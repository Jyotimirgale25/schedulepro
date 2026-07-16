// fronted/src/manager/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import './mDashboard.css';
import { managerApi } from '../services/api';

const Dashboard = ({ user, setActiveTab }) => {
  const [stats, setStats] = useState({
    teamMembers: 0,
    pendingLeaves: 0,
    pendingSwaps: 0,
    pendingTasks: 0,
    activeProjects: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Load profile photo
  useEffect(() => {
    const loadProfilePhoto = async () => {
      try {
        // Try to get from user prop first
        if (user?.profilePhoto) {
          setProfilePhoto(user.profilePhoto);
          return;
        }
        
        // If not, fetch from API
        const response = await managerApi.getProfile();
        if (response.data?.profilePhoto) {
          setProfilePhoto(response.data.profilePhoto);
        }
      } catch (err) {
        console.error('Error loading profile photo:', err);
      }
    };
    loadProfilePhoto();
  }, [user]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📊 Loading dashboard data...');

      const [teamRes, leavesRes, swapsRes, tasksRes, projectsRes] = await Promise.all([
        managerApi.getTeam().catch(err => {
          console.error('Team API Error:', err);
          return { data: [] };
        }),
        managerApi.getPendingLeaves().catch(err => {
          console.error('Leaves API Error:', err);
          return { data: [] };
        }),
        managerApi.getPendingSwaps().catch(err => {
          console.error('Swaps API Error:', err);
          return { data: [] };
        }),
        managerApi.getTasks().catch(err => {
          console.error('Tasks API Error:', err);
          return { data: [] };
        }),
        managerApi.getProjects().catch(err => {
          console.error('Projects API Error:', err);
          return { data: [] };
        })
      ]);

      const getData = (response) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response.data) {
          if (Array.isArray(response.data)) return response.data;
          if (response.data.data && Array.isArray(response.data.data)) return response.data.data;
          if (response.data.content && Array.isArray(response.data.content)) return response.data.content;
        }
        if (response.data && response.data.content && Array.isArray(response.data.content)) {
          return response.data.content;
        }
        return [];
      };

      const teamData = getData(teamRes);
      const leavesData = getData(leavesRes);
      const swapsData = getData(swapsRes);
      const tasksData = getData(tasksRes);
      const projectsData = getData(projectsRes);

      let pendingTasks = 0;
      if (tasksData && Array.isArray(tasksData)) {
        pendingTasks = tasksData.filter(task => 
          task.status === 'PENDING' || 
          task.status === 'IN_PROGRESS' || 
          task.status === 'SUBMITTED' ||
          task.status === 'REVIEW'
        ).length;
      }

      const newStats = {
        teamMembers: teamData?.length || 0,
        pendingLeaves: leavesData?.length || 0,
        pendingSwaps: swapsData?.length || 0,
        pendingTasks: pendingTasks || 0,
        activeProjects: projectsData?.length || 0
      };
      
      setStats(newStats);

      const activities = [];

      if (leavesData && Array.isArray(leavesData) && leavesData.length > 0) {
        leavesData.forEach(leave => {
          activities.push({
            id: `leave-${leave.id || Date.now()}`,
            type: 'leave',
            title: '📋 Leave Request',
            action: `${leave.userFullName || leave.employeeName || leave.requesterName || 'Employee'} requested ${leave.leaveType || 'leave'}`,
            date: leave.createdAt || leave.createdDate || new Date().toISOString(),
            status: 'PENDING',
            details: `${leave.startDate || 'N/A'} to ${leave.endDate || 'N/A'}`,
            icon: '📋',
            data: leave
          });
        });
      }

      if (swapsData && Array.isArray(swapsData) && swapsData.length > 0) {
        swapsData.forEach(swap => {
          activities.push({
            id: `swap-${swap.id || Date.now()}`,
            type: 'swap',
            title: '🔄 Swap Request',
            action: `${swap.requesterName || swap.requester?.fullName || 'Employee'} ↔ ${swap.targetName || swap.targetEmployee?.fullName || 'Target'}`,
            date: swap.createdAt || new Date().toISOString(),
            status: 'PENDING',
            details: `${swap.requesterShiftDate || 'N/A'} → ${swap.targetShiftDate || 'N/A'}`,
            icon: '🔄',
            data: swap
          });
        });
      }

      if (tasksData && Array.isArray(tasksData) && tasksData.length > 0) {
        tasksData.filter(task => 
          task.status === 'PENDING' || 
          task.status === 'IN_PROGRESS' || 
          task.status === 'SUBMITTED' ||
          task.status === 'REVIEW'
        ).forEach(task => {
          activities.push({
            id: `task-${task.id || Date.now()}`,
            type: 'task',
            title: '✅ Task Pending',
            action: `${task.assignedTo?.fullName || task.assignedTo?.name || 'Employee'} working on: ${task.title || 'task'}`,
            date: task.updatedAt || task.createdAt || new Date().toISOString(),
            status: task.status === 'SUBMITTED' || task.status === 'REVIEW' ? 'REVIEW' : 'PENDING',
            details: `Project: ${task.project?.name || 'N/A'}`,
            icon: '✅',
            data: task
          });
        });
      }

      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivities(activities.slice(0, 4));

    } catch (err) {
      console.error('❌ Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    
    const handleUpdate = () => loadDashboardData();
    
    window.addEventListener('leaveRequestCreated', handleUpdate);
    window.addEventListener('leaveRequestUpdated', handleUpdate);
    window.addEventListener('swapRequestCreated', handleUpdate);
    window.addEventListener('swapRequestUpdated', handleUpdate);
    window.addEventListener('teamUpdated', handleUpdate);
    window.addEventListener('taskCreated', handleUpdate);
    window.addEventListener('taskUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('leaveRequestCreated', handleUpdate);
      window.removeEventListener('leaveRequestUpdated', handleUpdate);
      window.removeEventListener('swapRequestCreated', handleUpdate);
      window.removeEventListener('swapRequestUpdated', handleUpdate);
      window.removeEventListener('teamUpdated', handleUpdate);
      window.removeEventListener('taskCreated', handleUpdate);
      window.removeEventListener('taskUpdated', handleUpdate);
    };
  }, [loadDashboardData]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'dashboard-pending';
      case 'REVIEW': return 'dashboard-review';
      case 'APPROVED': return 'dashboard-approved';
      case 'REJECTED': return 'dashboard-rejected';
      case 'COMPLETED': return 'dashboard-completed';
      default: return '';
    }
  };

  const getActionButton = (activity) => {
    if (activity.type === 'leave' && activity.status === 'PENDING') {
      return (
        <button className="dashboard-review-btn" onClick={() => setActiveTab('leave-approvals')}>
          Review →
        </button>
      );
    }
    if (activity.type === 'swap' && activity.status === 'PENDING') {
      return (
        <button className="dashboard-review-btn" onClick={() => setActiveTab('swap-approvals')}>
          Review →
        </button>
      );
    }
    if (activity.type === 'task' && (activity.status === 'REVIEW' || activity.status === 'PENDING')) {
      return (
        <button className="dashboard-review-btn" onClick={() => setActiveTab('tasks')}>
          Review →
        </button>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section with Profile Photo */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-left">
          {/* ✅ Profile Photo */}
          <div className="dashboard-welcome-avatar">
            {profilePhoto ? (
              <img 
                src={profilePhoto} 
                alt={user?.fullName || 'Manager'} 
                className="dashboard-welcome-avatar-img"
              />
            ) : (
              <div className="dashboard-welcome-avatar-placeholder">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'M'}
              </div>
            )}
          </div>
          <div className="dashboard-welcome-content">
            <h2>Hello, {user?.fullName || 'Manager'}! 👋</h2>
            <p>Here's your team's work summary</p>
          </div>
        </div>
       
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card dashboard-team">
          <div className="dashboard-stat-icon">👥</div>
          <div className="dashboard-stat-info">
            <h3>{stats.teamMembers}</h3>
            <p>Team Members</p>
          </div>
        </div>
        <div className="dashboard-stat-card dashboard-leaves">
          <div className="dashboard-stat-icon">📋</div>
          <div className="dashboard-stat-info">
            <h3>{stats.pendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>
        <div className="dashboard-stat-card dashboard-swaps">
          <div className="dashboard-stat-icon">🔄</div>
          <div className="dashboard-stat-info">
            <h3>{stats.pendingSwaps}</h3>
            <p>Pending Swaps</p>
          </div>
        </div>
        <div className="dashboard-stat-card dashboard-tasks">
          <div className="dashboard-stat-icon">✅</div>
          <div className="dashboard-stat-info">
            <h3>{stats.pendingTasks}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="dashboard-extra-stats">
        <div className="dashboard-stat-card dashboard-projects">
          <div className="dashboard-stat-icon">📁</div>
          <div className="dashboard-stat-info">
            <h3>{stats.activeProjects}</h3>
            <p>Active Projects</p>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="dashboard-recent-activities">
        <div className="dashboard-section-header">
          <h4>📋 Recent Activities</h4>
          <button onClick={() => setActiveTab('leave-approvals')}>
            View All →
          </button>
        </div>
        <div className="dashboard-activities-list">
          {recentActivities.length === 0 ? (
            <div className="dashboard-no-activities">
              <span>📭</span>
              <p>No recent activities</p>
            </div>
          ) : (
            recentActivities.map(activity => (
              <div key={activity.id} className={`dashboard-activity-item ${getStatusColor(activity.status)}`}>
                <div className="dashboard-activity-icon">{activity.icon}</div>
                <div className="dashboard-activity-content">
                  <div className="dashboard-activity-title">{activity.title}</div>
                  <div className="dashboard-activity-action">{activity.action}</div>
                  {activity.details && (
                    <div className="dashboard-activity-details">{activity.details}</div>
                  )}
                  <div className="dashboard-activity-date">{new Date(activity.date).toLocaleString()}</div>
                </div>
                {getActionButton(activity)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-quick-actions">
        <h4>⚡ Quick Actions</h4>
        <div className="dashboard-action-buttons">
          <button onClick={() => setActiveTab('team-schedule')}>
            📅 Create Schedule
          </button>
          <button onClick={() => setActiveTab('leave-approvals')}>
            📋 Review Leaves ({stats.pendingLeaves})
          </button>
          <button onClick={() => setActiveTab('swap-approvals')}>
            🔄 Review Swaps ({stats.pendingSwaps})
          </button>
          <button onClick={() => setActiveTab('tasks')}>
            ✅ Review Tasks ({stats.pendingTasks})
          </button>
          <button onClick={() => setActiveTab('team')}>
            📧 Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;