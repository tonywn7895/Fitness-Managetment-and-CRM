import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaChartLine, FaUsers } from 'react-icons/fa';
import { MdPlaylistAdd, MdStore, MdOutlineLogout } from 'react-icons/md';

function Sidebar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center p-2 rounded hover:bg-gray-700 ${
      isActive ? 'bg-gray-700 text-blue-400' : 'text-gray-200'
    }`;

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white p-4 fixed">
      <h2 className="text-xl font-bold mb-6">Fitness Admin</h2>
      <nav>
        <ul className="space-y-2">
          <li>
            <NavLink to="/admin/sales-overview" className={navLinkClass}>
              <FaChartLine className="mr-2" /> Sales Overview
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/customer-management" className={navLinkClass}>
              <FaUsers className="mr-2" /> Customer Management
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/plans" className={navLinkClass}>
              <MdPlaylistAdd className="mr-2" /> Plans
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/products" className={navLinkClass}>
              <MdStore className="mr-2" /> Products
            </NavLink>
          </li>
        </ul>
      </nav>

      <button
        onClick={handleLogoutClick}
        className="mt-6 flex items-center justify-center w-full bg-red-500 hover:bg-red-600 text-white p-2 rounded"
      >
        <MdOutlineLogout className="mr-2" /> Logout
      </button>
    </aside>
  );
}

export default Sidebar;