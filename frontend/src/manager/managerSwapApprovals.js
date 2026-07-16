import React, { useState, useEffect } from 'react';
import './managerSwapApprovals.css';
import { managerApi } from '../services/api';

const SwapApprovals = ({ user }) => {
  const [swapRequests, setSwapRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSwapRequests();
    
    const handleSwapUpdate = () => {
      loadSwapRequests();
    };
    
    window.addEventListener('swapRequestCreated', handleSwapUpdate);
    window.addEventListener('swapRequestUpdated', handleSwapUpdate);
    
    return () => {
      window.removeEventListener('swapRequestCreated', handleSwapUpdate);
      window.removeEventListener('swapRequestUpdated', handleSwapUpdate);
    };
  }, []);

  const loadSwapRequests = async () => {
    setLoading(true);
    try {
      const response = await managerApi.getPendingSwaps();
      if (response.data) {
        setSwapRequests(response.data);
        console.log('🔄 Pending swaps:', response.data);
      }
    } catch (err) {
      console.error('Error loading swaps:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSwapStatus = async (requestId, status, rejectReason = '') => {
    try {
      const comments = status === 'APPROVED' ? 'Approved by manager' : rejectReason || 'Rejected by manager';
      
      if (status === 'APPROVED') {
        await managerApi.approveSwap(requestId, { comments });
      } else {
        await managerApi.rejectSwap(requestId, { comments });
      }
      
      await loadSwapRequests();
      window.dispatchEvent(new Event('swapRequestUpdated'));
      return true;
    } catch (err) {
      console.error('Error updating swap:', err);
      alert('Failed to update swap request');
      return false;
    }
  };

  const handleApprove = async (request) => {
    if (window.confirm(`Approve swap request between ${request.requesterName} and ${request.targetName}?`)) {
      const success = await updateSwapStatus(request.id, 'APPROVED');
      if (success) {
        alert('✅ Swap approved! Schedules have been updated.');
      }
    }
  };

  const handleReject = async (request) => {
    const reason = prompt('Enter reason for rejection:');
    if (reason !== null) {
      const success = await updateSwapStatus(request.id, 'REJECTED', reason);
      if (success) {
        alert('❌ Swap rejected.');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED': return <span className="swap-status-approved">✅ Approved</span>;
      case 'REJECTED': return <span className="swap-status-rejected">❌ Rejected</span>;
      default: return <span className="swap-status-pending">⏳ Pending</span>;
    }
  };

  if (loading) return <div className="swap-loading">Loading swap requests...</div>;

  if (swapRequests.length === 0) {
    return (
      <div className="swap-approvals-container">
        <div className="swap-approvals-header">
          <h4>🔄 Pending Swap Approvals</h4>
          <span className="swap-approvals-pending-count">0 pending</span>
        </div>
        <div className="swap-no-pending">
          <p>No pending swap requests</p>
          <small>All swap requests have been processed</small>
        </div>
      </div>
    );
  }

  return (
    <div className="swap-approvals-container">
      <div className="swap-approvals-header">
        <h4>🔄 Pending Swap Approvals</h4>
        <span className="swap-approvals-pending-count">{swapRequests.length} pending</span>
      </div>

      <div className="swap-approvals-list">
        {swapRequests.map(request => (
          <div key={request.id} className="swap-approval-card">
            <div className="swap-approval-header">
              <div className="swap-info">
                <div className="swap-requester-info">
                  <span className="swap-icon">🔄</span>
                  <div>
                    <h4>{request.requesterName} ↔ {request.targetName}</h4>
                    <p>{request.requesterEmail} ↔ {request.targetEmail}</p>
                  </div>
                </div>
                {getStatusBadge(request.managerStatus)}
              </div>
            </div>

            <div className="swap-details">
              <div className="swap-shift-detail swap-from">
                <span className="swap-label">📤 {request.requesterName}'s Shift:</span>
                <strong>{request.requesterShiftDate} - {request.requesterShiftTime}</strong>
              </div>
              <div className="swap-arrow">↓ SWAP WITH ↓</div>
              <div className="swap-shift-detail swap-to">
                <span className="swap-label">📥 {request.targetName}'s Shift:</span>
                <strong>{request.targetShiftDate} - {request.targetShiftTime}</strong>
              </div>
              <div className="swap-reason-detail">
                <span>📝 Reason:</span>
                <p>{request.reason}</p>
              </div>
              <div className="swap-agreement-status">
                <span>Both employees have agreed to this swap</span>
              </div>
            </div>

            {request.managerStatus === 'PENDING' && (
              <div className="swap-approval-actions">
                <button className="swap-btn-approve" onClick={() => handleApprove(request)}>
                  ✓ Approve Swap
                </button>
                <button className="swap-btn-reject" onClick={() => handleReject(request)}>
                  ✗ Reject Swap
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SwapApprovals;