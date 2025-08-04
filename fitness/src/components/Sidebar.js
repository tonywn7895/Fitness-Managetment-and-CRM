import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Sidebar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white p-4 fixed">
      <h2 className="text-xl font-bold mb-4"><NavLink to="/dashboard"className={({ isActive }) => (isActive ? 'text-blue-400' : 'text-white')}>Fitness Dashboard</NavLink></h2>
      <nav>
        <ul>
          <li className="mb-2">
            <br></br>
            <NavLink
              to="/admin/sales-overview"
              className={({ isActive }) => (isActive ? 'text-blue-400' : 'text-white')}
            >
              Sales Overview
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/customer-management"
              className={({ isActive }) => (isActive ? 'text-blue-400' : 'text-white')}
            >
              Customer Management
            </NavLink>
          </li>
        </ul>
      </nav>
      <button
        onClick={handleLogoutClick}
        className="mt-4 w-full bg-red-500 text-white p-2 rounded"
      >
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;