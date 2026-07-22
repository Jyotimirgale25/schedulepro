import React, { useState, useEffect, useCallback } from 'react';
import './employeeLeave.css';

const Leaves = ({ user }) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [viewType, setViewType] = useState('list');

  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({
    casual: 12,
    sick: 10,
    annual: 15,
    emergency: 3,
    totalUsed: 3
  });
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'CASUAL',
    halfDay: false,
    halfDaySession: 'MORNING'
  });

  const getAuthToken = () => localStorage.getItem('accessToken');

  // Load leaves from backend
  const loadLeaveRequests = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/employee/leaves', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data);
      }
    } catch (err) {
      console.error('Error loading leaves:', err);
    }
  }, []);

  // Load leave balance from backend
  const loadLeaveBalance = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/employee/leaves/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeaveBalance({
          casual: data.casualLeaves || 12,
          sick: data.sickLeaves || 10,
          annual: data.annualLeaves || 15,
          emergency: data.emergencyLeaves || 3,
          totalUsed: 50 - ((data.casualLeaves || 12) + (data.sickLeaves || 10) + 
                   (data.annualLeaves || 15) + (data.emergencyLeaves || 3))
        });
      }
    } catch (err) {
      console.error('Error loading balance:', err);
    }
  }, []);

  // Save leave to backend
  const saveLeaveRequest = async (newLeave) => {
    try {
      const token = getAuthToken();
      const response = await fetch('/api/employee/leaves', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leaveType: newLeave.type,
          startDate: newLeave.startDate,
          endDate: newLeave.endDate,
          reason: newLeave.reason
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Leave saved:', data);
        window.dispatchEvent(new Event('leaveRequestCreated'));
        return true;
      } else {
        const error = await response.text();
        console.error('Error response:', error);
        return false;
      }
    } catch (err) {
      console.error('Error saving leave:', err);
      return false;
    }
  };

  useEffect(() => {
    loadLeaveRequests();
    loadLeaveBalance();

    const handleUpdate = () => {
      loadLeaveRequests();
      loadLeaveBalance();
    };

    window.addEventListener('leaveRequestUpdated', handleUpdate);
    return () => window.removeEventListener('leaveRequestUpdated', handleUpdate);
  }, [loadLeaveRequests, loadLeaveBalance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const newLeave = {
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      type: leaveForm.type,
      totalDays: leaveForm.halfDay ? 0.5 : days
    };

    const success = await saveLeaveRequest(newLeave);

    if (success) {
      await loadLeaveRequests();
      await loadLeaveBalance();
      alert('Leave request submitted to manager for approval!');
      setShowModal(false);
      setLeaveForm({ startDate: '', endDate: '', reason: '', type: 'CASUAL', halfDay: false, halfDaySession: 'MORNING' });
    } else {
      alert('Failed to submit leave request. Please try again.');
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED': return <span className="leave-status-approved">✅ Approved</span>;
      case 'PENDING': return <span className="leave-status-pending">⏳ Pending</span>;
      case 'REJECTED': return <span className="leave-status-rejected">❌ Rejected</span>;
      default: return <span className="leave-status-default">{status}</span>;
    }
  };

  const getLeaveTypeIcon = (type) => {
    switch(type) {
      case 'CASUAL': return '🏖️';
      case 'SICK': return '🤒';
      case 'ANNUAL': return '✈️';
      case 'EMERGENCY': return '🚨';
      default: return '📋';
    }
  };

  // Calculate counts for each status
  const totalPending = leaveRequests.filter(l => l.status === 'PENDING').length;
  const totalApproved = leaveRequests.filter(l => l.status === 'APPROVED').length;
  const totalRejected = leaveRequests.filter(l => l.status === 'REJECTED').length;
  const totalLeaves = leaveRequests.length;

  const today = new Date().toISOString().split('T')[0];

  const getMinEndDate = () => {
    return leaveForm.startDate || today;
  };

  return (
    <div className="leave-container">
      <div className="leave-header">
        <div>
          <h4>📋 Leave Management</h4>
          <p className="leave-subtitle">Manage your leave requests and track balance</p>
        </div>
        <button className="leave-btn-primary" onClick={() => setShowModal(true)}>
          + New Request
        </button>
      </div>

      <div className="leave-view-toggle">
        <button className={`leave-view-btn ${viewType === 'list' ? 'leave-view-active' : ''}`} onClick={() => setViewType('list')}>
          📋 List View
        </button>
      </div>

      {/* ✅ 5 STATS CARDS - Leave Balance, Used Leaves, Pending, Approved, Rejected */}
      <div className="leave-stats">
        {/* 1. Leave Balance */}
        <div className="leave-stat-card leave-balance-card">
          <div className="leave-stat-icon">📊</div>
          <div className="leave-stat-info">
            <span>Leave Balance</span>
            <div className="leave-balance-details">
              <small>🏖️ Casual: {leaveBalance.casual}</small>
              <small>🤒 Sick: {leaveBalance.sick}</small>
              <small>✈️ Annual: {leaveBalance.annual}</small>
              <small>🚨 Emergency: {leaveBalance.emergency}</small>
            </div>
          </div>
        </div>

        {/* 2. Used Leaves */}
        <div className="leave-stat-card leave-used-card">
          <div className="leave-stat-icon">✅</div>
          <div className="leave-stat-info">
            <span>Used Leaves</span>
            <strong>{leaveBalance.totalUsed} days</strong>
          </div>
        </div>

        {/* 3. Pending Requests */}
        <div className="leave-stat-card leave-pending-card">
          <div className="leave-stat-icon">⏳</div>
          <div className="leave-stat-info">
            <span>Pending Requests</span>
            <strong>{totalPending}</strong>
          </div>
        </div>

        {/* 4. Approved Requests */}
        <div className="leave-stat-card leave-approved-card">
          <div className="leave-stat-icon">✔️</div>
          <div className="leave-stat-info">
            <span>Approved Requests</span>
            <strong>{totalApproved}</strong>
          </div>
        </div>

        {/* 5. Rejected Requests */}
        <div className="leave-stat-card leave-rejected-card">
          <div className="leave-stat-icon">❌</div>
          <div className="leave-stat-info">
            <span>Rejected Requests</span>
            <strong>{totalRejected}</strong>
          </div>
        </div>
      </div>

      {viewType === 'list' && (
        <div className="leave-list-section">
          <div className="leave-section-header">
            <h5>📋 Leave History</h5>
            <div className="leave-filter-buttons">
              <button 
                className={`leave-filter-btn ${filterStatus === 'all' ? 'leave-filter-active' : ''}`} 
                onClick={() => setFilterStatus('all')}
              >
                All ({totalLeaves})
              </button>
              <button 
                className={`leave-filter-btn ${filterStatus === 'pending' ? 'leave-filter-active' : ''}`} 
                onClick={() => setFilterStatus('pending')}
              >
                Pending ({totalPending})
              </button>
              <button 
                className={`leave-filter-btn ${filterStatus === 'approved' ? 'leave-filter-active' : ''}`} 
                onClick={() => setFilterStatus('approved')}
              >
                Approved ({totalApproved})
              </button>
              <button 
                className={`leave-filter-btn ${filterStatus === 'rejected' ? 'leave-filter-active' : ''}`} 
                onClick={() => setFilterStatus('rejected')}
              >
                Rejected ({totalRejected})
              </button>
            </div>
          </div>
          
          <div className="leave-table-wrapper">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Dates</th>
                  <th>Type</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests
                  .filter(leave => {
                    if (filterStatus === 'all') return true;
                    if (filterStatus === 'pending') return leave.status === 'PENDING';
                    if (filterStatus === 'approved') return leave.status === 'APPROVED';
                    if (filterStatus === 'rejected') return leave.status === 'REJECTED';
                    return true;
                  })
                  .map(leave => (
                    <tr key={leave.id} className={`leave-row leave-row-${leave.status.toLowerCase()}`}>
                      <td className="leave-date-cell">
                        <span className="leave-date-range">📅 {leave.startDate} - {leave.endDate}</span>
                        <small>Total: {leave.totalDays || 1} days</small>
                      </td>
                      <td className="leave-type-cell">
                        <span className="leave-type-badge">{getLeaveTypeIcon(leave.leaveType)} {leave.leaveType}</span>
                      </td>
                      <td className="leave-days-cell">{leave.totalDays || 1} days</td>
                      <td className="leave-reason-cell">{leave.reason || '-'}</td>
                      <td className="leave-status-cell">{getStatusBadge(leave.status)}</td>
                      <td className="leave-actions-cell">
                        <button className="leave-action-btn leave-view-action" onClick={() => { setSelectedLeave(leave); setShowDetailsModal(true); }} title="View Details">👁️</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Leave Request Modal */}
      {showModal && (
        <div className="leave-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="leave-modal-content leave-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leave-modal-header">
              <h4>📝 Request Leave</h4>
              <button className="leave-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="leave-form-group">
                <label>📋 Leave Type *</label>
                <select className="leave-form-control" value={leaveForm.type} onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})} required>
                  <option value="CASUAL">🏖️ Casual Leave</option>
                  <option value="SICK">🤒 Sick Leave</option>
                  <option value="ANNUAL">✈️ Annual Leave</option>
                  <option value="EMERGENCY">🚨 Emergency Leave</option>
                   <option value="Others">Others</option>
                </select>
              </div>

              <div className="leave-form-row">
                <div className="leave-form-group">
                  <label>📅 Start Date *</label>
                  <input type="date" className="leave-form-control" min={today} value={leaveForm.startDate} onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})} required />
                </div>
                <div className="leave-form-group">
                  <label>📅 End Date *</label>
                  <input type="date" className="leave-form-control" min={getMinEndDate()} value={leaveForm.endDate} onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})} required />
                </div>
              </div>

              <div className="leave-form-group">
                <label>📝 Reason for Leave *</label>
                <textarea className="leave-form-control" rows="3" value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} placeholder="Please provide reason for leave..." required />
              </div>

              {leaveForm.startDate && leaveForm.endDate && (
                <div className="leave-summary">
                  <span>📊 Summary:</span>
                  <strong>{Math.ceil((new Date(leaveForm.endDate) - new Date(leaveForm.startDate)) / (1000 * 60 * 60 * 24)) + 1} day(s)</strong>
                </div>
              )}

              <div className="leave-modal-buttons">
                <button type="button" className="leave-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="leave-btn-submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showDetailsModal && selectedLeave && (
        <div className="leave-modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="leave-modal-content leave-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leave-modal-header">
              <h4>📋 Leave Details</h4>
              <button className="leave-modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="leave-details-body">
              <div className="leave-detail-item"><label>Leave Type:</label><span>{getLeaveTypeIcon(selectedLeave.leaveType)} {selectedLeave.leaveType}</span></div>
              <div className="leave-detail-item"><label>Duration:</label><span>📅 {selectedLeave.startDate} to {selectedLeave.endDate}</span></div>
              <div className="leave-detail-item"><label>Total Days:</label><span>{selectedLeave.totalDays || 1} days</span></div>
              <div className="leave-detail-item"><label>Reason:</label><span>{selectedLeave.reason || '-'}</span></div>
              <div className="leave-detail-item"><label>Status:</label><span>{getStatusBadge(selectedLeave.status)}</span></div>
              <div className="leave-detail-item"><label>Applied On:</label><span>{new Date(selectedLeave.createdAt).toLocaleDateString()}</span></div>
              {selectedLeave.approvedBy && (<div className="leave-detail-item"><label>Approved By:</label><span>{selectedLeave.approvedBy}</span></div>)}
            </div>
            <div className="leave-modal-buttons">
              <button className="leave-btn-cancel" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;