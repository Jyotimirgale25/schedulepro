import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import './adminSidebar.css';

const Sidebar = ({ activeTab, setActiveTab, user }) => {
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  // Load profile photo from localStorage or backend
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // First check localStorage
        const savedPhoto = localStorage.getItem('adminProfilePhoto');
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedPhoto) {
          setProfilePhoto(savedPhoto);
        } else if (user?.profilePhoto) {
          setProfilePhoto(user.profilePhoto);
        }
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUserName(parsedUser?.fullName || user?.fullName || 'Admin');
        } else if (user?.fullName) {
          setUserName(user.fullName);
        } else {
          // Try to fetch from backend if no user data
          try {
            const response = await adminApi.getProfile();
            if (response.data.success && response.data.data) {
              const data = response.data.data;
              if (data.profilePhoto) {
                setProfilePhoto(data.profilePhoto);
                localStorage.setItem('adminProfilePhoto', data.profilePhoto);
              }
              setUserName(data.fullName || 'Admin');
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
          }
        }

        // Load notification count
        try {
          const statsResponse = await adminApi.getNotificationStats();
          if (statsResponse.data.success && statsResponse.data.data) {
            setNotificationCount(statsResponse.data.data.unreadNotifications || 0);
          }
        } catch (err) {
          console.error('Error loading notification count:', err);
        }

      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();

    // Listen for profile photo updates
    const handleProfileUpdate = () => {
      const savedPhoto = localStorage.getItem('adminProfilePhoto');
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUserName(parsedUser?.fullName || userName);
      }
    };

    // Listen for notification updates
    const handleNotificationUpdate = async () => {
      try {
        const statsResponse = await adminApi.getNotificationStats();
        if (statsResponse.data.success && statsResponse.data.data) {
          setNotificationCount(statsResponse.data.data.unreadNotifications || 0);
        }
      } catch (err) {
        console.error('Error updating notification count:', err);
      }
    };

    window.addEventListener('profilePhotoUpdated', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('notificationUpdated', handleNotificationUpdate);

    return () => {
      window.removeEventListener('profilePhotoUpdated', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
  }, [user, userName]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('adminProfilePhoto');
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'departments', label: 'Departments', icon: '🏢' },
    { id: 'schedules', label: 'Company Schedule', icon: '📅' },
    { id: 'leaves', label: 'Leave Overview', icon: '📋' },
    { id: 'swaps', label: 'Swap Overview', icon: '🔄' },
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'notifications', label: 'Notifications', icon: '🔔', badge: notificationCount },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'profile', label: 'Profile', icon: '👤' },
 
  ];

  // ✅ Use loading state - show loading indicator while fetching
  if (loading) {
    return (
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo">📅 Schedule Pro</div>
          <div className="role-badge">ADMIN</div>
        </div>
        <div className="sidebar-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <div className="logo">📅 Schedule Pro</div>
        <div className="role-badge">ADMIN</div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.badge > 0 && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          {profilePhoto ? (
            <img 
              src={profilePhoto} 
              alt="Profile" 
              className="user-avatar-img" 
            />
          ) : user?.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profile" className="user-avatar-img" />
          ) : (
            <div className="user-avatar">👑</div>
          )}
          <div className="user-details">
            <strong>{userName || user?.fullName || 'Admin'}</strong>
            <small>Administrator</small>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;