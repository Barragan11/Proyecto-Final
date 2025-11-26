// back/controllers/authController.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendMail,
  sendContactAutoReply,
} = require("../utils/mailer");

// ===== Captcha en memoria =====
const captchaStore = new Map(); // id -> { text, expiresAt }
const CAPTCHA_EXP_MINUTES = 5;

function generateCaptchaText(length = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    result += chars[idx];
  }
  return result;
}

// GET /api/auth/captcha
async function getCaptcha(req, res, next) {
  try {
    const id = crypto.randomBytes(12).toString("hex");
    const text = generateCaptchaText(6);
    const expiresAt = Date.now() + CAPTCHA_EXP_MINUTES * 60 * 1000;

    captchaStore.set(id, { text, expiresAt });

    res.json({ id, text });
  } catch (err) {
    next(err);
  }
}

function verifyCaptchaOrThrow(captchaId, captchaText) {
  if (!captchaId || !captchaText) {
    const e = new Error("Captcha requerido");
    e.status = 400;
    throw e;
  }

  const entry = captchaStore.get(captchaId);
  captchaStore.delete(captchaId); // de un solo uso

  if (!entry) {
    const e = new Error("Captcha inválido o expirado. Actualiza el captcha.");
    e.status = 400;
    throw e;
  }

  if (entry.expiresAt < Date.now()) {
    const e = new Error("Captcha expirado. Actualiza el captcha.");
    e.status = 400;
    throw e;
  }

  if (entry.text.toUpperCase() !== captchaText.trim().toUpperCase()) {
    const e = new Error("Captcha incorrecto");
    e.status = 400;
    throw e;
  }
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "2h" }
  );
}

// ================= REGISTRO (TEXTO PLANO) =================

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Nombre, correo y contraseña son obligatorios." });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res
        .status(400)
        .json({ message: "Ese correo ya está registrado." });
    }

    // Guardar contraseña TAL CUAL en contrasena_hash
    const newUser = await User.createUser({
      name,
      email,
      contrasena_hash: password,
      role: "cliente",
    });

    const token = generateToken(newUser);

    // correo de bienvenida con cupón
    try {
      await sendWelcomeEmail({
        to: email,
        nombre: name,
        cuponCodigo: "ASTRO10",
      });
    } catch (mailErr) {
      console.error("Error enviando correo de bienvenida:", mailErr);
    }

    return res.status(201).json({
      message: "Usuario registrado",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Error en register:", err);
    next(err);
  }
}

const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 5;

// ================= LOGIN (TEXTO PLANO + bloqueo básico) =================

async function login(req, res, next) {
  try {
    const { email, password, captchaId, captchaText } = req.body;

    // 1) validar captcha
    try {
      verifyCaptchaOrThrow(captchaId, captchaText);
    } catch (captchaError) {
      return res
        .status(captchaError.status || 400)
        .json({ message: captchaError.message });
    }

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Correo y contraseña son obligatorios" });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // No podemos sumar intentos porque no hay usuario
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    // ¿Cuenta bloqueada?
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      return res.status(403).json({
        message:
          "Cuenta bloqueada por múltiples intentos. Intenta de nuevo en unos minutos.",
      });
    }

    // Comparación en texto plano
    const pwdFromDb = user.contrasena_hash || "";
    const match = password === pwdFromDb;

    if (!match) {
      const attempts = (user.failed_attempts || 0) + 1;
      const shouldLock = attempts >= MAX_ATTEMPTS;
      const lock_until = shouldLock
        ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
        : null;

      await User.updateFailedAttempts(user.id, attempts, lock_until);

      return res
        .status(400)
        .json({ message: "Credenciales inválidas. Intenta de nuevo." });
    }

    // credenciales correctas → resetear intentos
    await User.resetFailedAttempts(user.id);

    const token = generateToken(user);

    res.json({
      message: "Login exitoso",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    next(err);
  }
}

// ====== OLVIDÉ CONTRASEÑA (guarda token en BD) ======
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ message: "El correo electrónico es obligatorio." });
    }

    const user = await User.findByEmail(email);

    // Para no revelar si existe o no el correo, respondemos igual
    if (!user) {
      return res.json({
        message:
          "Si el correo existe en Astro Motors, te enviaremos un enlace para restablecer la contraseña.",
      });
    }

    // Token aleatorio en texto plano y guardado en BD
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await User.setResetToken(user.id, token, expires);

    await sendPasswordResetEmail({
      to: user.email,
      nombre: user.name,
      token,
    });

    res.json({
      message:
        "Si el correo existe en Astro Motors, te enviamos un enlace para restablecer la contraseña.",
    });
  } catch (err) {
    console.error("Error en forgotPassword:", err);
    next(err);
  }
}

// ====== RESTABLECER CONTRASEÑA ======
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token y nueva contraseña son obligatorios." });
    }

    const user = await User.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: "Token inválido o expirado." });
    }

    if (!user.reset_expires || new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({ message: "Token expirado." });
    }

    // Actualizar contraseña en TEXTO PLANO y limpiar token
    await User.updatePasswordAndClearToken(user.id, password);

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (err) {
    console.error("Error en resetPassword:", err);
    next(err);
  }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
    });
  } catch (err) {
    next(err);
  }
}

// ================= Manejo de suscripción (correo con cupón) =================

async function subscribe(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Correo electrónico requerido." });
  }

  const couponCode = "ASTRO10"; // 10% de descuento

  const html = `
  <div style="font-family:Arial, sans-serif; background:#0b0b0f; color:#fff; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px; text-align:center; background:#000;">
          <img src="http://localhost:3000/images/logo-astro-motors-mail.png" alt="Astro Motors" style="height:60px; display:block; margin:0 auto 8px;">
          <h1 style="margin:0;font-size:22px;letter-spacing:0.18em;">ASTRO MOTORS</h1>
          <p style="margin:4px 0 0;font-size:12px; color:#bbb;">"Conquista la carretera, llega más lejos"</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 24px 10px;">
          <h2 style="margin-top:0;font-size:20px;">¡Gracias por suscribirte! 🚀</h2>
          <p style="font-size:14px;line-height:1.6;">
            Bienvenido a la familia <strong>Astro Motors</strong>. A partir de hoy recibirás noticias de nuevos modelos,
            ofertas especiales y contenido exclusivo para apasionados de los autos.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 24px 24px;">
          <div style="background:#191919;border-radius:14px;border:1px dashed #ff4444;padding:16px 18px;text-align:center;">
            <p style="margin:0 0 6px;font-size:13px;color:#bbb;">Tu cupón exclusivo de bienvenida</p>
            <div style="display:inline-block;background:#ff4444;color:#fff;padding:10px 18px;border-radius:999px;font-size:18px;font-weight:bold;letter-spacing:0.15em;">
              ${couponCode}
            </div>
            <p style="margin:10px 0 0;font-size:12px;color:#ccc;">
              Usa este cupón en tu próxima compra para obtener <strong>10% de descuento</strong>.
            </p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px; font-size:11px; color:#888; text-align:center;">
          Astro Motors · Proyecto académico de tienda en línea · ${new Date().getFullYear()}
        </td>
      </tr>
    </table>
  </div>
  `;

  try {
    await sendMail({
      to: email,
      subject: "Tu cupón de bienvenida - Astro Motors",
      html,
    });

    res.json({ message: "Suscripción registrada y cupón enviado." });
  } catch (err) {
    console.error("Error enviando cupón:", err);
    res.status(500).json({ message: "No se pudo enviar el correo." });
  }
}

module.exports = {
  getCaptcha,
  register,
  login,
  me,
  subscribe,
  forgotPassword,
  resetPassword,
};
