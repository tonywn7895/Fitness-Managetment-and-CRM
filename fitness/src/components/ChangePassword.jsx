import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Profile-Sidebar";

export default function ChangePassword() {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (form.newPassword || form.confirmPassword) {
      if (!form.oldPassword) {
        toast.error("Old password is required to change password");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
      if (form.newPassword.length < 8) {
        toast.error("New password must be at least 8 characters");
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:5001/api/profile/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        toast.success("Password updated successfully!");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Change Password</h1>
        </div>
        <form onSubmit={handleUpdate} className="space-y-5 mb-8">
          <input
            type="password"
            name="oldPassword"
            placeholder="Old Password"
            value={form.oldPassword}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-400"
          />
          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={form.newPassword}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-400"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm New Password"
            value={form.confirmPassword}
            onChange={handleInputChange}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-400"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}