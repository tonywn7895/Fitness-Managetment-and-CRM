const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/plansController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, authorizeRoles('admin','staff'), ctrl.list);
router.get('/:id', authenticateToken, authorizeRoles('admin','staff'), ctrl.get);
router.post('/', authenticateToken, authorizeRoles('admin','staff'), ctrl.create);
router.put('/:id', authenticateToken, authorizeRoles('admin','staff'), ctrl.update);
router.delete('/:id', authenticateToken, authorizeRoles('admin','staff'), ctrl.remove);

module.exports = router;

