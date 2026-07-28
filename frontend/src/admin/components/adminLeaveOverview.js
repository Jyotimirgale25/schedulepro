import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './adminLeaveOverview.css';

const LeaveOverview = ({ user }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Load all leave requests using adminApi
  const loadLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getLeaves();
      console.log('📋 Admin leaves loaded:', response.data);
      
      // Handle both response formats
      if (response.data && response.data.success && response.data.data) {
        setLeaveRequests(response.data.data);
      } else if (Array.isArray(response.data)) {
        setLeaveRequests(response.data);
      } else {
        console.warn('Unexpected response format:', response.data);
        setLeaveRequests([]);
      }
    } catch (err) {
      console.error('Error loading leaves:', err);
      toast.error('❌ Failed to load leave requests');
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Update leave status using adminApi
  const updateLeaveStatus = async (id, status, reason = '') => {
    try {
      let response;
      if (status === 'APPROVED') {
        response = await adminApi.approveLeave(id, { approvalComments: reason });
      } else {
        response = await adminApi.rejectLeave(id, { approvalComments: reason });
      }
      
      console.log(`✅ Leave ${status}:`, response.data);
      
      window.dispatchEvent(new Event('leaveRequestUpdated'));
      await loadLeaves();
      return true;
    } catch (err) {
      console.error('Error updating leave:', err);
      toast.error(`❌ Failed to ${status} leave request`);
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
        toast.success('✅ Leave approved successfully!');
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
        toast.info('❌ Leave rejected successfully!');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedLeave(null);
      }
    }
  };

  // ✅ Clear all leaves using adminApi
  const handleClearAll = () => {
    setShowClearModal(true);
  };

  const confirmClearAll = async () => {
    try {
      await adminApi.deleteAllLeaves();
      toast.success('✅ All leave requests cleared successfully!');
      await loadLeaves();
      setShowClearModal(false);
    } catch (err) {
      console.error('Error clearing leaves:', err);
      toast.error('❌ Failed to clear leave requests');
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
      <ToastContainer position="top-right" autoClose={3000} />
      
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