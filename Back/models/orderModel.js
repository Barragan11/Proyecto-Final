// back/models/orderModel.js
const db = require("../db");
const Cart = require("./cartModel");

// Config de impuestos / envío por país
const COUNTRY_CONFIG = {
  MX: { nombre: "México", tasaImpuesto: 0.16, envio: 250 },
  US: { nombre: "Estados Unidos", tasaImpuesto: 0.1, envio: 500 },
  ES: { nombre: "España", tasaImpuesto: 0.21, envio: 600 },
  OTRO: { nombre: "Otro", tasaImpuesto: 0.0, envio: 300 },
};

function getCountryConfig(code) {
  return COUNTRY_CONFIG[code] || COUNTRY_CONFIG.OTRO;
}

function calcularTotales(items, countryCode, couponCode) {
  const summary = Cart.calculateCartSummary(items);
  const conf = getCountryConfig(countryCode);
  const subtotal = summary.subtotal;

  const impuestos = subtotal * conf.tasaImpuesto;
  const envio = conf.envio;

  let descuento = 0;
  // cupón ejemplo: ASTRO10 = 10% sobre subtotal
  if (couponCode && couponCode.toUpperCase() === "ASTRO10") {
    descuento = subtotal * 0.1;
  }

  const totalGeneral = subtotal + impuestos + envio - descuento;

  return {
    totalProductos: summary.totalProductos,
    subtotal,
    impuestos,
    envio,
    descuento,
    totalGeneral,      // 👈 esto lo devolvemos al front
    paisNombre: conf.nombre,
  };
}

/**
 * Crear la orden EN BASE a un carrito
 * Se ajusta a la tabla:
 * id, usuario_id, total_productos, subtotal, impuestos, envio, total, cupon_codigo, creado_en
 */
async function createOrderFromCart(
  usuarioId,
  cart,
  items,
  totales,
  datosEnvio,
  metodoPago,
  couponCode
) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `
      INSERT INTO ordenes (
       usuario_id,
        total_productos,
        subtotal,
        impuestos,
        envio,
        total,
        cupon_codigo,
        creado_en
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        usuarioId,
        totales.totalProductos,
        totales.subtotal,
        totales.impuestos,
        totales.envio,
        totales.totalGeneral,
        couponCode || null,
      ]
    );

    const ordenId = orderResult.insertId;

    // Insertar items de la orden + actualizar inventario
    for (const item of items) {
      const subtotalItem = item.precio_unitario * item.cantidad;

      await conn.query(
        `
        INSERT INTO orden_items (
          orden_id,
          producto_id,
          nombre_producto,
          categoria,
          precio_unitario,
          cantidad,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          ordenId,
          item.producto_id,
          item.nombre,
          item.categoria,      
          item.precio_unitario,
          item.cantidad,
          subtotalItem,
        ]
      );

      // 🔹 Descontar inventario (usa columna "existencias")
      await conn.query(
        "UPDATE productos SET existencias = existencias - ? WHERE id = ?",
        [item.cantidad, item.producto_id]
      );
    }

    // Cerrar carrito y vaciar items
    await conn.query("UPDATE carritos SET estado = 'cerrado' WHERE id = ?", [
      cart.id,
    ]);
    await conn.query("DELETE FROM carrito_items WHERE carrito_id = ?", [
      cart.id,
    ]);

    await conn.commit();

    return {
      id: ordenId,
      ...totales,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 🔹 Obtener TODAS las órdenes (para ADMIN)
 * Usa las columnas reales de tu tabla
 */
async function getAllOrders() {
  const [rows] = await db.query(
    `
    SELECT
      o.id,
      o.usuario_id,
      u.nombre AS cliente,
      u.correo AS correo_cliente,
      o.total_productos,
      o.subtotal,
      o.impuestos,
      o.envio,
      o.total      AS total_general,  -- alias para que el front siga usando "total_general"
      o.cupon_codigo,
      o.creado_en
    FROM ordenes o
    JOIN usuarios u ON u.id = o.usuario_id
    ORDER BY o.creado_en DESC
    `
  );
  return rows;
}

/**
 * 🔹 Obtener órdenes de un usuario (para "Mis pedidos")
 */
async function getOrdersByUser(usuarioId) {
  const [rows] = await db.query(
    `
    SELECT
      o.id,
      o.usuario_id,
      o.total_productos,
      o.subtotal,
      o.impuestos,
      o.envio,
      o.total      AS total_general,
      o.cupon_codigo,
      o.creado_en
    FROM ordenes o
    WHERE o.usuario_id = ?
    ORDER BY o.creado_en DESC
    `,
    [usuarioId]
  );
  return rows;
}

module.exports = {
  calcularTotales,
  createOrderFromCart,
  getAllOrders,
  getOrdersByUser,
};
