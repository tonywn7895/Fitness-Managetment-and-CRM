import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Profile-Sidebar";
// ✅ เพิ่มมา แต่ยังไม่ใช้งาน
// import Calendar from "react-calendar";
// import "react-calendar/dist/Calendar.css";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function WorkoutLog() {
  const [userData, setUserData] = useState(null);
  const [existingGoal, setExistingGoal] = useState({ type: "", target: "", startDate: "", endDate: "" });
  const [newGoal, setNewGoal] = useState({ type: "", target: "", startDate: "", endDate: "" });
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState({ date: new Date().toISOString().split("T")[0], activity: "", distance: "", duration: "" });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        toast.error("No token found, please log in");
        navigate("/");
        return;
      }
      try {
        const response = await fetch("http://localhost:5001/api/workout", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setUserData(data.userData);
          setExistingGoal(data.goal || { type: "", target: "", startDate: "", endDate: "" });
          setLogs(data.logs || []);
          if (data.congratulation) setShowCongrats(true);
        } else {
          toast.error(data.message);
        }
      } catch (err) {
        toast.error("Server error");
      }
    };
    fetchData();
  }, [navigate, token]);

  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    setNewGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogChange = (e) => {
    const { name, value } = e.target;
    setNewLog((prev) => ({ ...prev, [name]: value || "" }));
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    const goalData = { type: newGoal.type, target: newGoal.target, startDate: newGoal.startDate, endDate: newGoal.endDate };
    try {
      const response = await fetch("http://localhost:5001/api/workout/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(goalData),
      });
      const data = await response.json();
      if (data.success) {
        setExistingGoal(data.goal);
        setNewGoal({ type: "", target: "", startDate: "", endDate: "" });
        toast.success("Goal added successfully!");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Server error");
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    const dateStr = newLog.date;
    if (!dateStr || !newLog.activity || !newLog.distance || !newLog.duration || isNaN(newLog.distance) || isNaN(newLog.duration) || newLog.distance <= 0 || newLog.duration <= 0) {
      toast.error("All fields are required and distance/duration must be positive");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (dateStr > today) {
      toast.error("Date cannot be in the future");
      return;
    }
    try {
      const response = await fetch("http://localhost:5001/api/workout/log", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: dateStr, activity: newLog.activity, distance: newLog.distance, duration: newLog.duration }),
      });
      const data = await response.json();
      if (data.success) {
        setLogs([...logs, data.log]);
        setNewLog({ date: new Date().toISOString().split("T")[0], activity: "", distance: "", duration: "" });
        toast.success("Log added successfully!");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Server error");
    }
  };

  const handleDeleteGoal = async () => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      try {
        const response = await fetch("http://localhost:5001/api/workout/goal", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setExistingGoal({ type: "", target: "", startDate: "", endDate: "" });
          setIsEditingGoal(false);
          toast.success("Goal deleted successfully!");
        } else {
          toast.error(data.message);
        }
      } catch {
        toast.error("Server error");
      }
    }
  };

  const handleEditGoal = () => {
    setIsEditingGoal(true);
    setNewGoal(existingGoal);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    const goalData = { type: newGoal.type, target: newGoal.target, startDate: newGoal.startDate, endDate: newGoal.endDate };
    try {
      const response = await fetch("http://localhost:5001/api/workout/goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(goalData),
      });
      const data = await response.json();
      if (data.success) {
        setExistingGoal(data.goal);
        setIsEditingGoal(false);
        setNewGoal({ type: "", target: "", startDate: "", endDate: "" });
        toast.success("Goal updated successfully!");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Server error");
    }
  };

  const totalDistance = logs.reduce((sum, log) => sum + (parseFloat(log.distance) || 0), 0);
  const goalValue = existingGoal.target ? parseFloat(existingGoal.target.split(" ")[0]) : 0;
  const progressPercentage = goalValue ? ((totalDistance / goalValue) * 100).toFixed(1) : 0;

  const cumulativeDistances = logs
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((acc, log, index) => {
      const distance = parseFloat(log.distance) || 0;
      acc.push(index === 0 ? distance : acc[index - 1] + distance);
      return acc;
    }, []);

  const chartData = {
    labels: logs.map((log) => log.date),
    datasets: [
      {
        label: "Distance (km)",
        data: logs.map((log) => parseFloat(log.distance) || 0),
        type: "bar",
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        yAxisID: "y",
      },
      ...(existingGoal.target
        ? [
            {
              label: "Cumulative Distance (km)",
              data: cumulativeDistances,
              type: "line",
              borderColor: "rgba(255, 165, 0, 1)",
              borderWidth: 2,
              fill: false,
              yAxisID: "y",
            },
            {
              label: "Goal (km)",
              data: logs.map(() => goalValue),
              type: "line",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 2,
              fill: false,
              yAxisID: "y",
            },
          ]
        : []),
      {
        label: "Average Speed (km/min)",
        data: logs.map((log) => log.duration ? (parseFloat(log.distance) / parseFloat(log.duration)).toFixed(2) : 0),
        type: "line",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        fill: false,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Workout Progress vs Goal" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Distance (km)" },
      },
      y1: {
        beginAtZero: true,
        title: { display: true, text: "Speed (km/min)" },
        position: "right",
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ToastContainer position="top-center" autoClose={3000} />
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Workout Log & Goals</h1>

        {showCongrats && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-green-800 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-yellow-300">Congratulations!</h2>
              <p className="mt-2">You've completed your goal! You've earned 100 points!</p>
              <button
                onClick={() => setShowCongrats(false)}
                className="mt-4 py-2 px-4 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Goal Section */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Set Your Goal</h2>
          {existingGoal.type ? (
            <div>
              <p>
                Current Goal: {existingGoal.type} - {existingGoal.target} (Until {existingGoal.endDate})
              </p>
              <div className="flex space-x-2 mt-2">
                <button onClick={handleEditGoal} className="py-1 px-2 rounded-lg bg-blue-400 text-black font-bold hover:bg-blue-500">
                  Edit Goal
                </button>
                <button onClick={handleDeleteGoal} className="py-1 px-2 rounded-lg bg-red-400 text-black font-bold hover:bg-red-500">
                  Delete Goal
                </button>
              </div>
              {isEditingGoal && (
                <form onSubmit={handleSaveGoal} className="space-y-4 mt-2">
                  <input type="text" name="type" value={newGoal.type} onChange={handleGoalChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
                  <input type="text" name="target" value={newGoal.target} onChange={handleGoalChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
                  <input type="date" name="startDate" value={newGoal.startDate} onChange={handleGoalChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
                  <input type="date" name="endDate" value={newGoal.endDate} onChange={handleGoalChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
                  <button type="submit" className="w-full py-2 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-500">
                    Save Goal
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleAddGoal} className="space-y-4">
              <input type="text" name="type" placeholder="Goal Type (e.g., Running)" value={newGoal.type} onChange={handleGoalChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
              <input type="text" name="target" placeholder="Target (e.g., 5 km)" value={newGoal.target} onChange={handleGoalChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
              <input type="date" name="startDate" value={newGoal.startDate} onChange={handleGoalChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
              <input type="date" name="endDate" value={newGoal.endDate} onChange={handleGoalChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
              <button type="submit" className="w-full py-2 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-500">
                Add Goal
              </button>
            </form>
          )}
        </div>

        {/* Workout Logs */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Workout Log</h2>
          <form onSubmit={handleAddLog} className="space-y-4">
            <input type="date" name="date" value={newLog.date} onChange={handleLogChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
            <input type="text" name="activity" placeholder="Activity (e.g., Running)" value={newLog.activity} onChange={handleLogChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
            <input type="number" name="distance" placeholder="Distance (km)" value={newLog.distance} onChange={handleLogChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" step="0.01" />
            <input type="number" name="duration" placeholder="Duration (minutes)" value={newLog.duration} onChange={handleLogChange} className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600" />
            <button type="submit" className="w-full py-2 rounded-lg bg-green-400 text-black font-bold hover:bg-green-500">
              Add Log
            </button>
          </form>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Recent Logs</h3>
            <ul className="list-disc pl-5">
              {logs.map((log, index) => (
                <li key={index}>
                  {log.date}: {log.activity} - {log.distance} km in {log.duration} min
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Progress Dashboard</h2>
          <p>Total Progress: {progressPercentage}% ({totalDistance} km of {goalValue} km)</p>
          <Chart type="bar" data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}