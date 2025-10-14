const Omise = require("omise");
const QRCode = require("qrcode");
const { pool } = require("../config/db");

// ✅ init Omise
const omise = Omise({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: "2019-05-29",
});

// ✅ สร้าง QR Code สำหรับการชำระเงิน
exports.createQRCodePayment = async (req, res) => {
  try {
    const { amount, email } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ success: false, message: "Missing amount or email" });
    }

    // amount ต้องเป็น satang → เช่น 100 บาท = 10000
    const charge = await omise.charges.create({
      amount: amount * 100,
      currency: "thb",
      return_uri: "http://localhost:3000/payment-success",
      source: {
        type: "promptpay",
      },
    });

    // สร้าง QRCode จาก omise charge
    const qrImageUrl = await QRCode.toDataURL(charge.source.scannable_code.image.download_uri);

    res.json({
      success: true,
      chargeId: charge.id,
      qrImageUrl,
      amount,
      email,
    });
  } catch (err) {
    console.error("QR Payment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Confirm Payment → update DB
exports.confirmPayment = async (req, res) => {
  try {
    const { chargeId, customerId, points } = req.body;

    if (!chargeId || !customerId) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    // ตรวจสอบ charge จาก Omise
    const charge = await omise.charges.retrieve(chargeId);

    if (charge.status !== "successful") {
      return res.status(400).json({ success: false, message: "Payment not confirmed yet" });
    }

    // บันทึกการเติมเงินลง DB
    await pool.query(
      "INSERT INTO payment_history (customer_id, amount, charge_id, status) VALUES ($1, $2, $3, $4)",
      [customerId, charge.amount / 100, chargeId, charge.status]
    );

    // อัปเดตแต้มให้ลูกค้า (ถ้าใช้ระบบ point)
    if (points) {
      await pool.query("UPDATE customers SET points = points + $1 WHERE id = $2", [points, customerId]);
    }

    res.json({ success: true, message: "Payment confirmed", charge });
  } catch (err) {
    console.error("Confirm Payment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};