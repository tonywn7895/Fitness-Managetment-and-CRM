const { pool } = require('../config/db');

async function ensureProducts() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
      price_points INT NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      category TEXT,
      image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

exports.list = async (req, res) => {
  try {
    await ensureProducts();
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id ASC');
    res.json({ success:true, data: rows });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    await ensureProducts();
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Product not found' });
    res.json({ success:true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    await ensureProducts();
    const { sku, name, price_cash, price_points, stock, active, category } = req.body;
    if (!sku || !name) return res.status(400).json({ success:false, message:'Missing sku or name' });
    const { rows } = await pool.query(
      `INSERT INTO products (sku,name,price_cash,price_points,stock,active,category,image_url)
       VALUES ($1,$2,COALESCE($3,0),COALESCE($4,0),COALESCE($5,0),COALESCE($6,TRUE),$7,$8)
       RETURNING *`,
      [sku, name, price_cash, price_points, stock, active, category || null, null]
    );
    res.status(201).json({ success:true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    await ensureProducts();
    const { id } = req.params;
    const { sku, name, price_cash, price_points, stock, active, category, image_url } = req.body;
    const { rows } = await pool.query(
      `UPDATE products SET
         sku = COALESCE($1, sku),
         name = COALESCE($2, name),
         price_cash = COALESCE($3, price_cash),
         price_points = COALESCE($4, price_points),
         stock = COALESCE($5, stock),
         active = COALESCE($6, active),
         category = COALESCE($7, category),
         image_url = COALESCE($8, image_url)
       WHERE id=$9 RETURNING *`,
      [sku, name, price_cash, price_points, stock, active, category, image_url, id]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Product not found' });
    res.json({ success:true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await ensureProducts();
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM products WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ success:false, message:'Product not found' });
    res.json({ success:true, message:'Product deleted' });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// Public list (active only)
exports.publicList = async (req, res) => {
  try {
    await ensureProducts();
    const { rows } = await pool.query('SELECT id, sku, name, price_cash, price_points, stock, category, image_url FROM products WHERE active=TRUE ORDER BY id ASC');
    res.json({ success:true, data: rows });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

// Attach/Upload image
exports.setImage = async (req, res) => {
  try {
    const { id } = req.params;
    const fileUrl = req.file ? `/uploads/products/${req.file.filename}` : null;
    if (!fileUrl) return res.status(400).json({ success:false, message:'Missing file' });
    const { rows } = await pool.query('UPDATE products SET image_url=$1 WHERE id=$2 RETURNING *', [fileUrl, id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Product not found' });
    res.json({ success:true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};
