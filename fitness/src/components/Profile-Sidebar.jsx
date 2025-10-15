import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login"; // ✅ redirect ไปหน้า login หลัง logout
  };

  return (
    <div className="w-64 bg-black h-screen p-4 flex flex-col">
      <div className="mb-8">
        <Link to="/">
          <img
            src="/Factfit_Logo.png"
            alt="FactFit Logo"
            className="h-18 w-auto mb-6"
          />
        </Link>
      </div>

      <nav className="flex-1">
        <ul className="space-y-4">
          <li>
            <Link
              to="/profile"
              className="block py-2 px-4 rounded hover:bg-yellow-500"
            >
              Edit Profile
            </Link>
          </li>
          <li>
            <Link
              to="/myplan"
              className="block py-2 px-4 rounded hover:bg-yellow-500"
            >
              My Plan
            </Link>
          </li>
          <li>
            <Link
              to="/Password"
              className="block py-2 px-4 rounded hover:bg-yellow-500"
            >
              Change Password
            </Link>
          </li>
          <li>
            <Link
              to="/Workout Log"
              className="block py-2 px-4 rounded hover:bg-yellow-500"
            >
              Workout Log
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="w-full text-left py-2 px-4 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;