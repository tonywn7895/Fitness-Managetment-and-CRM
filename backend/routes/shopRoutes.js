const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/shopController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/checkout', authenticateToken, authorizeRoles('admin','staff'), ctrl.checkout);
router.post('/redeem', authenticateToken, authorizeRoles('admin','staff'), ctrl.redeem);

// Customer self-service
router.post('/customer/checkout', authenticateToken, ctrl.checkoutCustomer);
router.post('/customer/redeem', authenticateToken, ctrl.redeemCustomer);

module.exports = router;
