// src/admin/LeaveOverview.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './adminLeaveOverview.css';

const LeaveOverview = ({ user }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => localStorage.getItem('accessToken');

  // Load all leave requests
  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:8080/api/admin/leaves', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load leaves');
      }

      const result = await response.json();
      
      // Handle both response formats
      if (result.success && result.data) {
        setLeaveRequests(result.data);
      } else if (Array.isArray(result)) {
        setLeaveRequests(result);
      } else {
        console.warn('Unexpected response format:', result);
        setLeaveRequests([]);
      }
    } catch (err) {
      console.error('Error loading leaves:', err);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update leave status via backend API
  const updateLeaveStatus = async (id, status, reason = '') => {
    try {
      const token = getAuthToken();
      const endpoint = status === 'APPROVED' ? 'approve' : 'reject';
      
      const response = await fetch(`http://localhost:8080/api/admin/leaves/${id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: status,
          approvalComments: reason
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${status} leave`);
      }

      const result = await response.json();
      
      if (result.success) {
        window.dispatchEvent(new Event('leaveRequestUpdated'));
        await loadLeaves();
        return true;
      } else {
        throw new Error(result.message || `Failed to ${status} leave`);
      }
    } catch (err) {
      console.error('Error updating leave:', err);
      alert(`Failed to ${status} leave request: ${err.message}`);
      return false;
    }
  };

  useEffect(() => {
    loadLeaves();
    
    const handleUpdate = () => {
      loadLeaves();
    };
    
    window.addEventListener('leaveRequestCreated', handleUpdate);
    window.addEventListener('leaveRequestUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('leaveRequestCreated', handleUpdate);
      window.removeEventListener('leaveRequestUpdated', handleUpdate);
    };
  }, [loadLeaves]);

  const handleApprove = async (leave) => {
    if (window.confirm(`Approve ${leave.userFullName || leave.userId}'s leave request?`)) {
      const success = await updateLeaveStatus(leave.id, 'APPROVED');
      if (success) {
        alert('Leave approved successfully!');
      }
    }
  };

  const handleReject = (leave) => {
    setSelectedLeave(leave);
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (selectedLeave) {
      const success = await updateLeaveStatus(selectedLeave.id, 'REJECTED', rejectReason);
      if (success) {
        alert('Leave rejected successfully!');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedLeave(null);
      }
    }
  };

  const handleClearAll = () => {
    setShowClearModal(true);
  };

  const confirmClearAll = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:8080/api/admin/leaves/all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear leaves');
      }

      const result = await response.json();
      
      if (result.success) {
        await loadLeaves();
        setShowClearModal(false);
        alert('All leave requests cleared successfully!');
      } else {
        throw new Error(result.message || 'Failed to clear leaves');
      }
    } catch (err) {
      console.error('Error clearing leaves:', err);
      alert('Failed to clear leave requests');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED': return <span className="admin-leave-status-badge admin-leave-approved">✅ Approved</span>;
      case 'REJECTED': return <span className="admin-leave-status-badge admin-leave-rejected">❌ Rejected</span>;
      default: return <span className="admin-leave-status-badge admin-leave-pending">⏳ Pending</span>;
    }
  };

  const filteredLeaves = filter === 'all' 
    ? leaveRequests 
    : leaveRequests.filter(l => l.status === filter.toUpperCase());

  if (loading) {
    return <div className="admin-leave-loading-container">Loading leave requests...</div>;
  }

  return (
    <div className="admin-leave-overview-container">
      <div className="admin-leave-header">
        <h4>📋 Leave Overview</h4>
        <div className="admin-leave-header-actions">
          <div className="admin-leave-filter-buttons">
            <button 
              className={`admin-leave-filter-btn ${filter === 'all' ? 'admin-leave-active' : ''}`} 
              onClick={() => setFilter('all')}
            >
              All ({leaveRequests.length})
            </button>
            <button 
              className={`admin-leave-filter-btn ${filter === 'pending' ? 'admin-leave-active' : ''}`} 
              onClick={() => setFilter('pending')}
            >
              Pending ({leaveRequests.filter(l => l.status === 'PENDING').length})
            </button>
            <button 
              className={`admin-leave-filter-btn ${filter === 'approved' ? 'admin-leave-active' : ''}`} 
              onClick={() => setFilter('approved')}
            >
              Approved ({leaveRequests.filter(l => l.status === 'APPROVED').length})
            </button>
            <button 
              className={`admin-leave-filter-btn ${filter === 'rejected' ? 'admin-leave-active' : ''}`} 
              onClick={() => setFilter('rejected')}
            >
              Rejected ({leaveRequests.filter(l => l.status === 'REJECTED').length})
            </button>
          </div>
          {leaveRequests.length > 0 && (
            <button 
              className="admin-leave-clear-all-btn" 
              onClick={handleClearAll}
            >
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-leave-stats">
        <div className="admin-leave-stat">
          <span>Total Requests</span>
          <strong>{leaveRequests.length}</strong>
        </div>
        <div className="admin-leave-stat admin-leave-pending">
          <span>Pending</span>
          <strong>{leaveRequests.filter(l => l.status === 'PENDING').length}</strong>
        </div>
        <div className="admin-leave-stat admin-leave-approved">
          <span>Approved</span>
          <strong>{leaveRequests.filter(l => l.status === 'APPROVED').length}</strong>
        </div>
        <div className="admin-leave-stat admin-leave-rejected">
          <span>Rejected</span>
          <strong>{leaveRequests.filter(l => l.status === 'REJECTED').length}</strong>
        </div>
      </div>

      {/* Leave Table */}
      <div className="admin-leave-table-wrapper">
        <table className="admin-leave-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Applied</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map(leave => (
              <tr key={leave.id}>
                <td>
                  <div className="admin-leave-employee-info">
                    <strong>{leave.userFullName || leave.userId}</strong>
                    <small>{leave.userEmail || ''}</small>
                  </div>
                </td>
                <td>{leave.leaveType || leave.type}</td>
                <td>
                  {leave.startDate} <br />
                  <small>to {leave.endDate}</small>
                </td>
                <td>{leave.totalDays || 0} days</td>
                <td className="admin-leave-reason-cell">{leave.reason || '-'}</td>
                <td>{leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : '-'}</td>
                <td>{getStatusBadge(leave.status)}</td>
                <td>
                  {leave.status === 'PENDING' && (
                    <div className="admin-leave-action-buttons">
                      <button 
                        className="admin-leave-approve-btn" 
                        onClick={() => handleApprove(leave)}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="admin-leave-reject-btn" 
                        onClick={() => handleReject(leave)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {leave.status !== 'PENDING' && (
                    <span className="admin-leave-no-action">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeaves.length === 0 && (
          <div className="admin-leave-empty-state">
            <p>No leave requests found</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="admin-leave-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="admin-leave-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-leave-modal-header">
              <h4>Reject Leave Request</h4>
              <button className="admin-leave-modal-close" onClick={() => setShowRejectModal(false)}>
                ✕
              </button>
            </div>
            <div className="admin-leave-modal-body">
              <p><strong>Employee:</strong> {selectedLeave?.userFullName}</p>
              <p><strong>Leave Type:</strong> {selectedLeave?.leaveType}</p>
              <p><strong>Dates:</strong> {selectedLeave?.startDate} to {selectedLeave?.endDate}</p>
              <div className="admin-leave-form-group">
                <label>Rejection Reason:</label>
                <textarea 
                  className="admin-leave-form-control" 
                  rows="4" 
                  placeholder="Enter reason for rejection..."
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-leave-modal-footer">
              <button className="admin-leave-btn-cancel" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button className="admin-leave-btn-submit" onClick={submitRejection}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="admin-leave-modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="admin-leave-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-leave-modal-header">
              <h4>⚠️ Clear All Leave Requests</h4>
              <button className="admin-leave-modal-close" onClick={() => setShowClearModal(false)}>
                ✕
              </button>
            </div>
            <div className="admin-leave-modal-body">
              <p>Are you sure you want to delete <strong>ALL {leaveRequests.length} leave requests</strong>?</p>
              <p className="admin-leave-warning-text">This action cannot be undone!</p>
            </div>
            <div className="admin-leave-modal-footer">
              <button className="admin-leave-btn-cancel" onClick={() => setShowClearModal(false)}>
                Cancel
              </button>
              <button className="admin-leave-btn-danger" onClick={confirmClearAll}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveOverview;