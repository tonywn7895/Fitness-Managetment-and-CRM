const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const paymentWebhookController = require("../controllers/paymentWebhookController");

// ✅ Webhook (จาก Omise)
router.post("/webhook", paymentWebhookController.handleOmiseWebhook);

// ✅ สร้าง QR สำหรับชำระเงิน
router.post("/qrcode", paymentController.createQRCodePayment);

// ✅ ตรวจสอบสถานะ และดึง Entry QR
router.get("/status/:orderId", paymentController.getPaymentStatus);
router.get("/entry-qr/:orderId", paymentController.getEntryQR);

module.exports = router;
