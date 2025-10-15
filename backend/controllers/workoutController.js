const { pool } = require("../config/db");

// ✅ ดึงข้อมูล workout ทั้งหมด
exports.getWorkoutData = async (req, res) => {
  const userId = req.user.id;
  try {
    const goalRes = await pool.query(
      "SELECT type, value AS target, start_date AS startDate, end_date AS endDate FROM workout_goals WHERE user_id = $1",
      [userId]
    );
    const goal = goalRes.rows[0];

    const logRes = await pool.query(
      "SELECT date, activity, distance, duration FROM workout_logs WHERE user_id = $1 ORDER BY date DESC",
      [userId]
    );

    const pointsRes = await pool.query(
      "SELECT COALESCE(SUM(points), 0) AS total_points FROM user_points WHERE customer_id = $1",
      [userId]
    );

    res.json({
      success: true,
      userData: { id: userId, totalPoints: pointsRes.rows[0].total_points },
      goal: goal || null,
      logs: logRes.rows
    });
  } catch (err) {
    console.error("Get workout error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ เพิ่ม log
exports.addLog = async (req, res) => {
  const userId = req.user.id;
  const { date, activity, distance, duration } = req.body;
  try {
    if (!date || !activity || !distance || !duration)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const result = await pool.query(
      "INSERT INTO workout_logs (user_id, date, activity, distance, duration, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *",
      [userId, date, activity, distance, duration]
    );
    res.json({ success: true, log: result.rows[0], message: "Log added" });
  } catch (err) {
    console.error("Add log error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ เพิ่มเป้าหมาย (goal)
exports.addGoal = async (req, res) => {
  const userId = req.user.id;
  const { type, target, startDate, endDate } = req.body;
  try {
    if (!type || !target || !startDate || !endDate)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const result = await pool.query(
      "INSERT INTO workout_goals (user_id, type, value, start_date, end_date, created_at) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *",
      [userId, type, target, startDate, endDate]
    );
    res.json({ success: true, goal: result.rows[0], message: "Goal added" });
  } catch (err) {
    console.error("Add goal error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
