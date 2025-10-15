const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

// 📸 ตั้งค่า multer สำหรับอัปโหลดรูป (เก็บใน memory)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // max 2MB
const uploadMiddleware = upload.single("profileImage");

// ✅ อ่านข้อมูลโปรไฟล์
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT username, email, subscription_status, profile_image FROM customers WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ อัปเดตโปรไฟล์ (username, email, profile image)
exports.editProfile = [
  uploadMiddleware,
  async (req, res) => {
    const client = await pool.connect();
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, message: "Unauthorized" });

      let { username, email } = req.body;
      const file = req.file;
      username = username?.trim();
      email = email?.trim().toLowerCase();

      if (!username && !email && !file)
        return res.status(400).json({ success: false, message: "No data to update" });

      // ตรวจสอบรูปแบบข้อมูล
      if (username && !/^[a-zA-Z0-9_.]{3,30}$/.test(username))
        return res.status(400).json({ success: false, message: "Invalid username" });
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ success: false, message: "Invalid email format" });

      if (file) {
        if (!file.mimetype.startsWith("image/"))
          return res.status(400).json({ success: false, message: "File must be an image" });
      }

      await client.query("BEGIN");

      // ตรวจสอบซ้ำซ้อน
      const dupUser = username
        ? await client.query("SELECT id FROM customers WHERE username=$1 AND id<>$2", [username, userId])
        : { rows: [] };
      if (dupUser.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ success: false, message: "Username already taken" });
      }

      const dupEmail = email
        ? await client.query("SELECT id FROM customers WHERE email=$1 AND id<>$2", [email, userId])
        : { rows: [] };
      if (dupEmail.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ success: false, message: "Email already in use" });
      }

      // ✅ อัปเดตเฉพาะฟิลด์ที่ส่งมา
      const sets = [];
      const values = [];
      let i = 1;
      if (username) { sets.push(`username=$${i++}`); values.push(username); }
      if (email) { sets.push(`email=$${i++}`); values.push(email); }
      if (file) { sets.push(`profile_image=$${i++}`); values.push(file.buffer); }

      values.push(userId);
      const sql = `UPDATE customers SET ${sets.join(", ")} WHERE id=$${i} RETURNING id, username, email, profile_image`;
      const result = await client.query(sql, values);

      await client.query("COMMIT");

      const updated = result.rows[0];
      let profileImageUrl = null;
      if (updated.profile_image) {
        profileImageUrl = `data:image/jpeg;base64,${updated.profile_image.toString("base64")}`;
      }

      res.json({
        success: true,
        message: "Profile updated",
        data: { id: updated.id, username: updated.username, email: updated.email, profileImage: profileImageUrl },
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Edit profile error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    } finally {
      client.release();
    }
  },
];

// ✅ เปลี่ยนรหัสผ่าน
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword, confirmPassword } = req.body;
  try {
    const result = await pool.query("SELECT password FROM customers WHERE id = $1", [userId]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "User not found" });

    const stored = result.rows[0].password;
    const isMatch = await bcrypt.compare(oldPassword, stored);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Old password incorrect" });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, message: "Password must be at least 8 chars" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE customers SET password=$1 WHERE id=$2", [hashed, userId]);

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ ลบบัญชีผู้ใช้
exports.deleteProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query("DELETE FROM customers WHERE id=$1 RETURNING *", [userId]);
    if (result.rowCount === 0)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    console.error("Delete profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};