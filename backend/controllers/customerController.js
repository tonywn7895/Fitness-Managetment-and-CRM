const { pool } = require("../config/db");

// ✅ Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const sql = `
      SELECT c.id, c.username, c.email, c.subscription_status,
             COALESCE(SUM(p.points), 0)::int AS total_points
      FROM customers c
      LEFT JOIN points p ON p.customer_id = c.id
      GROUP BY c.id, c.username, c.email, c.subscription_status
      ORDER BY c.id;
    `;
    const result = await pool.query(sql);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Fetch customers error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get customer by ID
exports.getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, username, email, subscription_status FROM customers WHERE id = $1",
      [id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: "Customer not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Get customer error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get total points (for dashboard)
exports.getTotalPoints = async (req, res) => {
  const { customer_id } = req.query;
  try {
    if (!customer_id)
      return res.status(400).json({ success: false, message: "Missing customer_id" });

    const result = await pool.query(
      "SELECT COALESCE(SUM(points), 0) as total_points FROM points WHERE customer_id = $1",
      [customer_id]
    );
    const total = parseInt(result.rows[0].total_points, 10);
    res.json({ success: true, data: { total_points: total } });
  } catch (err) {
    console.error("Get total points error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get customer count
exports.getCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM customers");
    res.json({ success: true, data: { count: result.rows[0].count } });
  } catch (err) {
    console.error("Get count error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Create new customer
exports.createCustomer = async (req, res) => {
  const { username, email, password, subscription_status, role } = req.body;
  try {
    if (!username || !email || !password || !subscription_status || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const result = await pool.query(
      `INSERT INTO customers (username, email, password, subscription_status, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, subscription_status, role`,
      [username, email, password, subscription_status, role]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Create customer error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update customer info
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { username, email, subscription_status } = req.body;
  try {
    if (!username || !email || !subscription_status)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const result = await pool.query(
      "UPDATE customers SET username=$1, email=$2, subscription_status=$3 WHERE id=$4 RETURNING *",
      [username, email, subscription_status, id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: "Customer not found" });

    await pool.query(
      "INSERT INTO customer_history (customer_id, action, details, timestamp) VALUES ($1,$2,$3,NOW())",
      [id, "Status Updated", `Changed to ${subscription_status}`]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Update customer error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Add points
exports.addPoints = async (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  try {
    await pool.query("INSERT INTO points (customer_id, points) VALUES ($1, $2)", [id, points]);
    res.json({ success: true, message: `Added ${points} points` });
  } catch (err) {
    console.error("Add points error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Subtract points
exports.subtractPoints = async (req, res) => {
  const { id } = req.params;
  const { points } = req.body;
  try {
    await pool.query("INSERT INTO points (customer_id, points) VALUES ($1, $2)", [id, -points]);
    res.json({ success: true, message: `Subtracted ${points} points` });
  } catch (err) {
    console.error("Subtract points error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get history
exports.getHistory = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM customer_history WHERE customer_id=$1 ORDER BY timestamp DESC",
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Get history error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
