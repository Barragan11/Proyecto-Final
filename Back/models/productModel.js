// back/models/productModel.js
const pool = require("../db");

async function getProducts({ category, is_offer }) {
  let sql = `SELECT 
               id,
               nombre AS name,
               descripcion AS description,
               precio AS price,
               precio_anterior AS oldPrice,
               imagen_url AS imageUrl,
               categoria AS category,
               existencias AS stock,
               es_oferta AS isOffer,
               (existencias > 0) AS available
             FROM productos
             WHERE 1=1`;
  const params = [];

  if (category) {
    sql += " AND categoria = ?";
    params.push(category);
  }

  if (typeof is_offer !== "undefined") {
    sql += " AND es_oferta = ?";
    params.push(is_offer ? 1 : 0);
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query(
    `SELECT 
       id,
       nombre AS name,
       descripcion AS description,
       precio AS price,
       precio_anterior AS oldPrice,
       imagen_url AS imageUrl,
       categoria AS category,
       existencias AS stock,
       es_oferta AS isOffer,
       (existencias > 0) AS available
     FROM productos
     WHERE id = ?`,
    [id]
  );
  return rows[0];
}

async function createProduct(product) {
  const {
    name,
    description,
    price,
    oldPrice,
    imageUrl,
    category,
    stock,
    isOffer,
  } = product;

  const [result] = await pool.query(
    `INSERT INTO productos
       (nombre, descripcion, precio, precio_anterior, imagen_url, categoria, existencias, es_oferta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      description,
      price,
      oldPrice || null,
      imageUrl,
      category,
      stock,
      isOffer ? 1 : 0,
    ]
  );

  return { id: result.insertId, ...product };
}

async function updateProduct(id, product) {
  const {
    name,
    description,
    price,
    oldPrice,
    imageUrl,
    category,
    stock,
    isOffer,
  } = product;

  await pool.query(
    `UPDATE productos
     SET nombre = ?, descripcion = ?, precio = ?, precio_anterior = ?, 
         imagen_url = ?, categoria = ?, existencias = ?, es_oferta = ?
     WHERE id = ?`,
    [
      name,
      description,
      price,
      oldPrice || null,
      imageUrl,
      category,
      stock,
      isOffer ? 1 : 0,
      id,
    ]
  );

  return getById(id);
}

async function deleteProduct(id) {
  await pool.query("DELETE FROM productos WHERE id = ?", [id]);
}

module.exports = {
  getProducts,
  getById,
  createProduct,
  updateProduct,
  deleteProduct,
};
