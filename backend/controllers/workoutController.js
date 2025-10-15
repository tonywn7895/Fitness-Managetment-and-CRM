const { pool } = require("../config/db");

exports.getWorkoutData = async (req, res) => {
  const userId = req.user.id;
  try {
    const goalResult = await pool.query(
      "SELECT type, value AS target, start_date AS startDate, end_date AS endDate FROM workout_goals WHERE user_id = $1",
      [userId]
    );
    const goal = goalResult.rows[0];
    let logResult;
    if (goal) {
      logResult = await pool.query(
        "SELECT date, activity, distance, duration FROM workout_logs WHERE user_id = $1 AND activity = $2 UNION ALL SELECT date, activity, distance, duration FROM temp_logs WHERE user_id = $1 AND activity = $2 ORDER BY date DESC",
        [userId, goal.type]
      );
    } else {
      logResult = await pool.query(
        "SELECT date, activity, distance, duration FROM workout_logs WHERE user_id = $1 ORDER BY date DESC",
        [userId]
      );
    }
    const pointsResult = await pool.query("SELECT COALESCE(SUM(points), 0) as total_points FROM user_points WHERE customer_id = $1", [userId]);
    const totalPoints = pointsResult.rows[0].total_points;

    res.json({
      success: true,
      userData: { id: userId, totalPoints },
      goal: goal || null,
      logs: logResult.rows || [],
    });
  } catch (err) {
    console.error("Get workout data error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.addLog = async (req, res) => {
  const userId = req.user.id;
  const { date, activity, distance, duration } = req.body;
  if (!date || !activity || !distance || !duration || isNaN(distance) || isNaN(duration) || distance <= 0 || duration <= 0) {
    return res.status(400).json({ success: false, message: "Invalid input" });
  }
  const today = new Date().toISOString().split("T")[0];
  if (date > today) {
    return res.status(400).json({ success: false, message: "Date cannot be in the future" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO temp_logs (user_id, date, activity, distance, duration, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *",
      [userId, date, activity, distance, duration]
    );
    res.json({ success: true, log: result.rows[0] });
  } catch (err) {
    console.error("Add log error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.addGoal = async (req, res) => {
  const userId = req.user.id;
  const { type, target, startDate, endDate } = req.body;
  if (!type || !target || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  const today = new Date().toISOString().split("T")[0];
  if (startDate > today || endDate < today || startDate > endDate) {
    return res.status(400).json({ success: false, message: "Invalid date range" });
  }
  try {
    const oldGoalResult = await pool.query("SELECT * FROM workout_goals WHERE user_id = $1", [userId]);
    const oldGoal = oldGoalResult.rows[0];
    if (oldGoal) {
      const totalDistanceResult = await pool.query(
        "SELECT COALESCE(SUM(distance), 0) as total_distance FROM workout_logs WHERE user_id = $1 AND activity = $2 AND date BETWEEN $3 AND $4",
        [userId, oldGoal.type, oldGoal.start_date, oldGoal.end_date]
      );
      const totalDistance = parseFloat(totalDistanceResult.rows[0].total_distance) || 0;
      const goalValue = parseFloat(oldGoal.value.split(" ")[0]) || 0;

      if (totalDistance < goalValue) {
        return res.status(400).json({ success: false, message: "Complete your current goal before setting a new one" });
      } else {
        // บันทึกใน customer_history
        const historyResult = await pool.query(
          "INSERT INTO customer_history (customer_id, action, detail) VALUES ($1, $2, $3) RETURNING id",
          [userId, "goal_completion", `Completed ${oldGoal.type} goal`]
        );
        const actionId = historyResult.rows[0].id;
        // บันทึก points ใน points
        await pool.query(
          "INSERT INTO points (customer_id, action_id, points, created_at) VALUES ($1, $2, $3, NOW())",
          [userId, actionId, 100]
        );
        await pool.query("DELETE FROM workout_goals WHERE id = $1", [oldGoal.id]);
      }
    }

    const goalResult = await pool.query(
      "INSERT INTO workout_goals (user_id, type, value, start_date, end_date, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *",
      [userId, type, target, startDate, endDate]
    );
    const goal = goalResult.rows[0];

    const tempLogs = await pool.query("SELECT * FROM temp_logs WHERE user_id = $1 AND activity = $2", [userId, type]);
    if (tempLogs.rows.length > 0) {
      for (const log of tempLogs.rows) {
        await pool.query(
          "INSERT INTO workout_logs (user_id, date, activity, distance, duration, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
          [userId, log.date, log.activity, log.distance, log.duration]
        );
      }
      await pool.query("DELETE FROM temp_logs WHERE user_id = $1 AND activity = $2", [userId, type]);
    }

    res.json({ success: true, message: "Goal added", goal: goal, congratulation: oldGoal && totalDistance >= goalValue });
  } catch (err) {
    console.error("Add goal error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateGoal = async (req, res) => {
  const userId = req.user.id;
  const { type, target, startDate, endDate } = req.body;
  if (!type || !target || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  const today = new Date().toISOString().split("T")[0];
  if (startDate > today || endDate < today || startDate > endDate) {
    return res.status(400).json({ success: false, message: "Invalid date range" });
  }
  try {
    const goalResult = await pool.query(
      "UPDATE workout_goals SET type = $1, value = $2, start_date = $3, end_date = $4 WHERE user_id = $5 RETURNING *",
      [type, target, startDate, endDate, userId]
    );
    if (goalResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "No goal found" });
    }
    res.json({ success: true, goal: goalResult.rows[0], message: "Goal updated" });
  } catch (err) {
    console.error("Update goal error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteGoal = async (req, res) => {
  const userId = req.user.id;
  try {
    const goalResult = await pool.query("SELECT id FROM workout_goals WHERE user_id = $1", [userId]);
    if (goalResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No goal found" });
    }
    await pool.query("DELETE FROM workout_goals WHERE user_id = $1", [userId]);
    res.json({ success: true, message: "Goal deleted" });
  } catch (err) {
    console.error("Delete goal error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};