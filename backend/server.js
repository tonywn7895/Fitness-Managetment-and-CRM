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

// Routes
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const salesRoutes = require("./routes/salesRoutes");
const membersRoutes = require("./routes/membersRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const profileRoutes = require("./routes/profileRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const plansRoutes = require("./routes/plansRoutes");
const membershipsRoutes = require("./routes/membershipsRoutes");
const productsRoutes = require("./routes/productsRoutes");
const shopRoutes = require("./routes/shopRoutes");
const path = require("path");
const { authenticateToken } = require("./middleware/authMiddleware");


app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sale", salesRoutes);
// Backward-compatibility alias for plural path used by frontend
app.use("/api/sales", salesRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/memberships", membershipsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/shop", shopRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Compatibility endpoint expected by some frontend code
app.get("/api/points/total/all", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT COALESCE(SUM(points), 0)::int AS total_points FROM points');
    res.json({ success: true, data: { total_points: result.rows[0].total_points } });
  } catch (err) {
    console.error('compat points total all error:', err.message);
    // Return zero to keep dashboard functioning even if table is missing
    res.json({ success: true, data: { total_points: 0 } });
  }
});

// Global 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Server error' });
});

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

