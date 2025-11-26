// back/routes/statsRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// 🔹 Ventas por categoría (usa orden_items con la columna categoria)
router.get("/ventas-categoria", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        categoria,
        SUM(cantidad) AS total_ventas
      FROM orden_items
      WHERE categoria IS NOT NULL AND categoria <> ''
      GROUP BY categoria
      ORDER BY categoria
      `
    );

    // Devuelvo en un formato simple: { data: [...] }
    res.json({ data: rows });
  } catch (err) {
    console.error("Error stats ventas-categoria:", err);
    res
      .status(500)
      .json({ error: "Error obteniendo ventas por categoría" });
  }
});

// 🔹 Reporte de existencias (tal como lo tenías)
router.get("/reporte-existencias", async (req, res) => {
  try {
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

    res.json({ productos: rows });
  } catch (err) {
    console.error("Error stats reporte-existencias:", err);
    res
      .status(500)
      .json({ error: "Error obteniendo reporte de existencias" });
  }
});

module.exports = router;
