// back/routes/productRoutes.js
const express = require("express");
const router = express.Router();
const {
  getProducts,
  getOffers,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { authRequired, adminOnly } = require("../middleware/authMiddleware");

// público
router.get("/", getProducts);
router.get("/offers", getOffers);
router.get("/:id", getProductById);

// admin
router.post("/", authRequired, adminOnly, createProduct);
router.put("/:id", authRequired, adminOnly, updateProduct);
router.delete("/:id", authRequired, adminOnly, deleteProduct);

module.exports = router;
