// back/routes/authRoutes.js
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { authRequired } = require("../middleware/authMiddleware");

// 🔹 Captcha
router.get("/captcha", authController.getCaptcha);

// 🔹 Registro
router.post("/register", authController.register);

// 🔹 Login
router.post("/login", authController.login);

// 🔹 Datos del usuario autenticado
router.get("/me", authRequired, authController.me);

// 🔹 Suscripción (cupón por correo)
router.post("/suscripcion", authController.subscribe);

// 🔹 Olvidaste tu contraseña
router.post("/forgot-password", authController.forgotPassword);

// 🔹 Restablecer contraseña
router.post("/reset-password", authController.resetPassword);


module.exports = router;
