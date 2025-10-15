const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

//Customer Register
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // ตรวจสอบ username/email
    const usernameCheck = await pool.query("SELECT username FROM customers WHERE username=$1", [username]);
    if (usernameCheck.rows.length > 0) return res.status(400).json({ success: false, message: "Username exists" });

    const emailCheck = await pool.query("SELECT email FROM customers WHERE email=$1", [email]);
    if (emailCheck.rows.length > 0) return res.status(400).json({ success: false, message: "Email exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      "INSERT INTO customers (username, email, password, subscription_status, role) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [username, email, hashedPassword, "Not Active", role || "customer"]
    );

    const token = jwt.sign({ id: result.rows[0].id, username, email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ success: true, message: "Registration successful!", token, customerId: result.rows[0].id });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Customer Login
exports.login = async (req, res) => {
  console.log("Login request:", req.body); // debug
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Please provide email/username and password" });
    }
    
    const result = await pool.query(
      "SELECT id, username, email, password FROM customers WHERE username = $1 OR email = $1",
      [identifier]    
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//check customer authentication for chooseplan
exports.checkauth = async (req, res) => {
  console.log("req.user:", req.user); // Debug: ดูข้อมูล req.user ใน terminal
  if (!req.user) {
    return res.status(401).json({ success: false, message: "User not authenticated" }); // ส่ง JSON
  }
  res.json({ success: true, data: req.user });
}

//send email for customer membership plan success
exports.sendEmail = async (req, res) => {
  const { to, subject, html } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    res.json({ success: true, message: 'Email sent' });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Email sending failed" });
  }
};