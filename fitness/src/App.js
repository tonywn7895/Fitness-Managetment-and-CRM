import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PlansAdmin from './components/PlansAdmin';
import ProductsAdmin from './components/ProductsAdmin';
import SalesOverview from './components/SalesOverview';
import CustomerManagement from './components/CustomerManagement';

//customer page
import LandingPage from './components/LandingPage'; 
import Home from './components/Home';
import AboutUs from './components/AboutUs';
import MembershipPlan from './components/MembershipPlan';
import Shop from './components/Shop';
import Contact from './components/Contact';
import CustomerLogin from './components/Cust_Login';
import Profile from './components/Profile';
import Password from './components/ChangePassword';
import WorkoutLog from './components/WorkoutLog';
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
        <Route path="/register" element={<LandingPage />} />

        
        <Route path="/" element={<Home />} />
        <Route path="/About Us" element={<AboutUs />} />
        <Route path="/MembershipPlan" element={<MembershipPlan />} />
        <Route path="/Shop" element={<Shop />} />
        <Route path="/Contact" element={<Contact />} />
        <Route path="/Login" element={<CustomerLogin />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/Password" element={<Password />} />
        <Route path="/Workout Log" element={<WorkoutLog />} />

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
                    <Route path="plans" element={<PlansAdmin />} />
                    <Route path="products" element={<ProductsAdmin />} />
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
