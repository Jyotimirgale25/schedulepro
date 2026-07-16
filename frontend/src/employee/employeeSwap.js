import React, { useState, useEffect, useCallback } from 'react';
import './employeeSwap.css';

const Swap = ({ user }) => {
  const [swapRequests, setSwapRequests] = useState([]);
  const [incomingSwapRequests, setIncomingSwapRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swapForm, setSwapForm] = useState({
    targetEmployeeId: '',
    requesterScheduleId: '',
    targetScheduleId: '',
    requesterShiftDate: '',
    targetShiftDate: '',
    requesterShiftTime: '',
    targetShiftTime: '',
    reason: ''
  });
  const [activeTab, setActiveTab] = useState('myRequests');
  const [employees, setEmployees] = useState([]);

  const getAuthToken = () => localStorage.getItem('accessToken');

  // ===== LOAD EMPLOYEES FROM BACKEND =====
  const loadEmployees = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:8080/api/employee/team-members', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        console.log('✅ Team members loaded:', data);
      }
    } catch (err) {
      console.error('Error loading team members:', err);
    }
  }, []);

  // ===== LOAD SWAP REQUESTS FROM BACKEND =====
  const loadSwapRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      
      const outgoingResponse = await fetch('http://localhost:8080/api/employee/swaps', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (outgoingResponse.ok) {
        const data = await outgoingResponse.json();
        setSwapRequests(data);
        console.log('📤 Outgoing swaps:', data);
      }

      const incomingResponse = await fetch('http://localhost:8080/api/employee/swaps/incoming', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (incomingResponse.ok) {
        const data = await incomingResponse.json();
        setIncomingSwapRequests(data);
        console.log('📥 Incoming swaps:', data);
      }
    } catch (err) {
      console.error('Error loading swap requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== CREATE SWAP REQUEST =====
  const handleSwapRequest = async (e) => {
    e.preventDefault();
    setLoading(true);

    const selectedEmployee = employees.find(emp => String(emp.id) === String(swapForm.targetEmployeeId));

    if (!selectedEmployee) {
      alert('Please select a valid employee');
      setLoading(false);
      return;
    }

    const newRequest = {
      targetEmployeeId: String(selectedEmployee.id),
      requesterScheduleId: swapForm.requesterScheduleId || null,
      targetScheduleId: swapForm.targetScheduleId || null,
      requesterShiftDate: swapForm.requesterShiftDate,
      targetShiftDate: swapForm.targetShiftDate,
      requesterShiftTime: swapForm.requesterShiftTime,
      targetShiftTime: swapForm.targetShiftTime,
      reason: swapForm.reason
    };

    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:8080/api/employee/swaps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRequest)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Swap request created:', data);
        alert('✅ Swap request sent to employee! Waiting for their response.');
        setShowRequestModal(false);
        setSwapForm({
          targetEmployeeId: '',
          requesterScheduleId: '',
          targetScheduleId: '',
          requesterShiftDate: '',
          targetShiftDate: '',
          requesterShiftTime: '',
          targetShiftTime: '',
          reason: ''
        });
        await loadSwapRequests();
        window.dispatchEvent(new Event('swapRequestCreated'));
      } else {
        const error = await response.text();
        alert('❌ Failed to create swap request: ' + error);
      }
    } catch (err) {
      console.error('Error creating swap:', err);
      alert('❌ Failed to create swap request');
    } finally {
      setLoading(false);
    }
  };

  // ===== ACCEPT INCOMING SWAP =====
  const handleAcceptIncoming = async (request) => {
    if (!window.confirm(`Accept swap request from ${request.requesterName}?`)) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8080/api/employee/swaps/${request.id}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Swap accepted:', data);
        alert('✅ Request accepted! Forwarded to manager for final approval.');
        await loadSwapRequests();
        window.dispatchEvent(new Event('swapRequestUpdated'));
      } else {
        const error = await response.text();
        alert('❌ Failed to accept swap: ' + error);
      }
    } catch (err) {
      console.error('Error accepting swap:', err);
      alert('❌ Failed to accept swap');
    }
  };

  // ===== REJECT INCOMING SWAP =====
  const handleDeclineIncoming = async (request) => {
    if (!window.confirm('Decline this swap request?')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:8080/api/employee/swaps/${request.id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Swap rejected:', data);
        alert('✅ Swap request declined.');
        await loadSwapRequests();
        window.dispatchEvent(new Event('swapRequestUpdated'));
      } else {
        const error = await response.text();
        alert('❌ Failed to decline swap: ' + error);
      }
    } catch (err) {
      console.error('Error declining swap:', err);
      alert('❌ Failed to decline swap');
    }
  };

  // ===== CANCEL MY SWAP REQUEST =====
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Cancel this swap request?')) return;
    alert('⏳ Cancel functionality coming soon!');
  };

  // ===== USE EFFECT =====
  useEffect(() => {
    loadEmployees();
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
  }, [loadEmployees, loadSwapRequests]);

  // ===== STATUS BADGE =====
  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { label: '⏳ Pending', class: 'swap-status-pending' },
      'ACCEPTED': { label: '✅ Accepted', class: 'swap-status-approved' },
      'REJECTED': { label: '❌ Rejected', class: 'swap-status-rejected' },
      'APPROVED': { label: '✅ Approved', class: 'swap-status-approved' }
    };
    const s = statusMap[status] || { label: status, class: 'swap-status-pending' };
    return <span className={`swap-status ${s.class}`}>{s.label}</span>;
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="swap-loading">Loading swap requests...</div>;

  return (
    <div className="swap-container">
      <div className="swap-header">
        <h4>🔄 Shift Swap Requests</h4>
        <button className="swap-btn-primary" onClick={() => setShowRequestModal(true)}>
          + Request Swap
        </button>
      </div>

      {/* Stats */}
      <div className="swap-stats">
        <div className="swap-stat swap-stat-pending">
          <div className="swap-stat-icon">📤</div>
          <div className="swap-stat-info">
            <span>My Requests</span>
            <strong>{swapRequests.length}</strong>
          </div>
        </div>
        <div className="swap-stat swap-stat-incoming">
          <div className="swap-stat-icon">📥</div>
          <div className="swap-stat-info">
            <span>Incoming</span>
            <strong>{incomingSwapRequests.length}</strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="swap-tabs">
        <button 
          className={`swap-tab ${activeTab === 'myRequests' ? 'swap-tab-active' : ''}`}
          onClick={() => setActiveTab('myRequests')}
        >
          📤 My Requests ({swapRequests.length})
        </button>
        <button 
          className={`swap-tab ${activeTab === 'incoming' ? 'swap-tab-active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          📥 Incoming ({incomingSwapRequests.length})
        </button>
      </div>

      {/* Outgoing Requests */}
      {activeTab === 'myRequests' && (
        <div className="swap-requests">
          <h5>📤 My Swap Requests</h5>
          {swapRequests.length === 0 ? (
            <div className="swap-no-data">No swap requests found</div>
          ) : (
            swapRequests.map(request => (
              <div key={request.id} className="swap-card">
                <div className="swap-card-header">
                  <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                  {getStatusBadge(request.managerStatus || request.requesterStatus)}
                </div>
                <div className="swap-card-body">
                  <div className="swap-from">
                    <strong>My Shift:</strong>
                    <p>{request.requesterShiftDate} - {request.requesterShiftTime}</p>
                  </div>
                  <div className="swap-arrow">→</div>
                  <div className="swap-to">
                    <strong>With: {request.targetName}</strong>
                    <p>{request.targetShiftDate} - {request.targetShiftTime}</p>
                  </div>
                </div>
                <div className="swap-reason">
                  <strong>Reason:</strong> {request.reason}
                </div>
                {(request.requesterStatus === 'PENDING' || request.managerStatus === 'PENDING') && (
                  <div className="swap-card-footer">
                    <button className="swap-btn-cancel" onClick={() => handleCancelRequest(request.id)}>
                      Cancel Request
                    </button>
                  </div>
                )}
                {request.managerStatus === 'APPROVED' && (
                  <div className="swap-approved-message">✅ Swap Approved!</div>
                )}
                {request.managerStatus === 'REJECTED' && (
                  <div className="swap-rejected-message">
                    <span>❌ Swap Rejected</span>
                    {request.managerComments && (
                      <div className="swap-rejection-reason">
                        <strong>Reason:</strong> {request.managerComments}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Incoming Requests - APPROVE & REJECT BUTTONS HERE */}
      {activeTab === 'incoming' && (
        <div className="swap-requests">
          <h5>📥 Incoming Swap Requests</h5>
          {incomingSwapRequests.length === 0 ? (
            <div className="swap-no-data">No incoming swap requests</div>
          ) : (
            incomingSwapRequests.map(request => (
              <div key={request.id} className="swap-card">
                <div className="swap-card-header">
                  <span>From: {request.requesterName}</span>
                  {getStatusBadge(request.managerStatus || request.targetStatus)}
                </div>
                <div className="swap-card-body">
                  <div className="swap-from">
                    <strong>Their Shift:</strong>
                    <p>{request.requesterShiftDate} - {request.requesterShiftTime}</p>
                  </div>
                  <div className="swap-arrow">→</div>
                  <div className="swap-to">
                    <strong>Your Shift:</strong>
                    <p>{request.targetShiftDate} - {request.targetShiftTime}</p>
                  </div>
                </div>
                <div className="swap-reason">
                  <strong>Reason:</strong> {request.reason}
                </div>
                
                {/* ✅ APPROVE & REJECT BUTTONS - VISIBLE WHEN PENDING */}
                {request.targetStatus === 'PENDING' && (
                  <div className="swap-card-footer">
                    <button 
                      className="swap-btn-accept" 
                      onClick={() => handleAcceptIncoming(request)}
                    >
                      ✅ Accept
                    </button>
                    <button 
                      className="swap-btn-reject" 
                      onClick={() => handleDeclineIncoming(request)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
                
                {request.targetStatus === 'ACCEPTED' && (
                  <div className="swap-pending-manager">⏳ Waiting for manager approval...</div>
                )}
                {request.managerStatus === 'APPROVED' && (
                  <div className="swap-approved-message">✅ Swap Approved!</div>
                )}
                {request.managerStatus === 'REJECTED' && (
                  <div className="swap-rejected-message">
                    <span>❌ Swap Rejected</span>
                    {request.managerComments && (
                      <div className="swap-rejection-reason">
                        <strong>Reason:</strong> {request.managerComments}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="swap-modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="swap-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="swap-modal-header">
              <h4>📅 Request Shift Swap</h4>
              <button className="swap-modal-close" onClick={() => setShowRequestModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSwapRequest}>
              <div className="swap-form-group">
                <label>👥 Select Employee to swap with</label>
                <select 
                  className="swap-form-control"
                  value={swapForm.targetEmployeeId}
                  onChange={(e) => setSwapForm({...swapForm, targetEmployeeId: e.target.value})}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="swap-form-row">
                <div className="swap-form-group">
                  <label>📅 My Shift Date</label>
                  <input 
                    type="date" 
                    className="swap-form-control"
                    min={today}
                    value={swapForm.requesterShiftDate}
                    onChange={(e) => setSwapForm({...swapForm, requesterShiftDate: e.target.value})}
                    required
                  />
                </div>
                <div className="swap-form-group">
                  <label>⏰ My Shift Time</label>
                  <select 
                    className="swap-form-control"
                    value={swapForm.requesterShiftTime}
                    onChange={(e) => setSwapForm({...swapForm, requesterShiftTime: e.target.value})}
                    required
                  >
                    <option value="">Select shift time</option>
                    <option value="Morning (9:00 AM - 5:00 PM)">🌅 Morning (9-5)</option>
                    <option value="Evening (2:00 PM - 10:00 PM)">🌙 Evening (2-10)</option>
                    <option value="Night (10:00 PM - 6:00 AM)">⭐ Night (10-6)</option>
                  </select>
                </div>
              </div>

              <div className="swap-form-row">
                <div className="swap-form-group">
                  <label>📅 Target Shift Date</label>
                  <input 
                    type="date" 
                    className="swap-form-control"
                    min={today}
                    value={swapForm.targetShiftDate}
                    onChange={(e) => setSwapForm({...swapForm, targetShiftDate: e.target.value})}
                    required
                  />
                </div>
                <div className="swap-form-group">
                  <label>⏰ Target Shift Time</label>
                  <select 
                    className="swap-form-control"
                    value={swapForm.targetShiftTime}
                    onChange={(e) => setSwapForm({...swapForm, targetShiftTime: e.target.value})}
                    required
                  >
                    <option value="">Select shift time</option>
                    <option value="Morning (9:00 AM - 5:00 PM)">🌅 Morning (9-5)</option>
                    <option value="Evening (2:00 PM - 10:00 PM)">🌙 Evening (2-10)</option>
                    <option value="Night (10:00 PM - 6:00 AM)">⭐ Night (10-6)</option>
                  </select>
                </div>
              </div>

              <div className="swap-form-group">
                <label>📝 Reason for Swap</label>
                <textarea 
                  className="swap-form-control" 
                  rows="3" 
                  value={swapForm.reason} 
                  onChange={(e) => setSwapForm({...swapForm, reason: e.target.value})} 
                  placeholder="Please provide reason for swap..."
                  required
                />
              </div>

              <div className="swap-modal-buttons">
                <button type="button" className="swap-btn-cancel-modal" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="swap-btn-submit-modal" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Swap;