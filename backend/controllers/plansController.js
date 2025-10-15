const { pool } = require('../config/db');

async function ensurePlansTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plans (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL DEFAULT 0,
      duration_interval INTERVAL NOT NULL,
      visit_limit INT,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

exports.list = async (req, res) => {
  try {
    await ensurePlansTable();
    const { rows } = await pool.query('SELECT * FROM plans ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    await ensurePlansTable();
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM plans WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Plan not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    await ensurePlansTable();
    const { code, name, price, duration_interval, visit_limit, active } = req.body;
    if (!code || !name || !duration_interval) {
      return res.status(400).json({ success:false, message:'Missing required fields' });
    }
    const { rows } = await pool.query(
      `INSERT INTO plans (code, name, price, duration_interval, visit_limit, active)
       VALUES ($1,$2,COALESCE($3,0),$4,$5,COALESCE($6,TRUE)) RETURNING *`,
      [code, name, price, duration_interval, visit_limit || null, active]
    );
    res.status(201).json({ success:true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    await ensurePlansTable();
    const { id } = req.params;
    const { code, name, price, duration_interval, visit_limit, active } = req.body;
    const { rows } = await pool.query(
      `UPDATE plans SET
         code = COALESCE($1, code),
         name = COALESCE($2, name),
         price = COALESCE($3, price),
         duration_interval = COALESCE($4, duration_interval),
         visit_limit = COALESCE($5, visit_limit),
         active = COALESCE($6, active)
       WHERE id=$7 RETURNING *`,
      [code, name, price, duration_interval, visit_limit, active, id]
    );
    if (!rows.length) return res.status(404).json({ success:false, message:'Plan not found' });
    res.json({ success:true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await ensurePlansTable();
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM plans WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ success:false, message:'Plan not found' });
    res.json({ success:true, message:'Plan deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

