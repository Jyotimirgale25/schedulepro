// frontend/src/components/EmployeeDashboard.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './employeeSidebar';
import Tabdashboard from './Tabdashboard';
import Schedule from './employeeSchedule';
import Swap from './employeeSwap';
import Leave from './employeeLeave';
import Profile from './employeeProfile';
import Projects from './employeeProjects';
import Tasks from './employeeTasks';
import Announcements from './employeeAnnouncements';
import Invitations from './employeeInvitations';
import Notifications from './employeeNotifications';
import { employeeApi } from '../services/api';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isInitialLoad = useRef(true);
  const fetchInProgress = useRef(false);

  const fetchUserData = useCallback(async (showLoading = true) => {
    if (fetchInProgress.current) {
        console.log('⏳ Fetch already in progress, skipping...');
        return;
    }

    try {
        fetchInProgress.current = true;
        if (showLoading) setLoading(true);
        setError(null);
        
        console.log('📤 Fetching user profile from backend...');
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }

        const response = await employeeApi.getProfile();
        const profileData = response.data;
        
        console.log('📥 Profile data received:', profileData);

        const updatedUser = {
            id: profileData.id || '',
            fullName: profileData.fullName || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            role: 'EMPLOYEE',
            profilePhoto: profileData.profilePhoto || null,
            department: profileData.department || '',
            position: profileData.position || '',
            employeeId: profileData.employeeId || '',
            joinDate: profileData.joinDate || '',
            bloodGroup: profileData.bloodGroup || 'O+',
            dateOfBirth: profileData.dateOfBirth || '',
            address: profileData.address || '',
            skills: profileData.skills || [],
            languages: profileData.languages || [],
            emergencyContact: profileData.emergencyContact || {},
            socialLinks: profileData.socialLinks || {},
            isActive: true,
            managerId: null,
        };

        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (profileData.profilePhoto) {
            localStorage.setItem('employeeprofilePhoto', profileData.profilePhoto);
        }

        setUser(updatedUser);
        console.log('✅ User data updated successfully from backend');
        
    } catch (err) {
        console.error('❌ Error fetching user data:', err);
        
        const fallbackUser = localStorage.getItem('user');
        if (fallbackUser) {
            const userData = JSON.parse(fallbackUser);
            const savedPhoto = localStorage.getItem('employeeprofilePhoto');
            if (savedPhoto) {
                userData.profilePhoto = savedPhoto;
            }
            setUser(userData);
            setError('Using cached data. Backend may be unavailable.');
        } else {
            navigate('/login');
        }
    } finally {
        fetchInProgress.current = false;
        if (showLoading) setLoading(false);
    }
  }, [navigate]);

  const handlePhotoUpdate = useCallback((photoData) => {
    console.log('📸 Photo update received');
    
    setUser(prev => {
      if (prev) {
        return { ...prev, profilePhoto: photoData };
      }
      return prev;
    });
    
    localStorage.setItem('employeeprofilePhoto', photoData);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser.profilePhoto = photoData;
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    window.dispatchEvent(new Event('photoUpdated'));
  }, []);

  const handleProfileUpdate = useCallback((updatedData) => {
    console.log('📝 Profile update received');
    
    setUser(prev => {
      if (prev) {
        return { ...prev, ...updatedData };
      }
      return prev;
    });
    
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const mergedUser = { ...currentUser, ...updatedData };
    localStorage.setItem('user', JSON.stringify(mergedUser));
    
    if (updatedData.profilePhoto) {
      localStorage.setItem('employeeprofilePhoto', updatedData.profilePhoto);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      fetchUserData(true);
    }

    const handlePhotoUpdated = () => {
      console.log(' Photo update event detected');
      const savedPhoto = localStorage.getItem('employeeprofilePhoto');
      if (savedPhoto) {
        setUser(prev => {
          if (prev) {
            return { ...prev, profilePhoto: savedPhoto };
          }
          return prev;
        });
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'employeeprofilePhoto') {
        console.log(' Storage change: Photo updated');
        const savedPhoto = e.newValue;
        if (savedPhoto) {
          setUser(prev => {
            if (prev) {
              return { ...prev, profilePhoto: savedPhoto };
            }
            return prev;
          });
        }
      }
      if (e.key === 'user') {
        console.log('🔄 Storage change: User data updated');
        try {
          const userData = JSON.parse(e.newValue || '{}');
          setUser(prev => ({ ...prev, ...userData }));
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      }
    };

    window.addEventListener('photoUpdated', handlePhotoUpdated);
    window.addEventListener('profileUpdated', handlePhotoUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('photoUpdated', handlePhotoUpdated);
      window.removeEventListener('profileUpdated', handlePhotoUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate, fetchUserData]);

  const handleViewTasks = useCallback(() => {
    setActiveTab('tasks');
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const renderContent = useCallback(() => {
    switch(activeTab) {
      case 'dashboard':
        return <Tabdashboard user={user} setActiveTab={handleTabChange} />;
      case 'schedule':
        return <Schedule user={user} />;
      case 'swap':
        return <Swap user={user} />;
      case 'leave':
        return <Leave user={user} />;
      case 'profile':
        return (
          <Profile 
            user={user} 
            onPhotoUpdate={handlePhotoUpdate}
            onProfileUpdate={handleProfileUpdate}
          />
        );
      case 'projects':
        return <Projects user={user} onViewTasks={handleViewTasks} />;
      case 'tasks':
        return <Tasks user={user} />;
      case 'invitations':
        return <Invitations user={user} />;
      case 'announcements':
        return <Announcements user={user} />;
      default:
        return <Tabdashboard user={user} setActiveTab={handleTabChange} />;
    }
  }, [activeTab, user, handlePhotoUpdate, handleProfileUpdate, handleViewTasks, handleTabChange]);

  if (loading) {
    return (
      <div className="empdash-loading">
        <div className="empdash-loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="empdash-error">
        <div className="empdash-error-icon">⚠️</div>
        <h3>Unable to load dashboard</h3>
        <p>{error}</p>
      
        <button onClick={() => navigate('/login')} className="empdash-logout-btn">
          Logout
        </button>
      </div>
    );
  }

  if (!user) {
    return <div className="empdash-loading">Loading...</div>;
  }

  return (
    <div className="empdash-dashboard">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        user={user}
      />
      <div className="empdash-main-content">
        <div className="empdash-top-bar">
          <div className="empdash-welcome-text">
            <h3>Welcome back, {user.fullName || 'User'}! 👋</h3>
            <p>Here's your work summary</p>
          </div>
          <div className="empdash-top-bar-right">
           
            <Notifications user={user} />
            <div className="empdash-user-info">
              {user?.profilePhoto ? (
                <img 
                  src={user.profilePhoto} 
                  alt="Profile" 
                  className="empdash-user-avatar-small" 
                />
              ) : (
                <div className="empdash-user-avatar-placeholder">
                  {user.fullName?.charAt(0)?.toUpperCase() || '👤'}
                </div>
              )}
              <div>
                <strong>{user.fullName || 'User'}</strong>
                <small>{user.role || 'EMPLOYEE'}</small>
              </div>
            </div>
          </div>
        </div>
        <div className="empdash-content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;