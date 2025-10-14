const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/membershipsController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/purchase', authenticateToken, authorizeRoles('admin','staff'), ctrl.purchase);
router.get('/current/:customerId', authenticateToken, ctrl.current);
router.get('/customer/:customerId', authenticateToken, authorizeRoles('admin','staff'), ctrl.listByCustomer);

module.exports = router;

