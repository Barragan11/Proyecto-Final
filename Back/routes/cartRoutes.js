// back/routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const { authRequired } = require("../middleware/authMiddleware");
const cartController = require("../controllers/cartController");

router.use(authRequired);         // todas requieren login

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/item/:itemId", cartController.updateItem);
router.delete("/item/:itemId", cartController.removeItem);
router.delete("/clear", cartController.clear);

module.exports = router;
