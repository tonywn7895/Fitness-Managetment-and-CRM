// controllers/paymentWebhookController.js
const Omise = require("omise");
const { pool } = require("../config/db");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

const omise = Omise({
  secretKey: process.env.OMISE_SECRET_KEY,
  omiseVersion: "2019-05-29",
});

exports.handleOmiseWebhook = async (req, res) => {
  console.log("📡 Received webhook from Omise");
  console.log("Headers:", req.headers);

  try {
    const raw = req.body.toString("utf8");
    let eventData;
    try {
      eventData = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Webhook parse error:", err.message);
      return res.status(400).send("Invalid JSON format");
    }

    // ✅ Log ทั้ง body ดูโครงสร้างจริง
    console.log("🔍 Webhook body parsed:", JSON.stringify(eventData, null, 2));

    // ✅ Omise webhook structure จะมี charge อยู่ใน eventData.data (ไม่ใช่ eventData.data.object)
    const charge = eventData.data || eventData.data?.object;
    if (!charge) return res.status(400).send("Missing charge object");

    // ✅ ตอนนี้ metadata อยู่ใน charge.metadata แล้ว
    const metadata = charge.metadata || {};
    console.log("🔍 Metadata received:", metadata);

    const orderId = metadata.order_id || metadata.orderId || null;
    console.log("🧾 Extracted orderId:", orderId);

    if (!orderId) {
      return res.status(200).send("No order_id found in metadata");
    }

    const status = charge.status;
    console.log("💳 Charge Status:", status);

    if (status === "successful") {
      console.log("✅ Payment successful for order:", orderId);

      await pool.query(
        "UPDATE orders SET status = $1, paid_at = NOW() WHERE id = $2",
        ["PAID", orderId]
      );

      const token = uuidv4();
      const entryLink = `https://factfit.test/entry/${token}`;
      const qrDataUrl = await QRCode.toDataURL(entryLink);

      await pool.query(
        `INSERT INTO entry_qr (order_id, token, data, data_url, created_at) VALUES ($1, $2, $3, $4, NOW())`,
        [orderId, token, entryLink, qrDataUrl]
      );

      await pool.query(
        `UPDATE customers 
         SET subscription_status = 'ACTIVE' 
         WHERE id = (SELECT customer_id FROM orders WHERE id = $1)`,
        [orderId]
      );

      console.log("✅ DB updated and QR generated");
      return res.status(200).send("Payment successful");
    }

    return res.status(200).send("Payment pending or failed");
  } catch (err) {
    console.error("❌ Webhook handling error:", err);
    return res.status(500).send("Internal Server Error");
  }
};