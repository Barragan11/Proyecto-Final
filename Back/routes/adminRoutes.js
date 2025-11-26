// back/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const { authRequired } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const {
  getAdminProducts,
  updateProductAdmin,
  createProductAdmin,
  deleteProductAdmin,
  getOrdersAdmin,
  getUsersAdmin,
  getSalesByCategory,
  getExistenciasReport,
} = require("../controllers/adminController");

// Todas estas rutas requieren admin
router.use(authRequired, adminOnly);

// --- Gestión de productos ---
router.get("/products", getAdminProducts);
router.post("/products", createProductAdmin);
router.put("/products/:id", updateProductAdmin);
router.delete("/products/:id", deleteProductAdmin);

// --- Pedidos ---
router.get("/orders", getOrdersAdmin);

// --- Usuarios ---
router.get("/users", getUsersAdmin);

// --- Estadísticas ---
router.get("/stats/ventas-categoria", getSalesByCategory);
router.get("/stats/reporte-existencias", getExistenciasReport);

module.exports = router;
