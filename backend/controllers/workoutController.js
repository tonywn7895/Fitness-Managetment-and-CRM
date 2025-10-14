const { pool } = require("../config/db");

exports.getWorkoutData = async (req, res) => {
  const userId = req.user.id;
  try {
    const goalResult = await pool.query(
      "SELECT type, value, start_date AS startDate, end_date AS endDate FROM workout_goals WHERE user_id = $1",
      [userId]
    );
    const logResult = await pool.query(
      "SELECT date, activity, duration FROM workout_logs WHERE user_id = $1 ORDER BY date DESC",
      [userId]
    );
    res.json({
      success: true,
      userData: { id: userId },
      goal: goalResult.rows[0] || null,
      logs: logResult.rows || [],
    });
  } catch (err) {
    console.error("Get workout data error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.addGoal = async (req, res) => {
  const userId = req.user.id;
  const { type, target, startDate, endDate } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO workout_goals (user_id, type, target, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [userId, type, target, startDate, endDate]
    );
    res.json({ success: true, goal: result.rows[0], message: "Goals added successfully" });
  } catch (err) {
    console.error("Add goals error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.addLog = async (req, res) => {
  const userId = req.user.id;
  const { date, activity, duration } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO workout_logs (user_id, date, activity, duration) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, date, activity, duration]
    );
    res.json({ success: true, log: result.rows[0], message: "Log added successfully" });
  } catch (err) {
    console.error("Add log error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};