const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

/**
 * ใส่เส้นทางที่ "เฉพาะเจาะจง" มาก่อน param routes (/:id) เพื่อกันชน
 * และคง endpoint /api/customers/points/total สำหรับความเข้ากันได้
 */

// points + metrics
router.get('/points/total', authenticateToken, customerController.getTotalPoints);
// total points across all customers (compat for Dashboard.jsx)
router.get('/points/total/all', authenticateToken, async (req, res) => {
  const { pool } = require('../config/db');
  try {
    const result = await pool.query('SELECT COALESCE(SUM(points), 0)::int AS total_points FROM points');
    return res.json({ success: true, data: { total_points: result.rows[0].total_points } });
  } catch (err) {
    // If points table does not exist or other error, return 0 to avoid breaking the dashboard
    console.error('points total all error:', err.message);
    return res.json({ success: true, data: { total_points: 0 } });
  }
});
router.get('/count', authenticateToken, customerController.getCount);

// create first (ไม่ชน /:id) — protect with role
router.post('/', authenticateToken, authorizeRoles('admin', 'staff'), customerController.createCustomer);

// points ops (ใช้ :id แต่เส้นทางยังเฉพาะกว่าการแมทช์ /:id ตรงๆ) — protect with role
router.post('/:id/points', authenticateToken, authorizeRoles('admin', 'staff'), customerController.addPoints);
router.delete('/:id/points/subtract', authenticateToken, customerController.subtractPoints);

// history
router.get('/:id/history', authenticateToken, customerController.getHistory);

// CRUD by id
router.put('/:id', authenticateToken, customerController.updateCustomer);
router.delete('/:id', authenticateToken, customerController.deleteCustomer);
router.get('/:id', authenticateToken, customerController.getCustomerById);

// list customers (วางท้ายได้ ไม่ชน /:id)
router.get('/', authenticateToken, customerController.getAllCustomers);

module.exports = router;
