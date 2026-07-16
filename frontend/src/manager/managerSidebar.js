// fronted/src/manager/Sidebar.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '../services/api';
import './managerSidebar.css';

const Sidebar = ({ activeTab, setActiveTab, user }) => {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);


  // ✅ ADD THIS FUNCTION
const isGooglePhoto = (photo) => {
    if (!photo) return false;
    return photo.startsWith('https://lh3.googleusercontent.com') ||
           photo.includes('googleusercontent.com');
};
  // ✅ Fetch profile photo from backend
  const fetchProfilePhoto = useCallback(async () => {
    try {
      console.log('📸 Fetching profile photo from backend...');
      const response = await employeeApi.getProfile();
      console.log('📸 Profile response:', response.data);
      
      if (response.data) {
        const profileData = response.data;
        
        // Set user name
        const name = profileData.fullName || profileData.name || user?.fullName || user?.name || 'Manager';
        setUserName(name);
        console.log('📸 User name set to:', name);
        
        // ✅ Set profile photo from backend
        if (profileData.profilePhoto) {
          console.log('📸 Profile photo found in backend:', profileData.profilePhoto.substring(0, 50) + '...');
          setPhotoUrl(profileData.profilePhoto);
          // Save to localStorage for quick access
          localStorage.setItem('employeeprofilePhoto', profileData.profilePhoto);
        } else {
          console.log('📸 No profile photo in backend response');
          // Check localStorage as fallback
          const savedPhoto = localStorage.getItem('employeeprofilePhoto');
          if (savedPhoto) {
            console.log('📸 Found photo in localStorage');
            setPhotoUrl(savedPhoto);
          } else {
            console.log('📸 No photo found anywhere');
          }
        }
      }
    } catch (err) {
      console.error('❌ Error fetching profile from backend:', err);
      // Fallback to localStorage if backend fails
      const savedPhoto = localStorage.getItem('employeeprofilePhoto');
      if (savedPhoto) {
        setPhotoUrl(savedPhoto);
      }
      // Set name from user prop
      setUserName(user?.fullName || user?.name || 'Manager');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ Load profile data on mount
  useEffect(() => {
    fetchProfilePhoto();
  }, [fetchProfilePhoto]);

  // ✅ Listen for photo updates
  useEffect(() => {
    const handlePhotoUpdate = () => {
      console.log('📸 Photo update event received');
      fetchProfilePhoto();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'employeeprofilePhoto' || e.key === 'profilePhoto') {
        console.log('📸 Storage changed:', e.key, e.newValue ? 'new value set' : 'removed');
        if (e.newValue) {
          setPhotoUrl(e.newValue);
        } else {
          fetchProfilePhoto();
        }
      }
    };

    window.addEventListener('photoUpdated', handlePhotoUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('photoUpdated', handlePhotoUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchProfilePhoto]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('employeeprofilePhoto');
    localStorage.removeItem('profilePhoto');
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'team', label: 'My Team', icon: '👥' },
    { id: 'team-schedule', label: 'Team Schedule', icon: '📅' },
    { id: 'leave-approvals', label: 'Leave Approvals', icon: '📋' },
    { id: 'swap-approvals', label: 'Swap Approvals', icon: '🔄' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'notifications', label: 'Notification', icon: '📨' },
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  const getInitials = () => {
    if (!userName) return 'M';
    const names = userName.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
const getDisplayPhoto = () => {
    if (photoUrl && !isGooglePhoto(photoUrl)) return photoUrl;
    const savedPhoto = localStorage.getItem('employeeprofilePhoto');
    if (savedPhoto && !isGooglePhoto(savedPhoto)) return savedPhoto;
    return null;
};
const displayPhoto = getDisplayPhoto();
  const initials = getInitials();

  console.log('📸 Sidebar render - photoUrl:', photoUrl ? 'has photo' : 'no photo');
  console.log('📸 Sidebar render - displayPhoto:', displayPhoto ? 'has display photo' : 'no display photo');

  if (loading) {
    return (
      <div className="manager-sidebar">
        <div className="sidebar-header">
          <div className="logo">📅 Schedule Pro</div>
          <div className="role-badge">MANAGER</div>
        </div>
        <div style={{ padding: '20px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="manager-sidebar">
      <div className="sidebar-header">
        <div className="logo">📅 Schedule Pro</div>
        <div className="role-badge">MANAGER</div>
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
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          {/* ✅ Profile Photo - From Backend */}
          {displayPhoto ? (
            <img 
              src={displayPhoto} 
              alt={userName} 
              className="user-avatar-img"
              onError={(e) => {
                console.error('📸 Image failed to load:', displayPhoto);
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<div class="user-avatar-placeholder">${initials}</div>`;
              }}
            />
          ) : (
            <div className="user-avatar-placeholder">
              {initials}
            </div>
          )}
          <div className="user-details">
            <strong>{userName}</strong>
            <small>{user?.role || 'Manager'}</small>
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