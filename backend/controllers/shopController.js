const { pool } = require('../config/db');

async function ensureOrders() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      total_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
      total_points INT NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id),
      qty INT NOT NULL,
      price_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
      price_points INT NOT NULL DEFAULT 0
    );
  `);
}

async function getPointsBalance(client, customerId) {
  const res = await client.query('SELECT COALESCE(SUM(points),0)::int AS total FROM points WHERE customer_id=$1', [customerId]);
  return parseInt(res.rows[0].total, 10);
}

async function subtractPointsFIFO(client, customerId, amount) {
  let remaining = amount;
  while (remaining > 0) {
    const oldest = await client.query('SELECT id, points FROM points WHERE customer_id=$1 ORDER BY id ASC LIMIT 1', [customerId]);
    if (oldest.rowCount === 0) throw new Error('Not enough points');
    const row = oldest.rows[0];
    const remove = Math.min(remaining, row.points);
    if (remove === row.points) {
      await client.query('DELETE FROM points WHERE id=$1', [row.id]);
    } else {
      await client.query('UPDATE points SET points = points - $1 WHERE id=$2', [remove, row.id]);
    }
    remaining -= remove;
  }
}

async function resolveCustomerIdFromUser(client, user) {
  if (!user) return null;
  // If token already from customers
  if (user.role && String(user.role).toLowerCase() === 'customer' && user.id) return user.id;
  // Try mapping by email or username
  if (user.email) {
    const r = await client.query('SELECT id FROM customers WHERE email=$1 LIMIT 1', [user.email]);
    if (r.rows.length) return r.rows[0].id;
  }
  if (user.username) {
    const r = await client.query('SELECT id FROM customers WHERE username=$1 LIMIT 1', [user.username]);
    if (r.rows.length) return r.rows[0].id;
  }
  return null;
}

exports.checkout = async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureOrders();
    const { customer_id, items } = req.body; // [{product_id, qty}]
    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success:false, message:'Missing customer_id or items' });
    }
    await client.query('BEGIN');

    // lock products and validate stock
    const ids = items.map(i => i.product_id);
    const prodRes = await client.query('SELECT id, name, stock, price_cash FROM products WHERE id = ANY($1)', [ids]);
    const prodMap = new Map(prodRes.rows.map(r => [r.id, r]));
    for (const it of items) {
      const p = prodMap.get(it.product_id);
      if (!p) throw new Error(`Product ${it.product_id} not found`);
      if (p.stock < it.qty) {
        await client.query('ROLLBACK');
        return res.status(409).json({ success:false, message:'Out of stock', data:{ product_id: it.product_id, requested: it.qty, available: p.stock } });
      }
    }

    let totalCash = 0;
    for (const it of items) {
      const p = prodMap.get(it.product_id);
      totalCash += Number(p.price_cash) * it.qty;
      await client.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [it.qty, it.product_id]);
    }

    const ord = await client.query('INSERT INTO orders (customer_id, total_cash, total_points, status) VALUES ($1,$2,0,$3) RETURNING *', [customer_id, totalCash, 'completed']);
    for (const it of items) {
      const p = prodMap.get(it.product_id);
      await client.query('INSERT INTO order_items (order_id, product_id, qty, price_cash, price_points) VALUES ($1,$2,$3,$4,0)', [ord.rows[0].id, it.product_id, it.qty, p.price_cash]);
    }

    await client.query('INSERT INTO customer_history (customer_id, action, details, timestamp) VALUES ($1,$2,$3,NOW())', [customer_id, 'Order Cash', `Total ${totalCash}`]);
    await client.query('COMMIT');
    res.status(201).json({ success:true, data: { order: ord.rows[0] } });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success:false, message: err.message });
  } finally {
    client.release();
  }
};

exports.redeem = async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureOrders();
    const { customer_id, items } = req.body; // [{product_id, qty}]
    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success:false, message:'Missing customer_id or items' });
    }
    await client.query('BEGIN');

    const ids = items.map(i => i.product_id);
    const prodRes = await client.query('SELECT id, name, stock, price_points FROM products WHERE id = ANY($1)', [ids]);
    const prodMap = new Map(prodRes.rows.map(r => [r.id, r]));

    let requiredPoints = 0;
    for (const it of items) {
      const p = prodMap.get(it.product_id);
      if (!p) throw new Error(`Product ${it.product_id} not found`);
      if (p.stock < it.qty) {
        await client.query('ROLLBACK');
        return res.status(409).json({ success:false, message:'Out of stock', data:{ product_id: it.product_id, requested: it.qty, available: p.stock } });
      }
      requiredPoints += Number(p.price_points) * it.qty;
    }

    const balance = await getPointsBalance(client, customer_id);
    if (balance < requiredPoints) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success:false, message:'Insufficient points', data:{ required: requiredPoints, balance } });
    }

    // Subtract points FIFO and decrement stock
    await subtractPointsFIFO(client, customer_id, requiredPoints);
    for (const it of items) {
      await client.query('UPDATE products SET stock = stock - $1 WHERE id=$2', [it.qty, it.product_id]);
    }

    const ord = await client.query('INSERT INTO orders (customer_id, total_cash, total_points, status) VALUES ($1,0,$2,$3) RETURNING *', [customer_id, requiredPoints, 'completed']);
    for (const it of items) {
      const p = prodMap.get(it.product_id);
      await client.query('INSERT INTO order_items (order_id, product_id, qty, price_cash, price_points) VALUES ($1,$2,$3,0,$4)', [ord.rows[0].id, it.product_id, it.qty, p.price_points]);
    }

    await client.query('INSERT INTO customer_history (customer_id, action, details, timestamp) VALUES ($1,$2,$3,NOW())', [customer_id, 'Redeemed', `Points ${requiredPoints}`]);
    await client.query('COMMIT');
    res.status(201).json({ success:true, data: { order: ord.rows[0] } });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success:false, message: err.message });
  } finally {
    client.release();
  }
};

// Customer self-checkout (cash) using JWT user id
exports.checkoutCustomer = async (req, res) => {
  if (!req.user) return res.status(401).json({ success:false, message:'Unauthorized' });
  const client = await pool.connect();
  try {
    const cid = await resolveCustomerIdFromUser(client, req.user);
    if (!cid) {
      return res.status(400).json({ success:false, message:'No linked customer account. Please log in as a customer or specify customer_id via admin endpoint.' });
    }
    req.body.customer_id = cid;
    client.release();
    return exports.checkout(req, res);
  } catch (err) {
    client.release();
    return res.status(500).json({ success:false, message: err.message });
  }
};

// Customer self-redeem (points) using JWT user id
exports.redeemCustomer = async (req, res) => {
  if (!req.user) return res.status(401).json({ success:false, message:'Unauthorized' });
  const client = await pool.connect();
  try {
    const cid = await resolveCustomerIdFromUser(client, req.user);
    if (!cid) {
      return res.status(400).json({ success:false, message:'No linked customer account. Please log in as a customer or specify customer_id via admin endpoint.' });
    }
    req.body.customer_id = cid;
    client.release();
    return exports.redeem(req, res);
  } catch (err) {
    client.release();
    return res.status(500).json({ success:false, message: err.message });
  }
};
