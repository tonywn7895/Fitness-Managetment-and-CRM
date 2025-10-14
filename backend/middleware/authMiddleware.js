const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Please log in" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Token has expired" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(403).json({ success: false, message: "Invalid token format" });
      }
      return res.status(403).json({ success: false, message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };

// Role-based authorization middleware
// Usage: authorizeRoles('admin', 'staff')
const authorizeRoles = (...allowedRoles) => {
  const allowed = allowedRoles.map(r => String(r).trim().toLowerCase());
  return async (req, res, next) => {
    try {
      // Dev/Bootstrap bypass options
      if (process.env.AUTH_DEV_OPEN === 'true') {
        return next();
      }

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // 1) Prefer role from JWT if present
      let role = req.user.role ? String(req.user.role).trim().toLowerCase() : null;

      // 2) Fallback to DB lookup by id/email/username (Users first for admin/staff, then customers)
      if (!role) {
        let row;
        try {
          if (req.user.id) {
            row = (await pool.query("SELECT role FROM users WHERE id=$1 LIMIT 1", [req.user.id])).rows[0];
            role = row?.role ? String(row.role).trim().toLowerCase() : null;
            if (!role) {
              row = (await pool.query('SELECT role FROM "Users" WHERE id=$1 LIMIT 1', [req.user.id])).rows[0];
              role = row?.role ? String(row.role).trim().toLowerCase() : null;
            }
          }
          if (!role && req.user.email) {
            row = (await pool.query("SELECT role FROM users WHERE email=$1 LIMIT 1", [req.user.email])).rows[0];
            role = row?.role ? String(row.role).trim().toLowerCase() : null;
            if (!role) {
              row = (await pool.query('SELECT role FROM "Users" WHERE email=$1 LIMIT 1', [req.user.email])).rows[0];
              role = row?.role ? String(row.role).trim().toLowerCase() : null;
            }
          }
          if (!role && req.user.username) {
            row = (await pool.query("SELECT role FROM users WHERE username=$1 LIMIT 1", [req.user.username])).rows[0];
            role = row?.role ? String(row.role).trim().toLowerCase() : null;
            if (!role) {
              row = (await pool.query('SELECT role FROM "Users" WHERE username=$1 LIMIT 1', [req.user.username])).rows[0];
              role = row?.role ? String(row.role).trim().toLowerCase() : null;
            }
          }
        } catch (_) { /* users table may not exist */ }
        if (!role) {
          if (req.user.id) {
            row = (await pool.query("SELECT role FROM customers WHERE id=$1 LIMIT 1", [req.user.id])).rows[0];
            role = row?.role ? String(row.role).trim().toLowerCase() : null;
          }
          if (!role && req.user.email) {
            row = (await pool.query("SELECT role FROM customers WHERE email=$1 LIMIT 1", [req.user.email])).rows[0];
            role = row?.role ? String(row.role).trim().toLowerCase() : null;
          }
          if (!role && req.user.username) {
            row = (await pool.query("SELECT role FROM customers WHERE username=$1 LIMIT 1", [req.user.username])).rows[0];
            role = row?.role ? String(row.role).trim().toLowerCase() : null;
          }
        }
        if (role) {
          // attach resolved role to request for downstream use
          req.user.role = role;
        }
      }

      if (!role) {
        if (process.env.AUTH_DEBUG === 'true') {
          console.log('[authorizeRoles] missing role; jwt=', req.user);
        }
        // If no role resolved, allow during bootstrap if there is no admin/staff in DB yet
        const { rows } = await pool.query("SELECT COUNT(*)::int AS cnt FROM customers WHERE LOWER(role) IN ('admin','staff')");
        const hasPrivileged = Number(rows?.[0]?.cnt || 0) > 0;
        if (!hasPrivileged) {
          return next();
        }
        return res.status(403).json({ success: false, message: "Forbidden: missing role" });
      }

      if (!allowed.includes(role)) {
        // Final fallback: trust DB over JWT if DB grants higher role (helpful during migration)
        try {
          let dbRole = null;
          if (req.user.id) {
            let r = await pool.query('SELECT role FROM users WHERE id=$1 LIMIT 1', [req.user.id]);
            dbRole = r.rows?.[0]?.role ? String(r.rows[0].role).trim().toLowerCase() : null;
            if (!dbRole) {
              r = await pool.query('SELECT role FROM "Users" WHERE id=$1 LIMIT 1', [req.user.id]);
              dbRole = r.rows?.[0]?.role ? String(r.rows[0].role).trim().toLowerCase() : null;
            }
            if (!dbRole) {
              r = await pool.query('SELECT role FROM customers WHERE id=$1 LIMIT 1', [req.user.id]);
              dbRole = r.rows?.[0]?.role ? String(r.rows[0].role).trim().toLowerCase() : null;
            }
          } else if (req.user.email) {
            let r = await pool.query('SELECT role FROM users WHERE email=$1 LIMIT 1', [req.user.email]);
            dbRole = r.rows?.[0]?.role ? String(r.rows[0].role).trim().toLowerCase() : null;
            if (!dbRole) {
              r = await pool.query('SELECT role FROM "Users" WHERE email=$1 LIMIT 1', [req.user.email]);
              dbRole = r.rows?.[0]?.role ? String(r.rows[0].role).trim().toLowerCase() : null;
            }
            if (!dbRole) {
              r = await pool.query('SELECT role FROM customers WHERE email=$1 LIMIT 1', [req.user.email]);
              dbRole = r.rows?.[0]?.role ? String(r.rows[0].role).trim().toLowerCase() : null;
            }
          } else if (req.user.username) {
            let r = await pool.query('SELECT role FROM users WHERE username=$1 LIMIT 1', [req.user.username]);
            dbRole = r.rows?.[0]?.role ? String(r.rows[0].role).trim().toLowerCase() : null;
            if (!dbRole) {
              r = await pool.query('SELECT role FROM "Users" WHERE username=$1 LIMIT 1', [req.user.username]);
              dbRole = r.rows?.[0]?.role ? String(r.rows[0].role).trim().toLowerCase() : null;
            }
            if (!dbRole) {
              r = await pool.query('SELECT role FROM customers WHERE username=$1 LIMIT 1', [req.user.username]);
              dbRole = r.rows?.[0]?.role ? String(r.rows[0].role).trim().toLowerCase() : null;
            }
          }
          if (dbRole && allowed.includes(dbRole)) {
            req.user.role = dbRole;
            return next();
          }
        } catch (e) {
          // ignore and fall through to 403
        }
        if (process.env.AUTH_DEBUG === 'true') {
          console.log('[authorizeRoles] insufficient permissions; role=', role, 'allowed=', allowed);
        }
        return res.status(403).json({ success: false, message: "Forbidden: insufficient permissions" });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports.authorizeRoles = authorizeRoles;
