const express = require("express");
const router = express.Router();
const { getWorkoutData, addGoal, addLog, deleteGoal, updateGoal } = require("../controllers/workoutController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/", authenticateToken, getWorkoutData);
router.post("/goal", authenticateToken, addGoal);
router.put("/goal", authenticateToken, updateGoal); // เพิ่ม route สำหรับแก้ไข
router.post("/log", authenticateToken, addLog);
router.delete("/goal", authenticateToken, deleteGoal);

module.exports = router;