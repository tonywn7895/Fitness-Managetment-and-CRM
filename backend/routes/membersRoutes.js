const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/membersController');

// GET /api/members/growth
router.get('/growth', authenticateToken, ctrl.getGrowth);

module.exports = router;

