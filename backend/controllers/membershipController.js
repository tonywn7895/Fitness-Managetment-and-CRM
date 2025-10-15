// controllers/membershipController.js
const { pool } = require("../config/db");

/**
 * GET /api/membership/myplan
 * ดึงข้อมูลแผนสมาชิกปัจจุบันของลูกค้า
 */
exports.getMyPlan = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Missing user" });
    }

    // ✅ Query ที่ join ทั้ง plans + entry_qr และเลือกเฉพาะสถานะ PAID
    const query = `
      SELECT 
        o.id AS order_id,
        o.status,
        o.start_date,
        o.end_date,
        p.name AS plan_name,
        p.duration_months,
        p.price,
        p.description,
        e.data_url AS qr_data_url
      FROM orders o
      JOIN plans p ON o.plan_id = p.id
      LEFT JOIN entry_qr e ON e.order_id = o.id
      WHERE o.customer_id = $1
      AND o.status = 'PAID'
      ORDER BY o.created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [customerId]);

    // ❌ กรณีไม่มี plan ที่ active
    if (result.rowCount === 0) {
      return res.json({
        success: true,
        plan: null,
        message: "No active membership found",
      });
    }

    const plan = result.rows[0];

    // ✅ แปลงข้อมูลให้อยู่ในรูปแบบที่ MyPlan.jsx ใช้ได้
    return res.json({
      success: true,
      plan: {
        order_id: plan.order_id,
        plan_name: plan.plan_name,
        duration_months: plan.duration_months,
        price: plan.price,
        description: plan.description,
        start_date: plan.start_date,
        end_date: plan.end_date,
        status: "Active",
        qr_data_url: plan.qr_data_url || null,
      },
    });
  } catch (err) {
    console.error("❌ getMyPlan error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

/**
 * GET /api/membership/history
 * ดึงประวัติการสั่งซื้อแผนของลูกค้า
 */
exports.getPlanHistory = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized - Missing user" });
    }

    const result = await pool.query(
      `
      SELECT 
        o.id AS order_id,
        p.name AS plan_name,
        p.price,
        o.status,
        o.start_date,
        o.end_date,
        o.created_at
      FROM orders o
      JOIN plans p ON o.plan_id = p.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC
      `,
      [customerId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("❌ getPlanHistory error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

/**
 * PUT /api/membership/cancel
 * ยกเลิกแผนสมาชิก (เช่น กรณีลูกค้าไม่ต้องการต่ออายุ)
 */
exports.cancelMembership = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ success: false, message: "Unauthorized - Missing user" });
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET status = 'CANCELLED'
      WHERE customer_id = $1
      AND status = 'PAID'
      RETURNING id
      `,
      [customerId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "No active membership to cancel" });
    }

    await pool.query(
      "UPDATE customers SET subscription_status = 'Not Active' WHERE id = $1",
      [customerId]
    );

    res.json({ success: true, message: "Membership cancelled successfully" });
  } catch (err) {
    console.error("❌ cancelMembership error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};
