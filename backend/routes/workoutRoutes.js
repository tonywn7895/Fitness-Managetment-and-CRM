const express = require("express");
const router = express.Router();
const { getWorkoutData, addGoal, addLog } = require("../controllers/workoutController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, getWorkoutData);
router.post("/goal", authenticateToken, addGoal);
router.post("/log", authenticateToken, addLog);

module.exports = router;