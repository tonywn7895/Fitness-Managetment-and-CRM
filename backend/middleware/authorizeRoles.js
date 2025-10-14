// backend/middleware/authorizeRoles.js
const { pool } = require("../config/db");

async function resolveRoleFromDb(userPayload) {
  if (!userPayload) return null;
  let row;
  if (userPayload.id) {
    row = (await pool.query("SELECT role FROM customers WHERE id=$1 LIMIT 1", [userPayload.id])).rows[0];
    if (row?.role) return row.role;
  }
  if (userPayload.email) {
    row = (await pool.query("SELECT role FROM customers WHERE email=$1 LIMIT 1", [userPayload.email])).rows[0];
    if (row?.role) return row.role;
  }
  if (userPayload.username) {
    row = (await pool.query("SELECT role FROM customers WHERE username=$1 LIMIT 1", [userPayload.username])).rows[0];
    if (row?.role) return row.role;
  }
  return null;
}

function authorizeRoles(...allowed) {
  return async (req, res, next) => {
    try {
      let role = req.user?.role || await resolveRoleFromDb(req.user);
      if (!role) return res.status(403).json({ success:false, message:"Forbidden: missing role" });
      if (!allowed.includes(role)) {
        return res.status(403).json({ success:false, message:"Forbidden: insufficient permissions" });
      }
      next();
    } catch (err) {
      console.error("authorizeRoles error:", err);
      return res.status(500).json({ success:false, message:"Authorization error" });
    }
  };
}

module.exports = { authorizeRoles };
