const express = require("express");
const router = express.Router();
const { pool } = require("../config/db.js");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, price, duration_months, description, features, created_at
      FROM plans
      ORDER BY id ASC
    `);

    // ✅ แปลงคอลัมน์ features ให้เป็น array จริง
    const formattedPlans = result.rows.map((plan) => ({
      ...plan,
      features:
        typeof plan.features === "string"
          ? JSON.parse(plan.features)
          : plan.features,
    }));

    res.json({ success: true, plans: formattedPlans });
  } catch (err) {
    console.error("❌ Error fetching plans:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;