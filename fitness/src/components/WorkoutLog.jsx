import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Profile-Sidebar";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function WorkoutLog() {
  const [userData, setUserData] = useState(null);
  const [goal, setGoal] = useState({ type: "", target: "", startDate: "", endDate: "" });
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState({ date: "", activity: "", duration: "" });
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
          setGoal(data.goal || {});
          setLogs(data.logs || []);
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
    setGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogChange = (e) => {
    const { name, value } = e.target;
    setNewLog((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/api/workout/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(goal),
      });
      const data = await response.json();
      if (data.success) {
        setGoal(data.goal);
        toast.success("Goal added successfully!");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/api/workout/log", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newLog),
      });
      const data = await response.json();
      if (data.success) {
        setLogs([...logs, data.log]);
        setNewLog({ date: "", activity: "", duration: "" });
        toast.success("Log added successfully!");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  const chartData = {
    labels: logs.map((log) => log.date),
    datasets: [
      {
        label: "Duration (minutes)",
        data: logs.map((log) => parseInt(log.duration) || 0),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: "top" }, title: { display: true, text: "Workout Progress" } },
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">Workout Log & Goals</h1>

        {/* Add Fitness Goal */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Set Your Goal</h2>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <input
              type="text"
              name="type"
              placeholder="Goal Type (e.g., Running)"
              value={goal.type}
              onChange={handleGoalChange}
              className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
            />
            <input
              type="text"
              name="target"
              placeholder="Target (e.g., 5 km/day)"
              value={goal.target}
              onChange={handleGoalChange}
              className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
            />
            <input
              type="date"
              name="startDate"
              value={goal.startDate}
              onChange={handleGoalChange}
              className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
            />
            <input
              type="date"
              name="endDate"
              value={goal.endDate}
              onChange={handleGoalChange}
              className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-500"
            >
              Add Goal
            </button>
          </form>
          {goal.type && (
            <p className="mt-2">Current Goal: {goal.type} - {goal.target} (Until {goal.endDate})</p>
          )}
        </div>

        {/* Add Workout Log */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Workout Log</h2>
          <form onSubmit={handleAddLog} className="space-y-4">
            <input
              type="date"
              name="date"
              value={newLog.date}
              onChange={handleLogChange}
              className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
            />
            <input
              type="text"
              name="activity"
              placeholder="Activity (e.g., Running)"
              value={newLog.activity}
              onChange={handleLogChange}
              className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
            />
            <input
              type="number"
              name="duration"
              placeholder="Duration (minutes)"
              value={newLog.duration}
              onChange={handleLogChange}
              className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-green-400 text-black font-bold hover:bg-green-500"
            >
              Add Log
            </button>
          </form>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Recent Logs</h3>
            <ul className="list-disc pl-5">
              {logs.map((log, index) => (
                <li key={index}>
                  {log.date}: {log.activity} - {log.duration} min
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Progress Dashboard */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Progress Dashboard</h2>
          <Chart type="bar" data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}