// fronted/src/manager/ManagerDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '../services/api';
import Sidebar from './managerSidebar';
import Dashboard from './mDashboard';
import Team from './managerTeam';
import TeamSchedule from './managerTeamSchedule';
import LeaveApprovals from './managerLeaveApprovals';
import SwapApprovals from './managerSwapApprovals';
import Projects from './managerProjects';
import Tasks from './managerTasks';
import Reports from './managerReports';
import Profile from './managerProfile';
import Announcements from './managerAnnouncements';
import ManagerNotifications from './ManagerNotifications';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        let userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (userData.role !== 'MANAGER' && userData.role !== 'ADMIN') {
          navigate('/employee/dashboard');
          return;
        }

        try {
          const response = await employeeApi.getProfile();
          const profileData = response.data;
          
          userData = {
            ...userData,
            fullName: profileData.fullName || userData.fullName,
            email: profileData.email || userData.email,
            phone: profileData.phone || userData.phone,
            profilePhoto: profileData.profilePhoto || userData.profilePhoto,
            department: profileData.department || userData.department,
            position: profileData.position || userData.position,
          };
          
          localStorage.setItem('user', JSON.stringify(userData));
          if (profileData.profilePhoto) {
            localStorage.setItem('employeeprofilePhoto', profileData.profilePhoto);
          }
          
          setUser(userData);
          
        } catch (err) {
          console.error('Error fetching profile:', err);
          const savedPhoto = localStorage.getItem('employeeprofilePhoto');
          if (savedPhoto) {
            userData.profilePhoto = savedPhoto;
          }
          setUser(userData);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    const handlePhotoUpdate = () => {
      const savedPhoto = localStorage.getItem('employeeprofilePhoto');
      if (savedPhoto) {
        setUser(prev => ({ ...prev, profilePhoto: savedPhoto }));
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'employeeprofilePhoto' || e.key === 'user') {
        const savedPhoto = localStorage.getItem('employeeprofilePhoto');
        if (savedPhoto) {
          setUser(prev => ({ ...prev, profilePhoto: savedPhoto }));
        }
      }
    };

    window.addEventListener('photoUpdated', handlePhotoUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('photoUpdated', handlePhotoUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const handlePhotoUpdate = (photoData) => {
    setUser(prev => ({ ...prev, profilePhoto: photoData }));
    localStorage.setItem('employeeprofilePhoto', photoData);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser.profilePhoto = photoData;
    localStorage.setItem('user', JSON.stringify(currentUser));
  };

  const handleProfileUpdate = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const mergedUser = { ...currentUser, ...updatedData };
    localStorage.setItem('user', JSON.stringify(mergedUser));
    if (updatedData.profilePhoto) {
      localStorage.setItem('employeeprofilePhoto', updatedData.profilePhoto);
    }
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <Dashboard user={user} setActiveTab={setActiveTab} />;
      case 'team':
        return <Team user={user} />;
      case 'team-schedule':
        return <TeamSchedule user={user} />;
      case 'leave-approvals':
        return <LeaveApprovals user={user} />;
      case 'swap-approvals':
        return <SwapApprovals user={user} />;
      case 'projects':
        return <Projects user={user} />;
      case 'tasks':
        return <Tasks user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'announcements':
        return <Announcements user={user} />;
      case 'notifications':
        return <ManagerNotifications user={user} />;
      case 'profile':
        return <Profile user={user} onPhotoUpdate={handlePhotoUpdate} onProfileUpdate={handleProfileUpdate} />;
      default:
        return <Dashboard user={user} setActiveTab={setActiveTab} />;
    }
  };

  if (loading) {
    return (
      <div className="manager-dashboard-loading">
        <div className="manager-loading-spinner"></div>
        <p>Loading manager dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <div className="manager-loading">Loading...</div>;
  }

  return (
    <div className="manager-dashboard">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <div className="manager-main-content">
        <div className="manager-top-bar">
          <div className="manager-welcome-text">
            <h3>Welcome back, {user.fullName || 'Manager'}! 👋</h3>
            <p>Manage your team and projects</p>
          </div>
         
        </div>
        <div className="manager-content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;