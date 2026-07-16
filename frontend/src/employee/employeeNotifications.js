// src/components/Notifications.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { employeeApi } from '../services/api';
import './employeeNotifications.css';

const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const [renderKey, setRenderKey] = useState(0);
  const [filterType, setFilterType] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  
  // Track previous count to detect new notifications
  const prevCountRef = useRef(0);

  // ============================================
  // 1. FETCH NOTIFICATIONS
  // ============================================
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getNotifications();
      setNotifications(response.data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // 2. FETCH NOTIFICATIONS BY TYPE
  // ============================================
  const fetchNotificationsByType = useCallback(async (type) => {
    try {
      setLoading(true);
      const response = await employeeApi.getNotificationsByType(type);
      setNotifications(response.data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching notifications by type:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // 3. FILTER BY TYPE
  // ============================================
  const filterByType = (type) => {
    setFilterType(type);
    setShowFilters(false);
    if (type === 'ALL') {
      fetchNotifications();
    } else {
      fetchNotificationsByType(type);
    }
  };

  // ============================================
  // 4. GET SCHEDULE NOTIFICATIONS
  // ============================================
  const getScheduleNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await employeeApi.getNotificationsByType('SCHEDULE');
      setNotifications(response.data || []);
      setError(null);
      setFilterType('SCHEDULE');
      setShowFilters(false);
    } catch (err) {
      console.error('❌ Error fetching schedule notifications:', err);
      setError('Failed to load schedule notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // 5. FETCH UNREAD COUNT WITH AUTO-DETECTION
  // ============================================
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await employeeApi.getUnreadCount();
      const newCount = response.data?.count || 0;
      
      if (newCount > prevCountRef.current) {
        console.log('🔔 New notification detected!');
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('📬 New Notification', {
            body: `You have ${newCount - prevCountRef.current} new notification${newCount - prevCountRef.current > 1 ? 's' : ''}!`,
            icon: '/bell-icon.png'
          });
        }
        
        if (showDropdown) {
          fetchNotifications();
        }
        
        window.dispatchEvent(new Event('newNotification'));
      }
      
      prevCountRef.current = newCount;
      setUnreadCount(newCount);
      setRenderKey(prev => prev + 1);
      
    } catch (err) {
      console.error('❌ Error fetching unread count:', err);
    }
  }, [showDropdown, fetchNotifications]);

  // ============================================
  // 6. MARK AS READ
  // ============================================
  const markAsRead = useCallback(async (id) => {
    try {
      await employeeApi.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      prevCountRef.current = Math.max(0, prevCountRef.current - 1);
      setRenderKey(prev => prev + 1);
    } catch (err) {
      console.error('❌ Error marking notification as read:', err);
    }
  }, []);

  // ============================================
  // 7. MARK ALL AS READ
  // ============================================
  const markAllAsRead = useCallback(async () => {
    try {
      await employeeApi.markAllNotificationsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      prevCountRef.current = 0;
      setRenderKey(prev => prev + 1);
    } catch (err) {
      console.error('❌ Error marking all as read:', err);
    }
  }, []);

  // ============================================
  // 8. DELETE NOTIFICATION
  // ============================================
  const deleteNotification = useCallback(async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    
    try {
      await employeeApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      const deletedNotif = notifications.find(n => n.id === id);
      if (!deletedNotif?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        prevCountRef.current = Math.max(0, prevCountRef.current - 1);
        setRenderKey(prev => prev + 1);
      }
    } catch (err) {
      console.error('❌ Error deleting notification:', err);
    }
  }, [notifications]);

  // ============================================
  // 9. DELETE ALL NOTIFICATIONS
  // ============================================
  const deleteAllNotifications = useCallback(async () => {
    if (!window.confirm('Delete all notifications?')) return;
    
    try {
      await employeeApi.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      prevCountRef.current = 0;
      setRenderKey(prev => prev + 1);
    } catch (err) {
      console.error('❌ Error deleting all notifications:', err);
    }
  }, []);

  // ============================================
  // 10. MARK ALL BY TYPE AS READ
  // ============================================
  const markAllByTypeAsRead = useCallback(async (type) => {
    try {
      await employeeApi.markAllByTypeAsRead(type);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
      );
      // Recalculate unread count
      const newUnread = notifications.filter(n => !n.isRead).length;
      setUnreadCount(newUnread);
      prevCountRef.current = newUnread;
      setRenderKey(prev => prev + 1);
    } catch (err) {
      console.error('❌ Error marking all by type as read:', err);
    }
  }, [notifications]);

  // ============================================
  // 11. TOGGLE DROPDOWN
  // ============================================
  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev);
  }, []);

  // ============================================
  // 12. FETCH DATA WHEN DROPDOWN OPENS
  // ============================================
  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
    }
  }, [showDropdown, fetchNotifications]);

  // ============================================
  // 13. CLOSE DROPDOWN ON CLICK OUTSIDE
  // ============================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // 14. POLL FOR NEW NOTIFICATIONS
  // ============================================
  useEffect(() => {
    fetchUnreadCount();
    const pollInterval = setInterval(() => {
      fetchUnreadCount();
      if (showDropdown) {
        fetchNotifications();
      }
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [fetchUnreadCount, fetchNotifications, showDropdown]);

  // ============================================
  // 15. REQUEST PERMISSION FOR DESKTOP NOTIFICATIONS
  // ============================================
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ============================================
  // 16. LISTEN FOR REAL-TIME UPDATES
  // ============================================
  useEffect(() => {
    const handleNewNotification = () => {
      fetchUnreadCount();
      if (showDropdown) {
        fetchNotifications();
      }
    };
    window.addEventListener('newNotification', handleNewNotification);
    return () => window.removeEventListener('newNotification', handleNewNotification);
  }, [fetchUnreadCount, fetchNotifications, showDropdown]);

  // ============================================
  // 17. GET TIME AGO
  // ============================================
  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // ============================================
  // 18. GET ICON FOR TYPE
  // ============================================
  const getIcon = (type) => {
    switch(type) {
      case 'SUCCESS': return '✅';
      case 'ERROR': return '❌';
      case 'WARNING': return '⚠️';
      case 'SCHEDULE': return '📅';
      case 'LEAVE': return '📋';
      case 'SWAP': return '🔄';
      case 'TASK': return '✅';
      case 'ANNOUNCEMENT': return '📢';
      default: return 'ℹ️';
    }
  };

  // ============================================
  // 19. GET TYPE CLASS
  // ============================================
  const getTypeClass = (type) => {
    switch(type) {
      case 'SUCCESS': return 'notif-success';
      case 'ERROR': return 'notif-error';
      case 'WARNING': return 'notif-warning';
      case 'SCHEDULE': return 'notif-schedule';
      case 'LEAVE': return 'notif-leave';
      case 'SWAP': return 'notif-swap';
      case 'TASK': return 'notif-task';
      default: return 'notif-info';
    }
  };

  // ============================================
  // 20. GET ENTITY BADGE COLOR
  // ============================================
  const getEntityBadgeColor = (entityType) => {
    switch(entityType) {
      case 'SCHEDULE': return 'badge-schedule';
      case 'LEAVE': return 'badge-leave';
      case 'SWAP': return 'badge-swap';
      case 'TASK': return 'badge-task';
      case 'ANNOUNCEMENT': return 'badge-announcement';
      default: return 'badge-default';
    }
  };

  return (
    <div className="notif-wrapper" ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <div className="notif-bell" onClick={toggleDropdown} key={renderKey}>
        <span className="notif-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount}</span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <h4>
              <span className="notif-header-icon"></span>
              Notifications
              {unreadCount > 0 && (
                <span className="notif-header-count">{unreadCount}</span>
              )}
            </h4>
            <div className="notif-actions">
              <button 
                className="notif-filter-btn" 
                onClick={() => setShowFilters(!showFilters)}
                title="Filter notifications"
              >
                🔍
              </button>
              {filterType !== 'ALL' && notifications.length > 0 && (
                <button 
                  onClick={() => markAllByTypeAsRead(filterType)} 
                  className="notif-mark-type-btn"
                  title={`Mark all ${filterType} as read`}
                >
                  ✔️ {filterType}
                </button>
              )}
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="notif-mark-all-btn" title="Mark all as read">
                  ✔️ All
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={deleteAllNotifications} className="notif-delete-all-btn" title="Delete all">
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="notif-filters">
              <button 
                className={`notif-filter-tab ${filterType === 'ALL' ? 'active' : ''}`}
                onClick={() => filterByType('ALL')}
              >
                📌 All
              </button>
             <button 
    className="notif-schedule-quick-btn" 
    onClick={getScheduleNotifications}
    title="Show schedule notifications"
  >
    📅
  </button>
              <button 
                className={`notif-filter-tab ${filterType === 'LEAVE' ? 'active' : ''}`}
                onClick={() => filterByType('LEAVE')}
              >
                📋 Leave
              </button>
              <button 
                className={`notif-filter-tab ${filterType === 'SWAP' ? 'active' : ''}`}
                onClick={() => filterByType('SWAP')}
              >
                🔄 Swap
              </button>
              <button 
                className={`notif-filter-tab ${filterType === 'TASK' ? 'active' : ''}`}
                onClick={() => filterByType('TASK')}
              >
                ✅ Task
              </button>
              <button 
                className={`notif-filter-tab ${filterType === 'ANNOUNCEMENT' ? 'active' : ''}`}
                onClick={() => filterByType('ANNOUNCEMENT')}
              >
                📢 Announcement
              </button>
            </div>
          )}

          {loading ? (
            <div className="notif-loading">
              <div className="notif-spinner"></div>
              <span>Loading notifications...</span>
            </div>
          ) : error ? (
            <div className="notif-error-state">
              <span>{error}</span>
              <button onClick={fetchNotifications} className="notif-retry-btn">
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">
              <span>🎉</span>
              <p>No notifications yet</p>
              {filterType !== 'ALL' && (
                <button onClick={() => filterByType('ALL')} className="notif-show-all-btn">
                  Show all notifications
                </button>
              )}
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`notif-item ${!notification.isRead ? 'notif-unread' : ''} ${getTypeClass(notification.type)}`}
                >
                  <div className="notif-item-icon">
                    {getIcon(notification.type)}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-title">
                      {notification.title}
                      {!notification.isRead && <span className="notif-unread-dot">●</span>}
                    </div>
                    <div className="notif-item-message">{notification.message}</div>
                    <div className="notif-item-meta">
                      <span className="notif-item-time">{getTimeAgo(notification.createdAt)}</span>
                      {notification.entityType && (
                        <span className={`notif-entity-badge ${getEntityBadgeColor(notification.entityType)}`}>
                          {notification.entityType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="notif-item-actions">
                    {!notification.isRead && (
                      <button 
                        onClick={() => markAsRead(notification.id)} 
                        className="notif-mark-read-btn"
                        title="Mark as read"
                      >
                        ✔️
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notification.id)} 
                      className="notif-delete-btn"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;