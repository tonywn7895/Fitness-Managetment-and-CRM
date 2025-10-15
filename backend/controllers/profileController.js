const { pool } = require("../config/db");
const bcrypt = require("bcrypt");
const path = require("path");
const multer = require("multer")
const { Buffer } = require("buffer");


// ตั้งค่า multer สำหรับอัปโหลดไฟล์
const storage = multer.memoryStorage(); 
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadMiddleware = upload.single("profileImage");

// Get Profile (Read)
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT username, email, subscription_status, profile_image FROM customers WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update Profile (Edit Profile - Update username, email, profileImage)
exports.editProfile = [
  uploadMiddleware, // multer memoryStorage: upload.single('profileImage')
  async (req, res) => {
    const client = await pool.connect();
    try {
      const userId = req.user && req.user.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      // อ่านค่าและ normalize
      let { username, email } = req.body;
      username = typeof username === "string" ? username.trim() : undefined;
      email = typeof email === "string" ? email.trim().toLowerCase() : undefined;
      const file = req.file; // อันนี้มาจาก multer

      // อย่างน้อยต้องมีอย่างใดอย่างหนึ่งที่จะอัปเดต
      if (!username && !email && !file) {
        return res.status(400).json({ success: false, message: "No data to update" });
      }

      // validation
      if (username && !/^[a-zA-Z0-9_.]{3,30}$/.test(username)) {
        return res.status(400).json({ success: false, message: "Username must be 3-30 chars, letters/numbers/._ allowed" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }

      // File validation
      if (file) {
        if (!file.mimetype || !file.mimetype.startsWith("image/")) {
          return res.status(400).json({ success: false, message: "Uploaded file must be an image" });
        }
        // ขนาดจำกัด เช่น 2MB
        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          return res.status(400).json({ success: false, message: "Image too large (max 2MB)" });
        }
      }

      // เริ่ม transaction เพื่อป้องกัน race condition
      await client.query("BEGIN");

      // ตรวจว่าผู้ใช้มีจริง
      const { rows: existingRows } = await client.query("SELECT id, username, email FROM customers WHERE id = $1", [userId]);
      if (existingRows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ success: false, message: "User not found" });
      }
      const current = existingRows[0];

      // ถ้ามีการเปลี่ยน username/email ให้เช็คซ้ำ
      if (username && username !== current.username) {
        const dup = await client.query("SELECT id FROM customers WHERE username = $1 AND id <> $2", [username, userId]);
        if (dup.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(409).json({ success: false, message: "Username already taken" });
        }
      }
      if (email && email !== current.email) {
        const dup = await client.query("SELECT id FROM customers WHERE email = $1 AND id <> $2", [email, userId]);
        if (dup.rows.length > 0) {
          await client.query("ROLLBACK");
          return res.status(409).json({ success: false, message: "Email already in use" });
        }
      }

      const sets = [];
      const values = [];
      let idx = 1;
      if (username) { sets.push(`username = $${idx++}`); values.push(username); }
      if (email)    { sets.push(`email = $${idx++}`); values.push(email); }
      if (file)     { sets.push(`profile_image = $${idx++}`); values.push(file.buffer); }

      if (sets.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Nothing to update" });
      }

      // WHERE id param
      values.push(userId);
      const sql = `UPDATE customers SET ${sets.join(", ")} WHERE id = $${idx} RETURNING id, username, email, profile_image`;
      const { rows: updatedRows } = await client.query(sql, values);

      await client.query("COMMIT");

      const updated = updatedRows[0];

      let profileImageUrl = null;
      if (updated.profile_image) {
        const bufferData = Buffer.from(updated.profile_image);
        const mime = file && file.mimetype ? file.mimetype : "image/jpeg";
        profileImageUrl = `data:${mime};base64,${bufferData.toString("base64")}`;
      }
      res.json({
        success: true,
        message: "Profile updated",
        data: { id: updated.id, username: updated.username, email: updated.email, profileImage: profileImageUrl },
      });
    } catch (err) {
      // ถ้า error ให้ rollback และ handle duplicate-key (23505)
      try { await client.query("ROLLBACK"); } catch (e) {}
      console.error("Edit profile error:", err);
      if (err.code === "23505") {
        return res.status(409).json({ success: false, message: "Duplicate value (username/email)" });
      }
      return res.status(500).json({ success: false, message: "Server error" });
    } finally {
      client.release();
    }
  },
];

// Change Password (Update password only)
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword, confirmPassword } = req.body;
  console.log("Change password request:", { userId, oldPassword: !!oldPassword, newPassword: !!newPassword }); // Debug เพื่อดูว่าข้อมูลมาถูกต้องไหม
  try {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    const userResult = await pool.query("SELECT password FROM customers WHERE id = $1", [userId]);
    console.log("User result length:", userResult.rows.length);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const storedPassword = userResult.rows[0].password;

    const isMatch = await bcrypt.compare(oldPassword, storedPassword);
    console.log("Password match:", isMatch);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const result = await pool.query(
      "UPDATE customers SET password = $1 WHERE id = $2 RETURNING id",
      [hashedPassword, userId]
    );
    console.log("Update result:", result.rows); // Debug เพื่อดูว่าอัปเดตสำเร็จไหม

    res.json({ success: true, message: "Password updated", data: result.rows[0] });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete Profile (Delete)
exports.deleteProfile = async (req, res) => {
  const userId = req.user.id;
  console.log("Deleting profile for userId:", userId); // Debug
  if (!userId) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }
  try {
    const result = await pool.query("DELETE FROM customers WHERE id = $1 RETURNING *", [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    console.error("Delete profile error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message }); 
  }
};