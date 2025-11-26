// back/middleware/errorMiddleware.js
function errorHandler(err, req, res, next) {
  console.error("❌ Error:", err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Error interno del servidor",
  });
}

module.exports = { errorHandler };
