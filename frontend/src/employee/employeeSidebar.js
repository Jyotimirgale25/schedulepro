import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './employeeSidebar.css';
import { employeeApi } from '../services/api';

const Sidebar = ({ activeTab, setActiveTab, user }) => {
  const navigate = useNavigate();
  const [localUser, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUpdateKey, setPhotoUpdateKey] = useState(0);

  // ============================================
  // 1. FETCH USER DATA FROM BACKEND
  // ============================================
  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      console.log('🔑 Token exists:', !!token);
      console.log('👤 User data exists:', !!userData);
      
      if (!token) {
        setLoading(false);
        return;
      }

      // First, check localStorage for user data
      let parsedUser = null;
      if (userData) {
        try {
          parsedUser = JSON.parse(userData);
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      // Fetch fresh data from backend using employeeApi
      try {
        const response = await employeeApi.getProfile();
        console.log('📡 Profile API Response:', response.data);
        
        if (response.data.success && response.data.data) {
          const profileData = response.data.data;
          const savedPhoto = localStorage.getItem('employeeprofilePhoto');
          
          const userWithPhoto = {
            ...profileData,
            profilePhoto: savedPhoto || profileData.profilePhoto || null,
            // Map fields for display
            fullName: profileData.fullName || profileData.name || 'Employee',
            email: profileData.email || '',
            firstName: profileData.firstName || profileData.fullName?.split(' ')[0] || '',
            lastName: profileData.lastName || profileData.fullName?.split(' ')[1] || '',
          };
          
          setLocalUser(userWithPhoto);
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(userWithPhoto));
        } else {
          // Fallback to localStorage data
          if (parsedUser) {
            const savedPhoto = localStorage.getItem('employeeprofilePhoto');
            setLocalUser({
              ...parsedUser,
              profilePhoto: savedPhoto || parsedUser.profilePhoto || null
            });
          }
        }
      } catch (apiError) {
        console.error('❌ API Error:', apiError);
        // Fallback to localStorage
        if (parsedUser) {
          const savedPhoto = localStorage.getItem('employeeprofilePhoto');
          setLocalUser({
            ...parsedUser,
            profilePhoto: savedPhoto || parsedUser.profilePhoto || null
          });
        }
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // 2. REFRESH USER DATA
  // ============================================
  const refreshUserData = useCallback(() => {
    console.log('🔄 Sidebar: Refreshing user data...');
    fetchUserData();
    setPhotoUpdateKey(prev => prev + 1);
  }, [fetchUserData]);

  // ============================================
  // 3. HANDLE EVENTS
  // ============================================
  const handlePhotoUpdate = useCallback(() => {
    console.log('📸 Sidebar: Photo update detected');
    refreshUserData();
  }, [refreshUserData]);

  const handleProfileUpdate = useCallback(() => {
    console.log('📝 Sidebar: Profile update detected');
    refreshUserData();
  }, [refreshUserData]);

  // ============================================
  // 4. LISTEN FOR EVENTS
  // ============================================
  useEffect(() => {
    fetchUserData();

    const onPhotoUpdate = () => handlePhotoUpdate();
    const onProfileUpdate = () => handleProfileUpdate();
    const onUserChange = () => refreshUserData();
    const onStorageChange = (e) => {
      if (e.key === 'employeeprofilePhoto' || e.key === 'user' || e.key === 'accessToken') {
        console.log('📸 Sidebar: Storage change detected:', e.key);
        refreshUserData();
      }
    };

    window.addEventListener('photoUpdated', onPhotoUpdate);
    window.addEventListener('profileUpdated', onProfileUpdate);
    window.addEventListener('userChanged', onUserChange);
    window.addEventListener('storage', onStorageChange);

    return () => {
      window.removeEventListener('photoUpdated', onPhotoUpdate);
      window.removeEventListener('profileUpdated', onProfileUpdate);
      window.removeEventListener('userChanged', onUserChange);
      window.removeEventListener('storage', onStorageChange);
    };
  }, [fetchUserData, handlePhotoUpdate, handleProfileUpdate, refreshUserData]);
  
  // ============================================
// ✅ CHECK IF PHOTO IS FROM GOOGLE
// ============================================
const isGooglePhoto = (photo) => {
    if (!photo) return false;
    return photo.startsWith('https://lh3.googleusercontent.com') ||
           photo.includes('googleusercontent.com');
};
  // ============================================
  // 5. HANDLE LOGOUT
  // ============================================
  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('employeeprofilePhoto');
      localStorage.removeItem('refreshToken');
      
      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  // ============================================
  // 6. MENU ITEMS
  // ============================================
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'schedule', label: 'My Schedule', icon: '📅' },
    { id: 'swap', label: 'Swap Request', icon: '🔄' },
    { id: 'leave', label: 'Leave Requests', icon: '📋' },
    { id: 'invitations', label: 'Invitations', icon: '📧' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'projects', label: 'My Projects', icon: '📁' },
    { id: 'tasks', label: 'My Tasks', icon: '✅' },
    { id: 'profile', label: 'My Profile', icon: '👤' }
  ];

  // ============================================
  // 7. GET USER DISPLAY INFO
  // ============================================
  const getDisplayName = () => {
    if (localUser?.fullName) {
      return localUser.fullName;
    }
    if (localUser?.firstName && localUser?.lastName) {
      return `${localUser.firstName} ${localUser.lastName}`;
    }
    if (localUser?.firstName) {
      return localUser.firstName;
    }
    if (localUser?.username) {
      return localUser.username;
    }
    if (user?.fullName) {
      return user.fullName;
    }
    if (user?.name) {
      return user.name;
    }
    return 'Employee';
  };

  const getDisplayEmail = () => {
    if (localUser?.email) {
      return localUser.email;
    }
    if (user?.email) {
      return user.email;
    }
    return '';
  };

const getDisplayPhoto = () => {
    // ✅ Check localUser first - Skip Google photos
    if (localUser?.profilePhoto) {
        if (isGooglePhoto(localUser.profilePhoto)) {
            console.log('📸 Skipping Google photo from localUser');
            return null;
        }
        return localUser.profilePhoto;
    }
    
    // ✅ Check localStorage - Skip Google photos
    const savedPhoto = localStorage.getItem('employeeprofilePhoto');
    if (savedPhoto) {
        if (isGooglePhoto(savedPhoto)) {
            console.log('📸 Skipping Google photo from localStorage');
            return null;
        }
        return savedPhoto;
    }
    
    // ✅ Check user prop - Skip Google photos
    if (user?.profilePhoto) {
        if (isGooglePhoto(user.profilePhoto)) {
            console.log('📸 Skipping Google photo from user prop');
            return null;
        }
        return user.profilePhoto;
    }
    
    return null;
};

  const getInitials = () => {
    const name = getDisplayName();
    if (name && name !== 'Employee') {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    return '👤';
  };

  const getRole = () => {
    if (localUser?.role) {
      return localUser.role;
    }
    if (user?.role) {
      return user.role;
    }
    return 'EMPLOYEE';
  };

  // ============================================
  // 8. RENDER
  // ============================================
  if (loading) {
    return (
      <div className="employee-sidebar">
        <div className="sidebar-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-sidebar" key={photoUpdateKey}>
      <div className="sidebar-header">
        <div className="logo">📅 Schedule Pro</div>
        <div className="role-badge">{getRole()}</div>
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
          {getDisplayPhoto() ? (
            <img 
              src={getDisplayPhoto()} 
              alt="Profile" 
              className="user-avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                const avatar = document.createElement('div');
                avatar.className = 'user-avatar';
                avatar.textContent = getInitials();
                parent.appendChild(avatar);
              }}
            />
          ) : (
            <div className="user-avatar">{getInitials()}</div>
          )}
          <div className="user-details">
            <strong>{getDisplayName()}</strong>
            <small>{getDisplayEmail()}</small>
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