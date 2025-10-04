const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { pool } = require("./config/db.js");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Omise = require('omise');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// เรียก routes
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const salesRoutes = require("./routes/salesRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const workoutRoutes = require("./routes/workoutRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sale", salesRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/workout", workoutRoutes);

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Graceful Shutdown
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