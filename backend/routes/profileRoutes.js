const express = require("express");
const router = express.Router();
const { getProfile, editProfile, changePassword, deleteProfile } = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/authMiddleware");

// ✅ Profile Routes
router.get("/profile", authenticateToken, getProfile);
router.put("/edit", authenticateToken, editProfile);
router.put("/change-password", authenticateToken, changePassword);
router.delete("/profile", authenticateToken, deleteProfile);

module.exports = router;
