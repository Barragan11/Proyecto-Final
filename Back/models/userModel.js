// back/models/userModel.js
const pool = require("../db");

/* ========= BÚSQUEDAS ========= */

// Busca usuario por correo
async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT
       id,
       nombre AS name,
       correo AS email,
       contrasena_hash AS contrasena_hash,
       rol AS role,
       verificado AS is_verified,
       intentos_fallidos AS failed_attempts,
       bloqueo_hasta AS lock_until,
       reset_token,
       reset_expires
     FROM usuarios
     WHERE correo = ?
     LIMIT 1`,
    [email]
  );
  return rows[0];
}

// Busca usuario por id
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT
       id,
       nombre AS name,
       correo AS email,
       rol AS role,
       verificado AS is_verified,
       intentos_fallidos AS failed_attempts,
       bloqueo_hasta AS lock_until
     FROM usuarios
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0];
}

/* ========= CREAR USUARIO ========= */
// Guarda la contraseña TAL CUAL (texto plano) en contrasena_hash
async function createUser({ name, email, contrasena_hash, role = "cliente" }) {
  const [result] = await pool.query(
    "INSERT INTO usuarios (nombre, correo, contrasena_hash, rol) VALUES (?, ?, ?, ?)",
    [name, email, contrasena_hash, role]
  );
  return { id: result.insertId, name, email, role };
}

/* ========= INTENTOS FALLIDOS / BLOQUEO ========= */

async function updateFailedAttempts(id, failed_attempts, lock_until) {
  await pool.query(
    "UPDATE usuarios SET intentos_fallidos = ?, bloqueo_hasta = ? WHERE id = ?",
    [failed_attempts, lock_until, id]
  );
}

async function resetFailedAttempts(id) {
  await pool.query(
    "UPDATE usuarios SET intentos_fallidos = 0, bloqueo_hasta = NULL WHERE id = ?",
    [id]
  );
}

/* ========= LISTA PARA ADMIN ========= */

async function getAllUsers() {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      nombre,
      correo,
      rol,
      verificado
    FROM usuarios
    ORDER BY nombre
    `
  );
  return rows;
}

/* ========= CAMPOS PARA RESET PASSWORD ========= */

async function setResetToken(userId, token, expires) {
  await pool.query(
    "UPDATE usuarios SET reset_token = ?, reset_expires = ? WHERE id = ?",
    [token, expires, userId]
  );
}

async function findByResetToken(token) {
  const [rows] = await pool.query(
    "SELECT * FROM usuarios WHERE reset_token = ? LIMIT 1",
    [token]
  );
  return rows[0];
}

async function updatePasswordAndClearToken(userId, newPlainPassword) {
  await pool.query(
    "UPDATE usuarios SET contrasena_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
    [newPlainPassword, userId]
  );
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateFailedAttempts,
  resetFailedAttempts,
  getAllUsers,
  setResetToken,
  findByResetToken,
  updatePasswordAndClearToken,
};
