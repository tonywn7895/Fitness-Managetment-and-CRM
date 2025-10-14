// routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const { getProfile, editProfile, deleteProfile } = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/profile", authenticateToken, getProfile);
router.put("/edit", authenticateToken, editProfile);
router.delete("/profile", authenticateToken, deleteProfile);

module.exports = router;