// back/utils/mailer.js
const nodemailer = require("nodemailer");
const { generateOrderPdfBuffer } = require("./pdfReceipt");
const path = require("path"); 

// ---------- Transporter de correo ----------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // normalmente false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ---------- Envío de correo con HTML + PDF adjunto ----------
async function sendOrderEmail({ to, nombre, order, totals, items }) {
  const from =
    process.env.SMTP_FROM || `"Astro Motors" <${process.env.SMTP_USER}>`;

  // 1) Generar PDF bonito con logo y colores
  const pdfBuffer = await generateOrderPdfBuffer({
    order,
    items,
    totals,
    customerName: nombre,
  });

  // 2) Cuerpo HTML del correo
  const html = `
  <div style="font-family:Arial, sans-serif; background:#050509; color:#fff; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#0c0c0f;border-radius:18px;overflow:hidden;">
      <tr>
        <td style="padding:24px 24px 14px; text-align:center; background:#000;">
          <h1 style="margin:0;font-size:22px;letter-spacing:0.18em;">ASTRO MOTORS</h1>
          <p style="margin:4px 0 0;font-size:12px; color:#bbb;">"Conquista la carretera, llega más lejos"</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px;">
          <h2 style="margin-top:0;font-size:20px;">Gracias por tu compra 🚗</h2>
          <p style="font-size:14px;line-height:1.6;">
            Hola <strong>${nombre}</strong>, hemos registrado tu compra con el número de orden
            <strong>#${order.id}</strong>.
          </p>
          <p style="font-size:14px;line-height:1.6;">
            En el archivo PDF adjunto encontrarás la <strong>nota de compra</strong> con todos los detalles
            de los productos adquiridos y el desglose de pago (subtotal, impuestos, envío, cupón y total general).
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 20px; font-size:11px; color:#888; text-align:center;">
          Astro Motors · Proyecto académico de tienda en línea · ${new Date().getFullYear()}
        </td>
      </tr>
    </table>
  </div>
  `;

  // 3) Enviar correo
  const info = await transporter.sendMail({
    from,
    to,
    subject: `Nota de compra #${order.id} - Astro Motors`,
    html,
    attachments: [
      {
        filename: `nota-compra-${order.id}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  console.log("✉️ Correo con PDF enviado:", info.messageId);
}

// ---------- Auto–respuesta de CONTACTO ----------
async function sendContactAutoReply({ to, nombre, mensajeUsuario }) {
  const from =
    process.env.SMTP_FROM || `"Astro Motors" <${process.env.SMTP_USER}>`;

  const year = new Date().getFullYear();

  const html = `
  <div style="font-family:Arial, sans-serif; background:#050509; color:#fff; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#0c0c0f;border-radius:18px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px; text-align:center; background:#000;">
          <img src="cid:logo-astro" alt="Astro Motors" style="height:56px; margin-bottom:8px;" />
          <h1 style="margin:0;font-size:20px;letter-spacing:0.16em;">ASTRO MOTORS</h1>
          <p style="margin:4px 0 0;font-size:12px; color:#bbb;">"Conquista la carretera, llega más lejos"</p>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 24px;">
          <h2 style="margin-top:0;font-size:18px;">Gracias por contactarnos</h2>
          <p style="font-size:14px;line-height:1.6;">
            Hola <strong>${nombre}</strong>, gracias por tus comentarios para <strong>Astro Motors</strong>.
          </p>
          <p style="font-size:14px;line-height:1.6;">
            <strong>En breve será atendido</strong> por nuestro equipo. Hemos recibido tu mensaje y lo revisaremos cuanto antes.
          </p>
          <p style="font-size:13px;line-height:1.6; margin-top:16px; color:#ccc;">
            Resumen de tu mensaje:
            <br>
            <span style="display:inline-block;margin-top:6px;padding:10px 12px;border-radius:8px;background:#15151b;">
              ${mensajeUsuario.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
            </span>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 18px; font-size:11px; color:#888; text-align:center;">
          Astro Motors · Proyecto académico de tienda en línea · ${year}
        </td>
      </tr>
    </table>
  </div>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Gracias por contactarnos - Astro Motors",
    html,
    attachments: [
      {
        filename: "logo-astro-motors.png",
        path: path.join(__dirname, "..", "images", "logo-astro-motors.png"),
        cid: "logo-astro", // 👈 se usa en el src="cid:logo-astro
      },
    ],
  });

  console.log("✉️ Auto–respuesta de contacto enviada:", info.messageId);
}

// ---------- Correo de bienvenida con cupón ----------
async function sendWelcomeEmail({ to, nombre, cuponCodigo = "ASTRO10" }) {
  const from =
    process.env.SMTP_FROM || `"Astro Motors" <${process.env.SMTP_USER}>`;

  // ruta al logo que ya usas en el proyecto
  const logoPath = path.join(__dirname, "..", "images", "logo-astro-motors.png");

  const html = `
  <div style="font-family:Arial, sans-serif; background:#050509; color:#fff; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#0c0c0f;border-radius:18px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px; text-align:center; background:#000;">
          <img src="cid:logo-astro" alt="Astro Motors" style="height:60px; margin-bottom:8px; display:block; margin-left:auto; margin-right:auto;">
          <h1 style="margin:4px 0 0;font-size:22px;letter-spacing:0.18em;">ASTRO MOTORS</h1>
          <p style="margin:4px 0 0;font-size:12px; color:#bbb;">"Conquista la carretera, llega más lejos"</p>
        </td>
      </tr>

      <tr>
        <td style="padding:22px 24px;">
          <p style="font-size:14px;line-height:1.6;">
            Hola <strong>${nombre}</strong>, gracias por registrarte en <strong>Astro Motors</strong>.
          </p>
          <p style="font-size:14px;line-height:1.6;">
            Como bienvenida te compartimos un <strong>cupón especial</strong> para tu próxima compra.
          </p>

          <div style="
            margin:20px 0;
            padding:18px 16px;
            border-radius:16px;
            text-align:center;
            background:linear-gradient(135deg,#ff4444,#ff8800);
            color:#fff;
            box-shadow:0 12px 30px rgba(0,0,0,0.6);
          ">
            <p style="margin:0 0 6px; font-size:13px; text-transform:uppercase; letter-spacing:0.12em;">
              Cupón de bienvenida
            </p>
            <div style="
              font-size:26px;
              font-weight:700;
              letter-spacing:0.20em;
              padding:10px 14px;
              border-radius:12px;
              border:2px dashed rgba(255,255,255,0.9);
              display:inline-block;
              background:rgba(0,0,0,0.18);
            ">
              ${cuponCodigo}
            </div>
            <p style="margin:10px 0 0; font-size:13px;">
              Úsalo en el carrito para obtener <strong>10% de descuento</strong> en tu compra (código vigente para este proyecto).
            </p>
          </div>

          <p style="font-size:13px;line-height:1.6; color:#ddd;">
            Inicia sesión, agrega tus vehículos favoritos al carrito y aplica el cupón <strong>${cuponCodigo}</strong> antes de finalizar la compra.
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:0 24px 20px; font-size:11px; color:#888; text-align:center;">
          Astro Motors · Proyecto académico de tienda en línea · ${new Date().getFullYear()}
        </td>
      </tr>
    </table>
  </div>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject: "¡Bienvenido a Astro Motors! Tu cupón de compra",
    html,
    attachments: [
      {
        filename: "logo-astro-motors.png",
        path: logoPath,
        cid: "logo-astro", // 👈 mismo cid que usamos en el HTML
      },
    ],
  });

  console.log("✉️ Correo de bienvenida enviado:", info.messageId);
}


// ---------- Correo para restablecer contraseña ----------
async function sendPasswordResetEmail({ to, nombre, token }) {
  const from =
    process.env.SMTP_FROM || `"Astro Motors" <${process.env.SMTP_USER}>`;

  const baseUrl = process.env.FRONT_BASE_URL || "http://localhost:5501";
  const resetUrl = `${baseUrl}/reset-password.html?token=${encodeURIComponent(
    token
  )}`;

  const logoPath = path.join(__dirname, "..", "images", "logo-astro-motors.png");

  const html = `
  <div style="font-family:Arial, sans-serif; background:#050509; color:#fff; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#0c0c0f;border-radius:18px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px; text-align:center; background:#000;">
          <img src="cid:logo-astro" alt="Astro Motors" style="height:56px; margin-bottom:8px;" />
          <h1 style="margin:0;font-size:20px;letter-spacing:0.16em;">ASTRO MOTORS</h1>
          <p style="margin:4px 0 0;font-size:12px; color:#bbb;">"Conquista la carretera, llega más lejos"</p>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 24px;">
          <h2 style="margin-top:0;font-size:18px;">Restablecer contraseña</h2>
          <p style="font-size:14px;line-height:1.6;">
            Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Astro Motors</strong>.
          </p>
          <p style="font-size:14px;line-height:1.6;">
            Para crear una nueva contraseña, haz clic en el siguiente botón:
          </p>
          <p style="text-align:center;margin:24px 0;">
            <a href="${resetUrl}" style="
              display:inline-block;
              padding:12px 24px;
              border-radius:999px;
              background:linear-gradient(135deg,#ff4444,#ff8800);
              color:#fff;
              text-decoration:none;
              font-weight:bold;
              letter-spacing:0.08em;
              text-transform:uppercase;
              font-size:12px;
            ">
              Restablecer contraseña
            </a>
          </p>
          <p style="font-size:12px;line-height:1.6;color:#ccc;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <span style="word-break:break-all;">${resetUrl}</span>
          </p>
          <p style="font-size:12px;line-height:1.6;color:#999;margin-top:12px;">
            Si tú no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 18px; font-size:11px; color:#888; text-align:center;">
          Astro Motors · Proyecto académico de tienda en línea · ${new Date().getFullYear()}
        </td>
      </tr>
    </table>
  </div>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Restablecer contraseña - Astro Motors",
    html,
    attachments: [
      {
        filename: "logo-astro-motors.png",
        path: logoPath,
        cid: "logo-astro",
      },
    ],
  });

  console.log("✉️ Correo de restablecimiento enviado:", info.messageId);
}


module.exports = {
  sendOrderEmail,
  sendContactAutoReply,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
