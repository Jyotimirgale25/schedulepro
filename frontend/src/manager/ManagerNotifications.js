// fronted/src/manager/ManagerNotifications.js
import React, { useState, useEffect } from 'react';
import { managerApi } from '../services/api';
import './ManagerNotifications.css';

const ManagerNotifications = ({ user }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: ''
  });
  const [scheduleForm, setScheduleForm] = useState({
    scheduleDate: '',
    shiftTime: '',
    date: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await managerApi.getTeam();
      setTeamMembers(response.data || []);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
    }
  };

  // ===== GENERAL NOTIFICATION HANDLERS =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm(prev => ({ ...prev, [name]: value }));
  };

  const sendToTeamMember = async (e) => {
    e.preventDefault();
    
    if (!selectedMember) {
      setError('Please select a team member');
      return;
    }

    if (!notificationForm.title || !notificationForm.message) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await managerApi.sendNotificationToTeamMember(selectedMember, {
        title: notificationForm.title,
        message: notificationForm.message
      });
      
      setSuccess(`✅ Notification sent to team member successfully!`);
      resetForm();
    } catch (err) {
      setError('❌ Failed to send notification: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const sendToAllTeam = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title || !notificationForm.message) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await managerApi.sendNotificationToTeam({
        title: notificationForm.title,
        message: notificationForm.message
      });
      
      setSuccess(`✅ Notification sent to all team members!`);
      resetForm();
    } catch (err) {
      setError('❌ Failed to send notification: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ===== SCHEDULE NOTIFICATION HANDLERS =====
  const sendScheduleUpdate = async (e) => {
    e.preventDefault();
    
    if (!scheduleForm.scheduleDate) {
      setError('Please select a schedule date');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await managerApi.sendScheduleUpdate({
        scheduleDate: scheduleForm.scheduleDate
      });
      
      setSuccess(`📅 Schedule update notification sent to all team members!`);
      resetScheduleForm();
    } catch (err) {
      setError('❌ Failed to send schedule update: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const sendShiftAssignment = async (e) => {
    e.preventDefault();
    
    if (!selectedMember) {
      setError('Please select a team member');
      return;
    }

    if (!scheduleForm.shiftTime || !scheduleForm.date) {
      setError('Please fill in all shift details');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await managerApi.sendShiftAssignment({
        userId: selectedMember,
        shiftTime: scheduleForm.shiftTime,
        date: scheduleForm.date
      });
      
      setSuccess(`🕒 Shift assignment notification sent successfully!`);
      resetScheduleForm();
      setSelectedMember('');
    } catch (err) {
      setError('❌ Failed to send shift assignment: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const sendAnnouncement = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title || !notificationForm.message) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await managerApi.sendAnnouncement({
        title: notificationForm.title
      });
      
      setSuccess(`📢 Announcement sent to all team members!`);
      resetForm();
    } catch (err) {
      setError('❌ Failed to send announcement: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ===== RESET FUNCTIONS =====
  const resetForm = () => {
    setNotificationForm({ title: '', message: '' });
    setSelectedMember('');
    setTimeout(() => setSuccess(''), 5000);
  };

  const resetScheduleForm = () => {
    setScheduleForm({ scheduleDate: '', shiftTime: '', date: '' });
    setTimeout(() => setSuccess(''), 5000);
  };

  // ===== RENDER TABS =====
  const renderTabs = () => (
    <div className="notifications-tabs">
      <button 
        className={`notifications-tab ${activeTab === 'general' ? 'active' : ''}`}
        onClick={() => setActiveTab('general')}
      >
        📨 General
      </button>
      <button 
        className={`notifications-tab ${activeTab === 'schedule' ? 'active' : ''}`}
        onClick={() => setActiveTab('schedule')}
      >
        📅 Schedule
      </button>
      <button 
        className={`notifications-tab ${activeTab === 'shift' ? 'active' : ''}`}
        onClick={() => setActiveTab('shift')}
      >
        🕒 Shift
      </button>
      <button 
        className={`notifications-tab ${activeTab === 'announcement' ? 'active' : ''}`}
        onClick={() => setActiveTab('announcement')}
      >
        📢 Announcement
      </button>
    </div>
  );

  return (
    <div className="notifications-manager-container">
      <div className="notifications-manager-header">
        <div className="notifications-header-left">
          <h2>📨 Notification Center</h2>
          <p className="notifications-subtitle">Communicate with your team members instantly</p>
        </div>
        <div className="notifications-header-right">
          <span className="notifications-team-count">{teamMembers.length} team members</span>
        </div>
      </div>

      {success && (
        <div className="notifications-alert notifications-success">
          <span className="notifications-alert-icon">✅</span>
          <span className="notifications-alert-message">{success}</span>
          <button className="notifications-alert-close" onClick={() => setSuccess('')}>✕</button>
        </div>
      )}
      
      {error && (
        <div className="notifications-alert notifications-error">
          <span className="notifications-alert-icon">❌</span>
          <span className="notifications-alert-message">{error}</span>
          <button className="notifications-alert-close" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {renderTabs()}

      {/* ===== GENERAL TAB ===== */}
      {activeTab === 'general' && (
        <div className="notifications-manager-grid">
          {/* Send to Specific Team Member */}
          <div className="notifications-card">
            <div className="notifications-card-header">
              <span className="notifications-card-icon">👤</span>
              <h3>Send to Individual</h3>
            </div>
            <form onSubmit={sendToTeamMember} className="notifications-form">
              <div className="notifications-form-group">
                <label>Select Team Member</label>
                <div className="notifications-select-wrapper">
                  <select 
                    value={selectedMember} 
                    onChange={(e) => setSelectedMember(e.target.value)}
                    required
                  >
                    <option value="">Choose a team member...</option>
                    {teamMembers.filter(m => m.isActive !== false).map(member => (
                      <option key={member.id} value={member.id}>
                        {member.fullName || member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                  <span className="notifications-select-arrow">▼</span>
                </div>
              </div>
              <div className="notifications-form-group">
                <label>Subject</label>
                <input
                  type="text"
                  name="title"
                  value={notificationForm.title}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  required
                />
              </div>
              <div className="notifications-form-group">
                <label>Message</label>
                <textarea
                  name="message"
                  value={notificationForm.message}
                  onChange={handleChange}
                  placeholder="Type your message here..."
                  rows="4"
                  required
                />
              </div>
              <button type="submit" className="notifications-btn-submit" disabled={loading}>
                {loading ? 'Sending...' : '📤 Send to Member'}
              </button>
            </form>
          </div>

          {/* Send to All Team Members */}
          <div className="notifications-card notifications-card-primary">
            <div className="notifications-card-header">
              <span className="notifications-card-icon">👥</span>
              <h3>Send to All Team</h3>
            </div>
            <form onSubmit={sendToAllTeam} className="notifications-form">
              <div className="notifications-form-group">
                <label>Subject</label>
                <input
                  type="text"
                  name="title"
                  value={notificationForm.title}
                  onChange={handleChange}
                  placeholder="Team announcement..."
                  required
                />
              </div>
              <div className="notifications-form-group">
                <label>Message</label>
                <textarea
                  name="message"
                  value={notificationForm.message}
                  onChange={handleChange}
                  placeholder="Type your team message here..."
                  rows="4"
                  required
                />
              </div>
              <button type="submit" className="notifications-btn-submit notifications-btn-primary" disabled={loading}>
                {loading ? 'Sending...' : '📢 Send to All Team'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== SCHEDULE TAB ===== */}
      {activeTab === 'schedule' && (
        <div className="notifications-manager-grid">
          <div className="notifications-card notifications-card-primary">
            <div className="notifications-card-header">
              <span className="notifications-card-icon">📅</span>
              <h3>Send Schedule Update</h3>
              <p className="notifications-card-subtitle">Notify all team members about schedule changes</p>
            </div>
            <form onSubmit={sendScheduleUpdate} className="notifications-form">
              <div className="notifications-form-group">
                <label>Schedule Date</label>
                <input
                  type="date"
                  name="scheduleDate"
                  value={scheduleForm.scheduleDate}
                  onChange={handleScheduleChange}
                  required
                />
              </div>
              <div className="notifications-form-info">
                <span>📌</span>
                <p>This will notify all team members that the schedule has been updated for the selected date.</p>
              </div>
              <button type="submit" className="notifications-btn-submit notifications-btn-primary" disabled={loading}>
                {loading ? 'Sending...' : '📅 Send Schedule Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== SHIFT TAB ===== */}
      {activeTab === 'shift' && (
        <div className="notifications-manager-grid">
          <div className="notifications-card">
            <div className="notifications-card-header">
              <span className="notifications-card-icon">🕒</span>
              <h3>Assign Shift Notification</h3>
              <p className="notifications-card-subtitle">Notify a team member about their shift assignment</p>
            </div>
            <form onSubmit={sendShiftAssignment} className="notifications-form">
              <div className="notifications-form-group">
                <label>Select Team Member</label>
                <div className="notifications-select-wrapper">
                  <select 
                    value={selectedMember} 
                    onChange={(e) => setSelectedMember(e.target.value)}
                    required
                  >
                    <option value="">Choose a team member...</option>
                    {teamMembers.filter(m => m.isActive !== false).map(member => (
                      <option key={member.id} value={member.id}>
                        {member.fullName || member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                  <span className="notifications-select-arrow">▼</span>
                </div>
              </div>
              <div className="notifications-form-group">
                <label>Shift Time</label>
                <input
                  type="text"
                  name="shiftTime"
                  value={scheduleForm.shiftTime}
                  onChange={handleScheduleChange}
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  required
                />
              </div>
              <div className="notifications-form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={scheduleForm.date}
                  onChange={handleScheduleChange}
                  required
                />
              </div>
              <button type="submit" className="notifications-btn-submit" disabled={loading}>
                {loading ? 'Sending...' : '🕒 Send Shift Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== ANNOUNCEMENT TAB ===== */}
      {activeTab === 'announcement' && (
        <div className="notifications-manager-grid">
          <div className="notifications-card notifications-card-primary">
            <div className="notifications-card-header">
              <span className="notifications-card-icon">📢</span>
              <h3>Send Announcement</h3>
              <p className="notifications-card-subtitle">Broadcast an announcement to all team members</p>
            </div>
            <form onSubmit={sendAnnouncement} className="notifications-form">
              <div className="notifications-form-group">
                <label>Announcement Title</label>
                <input
                  type="text"
                  name="title"
                  value={notificationForm.title}
                  onChange={handleChange}
                  placeholder="Announcement title..."
                  required
                />
              </div>
              <div className="notifications-form-group">
                <label>Message</label>
                <textarea
                  name="message"
                  value={notificationForm.message}
                  onChange={handleChange}
                  placeholder="Type your announcement here..."
                  rows="4"
                  required
                />
              </div>
              <div className="notifications-form-info">
                <span>📌</span>
                <p>This announcement will be sent to all team members as a notification.</p>
              </div>
              <button type="submit" className="notifications-btn-submit notifications-btn-primary" disabled={loading}>
                {loading ? 'Sending...' : '📢 Send Announcement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerNotifications;