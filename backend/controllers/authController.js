const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { pool } = require("../config/db");

// ✅ Customer Register
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // ตรวจสอบซ้ำ
    const usernameCheck = await pool.query("SELECT username FROM customers WHERE username=$1", [username]);
    if (usernameCheck.rows.length > 0) return res.status(400).json({ success: false, message: "Username exists" });

    const emailCheck = await pool.query("SELECT email FROM customers WHERE email=$1", [email]);
    if (emailCheck.rows.length > 0) return res.status(400).json({ success: false, message: "Email exists" });

    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO customers (username, email, password, subscription_status, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, role, username, email`,
      [username, email, hashedPassword, "Not Active", role || "customer"]
    );

    const payload = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email,
      role: result.rows[0].role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      success: true,
      message: "Registration successful!",
      token,
      customerId: result.rows[0].id,
      user: payload,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Login (รองรับทั้ง user/staff และ customer)
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Please provide email/username and password" });
    }

    // 1️⃣ ลองหาในตาราง Users (admin/staff)
    let adminRes;
    try {
      adminRes = await pool.query(
        `SELECT id, username, COALESCE(email, '') AS email, password, role
         FROM users WHERE username=$1 OR email=$1`,
        [identifier]
      );
    } catch (_) {
      try {
        adminRes = await pool.query(
          `SELECT id, username, COALESCE(email, '') AS email, password, role
           FROM "Users" WHERE username=$1 OR email=$1`,
          [identifier]
        );
      } catch (_) {}
    }

    if (adminRes && adminRes.rows.length > 0) {
      const adminUser = adminRes.rows[0];
      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

      const payload = {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role || "staff",
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
      return res.json({ success: true, message: "Login successful", token, user: payload });
    }

    // 2️⃣ หาใน customers
    const result = await pool.query(
      `SELECT id, username, email, password, role
       FROM customers WHERE username=$1 OR email=$1`,
      [identifier]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: "User not found" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const payload = { id: user.id, username: user.username, email: user.email, role: user.role || "customer" };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ success: true, message: "Login successful", token, user: payload });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Check Auth
exports.checkauth = async (req, res) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: "User not authenticated" });
  res.json({ success: true, data: req.user });
};

// ✅ Send Email (เช่น ยืนยันการสมัคร / แผนสมาชิก)
exports.sendEmail = async (req, res) => {
  const { to, subject, html } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });
    res.json({ success: true, message: "Email sent" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Email sending failed" });
  }
};
