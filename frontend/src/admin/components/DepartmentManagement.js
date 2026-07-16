import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import './DepartmentManagement.css';  // ← External CSS import

const DepartmentManagement = ({ user }) => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ 
    name: '', 
    description: '',
    head: '',
    managerId: ''
  });
  const [stats, setStats] = useState({
    totalDepartments: 0,
    totalEmployees: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptsRes, usersRes] = await Promise.all([
        adminApi.getDepartments(),
        adminApi.getUsers()
      ]);
      
      setDepartments(deptsRes.data || []);
      setUsers(usersRes.data || []);
      
      const totalEmployees = (deptsRes.data || []).reduce((sum, d) => sum + (d.employeeCount || 0), 0);
      setStats({
        totalDepartments: (deptsRes.data || []).length,
        totalEmployees: totalEmployees
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept) => {
    console.log('✏️ Editing department:', dept);
    setEditingDept(dept);
    setDeptForm({
      name: dept.name || '',
      description: dept.description || '',
      head: dept.head || '',
      managerId: dept.managerId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: deptForm.name,
        description: deptForm.description,
        head: deptForm.head,
        managerId: deptForm.managerId
      };

      if (editingDept) {
        await adminApi.updateDepartment(editingDept.id, payload);
        alert('✅ Department updated successfully!');
      } else {
        await adminApi.createDepartment(payload);
        alert('✅ Department created successfully!');
      }
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (err) {
      console.error('Error saving department:', err);
      alert('❌ Failed to save department: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async () => {
    if (!selectedDept) return;
    try {
      await adminApi.deleteDepartment(selectedDept.id);
      alert(`✅ Department "${selectedDept.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setSelectedDept(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('❌ Failed to delete department: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetForm = () => {
    setDeptForm({ name: '', description: '', head: '', managerId: '' });
    setEditingDept(null);
  };

  if (loading) {
    return (
      <div className="admin-dept-wrapper">
        <div className="admin-dept-loading">
          <div className="admin-dept-loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error && departments.length === 0) {
    return (
      <div className="admin-dept-wrapper">
        <div className="admin-dept-error">
          <p>❌ {error}</p>
          <button onClick={loadData} className="admin-dept-retry-btn">🔄 Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dept-wrapper">
      <div className="admin-dept-container">
        <div className="admin-dept-header">
          <h4>🏢 Department Management</h4>
          <button className="admin-dept-btn-primary" onClick={() => {
            resetForm();
            setShowModal(true);
          }}>
            + Add Department
          </button>
        </div>

        <div className="admin-dept-stats">
          <div className="admin-dept-stat">
            <span>Total Departments</span>
            <strong>{stats.totalDepartments}</strong>
          </div>
          <div className="admin-dept-stat">
            <span>Total Employees</span>
            <strong>{stats.totalEmployees}</strong>
          </div>
        </div>

        <div className="admin-dept-table-wrapper">
          <table className="admin-dept-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Description</th>
                <th>Department Head</th>
                <th>Employees</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="admin-dept-no-data">No departments found</td>
                </tr>
              ) : (
                departments.map(d => (
                  <tr key={d.id}>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.description || '-'}</td>
                    <td>{d.head || d.manager?.fullName || '-'}</td>
                    <td>
                      {d.employeeCount || 0} {d.employeeCount === 1 ? 'employee' : 'employees'}
                    </td>
                    <td className="admin-dept-actions-cell">
                      <button 
                        className="admin-dept-action-btn admin-dept-edit" 
                        onClick={() => handleEdit(d)} 
                        title="Edit Department"
                      >
                        ✏️
                      </button>
                      <button 
                        className="admin-dept-action-btn admin-dept-delete" 
                        onClick={() => {
                          setSelectedDept(d);
                          setShowDeleteModal(true);
                        }} 
                        title="Delete Department"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CREATE/EDIT MODAL */}
        {showModal && (
          <div className="admin-dept-modal-overlay" onClick={() => {
            setShowModal(false);
            resetForm();
          }}>
            <div className="admin-dept-modal-content" onClick={e => e.stopPropagation()}>
              <div className="admin-dept-modal-header">
                <h4>{editingDept ? '✏️ Edit Department' : '➕ Add New Department'}</h4>
                <button onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="admin-dept-modal-body">
                  <div className="admin-dept-form-group">
                    <label>Department Name *</label>
                    <input 
                      type="text" 
                      className="admin-dept-form-control" 
                      value={deptForm.name} 
                      onChange={e => setDeptForm({...deptForm, name: e.target.value})} 
                      required 
                      placeholder="e.g., Information Technology"
                    />
                  </div>
                  <div className="admin-dept-form-group">
                    <label>Description</label>
                    <textarea 
                      className="admin-dept-form-control" 
                      value={deptForm.description} 
                      onChange={e => setDeptForm({...deptForm, description: e.target.value})} 
                      rows="2"
                      placeholder="Brief description of the department"
                    />
                  </div>
                  <div className="admin-dept-form-group">
                    <label>Department Head/Manager</label>
                    <input 
                      type="text" 
                      className="admin-dept-form-control" 
                      value={deptForm.head} 
                      onChange={e => setDeptForm({...deptForm, head: e.target.value})} 
                      placeholder="e.g., John Doe"
                    />
                  </div>
                  <div className="admin-dept-form-group">
                    <label>Select Manager (Optional)</label>
                    <select 
                      className="admin-dept-form-control" 
                      value={deptForm.managerId} 
                      onChange={e => setDeptForm({...deptForm, managerId: e.target.value})}
                    >
                      <option value="">Select Manager</option>
                      {users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN').map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="admin-dept-modal-buttons">
                  <button type="button" className="admin-dept-btn-cancel" onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}>Cancel</button>
                  <button type="submit" className="admin-dept-btn-submit">
                    {editingDept ? '💾 Update Department' : '➕ Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteModal && selectedDept && (
          <div className="admin-dept-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="admin-dept-modal-content admin-dept-delete-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-dept-modal-header">
                <h4>Delete Department</h4>
                <button onClick={() => setShowDeleteModal(false)}>✕</button>
              </div>
              <div className="admin-dept-modal-body">
                <div className="admin-dept-delete-warning">
                  <span className="admin-dept-warning-icon">⚠️</span>
                  <p>Delete <strong>{selectedDept.name}</strong>?</p>
                  <p className="admin-dept-warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="admin-dept-modal-buttons">
                <button className="admin-dept-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="admin-dept-btn-delete" onClick={handleDelete}>Delete Department</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;