import React, { useState, useEffect, useCallback } from 'react';
import './employeeInvitations.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const Invitations = ({ user }) => {
  const [invitations, setInvitations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [acceptForm, setAcceptForm] = useState({
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  const getAuthToken = () => localStorage.getItem('accessToken');

  // Load pending invitations
  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/employee/invitations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📧 Pending invitations:', data);
        setInvitations(data);
      } else {
        setInvitations([]);
      }
    } catch (err) {
      console.error('Error loading invitations:', err);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load invitation history (ACCEPTED & REJECTED only)
  const loadHistory = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/employee/invitations/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📜 Invitation history:', data);
        setHistory(data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    }
  }, []);

  // ✅ DELETE SINGLE HISTORY RECORD
  const deleteHistory = async (inviteId) => {
    if (!window.confirm('Are you sure you want to delete this history record?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/employee/invitations/${inviteId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ History record deleted successfully!');
        await loadHistory();
        await loadInvitations();
      } else {
        const error = await response.text();
        alert('❌ Failed to delete history: ' + error);
      }
    } catch (err) {
      console.error('❌ Error deleting history:', err);
      alert('❌ Failed to delete history');
    }
  };

  // ✅ DELETE ALL HISTORY RECORDS
  const deleteAllHistory = async () => {
    if (!window.confirm('Are you sure you want to delete ALL history records?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/employee/invitations/history/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ All history records deleted successfully!');
        await loadHistory();
      } else {
        const error = await response.text();
        alert('❌ Failed to delete history: ' + error);
      }
    } catch (err) {
      console.error('❌ Error deleting history:', err);
      alert('❌ Failed to delete history');
    }
  };

  // Accept invitation
  const handleSubmitAccept = async (e) => {
    e.preventDefault();
    
    if (!selectedInvite) {
      alert('No invitation selected');
      return;
    }
    
    if (acceptForm.password !== acceptForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (acceptForm.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    try {
      const token = getAuthToken();
      console.log('📤 Accepting invitation:', selectedInvite.id);
      
      const response = await fetch(`${API_URL}/employee/invitations/${selectedInvite.id}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: acceptForm.password,
          fullName: acceptForm.fullName
        })
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Invitation accepted:', data);
        
        alert(`🎉 Welcome ${acceptForm.fullName}! You have joined the team.`);
        setShowAcceptModal(false);
        setSelectedInvite(null);
        setAcceptForm({ fullName: '', password: '', confirmPassword: '' });
        
        await loadInvitations();
        await loadHistory();
        window.dispatchEvent(new Event('teamUpdated'));
      } else {
        const error = await response.text();
        alert('❌ Failed to accept invitation: ' + error);
      }
    } catch (err) {
      console.error('❌ Error accepting invitation:', err);
      alert('❌ Failed to accept invitation. Please try again.');
    }
  };

  // Reject invitation
  const handleSubmitReject = async (e) => {
    e.preventDefault();
    
    if (!selectedInvite) {
      alert('No invitation selected');
      return;
    }
    
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejecting this invitation.');
      return;
    }
    
    try {
      const token = getAuthToken();
      console.log('📤 Rejecting invitation:', selectedInvite.id);
      console.log('📤 Reason:', rejectReason);
      
      const response = await fetch(`${API_URL}/employee/invitations/${selectedInvite.id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        alert('📧 Invitation declined. Your reason has been sent to the manager.');
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedInvite(null);
        
        await loadInvitations();
        await loadHistory();
        window.dispatchEvent(new Event('teamUpdated'));
      } else {
        const error = await response.text();
        alert('❌ Failed to decline invitation: ' + error);
      }
    } catch (err) {
      console.error('❌ Error declining invitation:', err);
      alert('❌ Failed to decline invitation');
    }
  };

  // Show reject modal
  const handleDeclineInvite = (invite) => {
    setSelectedInvite(invite);
    setRejectReason('');
    setShowRejectModal(true);
  };

  useEffect(() => {
    loadInvitations();
    loadHistory();
    
    const handleRefresh = () => {
      loadInvitations();
      loadHistory();
    };
    window.addEventListener('teamUpdated', handleRefresh);
    return () => window.removeEventListener('teamUpdated', handleRefresh);
  }, [loadInvitations, loadHistory]);

  const getDaysLeft = (expiresAt) => {
    if (!expiresAt) return 7;
    const today = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'ACCEPTED':
        return <span className="inv-status-accepted">✅ Accepted</span>;
      case 'REJECTED':
        return <span className="inv-status-rejected">❌ Rejected</span>;
      case 'PENDING':
        return <span className="inv-status-pending">⏳ Pending</span>;
      default:
        return <span className="inv-status-default">{status}</span>;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'ACCEPTED': return '🎉';
      case 'REJECTED': return '❌';
      case 'PENDING': return '⏳';
      default: return '📧';
    }
  };

  if (loading) return <div className="inv-loading">Loading invitations...</div>;

  return (
    <div className="inv-container">
      <div className="inv-header">
        <h4>📧 Invitations</h4>
        <p>View and manage your team invitations</p>
      </div>

      {/* Tab Navigation */}
      <div className="inv-tabs">
        <button 
          className={`inv-tab-btn ${activeTab === 'pending' ? 'inv-tab-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          📨 Pending ({invitations.length})
        </button>
        <button 
          className={`inv-tab-btn ${activeTab === 'history' ? 'inv-tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History ({history.length})
        </button>
        <button 
          className="inv-tab-btn inv-delete-all-btn"
          onClick={deleteAllHistory}
          disabled={history.length === 0}
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Pending Invitations */}
      {activeTab === 'pending' && (
        <>
          {invitations.length === 0 ? (
            <div className="inv-no-data">
              <div className="inv-empty-icon">📭</div>
              <h5>No Pending Invitations</h5>
              <p>When a manager invites you, you'll see it here</p>
              <button className="inv-refresh-btn" onClick={() => { loadInvitations(); loadHistory(); }}>
                🔄 Refresh
              </button>
            </div>
          ) : (
            <div className="inv-list">
              {invitations.map(invite => (
                <div key={invite.id} className="inv-card inv-card-pending">
                  <div className="inv-card-header">
                    <div className="inv-manager-info">
                      <span className="inv-manager-icon">👤</span>
                      <div>
                        <h4>{invite.managerName || 'Manager'}</h4>
                        <p>{invite.managerEmail || 'manager@company.com'}</p>
                      </div>
                    </div>
                    <div className="inv-expiry-badge">
                      {getDaysLeft(invite.expiresAt) > 0 ? (
                        <span className="inv-days-left">{getDaysLeft(invite.expiresAt)} days left</span>
                      ) : (
                        <span className="inv-expired">Expired</span>
                      )}
                    </div>
                  </div>

                  <div className="inv-details">
                    <div className="inv-detail-item">
                      <span className="inv-detail-label">📁 Department:</span>
                      <span className="inv-detail-value">{invite.department || 'Not specified'}</span>
                    </div>
                    <div className="inv-detail-item">
                      <span className="inv-detail-label">💼 Position:</span>
                      <span className="inv-detail-value">{invite.position || 'Not specified'}</span>
                    </div>
                    <div className="inv-detail-item">
                      <span className="inv-detail-label">👔 Role:</span>
                      <span className="inv-detail-value">{invite.role || 'EMPLOYEE'}</span>
                    </div>
                    <div className="inv-detail-item">
                      <span className="inv-detail-label">📅 Invited:</span>
                      <span className="inv-detail-value">{new Date(invite.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="inv-actions">
                    <button 
                      className="inv-btn-accept" 
                      onClick={() => {
                        setSelectedInvite(invite);
                        setShowAcceptModal(true);
                      }}
                      disabled={getDaysLeft(invite.expiresAt) <= 0}
                    >
                      ✓ Accept Invitation
                    </button>
                    <button 
                      className="inv-btn-decline" 
                      onClick={() => handleDeclineInvite(invite)}
                    >
                      ✗ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Invitation History */}
      {activeTab === 'history' && (
        <>
          {history.length === 0 ? (
            <div className="inv-no-history">
              <div className="inv-empty-icon">📭</div>
              <h5>No Invitation History</h5>
              <p>Your invitation history will appear here once you accept or reject invitations</p>
            </div>
          ) : (
            <div className="inv-history-list">
              {history.map(invite => (
                <div key={invite.id} className={`inv-history-card inv-history-${invite.status.toLowerCase()}`}>
                  <div className="inv-history-header">
                    <div className="inv-history-status-icon">{getStatusIcon(invite.status)}</div>
                    <div className="inv-history-info">
                      <h4>{invite.managerName || 'Manager'}'s Team</h4>
                      <p>{invite.managerEmail || 'manager@company.com'}</p>
                    </div>
                    <div className="inv-history-status">
                      {getStatusBadge(invite.status)}
                    </div>
                    <button 
                      className="inv-delete-history-btn"
                      onClick={() => deleteHistory(invite.id)}
                      title="Delete this history record"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="inv-history-details">
                    <div className="inv-detail-item">
                      <span className="inv-detail-label">📁 Department:</span>
                      <span className="inv-detail-value">{invite.department || 'Not specified'}</span>
                    </div>
                    <div className="inv-detail-item">
                      <span className="inv-detail-label">💼 Position:</span>
                      <span className="inv-detail-value">{invite.position || 'Not specified'}</span>
                    </div>
                    <div className="inv-detail-item">
                      <span className="inv-detail-label">📅 Invited:</span>
                      <span className="inv-detail-value">{new Date(invite.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="inv-detail-item">
                      <span className="inv-detail-label">📅 Responded:</span>
                      <span className="inv-detail-value">{invite.respondedAt ? new Date(invite.respondedAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {invite.status === 'ACCEPTED' && (
                      <div className="inv-success-message">
                        <span className="inv-detail-label">🎉 Status:</span>
                        <span className="inv-detail-value">You have joined {invite.managerName}'s team!</span>
                      </div>
                    )}
                    {invite.status === 'REJECTED' && (
                      <div className="inv-rejection-message">
                        <span className="inv-detail-label">📝 Reason:</span>
                        <span className="inv-detail-value inv-rejection-reason-text">{invite.rejectionReason || 'No reason provided'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Accept Invitation Modal */}
      {showAcceptModal && selectedInvite && (
        <div className="inv-modal-overlay" onClick={() => setShowAcceptModal(false)}>
          <div className="inv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h4>Accept Invitation</h4>
              <button className="inv-modal-close" onClick={() => setShowAcceptModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitAccept}>
              <div className="inv-form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  className="inv-form-control" 
                  placeholder="Enter your full name"
                  value={acceptForm.fullName}
                  onChange={(e) => setAcceptForm({...acceptForm, fullName: e.target.value})}
                  required
                />
              </div>
              
              <div className="inv-form-group">
                <label>Email (from invitation)</label>
                <input 
                  type="email" 
                  className="inv-form-control" 
                  value={selectedInvite.employeeEmail || selectedInvite.email || ''}
                  disabled
                  style={{ background: '#f1f5f9' }}
                />
              </div>
              
              <div className="inv-form-row">
                <div className="inv-form-group">
                  <label>Department</label>
                  <input 
                    type="text" 
                    className="inv-form-control" 
                    value={selectedInvite.department || 'Not specified'}
                    disabled
                    style={{ background: '#f1f5f9' }}
                  />
                </div>
                <div className="inv-form-group">
                  <label>Position</label>
                  <input 
                    type="text" 
                    className="inv-form-control" 
                    value={selectedInvite.position || 'Not specified'}
                    disabled
                    style={{ background: '#f1f5f9' }}
                  />
                </div>
              </div>
              
              <div className="inv-form-group">
                <label>Password *</label>
                <input 
                  type="password" 
                  className="inv-form-control" 
                  placeholder="Create a password (min 6 characters)"
                  value={acceptForm.password}
                  onChange={(e) => setAcceptForm({...acceptForm, password: e.target.value})}
                  required
                />
              </div>
              
              <div className="inv-form-group">
                <label>Confirm Password *</label>
                <input 
                  type="password" 
                  className="inv-form-control" 
                  placeholder="Confirm your password"
                  value={acceptForm.confirmPassword}
                  onChange={(e) => setAcceptForm({...acceptForm, confirmPassword: e.target.value})}
                  required
                />
              </div>
              
              <div className="inv-modal-buttons">
                <button type="button" className="inv-btn-cancel" onClick={() => setShowAcceptModal(false)}>Cancel</button>
                <button type="submit" className="inv-btn-submit">Complete Registration</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Invitation Modal */}
      {showRejectModal && selectedInvite && (
        <div className="inv-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="inv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h4>Decline Invitation</h4>
              <button className="inv-modal-close" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitReject}>
              <div className="inv-form-group">
                <label>Reason for declining *</label>
                <textarea
                  className="inv-form-control inv-form-textarea"
                  rows="4"
                  placeholder="Please let us know why you are declining this invitation..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
                <small>Your reason will be shared with the manager</small>
              </div>
              
              <div className="inv-modal-buttons">
                <button type="button" className="inv-btn-cancel" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button type="submit" className="inv-btn-submit inv-btn-danger">
                  Decline Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invitations;