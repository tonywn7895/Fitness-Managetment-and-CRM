const express = require("express");
const router = express.Router();
const { getWorkoutData, addGoal, updateGoal, deleteGoal, addLog } = require("../controllers/workoutController");
const { authenticateToken } = require("../middleware/authMiddleware");

// ✅ Workout routes
router.get("/", authenticateToken, getWorkoutData);
router.post("/goal", authenticateToken, addGoal);
router.put("/goal", authenticateToken, updateGoal);
router.delete("/goal", authenticateToken, deleteGoal);
router.post("/log", authenticateToken, addLog);

module.exports = router;
