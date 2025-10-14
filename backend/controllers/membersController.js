const { pool } = require('../config/db');

async function columnExists(table, column) {
  const { rows } = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_name=$2
     ) AS present;`,
    [table, column]
  );
  return !!rows?.[0]?.present;
}

exports.getGrowth = async (req, res) => {
  try {
    const hasCreatedAt = await columnExists('customers', 'created_at');
    if (!hasCreatedAt) {
      return res.json({ success: true, data: [] });
    }

    const { rows } = await pool.query(`
      SELECT
        DATE_TRUNC('month', created_at)::date AS month,
        SUM(CASE WHEN subscription_status = 'Active' THEN 1 ELSE 0 END)::int AS active,
        SUM(CASE WHEN subscription_status <> 'Active' THEN 1 ELSE 0 END)::int AS not_active
      FROM customers
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY 1
      ORDER BY 1 ASC;
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('members.getGrowth error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

