// controllers/customerController.js
const { pool } = require('../config/db');

// GET /api/customers  (รวม total_points มาในผลลัพธ์เดียว)
exports.getAllCustomers = async (req, res) => {
  try {
    const sql = `
      SELECT
        c.id,
        c.username,
        c.email,
        c.subscription_status,
        COALESCE(SUM(p.points), 0)::int AS total_points
      FROM customers c
      LEFT JOIN points p ON p.customer_id = c.id
      GROUP BY c.id, c.username, c.email, c.subscription_status
      ORDER BY c.id;
    `;
    const result = await pool.query(sql);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Fetch customers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/customers/:id
exports.getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, username, email, subscription_status FROM customers WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// (ยังคงไว้เพื่อความเข้ากันได้) GET /api/customers/points/total?customer_id=ID
exports.getTotalPoints = async (req, res) => {
  const { customer_id } = req.query;
  try {
    if (!customer_id)
      return res
        .status(400)
        .json({ success: false, message: 'Missing customer_id' });
    const result = await pool.query(
      'SELECT COALESCE(SUM(points), 0) as total_points FROM points WHERE customer_id = $1',
      [customer_id]
    );
    const total = parseInt(result.rows[0].total_points, 10);
    res.json({ success: true, data: { total_points: total } });
  } catch (err) {
    console.error('Get total points error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/customers
exports.createCustomer = async (req, res) => {
  const { username, email, password, subscription_status, role } = req.body;
  try {
    if (!username || !email || !password || !subscription_status || !role) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }
    const result = await pool.query(
      `INSERT INTO customers (username, email, password, subscription_status, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, subscription_status, role`,
      [username, email, password, subscription_status, role]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Create customer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/customers/:id
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { username, email, subscription_status } = req.body;
  try {
    if (!username || !email || !subscription_status)
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });

    const result = await pool.query(
      'UPDATE customers SET username = $1, email = $2, subscription_status = $3 WHERE id = $4 RETURNING *',
      [username, email, subscription_status, id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: 'Customer not found' });

    await pool.query(
      'INSERT INTO customer_history (customer_id, action, details, timestamp) VALUES ($1,$2,$3,NOW())',
      [id, 'Status Updated', `Changed to ${subscription_status}`]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/customers/:id
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM points WHERE customer_id = $1', [id]);
    const result = await client.query(
      'DELETE FROM customers WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    // (optional) reset sequence
    const maxIdResult = await client.query('SELECT MAX(id) as max FROM customers');
    const maxId = maxIdResult.rows[0].max || 0;
    await client.query(`ALTER SEQUENCE customers_id_seq RESTART WITH ${maxId + 1}`);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete customer error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// POST /api/customers/:id/points  (add points)
exports.addPoints = async (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  const client = await pool.connect();
  try {
    if (!points) return res.status(400).json({ success: false, message: 'Missing points' });
    await client.query('BEGIN');
    const insertRes = await client.query(
      'INSERT INTO points (customer_id, points) VALUES ($1, $2) RETURNING *',
      [id, points]
    );
    await client.query(
      'INSERT INTO customer_history (customer_id, action, details, timestamp) VALUES ($1,$2,$3,NOW())',
      [id, 'Points Added', `Added ${points} points`]
    );
    await client.query('COMMIT');
    res.json({ success: true, data: insertRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add points error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// DELETE /api/customers/:id/points/subtract  (subtract points; FIFO)
exports.subtractPoints = async (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  const client = await pool.connect();
  try {
    if (!points) return res.status(400).json({ success: false, message: 'Missing points' });

    const totalRes = await client.query(
      'SELECT COALESCE(SUM(points), 0) as total FROM points WHERE customer_id = $1',
      [id]
    );
    const currentTotal = parseInt(totalRes.rows[0].total, 10);
    if (currentTotal < points)
      return res.status(400).json({ success: false, message: 'Not enough points' });

    await client.query('BEGIN');
    let remaining = points;
    while (remaining > 0) {
      const oldest = await client.query(
        'SELECT id, points FROM points WHERE customer_id = $1 ORDER BY id ASC LIMIT 1',
        [id]
      );
      if (oldest.rowCount === 0) break;
      const { id: rowId, points: value } = oldest.rows[0];
      const remove = Math.min(remaining, value);
      if (remove === value) {
        await client.query('DELETE FROM points WHERE id = $1', [rowId]);
      } else {
        await client.query('UPDATE points SET points = points - $1 WHERE id = $2', [
          remove,
          rowId,
        ]);
      }
      remaining -= remove;
    }
    await client.query(
      'INSERT INTO customer_history (customer_id, action, details, timestamp) VALUES ($1,$2,$3,NOW())',
      [id, 'Points Subtracted', `Subtracted ${points} points`]
    );
    await client.query('COMMIT');
    res.json({ success: true, message: 'Points subtracted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Subtract points error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// GET /api/customers/:id/history
exports.getHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT timestamp, action, details FROM customer_history WHERE customer_id = $1 ORDER BY timestamp DESC',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/customers/count
exports.getCount = async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM customers');
    res.json({ success: true, data: { count: parseInt(result.rows[0].count, 10) } });
  } catch (err) {
    console.error('Count error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
