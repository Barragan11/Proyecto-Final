// back/controllers/orderController.js
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const { sendOrderEmail } = require("../utils/mailer");

// ==================== CHECKOUT (cliente) ====================
async function checkout(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const {
      pais,
      cupon,
      datosEnvio,   // { nombre, direccion, ciudad, codigoPostal, telefono }
      metodoPago,   // 'tarjeta' | 'transferencia' | 'oxxo'
      datosPago,    // info descriptiva, NO datos sensibles
    } = req.body;

    if (!pais || !datosEnvio || !datosEnvio.nombre) {
      return res
        .status(400)
        .json({ message: "Datos de envío incompletos" });
    }

    // 1) obtener carrito e items
    const cart = await Cart.getOrCreateCart(usuarioId);
    const items = await Cart.getCartItems(cart.id);
    if (!items.length) {
      return res.status(400).json({ message: "Tu carrito está vacío" });
    }

    // 2) calcular totales
    const totales = Order.calcularTotales(items, pais, cupon);

    // 3) crear orden (y cerrar carrito, actualizar inventario, etc.)
    const orden = await Order.createOrderFromCart(
      usuarioId,
      cart,
      items,
      totales,
      { pais, ...datosEnvio },
      metodoPago || "tarjeta",
      cupon
    );

    // 4) enviar correo con PDF (NO rompemos la compra si el correo falla)
    try {
      await sendOrderEmail({
        to: req.user.email,   // viene de authMiddleware
        nombre: req.user.name,
        order: orden,
        totals: {
          subtotal: totales.subtotal,
          impuestos: totales.impuestos,
          envio: totales.envio,
          descuento: totales.descuento,
          totalGeneral: totales.totalGeneral,
          cuponCodigo: totales.cuponCodigo || cupon || null,
        },
        items,
      });
    } catch (mailErr) {
      console.error("❌ Error al enviar correo de orden:", mailErr);
      // no hacemos return; sólo loggeamos el error
    }

    // 5) respuesta al front (para que muestres los 2 mensajes)
    res.status(201).json({
      message: "Compra finalizada",
      noteMessage: "La nota se envió a tu correo electrónico",
      orden,
      totales,
      datosEnvio,
    });
  } catch (err) {
    next(err);
  }
}

// ==================== LECTURA DE PEDIDOS ====================

async function getAllOrders(req, res, next) {
  try {
    const orders = await Order.getAllOrders();
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const usuarioId = req.user.id;
    const orders = await Order.getOrdersByUser(usuarioId);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkout,
  getAllOrders,
  getMyOrders,
};
