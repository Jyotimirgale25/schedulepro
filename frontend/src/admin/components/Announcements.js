// Announcements.js - Complete Fixed Version

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import './Announcements.css';

const Announcements = ({ user }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ 
    title: '', 
    content: '', 
    priority: 'NORMAL',
    expiresAt: ''
  });
  const [editId, setEditId] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to check if announcement is active
  const isAnnouncementActive = (announcement) => {
    if (!announcement) return false;
    const isActive = announcement.isActive;
    
    if (typeof isActive === 'boolean') return isActive;
    if (typeof isActive === 'string') return isActive.toLowerCase() === 'true';
    if (typeof isActive === 'number') return isActive === 1;
    
    return true;
  };

  // Load announcements
  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching announcements...');
      const response = await adminApi.getAnnouncements();
      console.log('📡 Response:', response.data);
      
      if (response.data?.success && response.data?.data) {
        setAnnouncements(response.data.data);
      } else if (Array.isArray(response.data)) {
        setAnnouncements(response.data);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('❌ Error loading announcements:', err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ FIXED: Create announcement - Complete version
  const createAnnouncement = async (data) => {
    try {
      console.log('📤 CREATE - Raw data:', data);
      
      // Build payload with ALL required fields
      const payload = {
        title: data.title.trim(),
        content: data.content.trim(),
        type: 'ANNOUNCEMENT',  // ✅ REQUIRED by database
        priority: data.priority || 'NORMAL'
      };

      // Add expiresAt only if provided
      if (data.expiresAt && data.expiresAt.trim() !== '') {
        payload.expiresAt = new Date(data.expiresAt).toISOString();
      }

      console.log('📤 CREATE - Final payload:', JSON.stringify(payload, null, 2));
      
      const response = await adminApi.createAnnouncement(payload);
      console.log('📡 CREATE - Response:', response.data);
      
      if (response.data?.success) {
        setSaveMessage('✅ Announcement created successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to create announcement');
      }
    } catch (err) {
      console.error('❌ CREATE - Error:', err);
      if (err.response) {
        console.error('❌ CREATE - Status:', err.response.status);
        console.error('❌ CREATE - Data:', err.response.data);
      }
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.errors?.[0]?.defaultMessage ||
                       err.message ||
                       'Failed to create announcement';
      setSaveMessage('❌ ' + errorMsg);
      setTimeout(() => setSaveMessage(''), 3000);
      return false;
    }
  };

  // ✅ FIXED: Update announcement - Complete version
  const updateAnnouncement = async (id, data) => {
    try {
      console.log('📤 UPDATE - Raw data:', data);
      
      const payload = {
        title: data.title.trim(),
        content: data.content.trim(),
        type: 'ANNOUNCEMENT',  // ✅ REQUIRED by database
        priority: data.priority || 'NORMAL'
      };

      if (data.expiresAt && data.expiresAt.trim() !== '') {
        payload.expiresAt = new Date(data.expiresAt).toISOString();
      }

      console.log('📤 UPDATE - Final payload:', JSON.stringify(payload, null, 2));
      
      const response = await adminApi.updateAnnouncement(id, payload);
      console.log('📡 UPDATE - Response:', response.data);
      
      if (response.data?.success) {
        setSaveMessage('✅ Announcement updated successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to update announcement');
      }
    } catch (err) {
      console.error('❌ UPDATE - Error:', err);
      if (err.response) {
        console.error('❌ UPDATE - Status:', err.response.status);
        console.error('❌ UPDATE - Data:', err.response.data);
      }
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.errors?.[0]?.defaultMessage ||
                       err.message ||
                       'Failed to update announcement';
      setSaveMessage('❌ ' + errorMsg);
      setTimeout(() => setSaveMessage(''), 3000);
      return false;
    }
  };

  // Delete announcement
  const deleteAnnouncement = async (id) => {
    try {
      console.log('📡 Deleting announcement...', id);
      const response = await adminApi.deleteAnnouncement(id);
      console.log('📡 Response:', response.data);
      
      if (response.data?.success) {
        setSaveMessage('✅ Announcement deleted successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to delete announcement');
      }
    } catch (err) {
      console.error('❌ Error deleting announcement:', err);
      setSaveMessage('❌ Failed to delete announcement: ' + err.message);
      setTimeout(() => setSaveMessage(''), 3000);
      return false;
    }
  };

  // Toggle announcement status
  const toggleStatus = async (id) => {
    try {
      console.log('📡 Toggling announcement status...', id);
      const response = await adminApi.toggleAnnouncementStatus(id);
      console.log('📡 Response:', response.data);
      
      if (response.data?.success) {
        await loadAnnouncements();
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to toggle status');
      }
    } catch (err) {
      console.error('❌ Error toggling status:', err);
      alert('Failed to toggle announcement status');
      return false;
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!announcementForm.title || !announcementForm.title.trim()) {
      setSaveMessage('❌ Title is required');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    
    if (!announcementForm.content || !announcementForm.content.trim()) {
      setSaveMessage('❌ Content is required');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    if (announcementForm.title.length > 200) {
      setSaveMessage('❌ Title must not exceed 200 characters');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    
    if (announcementForm.content.length > 5000) {
      setSaveMessage('❌ Content must not exceed 5000 characters');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        priority: announcementForm.priority || 'NORMAL',
        expiresAt: announcementForm.expiresAt || null
      };

      let success;
      if (editId) {
        success = await updateAnnouncement(editId, data);
      } else {
        success = await createAnnouncement(data);
      }

      if (success) {
        await loadAnnouncements();
        setShowModal(false);
        setEditId(null);
        setAnnouncementForm({ 
          title: '', 
          content: '', 
          priority: 'NORMAL',
          expiresAt: ''
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedAnnouncement) {
      const success = await deleteAnnouncement(selectedAnnouncement.id);
      if (success) {
        await loadAnnouncements();
        setShowDeleteModal(false);
        setSelectedAnnouncement(null);
      }
    }
  };

  const handleEdit = (announcement) => {
    setEditId(announcement.id);
    setAnnouncementForm({
      title: announcement.title || '',
      content: announcement.content || '',
      priority: announcement.priority || 'NORMAL',
      expiresAt: announcement.expiresAt ? announcement.expiresAt.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (announcement) => {
    await toggleStatus(announcement.id);
  };

  const getPriorityBadge = (priority) => {
    const type = (priority || 'NORMAL').toUpperCase();
    switch(type) {
      case 'URGENT': return <span className="admin-announcements-priority-urgent">🔴 URGENT</span>;
      case 'HIGH': return <span className="admin-announcements-priority-important">🟡 HIGH</span>;
      default: return <span className="admin-announcements-priority-general">🟢 NORMAL</span>;
    }
  };

  const getStatusBadge = (isActive) => {
    const active = isAnnouncementActive({ isActive });
    return active 
      ? <span className="admin-announcements-status-active">✅ Active</span>
      : <span className="admin-announcements-status-inactive">⛔ Inactive</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const activeCount = announcements.filter(a => isAnnouncementActive(a)).length;
  const inactiveCount = announcements.length - activeCount;

  if (loading) {
    return <div className="admin-announcements-loading-container">Loading announcements...</div>;
  }

  return (
    <div className="admin-announcements-container">
      <div className="admin-announcements-header">
        <h4>📢 Announcements</h4>
        <div className="admin-announcements-header-actions">
          {saveMessage && (
            <span className={`admin-announcements-save-message ${saveMessage.includes('✅') ? 'admin-announcements-success' : 'admin-announcements-error'}`}>
              {saveMessage}
            </span>
          )}
          <button className="admin-announcements-btn-primary" onClick={() => {
            setEditId(null);
            setAnnouncementForm({ 
              title: '', 
              content: '', 
              priority: 'NORMAL',
              expiresAt: ''
            });
            setShowModal(true);
          }}>
            + Send Announcement
          </button>
        </div>
      </div>

      <div className="admin-announcements-stats">
        <div className="admin-announcements-stat">
          <span>Total</span>
          <strong>{announcements.length}</strong>
        </div>
        <div className="admin-announcements-stat admin-announcements-stat-active">
          <span>Active</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="admin-announcements-stat admin-announcements-stat-inactive">
          <span>Inactive</span>
          <strong>{inactiveCount}</strong>
        </div>
      </div>

      <div className="admin-announcements-list">
        {announcements.length === 0 ? (
          <div className="admin-announcements-no-announcements">No announcements yet</div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className={`admin-announcements-card admin-announcements-priority-${(a.priority || 'normal').toLowerCase()}`}>
              <div className="admin-announcements-card-header">
                <div className="admin-announcements-title-group">
                  <h3>{a.title}</h3>
                  <div className="admin-announcements-badge-group">
                    {getPriorityBadge(a.priority)}
                    {getStatusBadge(a.isActive)}
                  </div>
                </div>
                <div className="admin-announcements-actions">
                  <button className="admin-announcements-edit-btn" onClick={() => handleEdit(a)} title="Edit">✏️</button>
                  <button className="admin-announcements-toggle-btn" onClick={() => handleToggleStatus(a)} title={isAnnouncementActive(a) ? 'Deactivate' : 'Activate'}>
                    {isAnnouncementActive(a) ? '⛔' : '✅'}
                  </button>
                  <button className="admin-announcements-delete-btn" onClick={() => handleDelete(a)} title="Delete">🗑️</button>
                </div>
              </div>
              <p className="admin-announcements-content">{a.content}</p>
              <div className="admin-announcements-footer">
                <span>👤 {a.createdByName || a.createdBy || 'Admin'}</span>
                <span>📅 {formatDate(a.createdAt)}</span>
                {a.expiresAt && <span>📌 Expires: {formatDate(a.expiresAt)}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-announcements-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-announcements-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-announcements-modal-header">
              <h4>{editId ? '✏️ Edit Announcement' : '📢 Send Announcement'}</h4>
              <button className="admin-announcements-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form className="admin-announcements-form" onSubmit={handleSubmit}>
              <div className="admin-announcements-form-group">
                <label>Title *</label>
                <input 
                  type="text" 
                  className="admin-announcements-form-control" 
                  value={announcementForm.title} 
                  onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} 
                  required 
                  maxLength="200"
                  placeholder="Enter announcement title"
                />
              </div>
              <div className="admin-announcements-form-group">
                <label>Content *</label>
                <textarea 
                  className="admin-announcements-form-control" 
                  rows="4" 
                  value={announcementForm.content} 
                  onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} 
                  required 
                  maxLength="5000"
                  placeholder="Enter announcement content"
                />
              </div>
              <div className="admin-announcements-form-group">
                <label>Priority</label>
                <select 
                  className="admin-announcements-form-control" 
                  value={announcementForm.priority} 
                  onChange={e => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="admin-announcements-form-group">
                <label>Expires At (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="admin-announcements-form-control" 
                  value={announcementForm.expiresAt} 
                  onChange={e => setAnnouncementForm({...announcementForm, expiresAt: e.target.value})} 
                />
              </div>
              <div className="admin-announcements-modal-buttons">
                <button type="button" className="admin-announcements-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-announcements-btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editId ? 'Update Announcement' : 'Send Announcement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAnnouncement && (
        <div className="admin-announcements-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="admin-announcements-modal-content admin-announcements-delete-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-announcements-modal-header">
              <h4>Delete Announcement</h4>
              <button className="admin-announcements-modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="admin-announcements-modal-body">
              <div className="admin-announcements-delete-warning">
                <span className="admin-announcements-warning-icon">⚠️</span>
                <p>Delete announcement <strong>"{selectedAnnouncement.title}"</strong>?</p>
                <p className="admin-announcements-warning-text">This action cannot be undone.</p>
              </div>
            </div>
            <div className="admin-announcements-modal-buttons">
              <button className="admin-announcements-btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="admin-announcements-btn-delete" onClick={confirmDelete}>
                Delete Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;