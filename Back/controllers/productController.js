// back/controllers/productController.js
const Product = require("../models/productModel");

// GET /api/products
async function getProducts(req, res, next) {
  try {
    const { category, offer } = req.query;

    const is_offer =
      typeof offer !== "undefined" ? (offer === "1" || offer === "true") : undefined;

    const products = await Product.getProducts({ category, is_offer });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

// GET /api/products/offers
async function getOffers(req, res, next) {
  try {
    const products = await Product.getProducts({ is_offer: true });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:id
async function getProductById(req, res, next) {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// POST /api/products (admin)
async function createProduct(req, res, next) {
  try {
    const {
      name,
      description,
      price,
      oldPrice,
      imageUrl,
      category,
      stock,
      isOffer,
    } = req.body;

    const product = await Product.createProduct({
      name,
      description,
      price,
      oldPrice,
      imageUrl,
      category,
      stock,
      isOffer,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

// PUT /api/products/:id (admin)
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;

    // 1) Traemos el producto actual
    const existing = await Product.getById(id);
    if (!existing) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // 2) Lo que llega en el body
    const {
      name,
      description,
      price,
      oldPrice,
      imageUrl,
      category,
      stock,
      isOffer,
    } = req.body;

    // 3) Mezclamos: si no viene en el body, usamos lo existente
    const toUpdate = {
      name:        typeof name        !== "undefined" ? name        : existing.name,
      description: typeof description !== "undefined" ? description : existing.description,
      price:       typeof price       !== "undefined" ? price       : existing.price,
      oldPrice:    typeof oldPrice    !== "undefined" ? oldPrice    : existing.oldPrice,
      imageUrl:    typeof imageUrl    !== "undefined" ? imageUrl    : existing.imageUrl,
      category:    typeof category    !== "undefined" ? category    : existing.category,
      stock:       typeof stock       !== "undefined" ? stock       : existing.stock,
      isOffer:     typeof isOffer     !== "undefined" ? isOffer     : existing.isOffer,
    };

    // 4) Actualizamos en BD usando ese objeto completo
    const updated = await Product.updateProduct(id, toUpdate);

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/products/:id (admin)
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await Product.getById(id);
    if (!existing) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    await Product.deleteProduct(id);
    res.json({ message: "Producto eliminado" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getOffers,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
