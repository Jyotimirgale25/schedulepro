import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import './UserManagement.css';  // ← External CSS import

const UserManagement = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    role: 'EMPLOYEE',
    department: '',
    position: '',
    phone: ''
  });
  const [departments] = useState(['IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'Development']);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAdmins: 0,
    totalManagers: 0,
    totalEmployees: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getAdminStats()
      ]);
      setUsers(usersRes.data || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await adminApi.updateUser(editingUser.id, userForm);
        alert('✅ User updated successfully!');
      } else {
        await adminApi.createUser(userForm);
        alert('✅ User created successfully!');
      }
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Error saving user:', err);
      alert('❌ Failed to save user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await adminApi.deleteUser(selectedUser.id);
      alert(`✅ User "${selectedUser.fullName}" deleted successfully!`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('❌ Failed to delete user: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminApi.toggleUserStatus(userId);
      await loadData();
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('❌ Failed to toggle status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setUserForm({
      fullName: user.fullName || '',
      email: user.email || '',
      username: user.username || '',
      password: '',
      role: user.role || 'EMPLOYEE',
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setUserForm({
      fullName: '',
      email: '',
      username: '',
      password: '',
      role: 'EMPLOYEE',
      department: '',
      position: '',
      phone: ''
    });
    setEditingUser(null);
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'ADMIN': return <span className="admin-user-role-badge admin-user-admin">👑 Admin</span>;
      case 'MANAGER': return <span className="admin-user-role-badge admin-user-manager">📊 Manager</span>;
      default: return <span className="admin-user-role-badge admin-user-employee">👤 Employee</span>;
    }
  };

  if (loading) {
    return <div className="admin-user-wrapper"><div className="admin-user-loading">Loading users...</div></div>;
  }

  return (
    <div className="admin-user-wrapper">
      <div className="admin-user-management-container">
        <div className="admin-user-header">
          <h4>👥 User Management</h4>
          <button className="admin-user-btn-primary" onClick={() => setShowModal(true)}>
            + Add User
          </button>
        </div>

        <div className="admin-user-stats">
          <div className="admin-user-stat">
            <span>Total Users</span>
            <strong>{stats.totalUsers || 0}</strong>
          </div>
          <div className="admin-user-stat">
            <span>Active Users</span>
            <strong>{stats.activeUsers || 0}</strong>
          </div>
          <div className="admin-user-stat">
            <span>Admins</span>
            <strong>{stats.totalAdmins || 0}</strong>
          </div>
          <div className="admin-user-stat">
            <span>Managers</span>
            <strong>{stats.totalManagers || 0}</strong>
          </div>
          <div className="admin-user-stat">
            <span>Employees</span>
            <strong>{stats.totalEmployees || 0}</strong>
          </div>
        </div>

        <div className="admin-user-table-wrapper">
          <table className="admin-user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.fullName}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.department || '-'}</td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td>
                    <span className={`admin-user-status-badge ${u.isActive ? 'admin-user-active' : 'admin-user-inactive'}`}>
                      {u.isActive ? '✅ Active' : '⛔ Inactive'}
                    </span>
                  </td>
                  <td className="admin-user-actions-cell">
                    <button className="admin-user-action-btn admin-user-edit" onClick={() => handleEdit(u)} title="Edit">✏️</button>
                    <button className="admin-user-action-btn admin-user-toggle" onClick={() => handleToggleStatus(u.id)} title="Toggle Status">
                      {u.isActive ? '⛔' : '✅'}
                    </button>
                    {u.role !== 'ADMIN' && (
                      <button className="admin-user-action-btn admin-user-delete" onClick={() => {
                        setSelectedUser(u);
                        setShowDeleteModal(true);
                      }} title="Delete">🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== CREATE/EDIT MODAL ===== */}
        {showModal && (
          <div className="admin-user-modal-overlay" onClick={() => {
            setShowModal(false);
            resetForm();
          }}>
            <div className="admin-user-modal-content" onClick={e => e.stopPropagation()}>
              <div className="admin-user-modal-header">
                <h4>{editingUser ? 'Edit User' : 'Add New User'}</h4>
                <button onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="admin-user-modal-body">
                  <div className="admin-user-form-group">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      className="admin-user-form-control" 
                      value={userForm.fullName} 
                      onChange={e => setUserForm({...userForm, fullName: e.target.value})} 
                      required 
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="admin-user-form-group">
                    <label>Email *</label>
                    <input 
                      type="email" 
                      className="admin-user-form-control" 
                      value={userForm.email} 
                      onChange={e => setUserForm({...userForm, email: e.target.value})} 
                      required 
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="admin-user-form-group">
                    <label>Username *</label>
                    <input 
                      type="text" 
                      className="admin-user-form-control" 
                      value={userForm.username} 
                      onChange={e => setUserForm({...userForm, username: e.target.value})} 
                      required 
                      placeholder="Enter username"
                    />
                  </div>
                  {!editingUser && (
                    <div className="admin-user-form-group">
                      <label>Password *</label>
                      <input 
                        type="password" 
                        className="admin-user-form-control" 
                        value={userForm.password} 
                        onChange={e => setUserForm({...userForm, password: e.target.value})} 
                        required 
                        placeholder="Enter password"
                      />
                    </div>
                  )}
                  <div className="admin-user-form-row">
                    <div className="admin-user-form-group">
                      <label>Role</label>
                      <select 
                        className="admin-user-form-control" 
                        value={userForm.role} 
                        onChange={e => setUserForm({...userForm, role: e.target.value})}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="EMPLOYEE">Employee</option>
                      </select>
                    </div>
                    <div className="admin-user-form-group">
                      <label>Department</label>
                      <select 
                        className="admin-user-form-control" 
                        value={userForm.department} 
                        onChange={e => setUserForm({...userForm, department: e.target.value})}
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="admin-user-form-group">
                    <label>Position</label>
                    <input 
                      type="text" 
                      className="admin-user-form-control" 
                      value={userForm.position} 
                      onChange={e => setUserForm({...userForm, position: e.target.value})} 
                      placeholder="Enter position"
                    />
                  </div>
                  <div className="admin-user-form-group">
                    <label>Phone</label>
                    <input 
                      type="text" 
                      className="admin-user-form-control" 
                      value={userForm.phone} 
                      onChange={e => setUserForm({...userForm, phone: e.target.value})} 
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="admin-user-modal-buttons">
                  <button type="button" className="admin-user-btn-cancel" onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}>Cancel</button>
                  <button type="submit" className="admin-user-btn-submit">
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== DELETE CONFIRMATION MODAL ===== */}
        {showDeleteModal && selectedUser && (
          <div className="admin-user-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="admin-user-modal-content admin-user-delete-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-user-modal-header">
                <h4>Delete User</h4>
                <button onClick={() => setShowDeleteModal(false)}>✕</button>
              </div>
              <div className="admin-user-modal-body">
                <div className="admin-user-delete-warning">
                  <span className="admin-user-warning-icon">⚠️</span>
                  <p>Delete <strong>{selectedUser.fullName}</strong>?</p>
                  <p className="admin-user-warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="admin-user-modal-buttons">
                <button className="admin-user-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="admin-user-btn-delete" onClick={handleDelete}>Delete User</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;