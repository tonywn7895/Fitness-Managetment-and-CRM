// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const paymentWebhookController = require('../controllers/paymentWebhookController');

// ✅ สร้าง QR/charge
router.post('/qrcode', paymentController.createQRCodePayment);

// ✅ ตรวจสอบสถานะ
router.get('/status/:orderId', paymentController.getPaymentStatus);
router.get('/entry-qr/:orderId', paymentController.getEntryQR);

module.exports = router;