// back/controllers/cartController.js
const Cart = require("../models/cartModel");

async function getCart(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const cart = await Cart.getOrCreateCart(usuarioId);
    const items = await Cart.getCartItems(cart.id);
    const summary = Cart.calculateCartSummary(items);

    res.json({
      cartId: cart.id,
      items,
      subtotal: summary.subtotal,
      totalProductos: summary.totalProductos,
    });
  } catch (err) {
    next(err);
  }
}

async function addToCart(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const { productId, quantity } = req.body;

    const qty = Number(quantity) || 1;
    if (!productId) {
      return res.status(400).json({ message: "productId es obligatorio" });
    }

    const cart = await Cart.getOrCreateCart(usuarioId);
    await Cart.addOrIncrementItem(cart.id, productId, qty);

    const items = await Cart.getCartItems(cart.id);
    const summary = Cart.calculateCartSummary(items);

    res.status(201).json({
      message: "Producto agregado al carrito",
      cartId: cart.id,
      items,
      subtotal: summary.subtotal,
      totalProductos: summary.totalProductos,
    });
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const usuarioId = req.user.id; // solo para asegurar que está autenticado
    const { itemId } = req.params;
    const { quantity } = req.body;

    const qty = Number(quantity);
    if (Number.isNaN(qty)) {
      return res.status(400).json({ message: "Cantidad inválida" });
    }

    await Cart.updateItemQuantity(itemId, qty);

    const cart = await Cart.getOrCreateCart(usuarioId);
    const items = await Cart.getCartItems(cart.id);
    const summary = Cart.calculateCartSummary(items);

    res.json({
      message: "Carrito actualizado",
      cartId: cart.id,
      items,
      subtotal: summary.subtotal,
      totalProductos: summary.totalProductos,
    });
  } catch (err) {
    next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const { itemId } = req.params;

    await Cart.removeItem(itemId);

    const cart = await Cart.getOrCreateCart(usuarioId);
    const items = await Cart.getCartItems(cart.id);
    const summary = Cart.calculateCartSummary(items);

    res.json({
      message: "Producto eliminado del carrito",
      cartId: cart.id,
      items,
      subtotal: summary.subtotal,
      totalProductos: summary.totalProductos,
    });
  } catch (err) {
    next(err);
  }
}

async function clear(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const cart = await Cart.getOrCreateCart(usuarioId);
    await Cart.clearCart(cart.id);

    res.json({
      message: "Carrito vaciado",
      cartId: cart.id,
      items: [],
      subtotal: 0,
      totalProductos: 0,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCart,
  addToCart,
  updateItem,
  removeItem,
  clear,
};
