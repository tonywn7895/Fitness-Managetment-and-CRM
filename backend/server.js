const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { pool } = require("./config/db.js");
const bodyParser = require("body-parser");
const { handleOmiseWebhook } = require("./controllers/paymentWebhookController");
const path = require("path");
const { authenticateToken } = require("./middleware/authMiddleware");

dotenv.config();
const app = express();

// ✅ Webhook route ต้องมาก่อน express.json()
app.post(
  "/api/payment/webhook",
  bodyParser.raw({ type: "application/json" }),
  handleOmiseWebhook
);

// ✅ CORS Configuration
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-omise-signature"],
    credentials: true,
  })
);

// ✅ Middleware สำหรับ route ปกติ
app.use(express.json({ limit: "10mb" }));

// ✅ Routes
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const salesRoutes = require("./routes/salesRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const planRoutes = require("./routes/planRoutes");
const membershipRoutes = require("./routes/membershipRoutes");

// ✅ Routes ของเพื่อน (Dashboard, Shop, Members, etc.)
const membersRoutes = require("./routes/membersRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const plansRoutes = require("./routes/plansRoutes");
const membershipsRoutes = require("./routes/membershipsRoutes");
const productsRoutes = require("./routes/productsRoutes");
const shopRoutes = require("./routes/shopRoutes");

// ✅ Route Mapping
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sale", salesRoutes);
app.use("/api/sales", salesRoutes); // สำหรับ compatibility
app.use("/api/payment", paymentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/membership", membershipRoutes);

// ✅ ของเพื่อน
app.use("/api/members", membersRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/memberships", membershipsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/shop", shopRoutes);

// ✅ Serve Uploaded Files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Compatibility endpoint
app.get("/api/points/total/all", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(SUM(points), 0)::int AS total_points FROM points"
    );
    res.json({
      success: true,
      data: { total_points: result.rows[0].total_points },
    });
  } catch (err) {
    console.error("compat points total all error:", err.message);
    res.json({ success: true, data: { total_points: 0 } });
  }
});

// ✅ 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ✅ Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("SIGINT received - Closing DB...");
  try {
    await pool.end();
    console.log("DB closed successfully");
  } catch (err) {
    console.error("Error closing DB:", err);
  }
  console.log("Exiting process...");
  process.exit(0);
});
