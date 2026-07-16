import React, { useState, useEffect, useCallback } from 'react';
import './managerLeaveApprovals.css';

const LeaveApprovals = ({ user }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const getAuthToken = () => localStorage.getItem('accessToken');

  const loadLeaveRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:8080/api/manager/leaves/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load leave requests');
      }

      const data = await response.json();
      setLeaveRequests(data);
    } catch (err) {
      console.error('Error loading leaves:', err);
      setError('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLeaveStatus = async (leaveId, status, rejectReason = '') => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8080/api/manager/leaves/${leaveId}/${status === 'APPROVED' ? 'approve' : 'reject'}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: status,
          remarks: rejectReason 
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${status} leave request`);
      }

      // Reload the list
      loadLeaveRequests();
      
      // Dispatch event for other components
      window.dispatchEvent(new Event('leaveRequestUpdated'));
      
      return true;
    } catch (err) {
      console.error('Error updating leave:', err);
      alert(`Failed to ${status} leave request. Please try again.`);
      return false;
    }
  };

  const handleApprove = async (leave) => {
    if (window.confirm(`Approve ${leave.userFullName}'s leave request?`)) {
      const success = await updateLeaveStatus(leave.id, 'APPROVED');
      if (success) {
        alert(`✅ Leave approved for ${leave.userFullName}!`);
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
        alert(`❌ Leave rejected for ${selectedLeave.userFullName}`);
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedLeave(null);
      }
    }
  };

  useEffect(() => {
    loadLeaveRequests();
    
    // Listen for new leave requests
    const handleLeaveUpdate = () => {
        loadLeaveRequests();
    };
    
    window.addEventListener('leaveRequestCreated', handleLeaveUpdate);
    window.addEventListener('leaveRequestUpdated', handleLeaveUpdate);
    
    return () => {
        window.removeEventListener('leaveRequestCreated', handleLeaveUpdate);
        window.removeEventListener('leaveRequestUpdated', handleLeaveUpdate);
    };
  }, [loadLeaveRequests]);

  const getLeaveTypeIcon = (type) => {
    switch(type) {
      case 'SICK': return '🤒';
      case 'CASUAL': return '🏖️';
      case 'ANNUAL': return '✈️';
      case 'EMERGENCY': return '🚨';
      default: return '📋';
    }
  };

  if (loading) {
    return <div className="leave-approvals-loading">Loading leave requests...</div>;
  }

  return (
    <div className="leave-approvals-container">
      <div className="leave-approvals-header">
        <h4>📋 Pending Leave Approvals</h4>
        <span className="leave-approvals-pending-count">{leaveRequests.length} pending</span>
      </div>

      {error && (
        <div className="leave-approvals-error-message">{error}</div>
      )}

      {leaveRequests.length === 0 ? (
        <div className="leave-no-pending">
          <div className="leave-empty-icon">✅</div>
          <p>No pending leave requests</p>
          <small>All leave requests have been processed</small>
        </div>
      ) : (
        <div className="leave-approvals-list">
          {leaveRequests.map(leave => (
            <div key={leave.id} className="leave-approval-card">
              <div className="leave-approval-header">
                <div className="leave-employee-info">
                  <div className="leave-employee-avatar">👤</div>
                  <div>
                    <h4>{leave.userFullName}</h4>
                    <p>{leave.userEmail || leave.userId}</p>
                  </div>
                </div>
                <span className="leave-pending-badge">⏳ PENDING</span>
              </div>

              <div className="leave-details">
                <div className="leave-detail">
                  <span>📋 Type:</span>
                  <strong>{getLeaveTypeIcon(leave.leaveType)} {leave.leaveType}</strong>
                </div>
                <div className="leave-detail">
                  <span>📅 Dates:</span>
                  <strong>{leave.startDate} to {leave.endDate}</strong>
                </div>
                <div className="leave-detail">
                  <span>📝 Reason:</span>
                  <p>{leave.reason || 'No reason provided'}</p>
                </div>
                <div className="leave-detail">
                  <span>📅 Total Days:</span>
                  <strong>{leave.totalDays} days</strong>
                </div>
              </div>

              <div className="leave-approval-actions">
                <button className="leave-btn-approve" onClick={() => handleApprove(leave)}>
                  ✓ Approve
                </button>
                <button className="leave-btn-reject" onClick={() => handleReject(leave)}>
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="leave-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="leave-modal-content" onClick={e => e.stopPropagation()}>
            <div className="leave-modal-header">
              <h4>Rejection Reason</h4>
              <button onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <div className="leave-modal-body">
              <textarea 
                className="leave-form-control" 
                rows="3" 
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="leave-modal-buttons">
              <button className="leave-btn-cancel" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="leave-btn-submit" onClick={submitRejection}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApprovals;