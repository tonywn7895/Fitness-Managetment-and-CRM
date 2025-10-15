// controllers/paymentController.js
const Omise = require("omise");
const QRCode = require("qrcode");
const { pool } = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// ✅ init Omise
const omise = Omise({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: "2019-05-29",
});

/**
 * ✅ สร้าง QR Code สำหรับชำระเงิน
 */
exports.createQRCodePayment = async (req, res) => {
  try {
    let { amount, email, customerId, planName, startDate } = req.body;

    if (!amount || !email || !customerId || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: amount, email, customerId, startDate",
      });
    }

    amount = Number(amount);

    // ✅ หา plan_id และ duration_months จากชื่อแผน
    let planId = null;
    let duration_months = 1;
    if (planName) {
      const planRes = await pool.query(
        "SELECT id, duration_months FROM plans WHERE name = $1",
        [planName]
      );
      if (planRes.rows.length > 0) {
        planId = planRes.rows[0].id;
        duration_months = planRes.rows[0].duration_months;
      }
    }

    // ✅ คำนวณ end_date จาก start_date + duration_months
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration_months);

    // ✅ สร้าง refCode และบันทึกลง DB (สถานะเริ่มต้น PENDING)
    const refCode = `ORD-${Date.now()}`;
    const orderRes = await pool.query(
      `INSERT INTO orders (ref_code, customer_id, plan_id, amount, status, start_date, end_date, created_at)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, NOW())
       RETURNING id`,
      [refCode, customerId, planId, amount, startDate, endDate]
    );
    const orderId = orderRes.rows[0].id;

    // ✅ สร้าง charge บน Omise
    const charge = await omise.charges.create({
      amount: Math.round(amount * 100),
      currency: "thb",
      return_uri:
        process.env.OMISE_RETURN_URI ||
        "http://localhost:3000/payment-success",
      source: { type: "promptpay" },
      metadata: { order_id: orderId, ref_code: refCode, customer_id: customerId },
    });

    // ✅ ดึง QR image จาก Omise
    const qrImageUrl =
      charge.source?.scannable_code?.image?.download_uri || null;

    // ✅ อัปเดต order ให้เก็บ charge_id
    await pool.query(
      "UPDATE orders SET charge_id=$1 WHERE id=$2",
      [charge.id, orderId]
    );

    console.log("✅ Order created:", { orderId, startDate, endDate });

    return res.json({
      success: true,
      orderId,
      chargeId: charge.id,
      qrImageUrl,
    });
  } catch (err) {
    console.error("❌ QR Payment error:", err);
    if (err.code) {
      return res
        .status(500)
        .json({
          success: false,
          message: `Omise error: ${err.code} - ${err.message}`,
        });
    }
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

/**
 * ✅ ดึง QR สำหรับเข้าใช้บริการฟิตเนส
 */
exports.getEntryQR = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await pool.query(
      "SELECT data_url FROM entry_qr WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1",
      [orderId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Entry QR not found" });
    }

    return res.json({
      success: true,
      qrDataUrl: result.rows[0].data_url,
    });
  } catch (err) {
    console.error("❌ Get entry QR error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

/**
 * ✅ ตรวจสอบสถานะการชำระเงิน
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await pool.query("SELECT status FROM orders WHERE id = $1", [
      orderId,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, status: result.rows[0].status });
  } catch (err) {
    console.error("❌ Get payment status error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

/**
 * 🧾 Confirm Payment → update DB (จากเพื่อน)
 */
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

    // บันทึกการชำระเงินลง DB
    await pool.query(
      "INSERT INTO payment_history (customer_id, amount, charge_id, status) VALUES ($1, $2, $3, $4)",
      [customerId, charge.amount / 100, chargeId, charge.status]
    );

    // เพิ่มแต้มให้ลูกค้า (ถ้ามีระบบ point)
    if (points) {
      await pool.query("UPDATE customers SET points = points + $1 WHERE id = $2", [points, customerId]);
    }

    res.json({ success: true, message: "Payment confirmed", charge });
  } catch (err) {
    console.error("Confirm Payment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
