// src/manager/ManagerAnnouncements.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { managerApi } from '../services/api';
import './managerAnnouncements.css';

const ManagerAnnouncements = ({ user }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📡 Manager fetching announcements...');
      const response = await managerApi.getActiveAnnouncements();
      console.log('📡 Response:', response.data);
      
      if (response.data.success && response.data.data) {
        setAnnouncements(response.data.data);
        const unread = response.data.data.filter(a => !a.isRead).length;
        setUnreadCount(unread);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('❌ Error loading announcements:', err);
      const saved = JSON.parse(localStorage.getItem('announcements') || '[]');
      setAnnouncements(saved);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (id) => {
    try {
      console.log('📡 Marking announcement as read:', id);
      const response = await managerApi.markAnnouncementRead(id);
      if (response.data.success) {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('❌ Error marking as read:', err);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = announcements.filter(a => !a.isRead).map(a => a.id);
    for (const id of unreadIds) {
      await markAsRead(id);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    const handleUpdate = () => loadAnnouncements();
    window.addEventListener('announcementCreated', handleUpdate);
    window.addEventListener('announcementUpdated', handleUpdate);
    return () => {
      window.removeEventListener('announcementCreated', handleUpdate);
      window.removeEventListener('announcementUpdated', handleUpdate);
    };
  }, [loadAnnouncements]);

  const getPriorityBadge = (type) => {
    switch(type) {
      case 'URGENT': return <span className="priority-badge urgent">🔴 URGENT</span>;
      case 'IMPORTANT': return <span className="priority-badge important">🟡 IMPORTANT</span>;
      default: return <span className="priority-badge general">🟢 GENERAL</span>;
    }
  };

  const getPriorityClass = (type) => {
    switch(type) {
      case 'URGENT': return 'priority-urgent';
      case 'IMPORTANT': return 'priority-important';
      default: return 'priority-general';
    }
  };

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

  const filteredAnnouncements = filter === 'all' 
    ? announcements 
    : filter === 'unread' 
      ? announcements.filter(a => !a.isRead)
      : announcements.filter(a => a.isRead);

  if (loading) {
    return (
      <div className="announcements-loading">
        <div className="loading-spinner"></div>
        <p>Loading announcements...</p>
      </div>
    );
  }

  return (
    <div className="manager-announcements-container">
      <div className="announcements-header">
        <div className="header-left">
          <div className="header-icon">📢</div>
          <div className="header-text">
            <h4>Announcements</h4>
            <p>Company announcements and important updates</p>
          </div>
        </div>
        <div className="header-right">
          {unreadCount > 0 && <span className="unread-badge">{unreadCount} new</span>}
          {unreadCount > 0 && (
            <button className="mark-all-read-btn" onClick={markAllAsRead}>✓ Mark all as read</button>
          )}
        </div>
      </div>

      <div className="announcements-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`} 
          onClick={() => setFilter('all')}
        >
          All ({announcements.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`} 
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button 
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`} 
          onClick={() => setFilter('read')}
        >
          Read ({announcements.length - unreadCount})
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="no-announcements">
          <div className="empty-icon">📭</div>
          <h5>No Announcements</h5>
          <p>There are no announcements at this time</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="no-announcements">
          <div className="empty-icon">🎉</div>
          <h5>All caught up!</h5>
          <p>No {filter === 'unread' ? 'unread ' : ''}announcements to show</p>
        </div>
      ) : (
        <div className="announcements-list">
          {filteredAnnouncements.map(a => (
            <div 
              key={a.id} 
              className={`announcement-card ${getPriorityClass(a.type)} ${!a.isRead ? 'unread' : 'read'}`}
              onClick={() => !a.isRead && markAsRead(a.id)}
            >
              <div className="announcement-card-header">
                <div className="announcement-title-section">
                  {!a.isRead && <span className="unread-dot">●</span>}
                  {getPriorityBadge(a.type)}
                  <h3>{a.title}</h3>
                </div>
                <div className="announcement-date">
                  <span className="date-icon">📅</span>
                  {getTimeAgo(a.createdAt)}
                </div>
              </div>
              <div className="announcement-body">
                <p>{a.content}</p>
              </div>
              <div className="announcement-footer">
                <div className="footer-info">
                  <span className="author">👤 Posted by: {a.createdByName || a.createdBy || 'Admin'}</span>
                  {a.validTo && <span className="expiry">⏰ Valid until: {new Date(a.validTo).toLocaleDateString()}</span>}
                  {a.isRead && <span className="read-status">✓ Read</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerAnnouncements;