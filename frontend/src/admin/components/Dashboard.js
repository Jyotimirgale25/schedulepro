// src/admin/Dashboard.js
import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import './Dashboard.css';

const Dashboard = ({ user, setActiveTab }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalAdmins: 0,
    totalManagers: 0,
    totalEmployees: 0,
    totalProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    pendingLeaves: 0,
    pendingSwaps: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();

    const handleUpdate = () => {
      loadStats();
    };

    window.addEventListener('userCreated', handleUpdate);
    window.addEventListener('userUpdated', handleUpdate);
    window.addEventListener('projectCreated', handleUpdate);
    window.addEventListener('taskCreated', handleUpdate);

    return () => {
      window.removeEventListener('userCreated', handleUpdate);
      window.removeEventListener('userUpdated', handleUpdate);
      window.removeEventListener('projectCreated', handleUpdate);
      window.removeEventListener('taskCreated', handleUpdate);
    };
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getDashboardStats();
      console.log('📡 Dashboard stats:', response.data);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setStats({
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          inactiveUsers: data.inactiveUsers || 0,
          totalAdmins: data.totalAdmins || 0,
          totalManagers: data.totalManagers || 0,
          totalEmployees: data.totalEmployees || 0,
          totalProjects: data.totalProjects || 0,
          totalTasks: data.totalTasks || 0,
          pendingTasks: data.pendingTasks || 0,
          pendingLeaves: data.pendingLeaves || 0,
          pendingSwaps: data.pendingSwaps || 0
        });
      } else {
        throw new Error(response.data.message || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Error loading admin stats:', err);
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const goTo = (tab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <div className="admin-error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={loadStats} className="admin-retry-btn">🔄 Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-welcome-banner">
        <h2>Admin Dashboard</h2>
        <p>System overview and key metrics</p>
      </div>

      <div className="admin-stats-grid">
        {/* Total Users */}
        <div className="admin-stat-card" onClick={() => goTo('users')}>
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
            <small>
              {stats.totalAdmins} Admins · {stats.totalManagers} Managers · {stats.totalEmployees} Employees
            </small>
          </div>
        </div>

        {/* Active Users */}
        <div className="admin-stat-card" onClick={() => goTo('users')}>
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-info">
            <h3>{stats.activeUsers}</h3>
            <p>Active Users</p>
            <small>{stats.inactiveUsers} Inactive</small>
          </div>
        </div>

        {/* Total Projects */}
        <div className="admin-stat-card" onClick={() => goTo('projects')}>
          <div className="admin-stat-icon">📁</div>
          <div className="admin-stat-info">
            <h3>{stats.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="admin-stat-card" onClick={() => goTo('tasks')}>
          <div className="admin-stat-icon">✅</div>
          <div className="admin-stat-info">
            <h3>{stats.totalTasks}</h3>
            <p>Total Tasks</p>
            <small>{stats.pendingTasks} Pending</small>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="admin-stat-card admin-pending" onClick={() => goTo('leaves')}>
          <div className="admin-stat-icon">📋</div>
          <div className="admin-stat-info">
            <h3>{stats.pendingLeaves}</h3>
            <p>Pending Leaves</p>
          </div>
        </div>

        {/* Pending Swaps */}
        <div className="admin-stat-card admin-pending" onClick={() => goTo('swaps')}>
          <div className="admin-stat-icon">🔄</div>
          <div className="admin-stat-info">
            <h3>{stats.pendingSwaps}</h3>
            <p>Pending Swaps</p>
          </div>
        </div>
      </div>

      <div className="admin-quick-actions">
        <h4>Quick Actions</h4>
        <div className="admin-action-buttons">
          <button onClick={() => goTo('users')} className="admin-primary">
            ➕ Add User
          </button>
          <button onClick={() => goTo('departments')}>
            🏢 Departments
          </button>
          <button onClick={() => goTo('announcements')}>
            📢 Announcement
          </button>
          <button onClick={() => goTo('settings')}>
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;