import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SalesOverview from './components/SalesOverview';
import CustomerManagement from './components/CustomerManagement';
import LandingPage from './components/LandingPage'; // Component ใหม่สำหรับหน้า Public
import { useState, useEffect } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('token') ? true : false;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) setIsAuthenticated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* Public Route - หน้า Landing Page สำหรับลูกค้า */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Routes - ต้องล็อกอิน */}
        <Route
          path="/admin/*"
          element={
            isAuthenticated ? (
              <>
                <Header />
                <Sidebar onLogout={handleLogout} />
                <div className="ml-64 p-6">
                  <Routes>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} /> {/* Default ไป Dashboard */}
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="sales-overview" element={<SalesOverview />} />
                    <Route path="customer-management" element={<CustomerManagement />} />
                  </Routes>
                </div>
              </>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />

        {/* Login Route */}
        <Route path="/admin/login" element={<Login onLogin={handleLogin} />} />
      </Routes>
    </Router>
  );
}

export default App;