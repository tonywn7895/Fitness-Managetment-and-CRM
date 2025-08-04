const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'admin_db',
  password: 'admin123',
  port: 5432,
});

// Register new customer (ใช้ /api/customers แทน /api/register)
app.post('/api/customers', async (req, res) => {
  const { username, email, password, subscription_status, role } = req.body; // รับ password และ role
  try {
    if (!username || !email || !password || !subscription_status) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await pool.query(
      'INSERT INTO customers (username, email, password, subscription_status, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, email, hashedPassword, subscription_status, role || 'customer']
    );
    res.json({ success: true, message: 'Registration successful! Please wait for approval.', customerId: result.rows[0].id });
  } catch (err) {
    console.error('Registration error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error during registration: ' + err.message });
  }
});

// Login for admins (ใช้ /api/login)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        res.json({ success: true, message: 'Login successful' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all customers for admin
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, subscription_status FROM customers');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update customer (for admin)
app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, subscription_status } = req.body;
  try {
    if (!username || !email || !subscription_status) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const result = await pool.query(
      'UPDATE customers SET username = $1, email = $2, subscription_status = $3 WHERE id = $4 RETURNING *',
      [username, email, subscription_status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    await pool.query(
      'INSERT INTO customer_history (customer_id, action, details) VALUES ($1, $2, $3)',
      [id, 'Status Updated', `Changed to ${subscription_status}`]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update customer error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error while updating customer' });
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM points WHERE customer_id = $1', [id]);
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    console.error('Delete customer error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error while deleting customer' });
  }
});

// Get sales data
app.get('/api/sales', async (req, res) => {
  try {
    const result = await pool.query('SELECT SUM(amount) as total_sales FROM sales');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/sales/daily', async (req, res) => {
  try {
    const result = await pool.query('SELECT date, SUM(amount) as amount FROM sales GROUP BY date ORDER BY date DESC LIMIT 7');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get customers count
app.get('/api/customers/count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM customers');
    res.json({ success: true, data: { count: parseInt(result.rows[0].count) } });
  } catch (err) {
    console.error('Count error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add points to a customer
app.post('/api/points/add', async (req, res) => {
  const { customer_id, points } = req.body;
  try {
    if (!customer_id || !points) {
      return res.status(400).json({ success: false, message: 'Missing customer_id or points' });
    }
    const result = await pool.query(
      'INSERT INTO points (customer_id, points) VALUES ($1, $2) RETURNING *',
      [customer_id, points]
    );
    await pool.query(
      'INSERT INTO customer_history (customer_id, action, details) VALUES ($1, $2, $3)',
      [customer_id, 'Points Added', `Added ${points} points`]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Add points error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error while adding points' });
  }
});

// Subtract points from a customer
app.delete('/api/points/subtract', async (req, res) => {
  const { customer_id, points } = req.body;
  try {
    if (!customer_id || !points) {
      return res.status(400).json({ success: false, message: 'Missing customer_id or points' });
    }
    const totalPointsRes = await pool.query('SELECT COALESCE(SUM(points), 0) as total_points FROM points WHERE customer_id = $1', [customer_id]);
    const currentTotal = parseInt(totalPointsRes.rows[0].total_points);
    if (currentTotal < points) {
      return res.status(400).json({ success: false, message: 'Not enough points to subtract' });
    }

    let remainingPointsToSubtract = points;
    while (remainingPointsToSubtract > 0) {
      const oldestPointRes = await pool.query(
        'SELECT id, points FROM points WHERE customer_id = $1 ORDER BY id ASC LIMIT 1',
        [customer_id]
      );
      if (oldestPointRes.rowCount === 0) break;
      const { id, points: pointValue } = oldestPointRes.rows[0];
      const pointsToRemove = Math.min(remainingPointsToSubtract, pointValue);
      if (pointsToRemove === pointValue) {
        await pool.query('DELETE FROM points WHERE id = $1', [id]);
      } else {
        await pool.query(
          'UPDATE points SET points = points - $1 WHERE id = $2',
          [pointsToRemove, id]
        );
      }
      remainingPointsToSubtract -= pointsToRemove;
    }
    await pool.query(
      'INSERT INTO customer_history (customer_id, action, details) VALUES ($1, $2, $3)',
      [customer_id, 'Points Subtracted', `Subtracted ${points} points`]
    );
    res.json({ success: true, message: 'Points subtracted successfully' });
  } catch (err) {
    console.error('Subtract points error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error while subtracting points' });
  }
});

// Update customer status
app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, subscription_status } = req.body;
  try {
    if (!username || !email || !subscription_status) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const result = await pool.query(
      'UPDATE customers SET username = $1, email = $2, subscription_status = $3 WHERE id = $4 RETURNING *',
      [username, email, subscription_status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    await pool.query(
      'INSERT INTO customer_history (customer_id, action, details) VALUES ($1, $2, $3)',
      [id, 'Status Updated', `Changed to ${subscription_status}`]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update customer error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error while updating customer' });
  }
});

// Get customer history
app.get('/api/customers/:id/history', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT timestamp, action, details FROM customer_history WHERE customer_id = $1 ORDER BY timestamp DESC',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('History error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error while fetching history' });
  }
});

// Get total points for all customers
app.get('/api/points/total/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT COALESCE(SUM(points), 0) as total_points FROM points');
    res.json({ success: true, data: { total_points: parseInt(result.rows[0].total_points) } });
  } catch (err) {
    console.error('Total points error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get total points for a specific customer
app.get('/api/points/total', async (req, res) => {
  const { customer_id } = req.query;
  try {
    const result = await pool.query('SELECT COALESCE(SUM(points), 0) as total_points FROM points WHERE customer_id = $1', [customer_id]);
    res.json({ success: true, data: { total_points: parseInt(result.rows[0].total_points) } });
  } catch (err) {
    console.error('Total points error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(5001, () => console.log('Server running on port 5001'));