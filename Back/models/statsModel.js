// back/models/statsModel.js
const db = require("../db");

// 🔹 Ventas por categoría (se basa en las órdenes realizadas)
async function getSalesByCategory() {
  const [rows] = await db.query(
    `
    SELECT
      p.categoria AS categoria,
      SUM(oi.cantidad) AS total_ventas
    FROM orden_items oi
    JOIN productos p ON p.id = oi.producto_id
    JOIN ordenes o ON o.id = oi.orden_id
    GROUP BY p.categoria
    ORDER BY p.categoria
    `
  );

  // El front espera { data: [...] }
  return { data: rows };
}

// 🔹 Reporte de existencias (por producto y categoría)
async function getStockReport() {
  const [rows] = await db.query(
    `
    SELECT
      id,
      nombre,
      categoria,
      existencias
    FROM productos
    ORDER BY categoria, nombre
    `
  );

  // El front espera { productos: [...] }
  return { productos: rows };
}

module.exports = {
  getSalesByCategory,
  getStockReport,
};
