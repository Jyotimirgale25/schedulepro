import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import './SwapOverview.css';

const SwapApprovals = ({ user }) => {
  const [swapRequests, setSwapRequests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);

  const loadSwaps = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching swaps from backend...');
      const response = await adminApi.getSwaps();
      console.log('📡 Response:', response.data);
      
      if (response.data.success && response.data.data) {
        setSwapRequests(response.data.data);
      } else if (Array.isArray(response.data)) {
        setSwapRequests(response.data);
      } else {
        setSwapRequests([]);
      }
    } catch (err) {
      console.error('❌ Error loading swaps:', err);
      setSwapRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSwapStatus = async (id, status, comments = '') => {
    try {
      console.log(`📡 ${status} swap:`, id);
      
      let response;
      if (status === 'APPROVED') {
        response = await adminApi.approveSwap(id, { 
          status: status,
          managerComments: comments 
        });
      } else {
        response = await adminApi.rejectSwap(id, { 
          status: status,
          managerComments: comments 
        });
      }
      
      console.log('📡 Response:', response.data);
      
      if (response.data.success) {
        window.dispatchEvent(new Event('swapRequestUpdated'));
        await loadSwaps();
        return true;
      } else {
        throw new Error(response.data.message || `Failed to ${status} swap`);
      }
    } catch (err) {
      console.error('❌ Error updating swap:', err);
      alert(`Failed to ${status} swap request: ${err.message}`);
      return false;
    }
  };

  useEffect(() => {
    loadSwaps();
    
    const handleUpdate = () => {
      loadSwaps();
    };
    
    window.addEventListener('swapRequestCreated', handleUpdate);
    window.addEventListener('swapRequestUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('swapRequestCreated', handleUpdate);
      window.removeEventListener('swapRequestUpdated', handleUpdate);
    };
  }, [loadSwaps]);

  const handleApprove = async (swap) => {
    if (window.confirm(`✅ Approve swap request from ${swap.requesterName} to ${swap.targetName}?`)) {
      const success = await updateSwapStatus(swap.id, 'APPROVED');
      if (success) {
        alert('✅ Swap approved successfully!');
      }
    }
  };

  const handleReject = (swap) => {
    setSelectedSwap(swap);
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (selectedSwap) {
      const success = await updateSwapStatus(selectedSwap.id, 'REJECTED', rejectReason);
      if (success) {
        alert('❌ Swap rejected successfully!');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedSwap(null);
      }
    }
  };

  const handleClearAll = () => {
    setShowClearModal(true);
  };

  const confirmClearAll = async () => {
    try {
      console.log('📡 Deleting all swaps...');
      const response = await adminApi.deleteAllSwaps();
      console.log('📡 Response:', response.data);
      
      if (response.data.success) {
        await loadSwaps();
        setShowClearModal(false);
        alert('All swap requests cleared successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to clear swaps');
      }
    } catch (err) {
      console.error('❌ Error clearing swaps:', err);
      alert('Failed to clear swap requests');
    }
  };

  const getStatusBadge = (swap) => {
    const status = swap.overallStatus || swap.managerStatus;
    
    if (status === 'APPROVED' || swap.managerStatus === 'APPROVED') {
      return <span className="admin-swap-status-badge admin-swap-approved">✅ Approved</span>;
    }
    if (status === 'REJECTED' || swap.managerStatus === 'REJECTED') {
      return <span className="admin-swap-status-badge admin-swap-rejected">❌ Rejected</span>;
    }
    if (swap.requesterStatus === 'REJECTED') {
      return <span className="admin-swap-status-badge admin-swap-rejected">❌ Rejected by Requester</span>;
    }
    if (swap.targetStatus === 'REJECTED') {
      return <span className="admin-swap-status-badge admin-swap-rejected">❌ Rejected by Target</span>;
    }
    if (swap.requesterStatus === 'PENDING') {
      return <span className="admin-swap-status-badge admin-swap-pending">⏳ Waiting for Requester</span>;
    }
    if (swap.targetStatus === 'PENDING') {
      return <span className="admin-swap-status-badge admin-swap-pending">⏳ Waiting for Target</span>;
    }
    if (swap.requesterStatus === 'ACCEPTED' && swap.targetStatus === 'ACCEPTED' && swap.managerStatus === 'PENDING') {
      return <span className="admin-swap-status-badge admin-swap-pending-admin">👑 Pending Admin</span>;
    }
    return <span className="admin-swap-status-badge admin-swap-pending">⏳ {status || 'Pending'}</span>;
  };

  const showAdminActions = (swap) => {
    return swap.requesterStatus === 'ACCEPTED' && 
           swap.targetStatus === 'ACCEPTED' && 
           swap.managerStatus === 'PENDING';
  };

  const filteredSwaps = filter === 'all' 
    ? swapRequests 
    : filter === 'pending'
      ? swapRequests.filter(s => s.requesterStatus === 'ACCEPTED' && s.targetStatus === 'ACCEPTED' && s.managerStatus === 'PENDING')
      : swapRequests.filter(s => s.managerStatus === filter.toUpperCase() || s.overallStatus === filter.toUpperCase());

  if (loading) {
    return <div className="admin-swap-loading-container">Loading swap requests...</div>;
  }

  return (
    <div className="admin-swap-overview-container">
      {/* Header */}
      <div className="admin-swap-header">
        <h4>🔄 Swap Approvals</h4>
        <div className="admin-swap-header-actions">
          {swapRequests.length > 0 && (
            <button className="admin-swap-clear-all-btn" onClick={handleClearAll}>
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-swap-stats">
        <div className="admin-swap-stat">
          <span>Total Swaps</span>
          <strong>{swapRequests.length}</strong>
        </div>
       
        <div className="admin-swap-stat admin-swap-approved">
          <span>Approved</span>
          <strong>{swapRequests.filter(s => s.managerStatus === 'APPROVED').length}</strong>
        </div>
        <div className="admin-swap-stat admin-swap-rejected">
          <span>Rejected</span>
          <strong>{swapRequests.filter(s => s.managerStatus === 'REJECTED' || s.requesterStatus === 'REJECTED' || s.targetStatus === 'REJECTED').length}</strong>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="admin-swap-filter-section">
        <div className="admin-swap-filter-buttons">
          <button 
            className={`admin-swap-filter-btn ${filter === 'all' ? 'admin-swap-active' : ''}`} 
            onClick={() => setFilter('all')}
          >
            All ({swapRequests.length})
          </button>
          <button 
            className={`admin-swap-filter-btn ${filter === 'pending' ? 'admin-swap-active' : ''}`} 
            onClick={() => setFilter('pending')}
          >
            Pending Admin ({swapRequests.filter(s => s.requesterStatus === 'ACCEPTED' && s.targetStatus === 'ACCEPTED' && s.managerStatus === 'PENDING').length})
          </button>
          <button 
            className={`admin-swap-filter-btn ${filter === 'approved' ? 'admin-swap-active' : ''}`} 
            onClick={() => setFilter('approved')}
          >
            Approved ({swapRequests.filter(s => s.managerStatus === 'APPROVED').length})
          </button>
          <button 
            className={`admin-swap-filter-btn ${filter === 'rejected' ? 'admin-swap-active' : ''}`} 
            onClick={() => setFilter('rejected')}
          >
            Rejected ({swapRequests.filter(s => s.managerStatus === 'REJECTED' || s.requesterStatus === 'REJECTED' || s.targetStatus === 'REJECTED').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-swap-table-wrapper">
        <table className="admin-swap-table">
          <thead>
            <tr>
              <th>Requester</th>
              <th>Target</th>
              <th>Requester Shift</th>
              <th>Target Shift</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSwaps.map(swap => (
              <tr key={swap.id}>
                <td>
                  <div className="admin-swap-user-info">
                    <strong>{swap.requesterName}</strong>
                    <small>{swap.requesterEmail}</small>
                  </div>
                </td>
                <td>
                  <div className="admin-swap-user-info">
                    <strong>{swap.targetName}</strong>
                    <small>{swap.targetEmail}</small>
                  </div>
                </td>
                <td>
                  {swap.requesterShiftDate} <br />
                  <small>{swap.requesterShiftTime || ''}</small>
                </td>
                <td>
                  {swap.targetShiftDate} <br />
                  <small>{swap.targetShiftTime || ''}</small>
                </td>
                <td className="admin-swap-reason-cell">{swap.reason || '-'}</td>
                <td>{getStatusBadge(swap)}</td>
                <td>
                  {showAdminActions(swap) && (
                    <div className="admin-swap-action-buttons">
                      <button className="admin-swap-approve-btn" onClick={() => handleApprove(swap)}>
                        ✅ Approve
                      </button>
                      <button className="admin-swap-reject-btn" onClick={() => handleReject(swap)}>
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {!showAdminActions(swap) && swap.managerStatus === 'PENDING' && (
                    <span className="admin-swap-waiting-text">
                      Waiting for {swap.requesterStatus === 'PENDING' ? 'Requester' : 'Target'} to accept
                    </span>
                  )}
                  {(swap.managerStatus === 'APPROVED' || swap.managerStatus === 'REJECTED' || 
                    swap.requesterStatus === 'REJECTED' || swap.targetStatus === 'REJECTED') && (
                    <span className="admin-swap-no-action">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSwaps.length === 0 && (
          <div className="admin-swap-empty-state">
            <p>No swap requests found</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="admin-swap-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="admin-swap-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-swap-modal-header">
              <h4>Reject Swap Request</h4>
              <button className="admin-swap-modal-close" onClick={() => setShowRejectModal(false)}>
                ✕
              </button>
            </div>
            <div className="admin-swap-modal-body">
              <p><strong>Requester:</strong> {selectedSwap?.requesterName}</p>
              <p><strong>Target:</strong> {selectedSwap?.targetName}</p>
              <div className="admin-swap-form-group">
                <label>Rejection Reason:</label>
                <textarea 
                  className="admin-swap-form-control" 
                  rows="4" 
                  placeholder="Enter reason for rejection..."
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-swap-modal-footer">
              <button className="admin-swap-btn-cancel" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button className="admin-swap-btn-submit" onClick={submitRejection}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="admin-swap-modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="admin-swap-modal-content" onClick={e => e.stopPropagation()}>
            <div className="admin-swap-modal-header">
              <h4>⚠️ Clear All Swap Requests</h4>
              <button className="admin-swap-modal-close" onClick={() => setShowClearModal(false)}>
                ✕
              </button>
            </div>
            <div className="admin-swap-modal-body">
              <p>Are you sure you want to delete <strong>ALL {swapRequests.length} swap requests</strong>?</p>
              <p className="admin-swap-warning-text">This action cannot be undone!</p>
            </div>
            <div className="admin-swap-modal-footer">
              <button className="admin-swap-btn-cancel" onClick={() => setShowClearModal(false)}>
                Cancel
              </button>
              <button className="admin-swap-btn-danger" onClick={confirmClearAll}>
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapApprovals;