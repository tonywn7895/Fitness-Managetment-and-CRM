const { pool } = require('../config/db');

async function ensureTables() {
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS memberships (
      id SERIAL PRIMARY KEY,
      customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      plan_id INT NOT NULL REFERENCES plans(id),
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active', -- Active | Queued | Frozen | Cancelled | Expired
      auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_membership_per_customer
      ON memberships(customer_id) WHERE status = 'Active';
  `);
}

exports.purchase = async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureTables();
    const { customer_id, plan_id, start_date, auto_renew } = req.body;
    if (!customer_id || !plan_id) {
      return res.status(400).json({ success:false, message:'Missing customer_id or plan_id' });
    }
    const planRes = await pool.query('SELECT id, duration_interval, name FROM plans WHERE id=$1 AND active=TRUE', [plan_id]);
    if (!planRes.rows.length) return res.status(400).json({ success:false, message:'Invalid or inactive plan' });
    const plan = planRes.rows[0];

    await client.query('BEGIN');
    const nowRes = await client.query('SELECT NOW() as now');
    const now = new Date(nowRes.rows[0].now);

    // find current active membership
    const act = await client.query(
      `SELECT * FROM memberships
       WHERE customer_id=$1 AND status='Active' AND end_date > NOW()
       ORDER BY end_date DESC LIMIT 1`,
      [customer_id]
    );

    let start = start_date ? new Date(start_date) : now;
    let status = 'Active';
    if (act.rows.length) {
      const end = new Date(act.rows[0].end_date);
      if (end > start) start = end; // queue directly after current ends
      if (start > now) status = 'Queued';
    } else if (start > now) {
      status = 'Queued';
    }

    const endSql = `SELECT ($1::timestamptz + ($2)::interval) AS end_date`;
    const endRes = await client.query(endSql, [start.toISOString(), plan.duration_interval]);
    const endDate = new Date(endRes.rows[0].end_date);

    const ins = await client.query(
      `INSERT INTO memberships (customer_id, plan_id, start_date, end_date, status, auto_renew)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6,false)) RETURNING *`,
      [customer_id, plan_id, start.toISOString(), endDate.toISOString(), status, auto_renew]
    );

    // log history
    await client.query(
      'INSERT INTO customer_history (customer_id, action, details, timestamp) VALUES ($1,$2,$3,NOW())',
      [customer_id, 'Membership Purchased', `Plan ${plan.name}, status ${status}`]
    );

    await client.query('COMMIT');
    res.status(201).json({ success:true, data: ins.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success:false, message: err.message });
  } finally {
    client.release();
  }
};

exports.current = async (req, res) => {
  try {
    await ensureTables();
    const { customerId } = req.params;
    const { rows } = await pool.query(
      `SELECT m.*, p.name as plan_name
       FROM memberships m JOIN plans p ON p.id = m.plan_id
       WHERE m.customer_id=$1 AND m.status='Active' AND NOW() BETWEEN m.start_date AND m.end_date
       ORDER BY m.end_date DESC LIMIT 1`,
      [customerId]
    );
    if (!rows.length) return res.json({ success:true, data: null });
    const m = rows[0];
    const rem = Math.max(0, Math.ceil((new Date(m.end_date) - new Date()) / (1000*60*60*24)));
    res.json({ success:true, data: { ...m, remaining_days: rem } });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

exports.listByCustomer = async (req, res) => {
  try {
    await ensureTables();
    const { customerId } = req.params;
    const { rows } = await pool.query(
      `SELECT m.*, p.name as plan_name FROM memberships m JOIN plans p ON p.id=m.plan_id
       WHERE m.customer_id=$1 ORDER BY m.start_date DESC`,
      [customerId]
    );
    res.json({ success:true, data: rows });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
};

