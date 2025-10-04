// controllers/saleController.js
const { pool } = require('../config/db');

exports.getSalesByFilter = async (req, res) => {
  const { filter } = req.params; // 'daily'|'weekly'|'monthly'
  let groupBy = "TO_CHAR(date, 'YYYY-MM')";
  if (filter === 'daily') groupBy = "TO_CHAR(date, 'YYYY-MM-DD')";
  else if (filter === 'weekly') groupBy = "TO_CHAR(date, 'IYYY-IW')";

  try {
    const salesResult = await pool.query(`
      SELECT ${groupBy} AS label, SUM(amount) as total_sales
      FROM sales
      GROUP BY ${groupBy}
      ORDER BY ${groupBy} ASC
    `);

    const productsResult = await pool.query(`
      SELECT product_name AS name, SUM(amount) AS value
      FROM sales
      GROUP BY product_name
      ORDER BY value DESC
      LIMIT 5
    `);

    const customersResult = await pool.query(`
      SELECT customer_name AS name, SUM(amount) AS value
      FROM sales
      GROUP BY customer_name
      ORDER BY value DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      sales: salesResult.rows.map(r => ({ date: r.label, amount: parseFloat(r.total_sales) })),
      top_products: productsResult.rows,
      top_customers: customersResult.rows
    });
  } catch (err) {
    console.error('Sales API error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// daily short endpoint
exports.getDailySales = async (req, res) => {
  try {
    const result = await pool.query("SELECT date, SUM(amount) as amount FROM sales GROUP BY date ORDER BY date DESC LIMIT 7");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Daily sales error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// total sales
exports.getTotalSales = async (req, res) => {
  try {
    const result = await pool.query('SELECT SUM(amount) as total_sales FROM sales');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Total sales error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
