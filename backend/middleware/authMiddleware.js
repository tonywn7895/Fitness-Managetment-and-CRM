const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

// ✅ ตรวจสอบ token สำหรับทุก request
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Please log in" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ success: false, message: "Token has expired" });
      } else if (err.name === "JsonWebTokenError") {
        return res
          .status(403)
          .json({ success: false, message: "Invalid token format" });
      }
      return res
        .status(403)
        .json({ success: false, message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// ✅ ตรวจสอบสิทธิ์การเข้าถึง (Role-based Authorization)
// ใช้ร่วมกับ authenticateToken เช่น:
// router.get("/admin", authenticateToken, authorizeRoles("admin"), handler);
const authorizeRoles = (...allowedRoles) => {
  const allowed = allowedRoles.map((r) => String(r).trim().toLowerCase());
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      let role = req.user.role
        ? String(req.user.role).trim().toLowerCase()
        : null;

      // ถ้าไม่มี role ใน JWT → ดึงจากฐานข้อมูล
      if (!role) {
        let row;
        try {
          if (req.user.id) {
            row = (
              await pool.query("SELECT role FROM customers WHERE id = $1", [
                req.user.id,
              ])
            ).rows[0];
            role = row?.role ? String(row.role).trim().toLowerCase() : null;
          }
        } catch (_) {}
      }

      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: missing role",
        });
      }

      if (!allowed.includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: insufficient permissions",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { authenticateToken, authorizeRoles };
