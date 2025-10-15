const { pool } = require("../config/db");

// ✅ กรองยอดขายตามช่วงเวลา
exports.getSalesByFilter = async (req, res) => {
  const { filter } = req.params;
  let groupBy = "TO_CHAR(date, 'YYYY-MM')";
  let interval = "3 months";

  if (filter === "daily") {
    groupBy = "TO_CHAR(date, 'YYYY-MM-DD')";
    interval = "7 days";
  } else if (filter === "weekly") {
    groupBy = "TO_CHAR(date, 'IYYY-IW')";
    interval = "4 weeks";
  }

  try {
    const sales = await pool.query(`
      SELECT ${groupBy} AS label, SUM(amount) AS total_sales
      FROM sales
      WHERE date >= NOW() - INTERVAL '${interval}'
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `);

    const topProducts = await pool.query(`
      SELECT product_name AS name, SUM(amount) AS value
      FROM sales
      WHERE date >= NOW() - INTERVAL '${interval}'
      GROUP BY product_name
      ORDER BY value DESC
      LIMIT 5
    `);

    const topCustomers = await pool.query(`
      SELECT customer_name AS name, SUM(amount) AS value
      FROM sales
      WHERE date >= NOW() - INTERVAL '${interval}'
      GROUP BY customer_name
      ORDER BY value DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      sales: sales.rows.map(r => ({ date: r.label, amount: parseFloat(r.total_sales) })),
      top_products: topProducts.rows,
      top_customers: topCustomers.rows
    });
  } catch (err) {
    console.error("Sales filter error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ ยอดขายรายวัน (ล่าสุด 7 วัน)
exports.getDailySales = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(date, 'YYYY-MM-DD') AS date, SUM(amount) AS amount
      FROM sales
      WHERE date >= NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(date, 'YYYY-MM-DD')
      ORDER BY date DESC
      LIMIT 7
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Daily sales error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ รวมยอดขายทั้งหมด
exports.getTotalSales = async (req, res) => {
  try {
    const result = await pool.query("SELECT SUM(amount) AS total_sales FROM sales");
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Total sales error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
