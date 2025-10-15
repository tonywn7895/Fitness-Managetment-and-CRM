const express = require("express");
const router = express.Router();
const membershipController = require("../controllers/membershipController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/myplan", authenticateToken, membershipController.getMyPlan);
router.get("/history", authenticateToken, membershipController.getPlanHistory);
router.put("/cancel", authenticateToken, membershipController.cancelMembership);

module.exports = router;
