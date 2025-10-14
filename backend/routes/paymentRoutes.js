const express = require("express");
const router = express.Router();
const { createQRCodePayment, confirmPayment } = require("../controllers/paymentController");



// สร้าง QR Code สำหรับการชำระเงิน
router.post("/qrcode", createQRCodePayment);

// Confirm Payment
router.post("/confirm", confirmPayment);

module.exports = router;