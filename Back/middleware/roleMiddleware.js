// back/middleware/roleMiddleware.js
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Acceso solo para administradores" });
  }
  next();
}

module.exports = { adminOnly };
