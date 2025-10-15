const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const workoutController = require("../controllers/workoutController");

// ✅ Workout routes
router.get("/", authenticateToken, workoutController.getWorkoutData);
router.post("/goal", authenticateToken, workoutController.addGoal);
router.put("/goal", authenticateToken, workoutController.updateGoal);
router.delete("/goal", authenticateToken, workoutController.deleteGoal);
router.post("/log", authenticateToken, workoutController.addLog);

module.exports = router;
