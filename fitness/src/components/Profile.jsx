import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Profile-Sidebar";

export default function EditProfile() {
  const [userData, setUserData] = useState(null);
  const [form, setForm] = useState({ username: "", email: "", profileImage: null });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        toast.error("No token found, please log in");
        navigate("/login");
        return;
      }
      try {
        const response = await fetch("http://localhost:5001/api/profile/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setUserData(data.data);
          setForm({
            username: data.data.username,
            email: data.data.email,
            profileImage: data.data.profileimage ? data.data.profileimage : null,
          });
        } else {
          toast.error(data.message || "Authentication failed");
        }
      } catch (err) {
        toast.error("Server error");
      }
    };
    fetchProfile();
  }, [navigate, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, profileImage: file }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", form.username);
    formData.append("email", form.email);
    if (form.profileImage) formData.append("profileImage", form.profileImage);

    try {
      const response = await fetch("http://localhost:5001/api/profile/edit", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUserData(data.data);
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  const handleDelete = async () => {
  if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
    try {
<<<<<<< HEAD
      const response = await fetch("http://localhost:5001/api/profile/profile", {
=======
      const response = await fetch("http://localhost:5001/api/profile", {
>>>>>>> origin/main
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Account deleted successfully!");
        localStorage.removeItem("token"); 
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Server error");
    }
  }
};

  const getInitials = (name) => {
    return name
      ? name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "U";
  };

  const profileInitial = userData ? getInitials(userData.username) : "U";

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
        </div>
        {userData && (
          <div className="space-y-5 mb-8">
            <div className="flex items-center space-x-4">
              {form.profileImage ? (
                <img
                  src={URL.createObjectURL(form.profileImage)}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : userData.profileImage ? (
                <img
                  src={userData.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-white">
                  {profileInitial}
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="mt-4" />
            </div>
            
            
              
              <p className="text-lg font-semibold">Username: {userData.username}</p>
              <p className="text-lg">Email: {userData.email}</p>
              <p className="text-lg">Subscription Status: {userData.subscription_status || "Not subscribed"}</p>
            
            
            <input
              type="text"
              name="username"
              placeholder="New Username"
              value={form.username}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-400"
            />
            <input
              type="email"
              name="email"
              placeholder="New Email"
              value={form.email}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-400"
            />
            <button
              onClick={handleUpdate}
              className="w-full py-3 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition"
            >
              Save Changes
            </button>

            <button
              onClick={() => handleDelete()}
              className="w-full py-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}