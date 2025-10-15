const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { pool } = require("./config/db.js");
const bodyParser = require("body-parser");
const { handleOmiseWebhook } = require("./controllers/paymentWebhookController");

dotenv.config();

const app = express();

// Webhook route ต้องมาก่อน express.json()
app.post(
  "/api/payment/webhook",
  bodyParser.raw({ type: "application/json" }),
  handleOmiseWebhook
);

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

const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const salesRoutes = require("./routes/salesRoutes");
const profileRoutes = require("./routes/profileRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const planRoutes = require("./routes/planRoutes");
const membershipRoutes = require("./routes/membershipRoutes");

app.use("/api/payment", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sale", salesRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/membership", membershipRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
