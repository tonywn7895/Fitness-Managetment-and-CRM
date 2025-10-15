const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");
const { pool } = require("../config/db");

// ✅ Points summary (used by dashboard)
router.get("/points/total", authenticateToken, customerController.getTotalPoints);
router.get("/points/total/all", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT COALESCE(SUM(points), 0)::int AS total_points FROM points");
    return res.json({ success: true, data: { total_points: result.rows[0].total_points } });
  } catch (err) {
    console.error("points total all error:", err.message);
    return res.json({ success: true, data: { total_points: 0 } });
  }
});

// ✅ Get customer count
router.get("/count", authenticateToken, customerController.getCount);

// ✅ Create customer (admin/staff only)
router.post("/", authenticateToken, authorizeRoles("admin", "staff"), customerController.createCustomer);

// ✅ Manage points
router.post("/:id/points", authenticateToken, authorizeRoles("admin", "staff"), customerController.addPoints);
router.delete("/:id/points/subtract", authenticateToken, authorizeRoles("admin", "staff"), customerController.subtractPoints);

// ✅ Customer history
router.get("/:id/history", authenticateToken, customerController.getHistory);

// ✅ Update/Delete/View customer
router.put("/:id", authenticateToken, customerController.updateCustomer);
router.delete("/:id", authenticateToken, customerController.deleteCustomer);
router.get("/:id", authenticateToken, customerController.getCustomerById);

// ✅ Get all customers
router.get("/", authenticateToken, customerController.getAllCustomers);

module.exports = router;
