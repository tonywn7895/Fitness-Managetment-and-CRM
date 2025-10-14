// routes/saleRoutes.js
const express = require('express');
const router = express.Router();
const saleController = require('../controllers/salesController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/:filter', authenticateToken, saleController.getSalesByFilter); // e.g. /api/sales/daily
router.get('/daily', authenticateToken, saleController.getDailySales); // /api/sales/daily
router.get('/', authenticateToken, saleController.getTotalSales);

module.exports = router;