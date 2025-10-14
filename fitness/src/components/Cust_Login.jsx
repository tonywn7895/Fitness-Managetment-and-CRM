import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Customer_Login() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Debug: ตรวจสอบค่า input ก่อนส่ง
    console.log("Form data before submit:", form);

    if (!form.identifier.trim() || !form.password.trim()) {
      setError("Please fill in both fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({identifier: form.identifier.trim(), password: form.password.trim() }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid JSON response");
      }

      if (res.ok) {
        // ✅ เก็บ token (ถ้า backend ส่งมา)
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // ✅ ไปหน้า Home หรือ Profile
        navigate("/");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong, please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-900 p-8 rounded-lg shadow-md w-96 max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-400">
          Welcome Back
        </h1>

        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="identifier"
            placeholder="Email or Username"
            value={form.identifier}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-400"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-yellow-400"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-yellow-400 text-black font-bold hover:bg-yellow-500 transition"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-yellow-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
