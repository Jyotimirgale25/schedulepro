// src/admin/components/AdminNotifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import './AdminNotifications.css';

const AdminNotifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [displayNotifications, setDisplayNotifications] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(30);
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    type: 'SYSTEM',
    targetRole: 'ALL'
  });
  const [stats, setStats] = useState({
    totalNotifications: 0,
    unreadNotifications: 0,
    readNotifications: 0
  });
  const [filter, setFilter] = useState({
    type: 'ALL',
    userId: '',
    searchTerm: ''
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userNotifications, setUserNotifications] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [typeDistribution, setTypeDistribution] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [topUsers, setTopUsers] = useState([]);

  const INITIAL_DISPLAY_COUNT = 4;

  // ============================================
  // ✅ LOAD STATS & DISTRIBUTION
  // ============================================
  const loadStatsData = useCallback(async () => {
    try {
      const [distributionRes, topUsersRes] = await Promise.all([
        adminApi.getNotificationTypeDistribution(),
        adminApi.getTopUsersWithNotifications(5)
      ]);

      let distData = {};
      if (distributionRes && distributionRes.data) {
        if (distributionRes.data.success && distributionRes.data.data) {
          distData = distributionRes.data.data;
        } else if (typeof distributionRes.data === 'object') {
          distData = distributionRes.data;
        }
      }
      setTypeDistribution(distData);

      let topUsersData = [];
      if (topUsersRes && topUsersRes.data) {
        if (topUsersRes.data.success && Array.isArray(topUsersRes.data.data)) {
          topUsersData = topUsersRes.data.data;
        } else if (Array.isArray(topUsersRes.data)) {
          topUsersData = topUsersRes.data;
        } else if (Array.isArray(topUsersRes)) {
          topUsersData = topUsersRes;
        }
      }
      setTopUsers(topUsersData);

    } catch (err) {
      console.error('Error loading stats data:', err);
    }
  }, []);

  // ============================================
  // ✅ LOAD DATA
  // ============================================
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching data...');
      
      const [notificationsRes, statsRes, usersRes] = await Promise.all([
        adminApi.getNotifications(),
        adminApi.getNotificationStats(),
        adminApi.getUsers()
      ]);

      console.log('📡 Notifications Response:', notificationsRes);
      console.log('📡 Stats Response:', statsRes);
      console.log('📡 Users Response:', usersRes);

      // ✅ Extract notifications
      let notifData = [];
      if (notificationsRes && notificationsRes.data) {
        if (Array.isArray(notificationsRes.data)) {
          notifData = notificationsRes.data;
        } else if (notificationsRes.data.success && Array.isArray(notificationsRes.data.data)) {
          notifData = notificationsRes.data.data;
        } else if (notificationsRes.data.data && Array.isArray(notificationsRes.data.data)) {
          notifData = notificationsRes.data.data;
        } else if (notificationsRes.data.content && Array.isArray(notificationsRes.data.content)) {
          notifData = notificationsRes.data.content;
        } else if (notificationsRes.data.items && Array.isArray(notificationsRes.data.items)) {
          notifData = notificationsRes.data.items;
        }
      }
      if (notifData.length === 0 && Array.isArray(notificationsRes)) {
        notifData = notificationsRes;
      }

      console.log('📡 Extracted notifications:', notifData.length);
      setNotifications(notifData);
      setFilteredNotifications(notifData);
      setDisplayNotifications(notifData.slice(0, INITIAL_DISPLAY_COUNT));

      // ✅ Extract users
      let usersData = [];
      if (usersRes && usersRes.data) {
        if (Array.isArray(usersRes.data)) {
          usersData = usersRes.data;
        } else if (usersRes.data.success && Array.isArray(usersRes.data.data)) {
          usersData = usersRes.data.data;
        } else if (usersRes.data.data && Array.isArray(usersRes.data.data)) {
          usersData = usersRes.data.data;
        } else if (usersRes.data.content && Array.isArray(usersRes.data.content)) {
          usersData = usersRes.data.content;
        }
      }
      if (usersData.length === 0 && Array.isArray(usersRes)) {
        usersData = usersRes;
      }
      console.log('📡 Extracted users:', usersData.length);
      setUsers(usersData);

      // ✅ Extract stats
      let statsData = {
        totalNotifications: 0,
        unreadNotifications: 0,
        readNotifications: 0
      };
      if (statsRes && statsRes.data) {
        if (statsRes.data.success && statsRes.data.data) {
          statsData = statsRes.data.data;
        } else if (statsRes.data.totalNotifications !== undefined) {
          statsData = statsRes.data;
        } else if (statsRes.data.data && statsRes.data.data.totalNotifications !== undefined) {
          statsData = statsRes.data.data;
        }
      }
      console.log('📡 Extracted stats:', statsData);
      setStats(statsData);

    } catch (err) {
      console.error('❌ Error loading data:', err);
      setNotifications([]);
      setFilteredNotifications([]);
      setDisplayNotifications([]);
      setUsers([]);
      setStats({
        totalNotifications: 0,
        unreadNotifications: 0,
        readNotifications: 0
      });
    } finally {
      setLoading(false);
      console.log('✅ Loading complete, loading state:', false);
    }
  }, []);

  // ============================================
  // ✅ INITIAL LOAD
  // ============================================
  useEffect(() => {
    const loadAll = async () => {
      await loadData();
      await loadStatsData();
    };
    
    loadAll();
    
    const handleUpdate = () => {
      loadAll();
    };
    
    window.addEventListener('notificationUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('notificationUpdated', handleUpdate);
    };
  }, [loadData, loadStatsData]);

  // ============================================
  // ✅ FILTER NOTIFICATIONS
  // ============================================
  useEffect(() => {
    let filtered = [...notifications];

    if (filter.type !== 'ALL') {
      filtered = filtered.filter(n => n.type === filter.type);
    }

    if (filter.userId) {
      filtered = filtered.filter(n => n.userId === filter.userId);
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(term) ||
        n.message?.toLowerCase().includes(term) ||
        n.userFullName?.toLowerCase().includes(term) ||
        n.userEmail?.toLowerCase().includes(term)
      );
    }

    setFilteredNotifications(filtered);
    
    if (!showAll) {
      setDisplayNotifications(filtered.slice(0, INITIAL_DISPLAY_COUNT));
    } else {
      setDisplayNotifications(filtered);
    }
  }, [notifications, filter, showAll]);

  // ============================================
  // ✅ VIEW ALL / SHOW LESS
  // ============================================
  const handleViewAll = () => {
    setShowAll(true);
    setDisplayNotifications(filteredNotifications);
  };

  const handleShowLess = () => {
    setShowAll(false);
    setDisplayNotifications(filteredNotifications.slice(0, INITIAL_DISPLAY_COUNT));
  };

  // ============================================
  // ✅ LOAD USER NOTIFICATIONS
  // ============================================
  const loadUserNotifications = async (userId) => {
    try {
      const response = await adminApi.getUserNotifications(userId);
      if (response.data.success) {
        setUserNotifications(response.data.data || []);
        const user = users.find(u => u.id === userId);
        setSelectedUser(user);
        setShowUserModal(true);
      }
    } catch (err) {
      console.error('Error loading user notifications:', err);
    }
  };

  // ============================================
  // ✅ BROADCAST
  // ============================================
  const handleBroadcast = async () => {
    if (!broadcastData.title || !broadcastData.message) {
      alert('Please fill in both title and message');
      return;
    }

    try {
      await adminApi.broadcastNotification(broadcastData);
      alert('✅ Broadcast notification sent successfully!');
      setShowBroadcastModal(false);
      setBroadcastData({
        title: '',
        message: '',
        type: 'SYSTEM',
        targetRole: 'ALL'
      });
      await loadData();
      await loadStatsData();
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error('Error broadcasting:', err);
      alert('Failed to send broadcast notification');
    }
  };

  // ============================================
  // ✅ DELETE NOTIFICATION
  // ============================================
  const handleDeleteNotification = async (id) => {
    if (window.confirm('Delete this notification?')) {
      try {
        await adminApi.deleteNotification(id);
        await loadData();
        await loadStatsData();
        window.dispatchEvent(new Event('notificationUpdated'));
      } catch (err) {
        console.error('Error deleting:', err);
        alert('Failed to delete notification');
      }
    }
  };

  // ============================================
  // ✅ DELETE USER NOTIFICATIONS
  // ============================================
  const handleDeleteUserNotifications = async (userId, userName) => {
    if (window.confirm(`Delete all notifications for ${userName}?`)) {
      try {
        await adminApi.deleteUserNotifications(userId);
        await loadData();
        await loadStatsData();
        setShowUserModal(false);
        window.dispatchEvent(new Event('notificationUpdated'));
      } catch (err) {
        console.error('Error deleting user notifications:', err);
        alert('Failed to delete user notifications');
      }
    }
  };

  // ============================================
  // ✅ DELETE ALL
  // ============================================
  const handleDeleteAll = async () => {
    if (window.confirm('Delete all notifications for all users?')) {
      try {
        await adminApi.deleteAllNotifications();
        await loadData();
        await loadStatsData();
        window.dispatchEvent(new Event('notificationUpdated'));
      } catch (err) {
        console.error('Error deleting all:', err);
        alert('Failed to delete all notifications');
      }
    }
  };

  // ============================================
  // ✅ MARK NOTIFICATION AS READ
  // ============================================
  const handleMarkAsRead = async (id) => {
    try {
      await adminApi.markNotificationAsRead(id);
      await loadData();
      await loadStatsData();
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error('Error marking as read:', err);
      alert('Failed to mark notification as read');
    }
  };

  // ============================================
  // ✅ DELETE NOTIFICATIONS OLDER THAN DAYS
  // ============================================
  const handleCleanup = async () => {
    if (!cleanupDays || cleanupDays < 1) {
      alert('Please enter a valid number of days');
      return;
    }
    
    if (!window.confirm(`Delete all notifications older than ${cleanupDays} days?`)) return;
    
    try {
      await adminApi.deleteNotificationsOlderThan(cleanupDays);
      alert(`✅ Notifications older than ${cleanupDays} days deleted successfully!`);
      setShowCleanupModal(false);
      await loadData();
      await loadStatsData();
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error('Error cleaning up notifications:', err);
      alert('Failed to delete old notifications');
    }
  };

  // ============================================
  // ✅ SEARCH NOTIFICATIONS
  // ============================================
  const handleSearch = async () => {
    if (!filter.searchTerm && filter.type === 'ALL') {
      await loadData();
      await loadStatsData();
      return;
    }
    
    try {
      setLoading(true);
      const response = await adminApi.searchNotifications(
        filter.searchTerm || '',
        filter.type !== 'ALL' ? filter.type : ''
      );
      
      let searchResults = [];
      if (response && response.data) {
        if (response.data.success && response.data.data) {
          searchResults = response.data.data.content || response.data.data;
        } else if (response.data.content) {
          searchResults = response.data.content;
        } else if (Array.isArray(response.data)) {
          searchResults = response.data;
        }
      }
      
      setNotifications(searchResults);
      setFilteredNotifications(searchResults);
      setDisplayNotifications(searchResults.slice(0, INITIAL_DISPLAY_COUNT));
      setShowAll(false);
    } catch (err) {
      console.error('Error searching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✅ GET TYPE BADGE
  // ============================================
  const getTypeBadge = (type) => {
    const types = {
      'SYSTEM': { class: 'admin-notif-badge-system', icon: '⚙️', label: 'System' },
      'ANNOUNCEMENT': { class: 'admin-notif-badge-announcement', icon: '📢', label: 'Announcement' },
      'LEAVE': { class: 'admin-notif-badge-leave', icon: '📋', label: 'Leave' },
      'TASK': { class: 'admin-notif-badge-task', icon: '✅', label: 'Task' },
      'SWAP': { class: 'admin-notif-badge-swap', icon: '🔄', label: 'Swap' },
      'GENERAL': { class: 'admin-notif-badge-general', icon: '📝', label: 'General' },
      'INFO': { class: 'admin-notif-badge-info', icon: 'ℹ️', label: 'Info' },
      'SUCCESS': { class: 'admin-notif-badge-success', icon: '✅', label: 'Success' },
      'WARNING': { class: 'admin-notif-badge-warning', icon: '⚠️', label: 'Warning' },
      'ERROR': { class: 'admin-notif-badge-error', icon: '❌', label: 'Error' },
      'SCHEDULE': { class: 'admin-notif-badge-schedule', icon: '📅', label: 'Schedule' }
    };
    const t = types[type] || types['GENERAL'];
    return <span className={`admin-notif-badge ${t.class}`}>{t.icon} {t.label}</span>;
  };

  // ============================================
  // ✅ GET TARGET ROLE LABEL
  // ============================================
  const getTargetRoleLabel = (role) => {
    switch(role) {
      case 'ALL': return '🌐 All Users';
      case 'EMPLOYEE': return '👥 Employees';
      case 'MANAGER': return '👔 Managers';
      case 'ADMIN': return '👑 Admins';
      default: return '🌐 All Users';
    }
  };

  // ============================================
  // ✅ GET UNIQUE TYPES
  // ============================================
  const getUniqueTypes = () => {
    const types = new Set(notifications.map(n => n.type));
    return ['ALL', ...Array.from(types)];
  };

  // ============================================
  // ✅ RENDER
  // ============================================
  if (loading) {
    return (
      <div className="admin-notifications-loading">
        <div className="admin-notifications-loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="admin-notifications-container">
      {/* Header */}
      <div className="admin-notif-header">
        <div>
          <h4>🔔 Notification Center</h4>
          <p className="admin-notif-subtitle">Manage and monitor system notifications</p>
        </div>
        <div className="admin-notif-header-actions">
          <button className="admin-notif-btn-broadcast" onClick={() => setShowBroadcastModal(true)}>
            📢 Broadcast
          </button>
          <button className="admin-notif-btn-stats" onClick={() => setShowStatsModal(true)}>
            📊 Stats
          </button>
          <button className="admin-notif-btn-cleanup" onClick={() => setShowCleanupModal(true)}>
            🧹 Cleanup
          </button>
          <button className="admin-notif-btn-filter" onClick={() => setShowFilterModal(!showFilterModal)}>
            🔍 Filter
          </button>
          {notifications.length > 0 && (
            <button className="admin-notif-btn-delete-all" onClick={handleDeleteAll}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      {showFilterModal && (
        <div className="admin-notif-filter-bar">
          <div className="admin-notif-filter-row">
            <div className="admin-notif-filter-group">
              <label>Type</label>
              <select 
                className="admin-notif-filter-select"
                value={filter.type}
                onChange={e => setFilter({...filter, type: e.target.value})}
              >
                {getUniqueTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="admin-notif-filter-group">
              <label>User</label>
              <select 
                className="admin-notif-filter-select"
                value={filter.userId}
                onChange={e => setFilter({...filter, userId: e.target.value})}
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-notif-filter-group">
              <label>Search</label>
              <div className="admin-notif-search-wrapper">
                <input 
                  type="text" 
                  className="admin-notif-filter-input"
                  placeholder="Search notifications..."
                  value={filter.searchTerm}
                  onChange={e => setFilter({...filter, searchTerm: e.target.value})}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                />
                <button className="admin-notif-search-btn" onClick={handleSearch}>🔍</button>
              </div>
            </div>
            <button 
              className="admin-notif-filter-clear"
              onClick={() => setFilter({type: 'ALL', userId: '', searchTerm: ''})}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="admin-notif-stats-cards">
        <div className="admin-notif-stat-card">
          <span className="admin-notif-stat-icon">📬</span>
          <div>
            <div className="admin-notif-stat-value">{stats.totalNotifications}</div>
            <div className="admin-notif-stat-label">Total Notifications</div>
          </div>
        </div>
        <div className="admin-notif-stat-card admin-notif-unread">
          <span className="admin-notif-stat-icon">🔴</span>
          <div>
            <div className="admin-notif-stat-value">{stats.unreadNotifications}</div>
            <div className="admin-notif-stat-label">Unread</div>
          </div>
        </div>
        <div className="admin-notif-stat-card admin-notif-read">
          <span className="admin-notif-stat-icon">✅</span>
          <div>
            <div className="admin-notif-stat-value">{stats.readNotifications}</div>
            <div className="admin-notif-stat-label">Read</div>
          </div>
        </div>
        <div className="admin-notif-stat-card admin-notif-users">
          <span className="admin-notif-stat-icon">👥</span>
          <div>
            <div className="admin-notif-stat-value">{users.length}</div>
            <div className="admin-notif-stat-label">Users</div>
          </div>
        </div>
      </div>


      {/* Results Info with View All / Show Less */}
      <div className="admin-notif-results-info">
        <span>Showing {displayNotifications.length} of {filteredNotifications.length} notifications</span>
        {filteredNotifications.length > INITIAL_DISPLAY_COUNT && (
          <span className="admin-notif-view-all-wrapper">
            {!showAll ? (
              <button className="admin-notif-btn-view-all" onClick={handleViewAll}>
                View All →
              </button>
            ) : (
              <button className="admin-notif-btn-show-less" onClick={handleShowLess}>
                Show Less ↑
              </button>
            )}
          </span>
        )}
        {filter.userId && (
          <span className="admin-notif-filter-tag">
            👤 User: {users.find(u => u.id === filter.userId)?.fullName}
            <button onClick={() => setFilter({...filter, userId: ''})}>✕</button>
          </span>
        )}
        {filter.type !== 'ALL' && (
          <span className="admin-notif-filter-tag">
            📂 Type: {filter.type}
            <button onClick={() => setFilter({...filter, type: 'ALL'})}>✕</button>
          </span>
        )}
        {filter.searchTerm && (
          <span className="admin-notif-filter-tag">
            🔍 {filter.searchTerm}
            <button onClick={() => setFilter({...filter, searchTerm: ''})}>✕</button>
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="admin-notif-list">
        {displayNotifications.length === 0 ? (
          <div className="admin-notif-empty-state">
            <span className="admin-notif-empty-icon">🔔</span>
            <p>No notifications found</p>
            {notifications.length > 0 && <p className="admin-notif-empty-sub">Try adjusting your filters</p>}
          </div>
        ) : (
          displayNotifications.map(notification => (
            <div key={notification.id} className={`admin-notif-item ${!notification.isRead ? 'admin-notif-unread' : ''}`}>
              <div className="admin-notif-item-icon">
                {!notification.isRead && <span className="admin-notif-unread-dot">●</span>}
              </div>
              <div className="admin-notif-item-content">
                <div className="admin-notif-item-header">
                  <span className="admin-notif-item-title">{notification.title}</span>
                  <span className="admin-notif-item-time">{notification.timeAgo || 'Just now'}</span>
                </div>
                <p className="admin-notif-item-message">{notification.message}</p>
                <div className="admin-notif-item-footer">
                  <div className="admin-notif-item-meta">
                    {getTypeBadge(notification.type)}
                    <span 
                      className="admin-notif-item-user admin-notif-clickable"
                      onClick={() => loadUserNotifications(notification.userId)}
                    >
                      👤 {notification.userFullName}
                    </span>
                    <span className="admin-notif-item-email">📧 {notification.userEmail}</span>
                    <span className="admin-notif-item-sender">📨 {notification.senderName || 'System'}</span>
                  </div>
                  <div className="admin-notif-item-actions">
                    {!notification.isRead && (
                      <button 
                        className="admin-notif-btn-mark-read" 
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    <button 
                      className="admin-notif-btn-delete" 
                      onClick={() => handleDeleteNotification(notification.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="admin-notif-modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="admin-notif-modal-content admin-notif-stats-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-notif-modal-header">
              <h4>📊 Notification Statistics</h4>
              <button className="admin-notif-modal-close" onClick={() => setShowStatsModal(false)}>✕</button>
            </div>
            <div className="admin-notif-modal-body">
              <div className="admin-notif-stats-grid">
                <div className="admin-notif-stat-item">
                  <span className="admin-notif-stat-item-icon">📬</span>
                  <div>
                    <div className="admin-notif-stat-item-value">{stats.totalNotifications}</div>
                    <div className="admin-notif-stat-item-label">Total</div>
                  </div>
                </div>
                <div className="admin-notif-stat-item">
                  <span className="admin-notif-stat-item-icon">🔴</span>
                  <div>
                    <div className="admin-notif-stat-item-value">{stats.unreadNotifications}</div>
                    <div className="admin-notif-stat-item-label">Unread</div>
                  </div>
                </div>
                <div className="admin-notif-stat-item">
                  <span className="admin-notif-stat-item-icon">✅</span>
                  <div>
                    <div className="admin-notif-stat-item-value">{stats.readNotifications}</div>
                    <div className="admin-notif-stat-item-label">Read</div>
                  </div>
                </div>
                <div className="admin-notif-stat-item">
                  <span className="admin-notif-stat-item-icon">👥</span>
                  <div>
                    <div className="admin-notif-stat-item-value">{users.length}</div>
                    <div className="admin-notif-stat-item-label">Users</div>
                  </div>
                </div>
              </div>
              <div className="admin-notif-stats-detail">
                <h5>📊 Type Distribution</h5>
                {Object.keys(typeDistribution).length === 0 ? (
                  <p>No data available</p>
                ) : (
                  Object.entries(typeDistribution).map(([type, count]) => (
                    <div key={type} className="admin-notif-stats-detail-item">
                      <span>{type}</span>
                      <span>{count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="admin-notif-modal-footer">
              <button className="admin-notif-btn-cancel" onClick={() => setShowStatsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="admin-notif-modal-overlay" onClick={() => setShowCleanupModal(false)}>
          <div className="admin-notif-modal-content admin-notif-cleanup-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-notif-modal-header">
              <h4>🧹 Cleanup Old Notifications</h4>
              <button className="admin-notif-modal-close" onClick={() => setShowCleanupModal(false)}>✕</button>
            </div>
            <div className="admin-notif-modal-body">
              <div className="admin-notif-form-group">
                <label>Delete notifications older than (days)</label>
                <input 
                  type="number" 
                  className="admin-notif-form-control" 
                  value={cleanupDays}
                  onChange={e => setCleanupDays(parseInt(e.target.value) || 0)}
                  min="1"
                  max="365"
                />
              </div>
              <div className="admin-notif-cleanup-info">
                <span>⚠️ This action cannot be undone. All notifications older than {cleanupDays} days will be permanently deleted.</span>
              </div>
            </div>
            <div className="admin-notif-modal-footer">
              <button className="admin-notif-btn-cancel" onClick={() => setShowCleanupModal(false)}>Cancel</button>
              <button className="admin-notif-btn-danger" onClick={handleCleanup}>
                🗑️ Delete Old Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Notifications Modal */}
      {showUserModal && selectedUser && (
        <div className="admin-notif-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="admin-notif-modal-content admin-notif-user-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-notif-modal-header">
              <h4>📬 {selectedUser.fullName}'s Notifications</h4>
              <button className="admin-notif-modal-close" onClick={() => setShowUserModal(false)}>✕</button>
            </div>
            <div className="admin-notif-modal-body">
              <div className="admin-notif-user-info">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Total Notifications:</strong> {userNotifications.length}</p>
              </div>
              <div className="admin-notif-user-list">
                {userNotifications.length === 0 ? (
                  <p className="admin-notif-no-notifications">No notifications for this user</p>
                ) : (
                  userNotifications.map(notif => (
                    <div key={notif.id} className="admin-notif-user-item">
                      <div className="admin-notif-user-item-header">
                        <span className="admin-notif-user-item-title">{notif.title}</span>
                        <span className="admin-notif-user-item-status">
                          {notif.isRead ? '✅ Read' : '🔴 Unread'}
                        </span>
                      </div>
                      <p className="admin-notif-user-item-message">{notif.message}</p>
                      <div className="admin-notif-user-item-meta">
                        {getTypeBadge(notif.type)}
                        <span>{notif.timeAgo}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="admin-notif-modal-footer">
              <button className="admin-notif-btn-cancel" onClick={() => setShowUserModal(false)}>Close</button>
              {userNotifications.length > 0 && (
                <button 
                  className="admin-notif-btn-danger"
                  onClick={() => handleDeleteUserNotifications(selectedUser.id, selectedUser.fullName)}
                >
                  🗑️ Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="admin-notif-modal-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="admin-notif-modal-content admin-notif-broadcast-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-notif-modal-header">
              <h4>📢 Broadcast Notification</h4>
              <button className="admin-notif-modal-close" onClick={() => setShowBroadcastModal(false)}>✕</button>
            </div>
            <div className="admin-notif-modal-body">
              <div className="admin-notif-form-group">
                <label>Title *</label>
                <input 
                  type="text" 
                  className="admin-notif-form-control" 
                  placeholder="Enter notification title"
                  value={broadcastData.title}
                  onChange={e => setBroadcastData({...broadcastData, title: e.target.value})}
                />
              </div>
              <div className="admin-notif-form-group">
                <label>Message *</label>
                <textarea 
                  className="admin-notif-form-control" 
                  rows="4" 
                  placeholder="Enter notification message"
                  value={broadcastData.message}
                  onChange={e => setBroadcastData({...broadcastData, message: e.target.value})}
                />
              </div>
              <div className="admin-notif-form-row">
                <div className="admin-notif-form-group">
                  <label>Type</label>
                  <select 
                    className="admin-notif-form-control" 
                    value={broadcastData.type}
                    onChange={e => setBroadcastData({...broadcastData, type: e.target.value})}
                  >
                    <option value="SYSTEM">⚙️ System</option>
                    <option value="ANNOUNCEMENT">📢 Announcement</option>
                    <option value="GENERAL">📝 General</option>
                    <option value="INFO">ℹ️ Info</option>
                    <option value="SUCCESS">✅ Success</option>
                    <option value="WARNING">⚠️ Warning</option>
                    <option value="ERROR">❌ Error</option>
                  </select>
                </div>
                <div className="admin-notif-form-group">
                  <label>Target Audience</label>
                  <select 
                    className="admin-notif-form-control" 
                    value={broadcastData.targetRole}
                    onChange={e => setBroadcastData({...broadcastData, targetRole: e.target.value})}
                  >
                    <option value="ALL">🌐 All Users</option>
                    <option value="EMPLOYEE">👥 Employees</option>
                    <option value="MANAGER">👔 Managers</option>
                    <option value="ADMIN">👑 Admins</option>
                  </select>
                </div>
              </div>
              <div className="admin-notif-broadcast-info">
                <span>ℹ️ This will send a notification to <strong>{getTargetRoleLabel(broadcastData.targetRole)}</strong></span>
              </div>
            </div>
            <div className="admin-notif-modal-footer">
              <button className="admin-notif-btn-cancel" onClick={() => setShowBroadcastModal(false)}>Cancel</button>
              <button 
                className="admin-notif-btn-send" 
                onClick={handleBroadcast}
                disabled={!broadcastData.title || !broadcastData.message}
              >
                📤 Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;