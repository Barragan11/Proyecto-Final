// back/routes/orderRoutes.js
const express = require("express");
const router = express.Router();

const {
  checkout,
  getAllOrders,
  getMyOrders,
} = require("../controllers/orderController");

const { authRequired } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

// Todas las rutas de órdenes requieren estar logeado
router.use(authRequired);

// Cliente finaliza compra
router.post("/checkout", checkout);

// Cliente ve SUS pedidos
router.get("/mine", getMyOrders);

// Admin ve TODOS los pedidos
router.get("/", adminOnly, getAllOrders);

module.exports = router;
