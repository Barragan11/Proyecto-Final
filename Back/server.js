// back/server.js
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

// ===== Rutas =====
const authRoutes   = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes   = require("./routes/cartRoutes");
const orderRoutes  = require("./routes/orderRoutes");
const userRoutes   = require("./routes/userRoutes");   // admin: ver usuarios
const statsRoutes  = require("./routes/statsRoutes");  // admin: gráficas / reportes
const contactRoutes = require("./routes/contactRoutes");

const { errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ===== Middlewares globales =====
app.use(cors());
app.use(express.json());

// 🔹 Servir carpeta de imágenes del back
// Cualquier archivo en back/images será accesible como:
// http://localhost:3000/images/nombre-archivo.jpg
app.use("/images", express.static(path.join(__dirname, "images")));

// ===== Rutas API =====
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);

// 👇 IMPORTANTE: ahora con /api delante, para que coincida con API_BASE_URL
app.use("/api/admin/stats", statsRoutes);

// (opcional) Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "API Astro Motors funcionando 🚀" });
});

// ===== Middleware de errores (al final) =====
app.use(errorHandler);

// ===== Levantar servidor =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});
