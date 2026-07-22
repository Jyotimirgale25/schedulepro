import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmployeeDashboard from './employee/EmployeeDashboard';
import ManagerDashboard from './manager/ManagerDashboard';
import AdminDashboard from './admin/AdminDashboard';
import VerifyOtpPage from './pages/VerifyOtpPage';
import AdminNotifications from './admin/components/AdminNotifications';
import ManagerNotifications from './manager/ManagerNotifications';
import ForgotPassword from './pages/ForgotPassword';
import OAuth2Redirect from './pages/OAuth2Redirect';
import OAuthCallback from './pages/OAuthCallback';

function App() {
  // ✅ Lift sidebar state to App level
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // ✅ Function to toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
        <Route path="/oauth2/redirect" element={<OAuthCallback />} />
        {/* ✅ Pass sidebar state to EmployeeDashboard */}
        <Route 
          path="/employee/dashboard" 
          element={
            <EmployeeDashboard 
              isSidebarCollapsed={isSidebarCollapsed}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              toggleSidebar={toggleSidebar}
            />
          } 
        />
        
        {/* ✅ Pass sidebar state to ManagerDashboard */}
        <Route 
          path="/manager/dashboard" 
          element={
            <ManagerDashboard 
              isSidebarCollapsed={isSidebarCollapsed}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              toggleSidebar={toggleSidebar}
            />
          } 
        />
        
        {/* ✅ Pass sidebar state to AdminDashboard */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminDashboard 
              isSidebarCollapsed={isSidebarCollapsed}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
              toggleSidebar={toggleSidebar}
            />
          } 
        />
        
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/manager/notifications" element={<ManagerNotifications />} />
      </Routes>
    </Router>
  );
}

export default App;