const express = require("express");
const router = express.Router();
const { register, login, checkauth, sendEmail } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { pool } = require("../config/db");

router.post("/register", register);
router.post('/login', login);
router.get('/check-auth', authenticateToken, checkauth);
router.post('/send-email', sendEmail);

// Diagnostic helper to see JWT payload and DB role resolution
router.get('/whoami', authenticateToken, async (req, res) => {
  try {
    let dbRole = null;
    if (req.user?.id) {
      const r = await pool.query('SELECT role FROM customers WHERE id=$1 LIMIT 1', [req.user.id]);
      dbRole = r.rows?.[0]?.role || null;
    } else if (req.user?.email) {
      const r = await pool.query('SELECT role FROM customers WHERE email=$1 LIMIT 1', [req.user.email]);
      dbRole = r.rows?.[0]?.role || null;
    } else if (req.user?.username) {
      const r = await pool.query('SELECT role FROM customers WHERE username=$1 LIMIT 1', [req.user.username]);
      dbRole = r.rows?.[0]?.role || null;
    }
    res.json({ success: true, data: { jwt: req.user, dbRole } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
