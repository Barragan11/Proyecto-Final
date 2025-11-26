// back/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const pool = require("../db");

async function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      `SELECT 
         id,
         nombre AS name,
         correo AS email,
         rol   AS role,
         verificado AS is_verified
       FROM usuarios
       WHERE id = ?`,
      [payload.id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    req.user = user; // {id, name, email, role, is_verified}
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

// Solo cuentas verificadas pueden hacer ciertas cosas (carrito, compra)
function verifiedRequired(req, res, next) {
  if (!req.user || !req.user.is_verified) {
    return res
      .status(403)
      .json({ message: "Cuenta no verificada. Contacta al administrador." });
  }
  next();
}

// 🔹 SOLO administradores
function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Acceso solo para administradores" });
  }
  next();
}

module.exports = { authRequired, verifiedRequired, adminOnly };
