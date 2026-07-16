import React, { useState, useEffect } from 'react';
import './managerTeam.css';
import { managerApi } from '../services/api';

const Team = ({ user }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [rejectedInvites, setRejectedInvites] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRejection, setSelectedRejection] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'EMPLOYEE',
    department: 'IT',
    position: 'Software Developer'
  });

  // Load all team data
  const loadTeamData = async () => {
    setLoading(true);
    try {
      // 1. Active team members
      const teamResponse = await managerApi.getTeam();
      if (teamResponse.data) {
        setTeamMembers(teamResponse.data);
      }

      // 2. PENDING invitations
      const inviteResponse = await managerApi.getPendingInvitations();
      if (inviteResponse.data) {
        setPendingInvites(inviteResponse.data);
      }

      // 3. REJECTED invitations
      const rejectedResponse = await managerApi.getRejectedInvitations();
      if (rejectedResponse.data) {
        setRejectedInvites(rejectedResponse.data);
        console.log('📋 Rejected invitations:', rejectedResponse.data);
      }
    } catch (err) {
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();

    const handleTeamUpdate = () => loadTeamData();
    window.addEventListener('teamUpdated', handleTeamUpdate);
    return () => window.removeEventListener('teamUpdated', handleTeamUpdate);
  }, []);

  // Send invitation
  const handleInvite = async (e) => {
    e.preventDefault();

    try {
      const response = await managerApi.sendInvitation({
        email: inviteData.email,
        department: inviteData.department,
        position: inviteData.position,
        role: inviteData.role,
        message: `You have been invited to join ${user?.fullName}'s team as ${inviteData.position}`
      });

      if (response.data) {
        alert(`✅ Invitation sent to ${inviteData.email}!`);
        setShowInviteModal(false);
        setInviteData({ email: '', role: 'EMPLOYEE', department: 'IT', position: 'Software Developer' });
        await loadTeamData();
      }
    } catch (err) {
      console.error('Error sending invitation:', err);
      alert('❌ Failed to send invitation: ' + (err.response?.data?.message || err.message));
    }
  };

  // Remove team member
  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from team?`)) return;

    try {
      await managerApi.removeTeamMember(id);
      alert(`${name} removed from team`);
      await loadTeamData();
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member');
    }
  };

  // Cancel pending invitation
  const handleCancelInvite = async (inviteId, email) => {
    if (!window.confirm(`Cancel invitation sent to ${email}?`)) return;

    try {
      await managerApi.cancelInvitation(inviteId);
      alert(`Invitation to ${email} cancelled`);
      await loadTeamData();
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      alert('Failed to cancel invitation');
    }
  };

  // Show rejection reason
  const handleViewRejection = (invite) => {
    setSelectedRejection(invite);
    setShowRejectionModal(true);
  };

  if (loading) return <div className="team-loading">Loading team...</div>;

  // Combine all members for display
  const activeEmails = new Set(teamMembers.map(m => m.email));

  // Filter pending invites - exclude already active
  const filteredPending = pendingInvites.filter(inv =>
    !activeEmails.has(inv.employeeEmail)
  );

  // ✅ REMOVE DUPLICATES FROM REJECTED INVITES (by ID)
  const uniqueRejected = rejectedInvites.filter((inv, index, self) =>
    index === self.findIndex((i) => i.id === inv.id)
  );

  // ALL members = Active + Pending + Rejected (unique)
  const allMembers = [
    ...teamMembers.map(m => ({ ...m, type: 'ACTIVE' })),
    ...filteredPending.map(inv => ({
      id: inv.id,
      name: inv.employeeName || inv.employeeEmail.split('@')[0],
      email: inv.employeeEmail,
      department: inv.department || 'Pending',
      position: inv.position || 'Pending',
      joinDate: new Date(inv.createdAt).toLocaleDateString(),
      status: 'PENDING',
      type: 'INVITATION'
    })),
    ...uniqueRejected.map(inv => ({
      id: inv.id,
      name: inv.employeeName || inv.employeeEmail.split('@')[0],
      email: inv.employeeEmail,
      department: inv.department || 'Rejected',
      position: inv.position || 'Rejected',
      joinDate: new Date(inv.createdAt).toLocaleDateString(),
      status: 'REJECTED',
      rejectionReason: inv.rejectionReason || 'No reason provided',
      type: 'REJECTED'
    }))
  ];

  // Stats
  const activeCount = teamMembers.filter(m => m.status === 'ACTIVE').length;
  const pendingCount = pendingInvites.filter(inv => inv.status === 'PENDING').length;
  const rejectedCount = uniqueRejected.length;

  return (
    <div className="team-container">
      <div className="team-header">
        <h4>👥 My Team</h4>
        <button className="team-btn-invite" onClick={() => setShowInviteModal(true)}>+ Invite Member</button>
      </div>

      <div className="team-manager-profile-card">
        <div className="team-manager-avatar">
          <div className="team-manager-avatar-default">👤</div>
        </div>
        <div className="team-manager-details">
          <h4>{user?.fullName || 'Manager'}</h4>
          <p>{user?.email || 'manager@company.com'}</p>
          <span className="team-manager-role">Team Manager</span>
        </div>
      </div>

      {/* Team Stats */}
      <div className="team-stats">
        <div className="team-stat">
          <span>Total Members</span>
          <strong>{teamMembers.length + pendingInvites.length + uniqueRejected.length}</strong>
        </div>
        <div className="team-stat">
          <span>Active</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="team-stat">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="team-stat">
          <span>Rejected</span>
          <strong>{rejectedCount}</strong>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="team-table-wrapper">
        <table className="team-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Position</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allMembers.length === 0 ? (
              <tr>
                <td colSpan="7" className="team-no-data">No team members yet</td>
              </tr>
            ) : (
              allMembers.map(member => (
                <tr key={member.id}>
                  <td><strong>{member.name}</strong></td>
                  <td>{member.email}</td>
                  <td>{member.department || 'Not specified'}</td>
                  <td>{member.position || 'Not specified'}</td>
                  <td>{member.joinDate || 'N/A'}</td>
                  <td>
                    {member.status === 'ACTIVE' ? (
                      <span className="team-status-active">● Active</span>
                    ) : member.status === 'REJECTED' ? (
                      <span className="team-status-rejected" title={member.rejectionReason}>❌ Rejected</span>
                    ) : member.status === 'PENDING' ? (
                      <span className="team-status-pending">⏳ Pending</span>
                    ) : (
                      <span className="team-status-default">{member.status}</span>
                    )}
                  </td>
                  <td>
                    {member.type === 'ACTIVE' ? (
                      <>
                        <button className="team-action-btn team-view" onClick={() => alert(`View ${member.name}'s profile`)}>👁️</button>
                        <button className="team-action-btn team-remove" onClick={() => handleRemove(member.id, member.name)}>🗑️</button>
                      </>
                    ) : member.type === 'REJECTED' ? (
                      <>
                        <button
                          className="team-action-btn team-view"
                          onClick={() => handleViewRejection(member)}
                          title="View Rejection Reason"
                        >
                          📋
                        </button>
                        <button
                          className="team-action-btn team-remove"
                          onClick={() => handleCancelInvite(member.id, member.email)}
                          title="Remove"
                        >
                          🗑️
                        </button>
                      </>
                    ) : (
                      <button
                        className="team-action-btn team-cancel"
                        onClick={() => handleCancelInvite(member.id, member.email)}
                        title="Cancel Invitation"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="team-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="team-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="team-modal-header">
              <h4>📧 Invite Team Member</h4>
              <button onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="team-form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  className="team-form-control"
                  placeholder="employee@company.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  required
                />
                <small>They will receive an invitation email</small>
              </div>

              <div className="team-form-row">
                <div className="team-form-group">
                  <label>Department</label>
                  <select
                    className="team-form-control"
                    value={inviteData.department}
                    onChange={(e) => setInviteData({...inviteData, department: e.target.value})}
                  >
                    <option>IT</option>
                    <option>HR</option>
                    <option>Sales</option>
                    <option>Marketing</option>
                  </select>
                </div>
                <div className="team-form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    className="team-form-control"
                    placeholder="Software Developer"
                    value={inviteData.position}
                    onChange={(e) => setInviteData({...inviteData, position: e.target.value})}
                  />
                </div>
              </div>

              <div className="team-form-group">
                <label>Role</label>
                <select
                  className="team-form-control"
                  value={inviteData.role}
                  onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                >
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

              <div className="team-modal-buttons">
                <button type="button" className="team-btn-cancel" onClick={() => setShowInviteModal(false)}>Cancel</button>
                <button type="submit" className="team-btn-submit">Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && selectedRejection && (
        <div className="team-modal-overlay" onClick={() => setShowRejectionModal(false)}>
          <div className="team-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="team-modal-header">
              <h4>📋 Rejection Reason</h4>
              <button onClick={() => setShowRejectionModal(false)}>✕</button>
            </div>
            <div className="team-modal-body">
              <div className="team-detail-item">
                <label>Employee:</label>
                <span>{selectedRejection.name}</span>
              </div>
              <div className="team-detail-item">
                <label>Email:</label>
                <span>{selectedRejection.email}</span>
              </div>
              <div className="team-detail-item">
                <label>Position:</label>
                <span>{selectedRejection.position}</span>
              </div>
              <div className="team-detail-item">
                <label>Reason for declining:</label>
                <div className="team-rejection-reason-box">
                  {selectedRejection.rejectionReason || 'No reason provided'}
                </div>
              </div>
            </div>
            <div className="team-modal-buttons">
              <button className="team-btn-cancel" onClick={() => setShowRejectionModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;