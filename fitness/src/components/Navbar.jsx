import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // เช็คว่ามี token ไหม
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchProfile(token);
    }
  }, []);

  const fetchProfile = async (token) => {
    try {
      const response = await fetch("http://localhost:5001/api/profile/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUserData(data.data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    navigate("/");
  };

  const getProfileImage = () => {
  if (userData?.profile_image) {
    const base64String = btoa(
      String.fromCharCode(...new Uint8Array(userData.profile_image.data))
    );
    return `data:image/jpeg;base64,${base64String}`;
  }
  return null;
};


  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-10 bg-black text-white flex justify-between items-center">

      {/* ---------- Logo ---------- */}
      <div className="flex items-center pl-4 pr-8 h-[100px]">
        <img
          className="h-[90px] w-auto object-contain transition-transform duration-200 hover:scale-105"
          src="/Factfit_Logo.png"
          alt="FACTFIT Logo"
        />
      </div>

      {/* ---------- Menu ---------- */}
      <div className="flex-grow flex justify-center space-x-12">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `px-2 py-1 border-b-4 transition ${
              isActive
                ? "border-[#F4FF01] text-white"
                : "border-transparent hover:text-yellow-400"
            }`
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/About Us"
          className={({ isActive }) =>
            `px-2 py-1 border-b-4 transition ${
              isActive
                ? "border-[#F4FF01] text-white"
                : "border-transparent hover:text-yellow-400"
            }`
          }
        >
          About Us
        </NavLink>

        <NavLink
          to="/MembershipPlan"
          className={({ isActive }) =>
            `px-2 py-1 border-b-4 transition ${
              isActive
                ? "border-[#F4FF01] text-white"
                : "border-transparent hover:text-yellow-400"
            }`
          }
        >
          Membership Plan
        </NavLink>

        <NavLink
          to="/Contact"
          className={({ isActive }) =>
            `px-2 py-1 border-b-4 transition ${
              isActive
                ? "border-[#F4FF01] text-white"
                : "border-transparent hover:text-yellow-400"
            }`
          }
        >
          Contact
        </NavLink>
      </div>

      {/* ---------- Auth Buttons / Profile Dropdown ---------- */}
      {isLoggedIn ? (
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center space-x-2 hover:bg-gray-700 p-2 rounded-full"
          >
            {getProfileImage() ? (
              <img
                src={getProfileImage()}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white">
                {userData?.username ? userData.username[0].toUpperCase() : "U"}
              </div>
            )}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-10">
              <ul className="py-1">
                <li>
                  <NavLink
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-white hover:bg-yellow-500 rounded-md"
                  >
                    Edit Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/myplan"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-white hover:bg-yellow-500 rounded-md"
                  >
                    My Plan
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Password"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-white hover:bg-yellow-500 rounded-md"
                  >
                    Change Password
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/Workout Log"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-white hover:bg-yellow-500 rounded-md"
                  >
                    Workout Log
                  </NavLink>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-red-700 rounded-md"
                  >
                    Log out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <NavLink to="/register" className="pr-4">
            Sign Up
          </NavLink>
          <NavLink
            to="/Login"
            className="bg-[#F4FF01] text-gray-800 font-bold py-3 px-6 rounded-full hover:bg-yellow-300 transition"
          >
            Log in
          </NavLink>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
