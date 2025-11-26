// back/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  authRequired,
  adminOnly,
} = require("../middleware/authMiddleware");
const { getAllUsers } = require("../controllers/userController");

// 🔹 Solo admin puede ver lista de usuarios
router.get("/", authRequired, adminOnly, getAllUsers);

module.exports = router;
