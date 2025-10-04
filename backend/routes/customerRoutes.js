// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken } = require('../middleware/authMiddleware');

// ถ้าเป็นหน้า admin ให้ใช้ authenticateToken (หรือเช็ค role เพิ่ม)
router.get('/', authenticateToken, customerController.getAllCustomers);
router.get('/count', authenticateToken, customerController.getCount);
router.get('/:id', authenticateToken, customerController.getCustomerById);
router.put('/:id', authenticateToken, customerController.updateCustomer);
router.delete('/:id', authenticateToken, customerController.deleteCustomer);

router.post('/:id/points', authenticateToken, customerController.addPoints);
router.post('/:id/points/subtract', authenticateToken, customerController.subtractPoints);

router.get('/:id/history', authenticateToken, customerController.getHistory);

module.exports = router;
