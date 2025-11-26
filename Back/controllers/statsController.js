// back/controllers/statsController.js
const Stats = require("../models/statsModel");

/**
 * GET /admin/stats/ventas-categoria
 */
async function getSalesByCategory(req, res, next) {
  try {
    const data = await Stats.getSalesByCategory();
    // data = { data: [...] }
    res.json(data);
  } catch (err) {
    console.error("Error getSalesByCategory:", err);
    if (next) return next(err);
    res.status(500).json({ message: "Error obteniendo ventas por categoría" });
  }
}

/**
 * GET /admin/stats/reporte-existencias
 */
async function getStockReport(req, res, next) {
  try {
    const data = await Stats.getStockReport();
    // data = { productos: [...] }
    res.json(data);
  } catch (err) {
    console.error("Error getStockReport:", err);
    if (next) return next(err);
    res.status(500).json({ message: "Error obteniendo reporte de existencias" });
  }
}

module.exports = {
  getSalesByCategory,
  getStockReport,
};
