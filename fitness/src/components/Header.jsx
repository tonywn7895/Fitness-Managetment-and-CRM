import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="w-full bg-gray-800 text-white p-4 fixed top-0 z-10 flex justify-between items-center">
      <div className="text-xl font-bold">
        <a href="/admin/dashboard">Fitness Admin Panel</a>
      </div>
      <div className="flex items-center">
        <span className="mr-4">Welcome, Admin</span>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;