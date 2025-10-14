const express = require("express");
const router = express.Router();

// แก้ path ให้ตรงกับไฟล์ของคุณจริง ๆ
const { authenticateToken } = require("../middleware/authMiddleware"); 
const { authorizeRoles } = require("../middleware/authorizeRoles");
const ctrl = require("../controllers/dashboardController");

router.get("/__health", (req, res) => res.json({ ok: true }));

router.get("/summary", authenticateToken, ctrl.getSummary);
router.get("/points/top", authenticateToken, ctrl.getTopPoints);
router.get("/checkins/today", authenticateToken, ctrl.getCheckinsToday);
router.get("/expiring", authenticateToken, authorizeRoles("admin","staff"), ctrl.getExpiring);

module.exports = router;
