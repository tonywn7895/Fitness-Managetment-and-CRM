const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productsController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage for product images
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `p_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Public list MUST come before param routes to avoid being captured by ":id"
router.get('/public/list', ctrl.publicList);

router.get('/', authenticateToken, authorizeRoles('admin','staff'), ctrl.list);
router.get('/:id', authenticateToken, authorizeRoles('admin','staff'), ctrl.get);
router.post('/', authenticateToken, authorizeRoles('admin','staff'), ctrl.create);
router.put('/:id', authenticateToken, authorizeRoles('admin','staff'), ctrl.update);
router.delete('/:id', authenticateToken, authorizeRoles('admin','staff'), ctrl.remove);

// Image upload (admin)
router.post('/:id/image', authenticateToken, authorizeRoles('admin','staff'), upload.single('image'), ctrl.setImage);

module.exports = router;
