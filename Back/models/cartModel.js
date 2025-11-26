// back/models/cartModel.js
const db = require("../db");

// Obtiene el carrito "abierto" del usuario o lo crea
async function getOrCreateCart(usuarioId) {
  const [rows] = await db.query(
    "SELECT * FROM carritos WHERE usuario_id = ? AND estado = 'abierto' LIMIT 1",
    [usuarioId]
  );

  if (rows.length) return rows[0];

  const [result] = await db.query(
    "INSERT INTO carritos (usuario_id, estado, creado_en) VALUES (?, 'abierto', NOW())",
    [usuarioId]
  );

  return {
    id: result.insertId,
    usuario_id: usuarioId,
    estado: "abierto",
  };
}

// Obtener items del carrito con datos del producto
async function getCartItems(cartId) {
  const [rows] = await db.query(
    `
    SELECT
      ci.id,
      ci.producto_id,
      ci.cantidad,
      ci.precio_unitario,
      p.nombre,
      p.imagen_url,
      p.categoria
    FROM carrito_items ci
    JOIN productos p ON p.id = ci.producto_id
    WHERE ci.carrito_id = ?
    `,
    [cartId]
  );
  return rows;
}

// Agregar producto o incrementar cantidad
async function addOrIncrementItem(cartId, productoId, cantidad) {
  // obtener precio actual del producto
  const [prodRows] = await db.query(
    "SELECT precio, existencias FROM productos WHERE id = ? LIMIT 1",
    [productoId]
  );

  if (!prodRows.length) {
    const e = new Error("Producto no encontrado");
    e.status = 404;
    throw e;
  }

  const producto = prodRows[0];

  // 👇 usar siempre 'existencias', igual que en la BD
  if (producto.existencias < cantidad) {
    const e = new Error("No hay suficiente inventario");
    e.status = 400;
    throw e;
  }

  // ¿ya existe item en el carrito?
  const [itemRows] = await db.query(
    "SELECT * FROM carrito_items WHERE carrito_id = ? AND producto_id = ? LIMIT 1",
    [cartId, productoId]
  );

  if (itemRows.length) {
    const nuevo = itemRows[0].cantidad + cantidad;
    await db.query(
      "UPDATE carrito_items SET cantidad = ? WHERE id = ?",
      [nuevo, itemRows[0].id]
    );
  } else {
    await db.query(
      "INSERT INTO carrito_items (carrito_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
      [cartId, productoId, cantidad, producto.precio]
    );
  }
}

// Actualizar cantidad de un item
async function updateItemQuantity(itemId, cantidad) {
  if (cantidad <= 0) {
    await db.query("DELETE FROM carrito_items WHERE id = ?", [itemId]);
    return;
  }
  await db.query("UPDATE carrito_items SET cantidad = ? WHERE id = ?", [
    cantidad,
    itemId,
  ]);
}

// Borrar item
async function removeItem(itemId) {
  await db.query("DELETE FROM carrito_items WHERE id = ?", [itemId]);
}

// Vaciar carrito
async function clearCart(cartId) {
  await db.query("DELETE FROM carrito_items WHERE carrito_id = ?", [cartId]);
}

// Cerrar carrito (cuando se genera una orden)
async function closeCart(cartId) {
  await db.query("UPDATE carritos SET estado = 'cerrado' WHERE id = ?", [
    cartId,
  ]);
}

// Calcular subtotal y total de artículos
function calculateCartSummary(items) {
  let subtotal = 0;
  let totalProductos = 0;
  items.forEach((item) => {
    const line = Number(item.precio_unitario) * Number(item.cantidad);
    subtotal += line;
    totalProductos += Number(item.cantidad);
  });
  return { subtotal, totalProductos };
}

module.exports = {
  getOrCreateCart,
  getCartItems,
  addOrIncrementItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  closeCart,
  calculateCartSummary,
};
