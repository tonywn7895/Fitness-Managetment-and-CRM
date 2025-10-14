import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    validateForm(updatedForm); // ✅ check password real-time
  };

  const validateForm = (data) => {
    const newErrors = { password: '', confirmPassword: '' };

    if (data.password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    setErrors(newErrors);
  };
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (errors.password || errors.confirmPassword) {
      return; // ถ้ามี error ห้ามส่งฟอร์ม
    }

    try {
      const response = await fetch('http://localhost:5001/api/register', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subscription_status: 'pending', // เพิ่มค่าเริ่มต้นตามที่ server คาดหวัง
          role: 'customer', // เพิ่ม role ตามที่ server คาดหวัง
        }),
      });

      const result = await response.json();
      console.log('Register Response:', result); // เพิ่ม log เพื่อดู response

    if (response.ok) {
      if (result.token) { // ตรวจสอบว่ามี token
        localStorage.setItem('token', result.token); // เก็บ token
        console.log('Token saved:', result.token); // log เพื่อยืนยัน
      } else {
        console.log('No token in response'); // ถ้าไม่มี token
      }
      setIsLoggedIn(true);
      setMessage('Registration successful!');
      navigate('/'); // Redirect ไปหน้า Membership
      setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    } else {
      setMessage(`Error: ${result.message || 'Registration failed'}`);
    }
  } catch (err) {
    setMessage(`Network error: ${err.message}`);
    console.error('Registration error:', err);
  }
};

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#000000] to-[#223B7B] flex items-center justify-center">
      <div className="flex">
        {/* Left Box */}
        <div className="bg-gradient-to-b from-[#000000] to-[#223B7B] p-8 rounded-lg shadow-md w-96 text-white flex flex-col items-center justify-center">
          <Link to="/">
            <img className="mb-4 w-full h-auto transition-transform duration-200 hover:scale-105" src="/Factfit_Logo.png" alt="Factfit Logo" />
          </Link>
          <div className="text-center">
            <div className="text-white text-3xl font-bold">
              Welcome to <span className="text-[#F4FF01]">Fact</span><span className="text-white">Fit</span>
            </div>
            <p>Fitness Center to achieve your goals</p>
          </div>
        </div>

        {/* Right Box - Registration Form */}
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-3xl font-bold mb-1 text-center text-gray-800">SIGN UP</h1>
          <p className="text-center text-gray-600 mb-6">Join us today and start your fitness journey!</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="block w-full p-2 border rounded-md pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-blue-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full p-2 border rounded-md pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}

            <button
              type="submit"
              className="w-full bg-[#223B7B] text-white p-2 rounded-md hover:bg-blue-600"
            >
              SIGN UP
            </button>
          </form>

          {message && <p className="mt-4 text-center text-sm text-gray-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;