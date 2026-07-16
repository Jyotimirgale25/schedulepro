// src/admin/AdminDashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import Sidebar from './components/adminSidebar';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import DepartmentManagement from './components/DepartmentManagement';
import CompanySchedule from './components/CompanySchedule';
import LeaveOverview from './components/adminLeaveOverview';
import SwapOverview from './components/SwapOverview';
import ProjectOverview from './components/ProjectOverview';
import TaskOverview from './components/TaskOverview';
import Reports from './components/adminReports';
import AdminNotifications from './components/AdminNotifications';
import Announcements from './components/Announcements';
import Profile from './components/adminProfile';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const [statsRes, notifsRes] = await Promise.all([
        adminApi.getNotificationStats(),
        adminApi.getNotifications()
      ]);

      if (statsRes.data.success && statsRes.data.data) {
        setNotificationCount(statsRes.data.data.unreadNotifications || 0);
      }

      if (notifsRes.data.success && notifsRes.data.data) {
        const sorted = notifsRes.data.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotifications(sorted.slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  useEffect(() => {
    const currentUser = localStorage.getItem('user');
    
    if (!currentUser) {
      navigate('/login');
    } else {
      const userData = JSON.parse(currentUser);
      
      if (userData.role !== 'ADMIN') {
        navigate('/login');
      }
      
      const savedPhoto = localStorage.getItem('adminProfilePhoto');
      if (savedPhoto) {
        userData.profilePhoto = savedPhoto;
      }
      setUser(userData);
      
      loadNotifications();
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    const handleNotificationUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('notificationUpdated', handleNotificationUpdate);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
  }, [navigate]);

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <Dashboard user={user} setActiveTab={setActiveTab} />;
      case 'users': return <UserManagement user={user} />;
      case 'departments': return <DepartmentManagement user={user} />;
      case 'schedules': return <CompanySchedule user={user} />;
      case 'leaves': return <LeaveOverview user={user} />;
      case 'swaps': return <SwapOverview user={user} />;
      case 'projects': return <ProjectOverview user={user} />;
      case 'tasks': return <TaskOverview user={user} />;
      case 'notifications': return <AdminNotifications user={user} />;
      case 'reports': return <Reports user={user} />;
      case 'announcements': return <Announcements user={user} />;
      case 'profile': return <Profile user={user} />;
      default: return <Dashboard user={user} setActiveTab={setActiveTab} />;
    }
  };

  const goToNotifications = () => {
    setShowNotificationDropdown(false);
    setActiveTab('notifications');
  };

  const markAsRead = async (notificationId) => {
    try {
      await adminApi.markNotificationRead(notificationId);
      loadNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setShowNotificationDropdown(false);
    setActiveTab('notifications');
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'SYSTEM': '⚙️',
      'ANNOUNCEMENT': '📢',
      'LEAVE': '📋',
      'TASK': '✅',
      'SWAP': '🔄',
      'GENERAL': '📝',
      'INFO': 'ℹ️',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌'
    };
    return icons[type] || '📝';
  };

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (!user) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      <div className="admin-main-content">
        <div className="admin-top-bar">
          <div className="admin-welcome-text">
            <h3>Welcome , {user.fullName}!</h3>
            <p>Manage system, users, and company settings</p>
          </div>
          <div className="admin-top-bar-right">
            {/* Notification Button with Dropdown */}
            <div className="admin-notification-wrapper" ref={dropdownRef}>
              <button 
                className={`admin-notification-btn ${notificationCount > 0 ? 'admin-has-notifications' : ''}`} 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              >
                🔔 
                {notificationCount > 0 && (
                  <span className="admin-badge">{notificationCount > 99 ? '99+' : notificationCount}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <div className="admin-notification-dropdown">
                  <div className="admin-dropdown-header">
                    <span>🔔 Notifications</span>
                    {notificationCount > 0 && (
                      <button className="admin-mark-all-read" onClick={() => {
                        adminApi.markAllNotificationsRead().then(() => {
                          loadNotifications();
                        });
                      }}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className="admin-dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="admin-no-notifications">
                        <span>🎉</span>
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`admin-dropdown-item ${!notification.isRead ? 'admin-unread' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="admin-dropdown-item-icon">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="admin-dropdown-item-content">
                            <div className="admin-dropdown-item-title">
                              {notification.title}
                              {!notification.isRead && <span className="admin-unread-dot">●</span>}
                            </div>
                            <div className="admin-dropdown-item-message">
                              {notification.message?.length > 60 
                                ? notification.message.substring(0, 60) + '...' 
                                : notification.message}
                            </div>
                            <div className="admin-dropdown-item-time">
                              {getTimeAgo(notification.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="admin-dropdown-footer">
                    <button className="admin-view-all-btn" onClick={goToNotifications}>
                      View All Notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-user-info-header">
              {localStorage.getItem('adminProfilePhoto') ? (
                <img 
                  src={localStorage.getItem('adminProfilePhoto')} 
                  alt="Profile" 
                  className="admin-user-avatar-img" 
                />
              ) : user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" className="admin-user-avatar-img" />
              ) : (
                <div className="admin-user-avatar-small">👤</div>
              )}
              <div>
                <strong>{user.fullName}</strong>
                <small>{user.role}</small>
              </div>
            </div>
          </div>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;