// back/controllers/adminController.js
const db = require("../db");

// ---------- Productos ----------
async function getAdminProducts(req, res, next) {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         nombre,
         descripcion,
         precio,
         precio_anterior,
         imagen_url,
         categoria,
         existencias,
         es_oferta
       FROM productos`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function createProductAdmin(req, res, next) {
  try {
    const {
      nombre,
      descripcion,
      precio,
      precio_anterior,
      imagen_url,
      categoria,
      existencias,
      es_oferta,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO productos
        (nombre, descripcion, precio, precio_anterior, imagen_url, categoria, existencias, es_oferta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        descripcion,
        precio,
        precio_anterior || null,
        imagen_url,
        categoria,
        existencias,
        es_oferta ? 1 : 0,
      ]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
}

async function updateProductAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      precio,
      precio_anterior,
      imagen_url,
      categoria,
      existencias,
      es_oferta,
    } = req.body;

    // primero obtenemos el producto actual
    const [rows] = await db.query("SELECT * FROM productos WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    const actual = rows[0];

    // usamos los valores actuales si en el body vienen undefined
    const nuevo = {
      nombre: nombre ?? actual.nombre,
      descripcion: descripcion ?? actual.descripcion,
      precio: precio ?? actual.precio,
      precio_anterior: precio_anterior ?? actual.precio_anterior,
      imagen_url: imagen_url ?? actual.imagen_url,
      categoria: categoria ?? actual.categoria,
      existencias: existencias ?? actual.existencias,
      es_oferta:
        typeof es_oferta === "undefined" ? actual.es_oferta : es_oferta ? 1 : 0,
    };

    await db.query(
      `UPDATE productos
       SET nombre = ?, descripcion = ?, precio = ?, precio_anterior = ?,
           imagen_url = ?, categoria = ?, existencias = ?, es_oferta = ?
       WHERE id = ?`,
      [
        nuevo.nombre,
        nuevo.descripcion,
        nuevo.precio,
        nuevo.precio_anterior,
        nuevo.imagen_url,
        nuevo.categoria,
        nuevo.existencias,
        nuevo.es_oferta,
        id,
      ]
    );

    res.json({ message: "Producto actualizado" });
  } catch (err) {
    next(err);
  }
}

async function deleteProductAdmin(req, res, next) {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM productos WHERE id = ?", [id]);
    res.json({ message: "Producto eliminado" });
  } catch (err) {
    next(err);
  }
}

// ---------- Pedidos ----------
// ---------- Pedidos (incluye detalle de autos vendidos) ----------
async function getOrdersAdmin(req, res, next) {
  try {
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
        o.total AS total_general,
        o.cupon_codigo,
        o.creado_en,
        -- 🔹 Resumen de los autos vendidos en ese pedido
        GROUP_CONCAT(
          CONCAT(oi.cantidad, 'x ', oi.nombre_producto, ' (', oi.categoria, ')')
          ORDER BY oi.id
          SEPARATOR ' • '
        ) AS items_detalle
      FROM ordenes o
      JOIN usuarios u      ON u.id = o.usuario_id
      LEFT JOIN orden_items oi ON oi.orden_id = o.id
      GROUP BY
        o.id,
        o.usuario_id,
        u.nombre,
        u.correo,
        o.total_productos,
        o.subtotal,
        o.impuestos,
        o.envio,
        o.total,
        o.cupon_codigo,
        o.creado_en
      ORDER BY o.creado_en DESC
      `
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
}


// ---------- Usuarios ----------
async function getUsersAdmin(req, res, next) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
        nombre,
        correo,
        rol,
        verificado,
        intentos_fallidos,
        bloqueo_hasta
      FROM usuarios
      ORDER BY id ASC
      `
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// ---------- Stats: ventas por categoría ----------
async function getSalesByCategory(req, res, next) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        p.categoria,
        SUM(oi.cantidad) AS total_unidades,
        SUM(oi.subtotal) AS total_ventas
      FROM orden_items oi
      JOIN productos p ON p.id = oi.producto_id
      JOIN ordenes o ON o.id = oi.orden_id
      GROUP BY p.categoria
      ORDER BY total_ventas DESC
      `
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// ---------- Stats: reporte de existencias ----------
async function getExistenciasReport(req, res, next) {
  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
        nombre,
        categoria,
        existencias,
        precio
      FROM productos
      ORDER BY existencias ASC, nombre ASC
      `
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminProducts,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  getOrdersAdmin,
  getUsersAdmin,
  getSalesByCategory,
  getExistenciasReport,
};
