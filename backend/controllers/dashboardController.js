// backend/controllers/dashboardController.js
const { pool } = require("../config/db");

async function tableExists(name) {
  const { rows } = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema='public' AND table_name=$1
     ) AS present;`,
    [name]
  );
  return !!rows?.[0]?.present;
}

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

exports.getSummary = async (req, res) => {
  try {
    const activeMembers = Number((await pool.query(
      "SELECT COUNT(*)::int AS cnt FROM customers WHERE subscription_status='Active';"
    )).rows[0]?.cnt || 0);

    let newSignups7d = 0;
    let newSignups30d = 0;
    if (await columnExists('customers', 'created_at')) {
      newSignups7d = Number((await pool.query(
        "SELECT COUNT(*)::int AS cnt FROM customers WHERE created_at >= NOW() - INTERVAL '7 days';"
      )).rows[0]?.cnt || 0);
      newSignups30d = Number((await pool.query(
        "SELECT COUNT(*)::int AS cnt FROM customers WHERE created_at >= NOW() - INTERVAL '30 days';"
      )).rows[0]?.cnt || 0);
    }

    let revenueToday=0, revenueMTD=0, revenuePrevMonth=0, revenueMoM=null;
    if (await tableExists("sales") && await columnExists('sales','created_at')) {
      const r1 = await pool.query(
        "SELECT COALESCE(SUM(amount),0)::numeric AS amt FROM sales WHERE created_at::date = NOW()::date;"
      );
      const r2 = await pool.query(
        "SELECT COALESCE(SUM(amount),0)::numeric AS amt FROM sales WHERE DATE_TRUNC('month', created_at)=DATE_TRUNC('month', NOW());"
      );
      const r3 = await pool.query(
        "SELECT COALESCE(SUM(amount),0)::numeric AS amt FROM sales WHERE DATE_TRUNC('month', created_at)=DATE_TRUNC('month', NOW()-INTERVAL '1 month');"
      );
      revenueToday = Number(r1.rows[0].amt||0);
      revenueMTD = Number(r2.rows[0].amt||0);
      revenuePrevMonth = Number(r3.rows[0].amt||0);
      revenueMoM = revenuePrevMonth===0 ? null : Number((((revenueMTD-revenuePrevMonth)/revenuePrevMonth)*100).toFixed(2));
    }

    let topPoints = [];
    if (await tableExists("points")) {
      const tp = await pool.query(`
        SELECT c.id, c.username, COALESCE(SUM(p.points),0)::int AS total_points
        FROM customers c
        LEFT JOIN points p ON p.customer_id = c.id
        GROUP BY c.id, c.username
        ORDER BY total_points DESC, c.id ASC
        LIMIT 5;
      `);
      topPoints = tp.rows || [];
    }

    let checkinsToday = 0, checkinsByHour = [];
    if (await tableExists("checkins")) {
      const t = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM checkins
        WHERE DATE_TRUNC('day', "timestamp") = DATE_TRUNC('day', NOW());
      `);
      const h = await pool.query(`
        SELECT EXTRACT(HOUR FROM "timestamp")::int AS hour, COUNT(*)::int AS cnt
        FROM checkins
        WHERE DATE_TRUNC('day', "timestamp") = DATE_TRUNC('day', NOW())
        GROUP BY 1
        ORDER BY 1;
      `);
      checkinsToday = Number(t.rows[0]?.total||0);
      checkinsByHour = h.rows || [];
    }

    let expiring7d = 0;
    if (await tableExists("memberships")) {
      const e = await pool.query(`
        SELECT COUNT(*)::int AS cnt
        FROM memberships
        WHERE end_date::date BETWEEN NOW()::date AND (NOW() + INTERVAL '7 days')::date
          AND status IN ('Active','pending_renewal');
      `);
      expiring7d = Number(e.rows[0]?.cnt||0);
    }

    let churn30d = 0;
    if (await tableExists("customer_history")) {
      const ch = await pool.query(`
        SELECT COUNT(DISTINCT customer_id)::int AS cnt
        FROM customer_history
        WHERE action='status_change_to_not_active'
          AND "timestamp" >= NOW() - INTERVAL '30 days';
      `);
      churn30d = Number(ch.rows[0]?.cnt||0);
    } else if (await columnExists('customers','created_at')) {
      const ch = await pool.query(`
        SELECT COUNT(*)::int AS cnt
        FROM customers
        WHERE subscription_status='Not Active'
          AND created_at >= NOW() - INTERVAL '30 days';
      `);
      churn30d = Number(ch.rows[0]?.cnt||0);
    } else {
      churn30d = 0;
    }

    return res.json({
      success: true,
      data: {
        activeMembers,
        newSignups7d,
        newSignups30d,
        expiring7d,
        checkinsToday,
        checkinsByHour, // [{hour, cnt}]
        revenueToday,
        revenueMTD,
        revenuePrevMonth,
        revenueMoM,
        churn30d,
        topPoints
      }
    });
  } catch (err) {
    console.error("getSummary error:", err);
    return res.status(500).json({ success:false, message: err.message });
  }
};

exports.getExpiring = async (req, res) => {
  try {
    const days = Math.max(1, Math.min(31, Number(req.query.days)||7));
    const has = await tableExists("memberships");
    if (!has) return res.json({ success:true, data: [] });

    const sql = `
      SELECT m.id, m.customer_id, c.username, c.email, m.end_date, m.status
      FROM memberships m
      JOIN customers c ON c.id = m.customer_id
      WHERE m.end_date::date BETWEEN NOW()::date AND (NOW() + ($1 || ' days')::interval)::date
      ORDER BY m.end_date ASC, m.id ASC;
    `;
    const { rows } = await pool.query(sql, [days]);
    return res.json({ success:true, data: rows });
  } catch (err) {
    console.error("getExpiring error:", err);
    return res.status(500).json({ success:false, message: err.message });
  }
};

exports.getTopPoints = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit)||5));
    const has = await tableExists("points");
    if (!has) return res.json({ success:true, data: [] });

    const { rows } = await pool.query(`
      SELECT c.id, c.username, COALESCE(SUM(p.points),0)::int AS total_points
      FROM customers c
      LEFT JOIN points p ON p.customer_id = c.id
      GROUP BY c.id, c.username
      ORDER BY total_points DESC, c.id ASC
      LIMIT $1;
    `, [limit]);

    return res.json({ success:true, data: rows });
  } catch (err) {
    console.error("getTopPoints error:", err);
    return res.status(500).json({ success:false, message: err.message });
  }
};

exports.getCheckinsToday = async (req, res) => {
  try {
    const has = await tableExists("checkins");
    if (!has) return res.json({ success:true, data: { total:0, byHour: [] } });

    const total = (await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM checkins
      WHERE DATE_TRUNC('day', "timestamp") = DATE_TRUNC('day', NOW());
    `)).rows[0].total;

    const byHour = (await pool.query(`
      SELECT EXTRACT(HOUR FROM "timestamp")::int AS hour, COUNT(*)::int AS cnt
      FROM checkins
      WHERE DATE_TRUNC('day', "timestamp") = DATE_TRUNC('day', NOW())
      GROUP BY 1
      ORDER BY 1;
    `)).rows;

    return res.json({ success:true, data: { total, byHour } });
  } catch (err) {
    console.error("getCheckinsToday error:", err);
    return res.status(500).json({ success:false, message: err.message });
  }
};
