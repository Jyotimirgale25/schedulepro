import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import './TaskOverview.css';

const TaskOverview = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    taskName: '',
    description: '',
    projectId: '',
    assignedTo: '',
    dueDate: '',
    priority: 'MEDIUM'
  });
  const [loading, setLoading] = useState(true);

  // Load all data from backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching tasks from backend...');
      
      const [tasksRes, usersRes, projectsRes] = await Promise.all([
        adminApi.getTasks(),
        adminApi.getUsers(),
        adminApi.getProjects()
      ]);

      console.log('📡 Tasks Response:', tasksRes.data);
      console.log('📡 Users Response:', usersRes.data);
      console.log('📡 Projects Response:', projectsRes.data);

      if (tasksRes.data.success && tasksRes.data.data) {
        setTasks(tasksRes.data.data);
      } else if (Array.isArray(tasksRes.data)) {
        setTasks(tasksRes.data);
      } else {
        setTasks([]);
      }

      if (usersRes.data.success && usersRes.data.data) {
        setUsers(usersRes.data.data);
      } else if (Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      } else {
        setUsers([]);
      }

      if (projectsRes.data.success && projectsRes.data.data) {
        setProjects(projectsRes.data.data);
      } else if (Array.isArray(projectsRes.data)) {
        setProjects(projectsRes.data);
      } else {
        setProjects([]);
      }

    } catch (err) {
      console.error('❌ Error loading data:', err);
      setTasks([]);
      setUsers([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    const handleUpdate = () => {
      loadData();
    };
    
    window.addEventListener('taskCreated', handleUpdate);
    window.addEventListener('taskUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('taskCreated', handleUpdate);
      window.removeEventListener('taskUpdated', handleUpdate);
    };
  }, [loadData]);

  // Create task via API
  const createTask = async (taskData) => {
    try {
      console.log('📡 Creating task...', taskData);
      const response = await adminApi.createTask(taskData);
      console.log('📡 Response:', response.data);
      
      if (response.data.success) {
        window.dispatchEvent(new Event('taskCreated'));
        await loadData();
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to create task');
      }
    } catch (err) {
      console.error('❌ Error creating task:', err);
      alert(`Failed to create task: ${err.message}`);
      return false;
    }
  };

  // Delete task via API
  const deleteTask = async (taskId) => {
    try {
      console.log('📡 Deleting task:', taskId);
      const response = await adminApi.deleteTask(taskId);
      console.log('📡 Response:', response.data);
      
      if (response.data.success) {
        window.dispatchEvent(new Event('taskUpdated'));
        await loadData();
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('❌ Error deleting task:', err);
      alert(`Failed to delete task: ${err.message}`);
      return false;
    }
  };

  // Update task via API
  const updateTask = async (taskId, taskData) => {
    try {
      console.log('📡 Updating task:', taskId, taskData);
      const response = await adminApi.updateTask(taskId, taskData);
      console.log('📡 Response:', response.data);
      
      if (response.data.success) {
        window.dispatchEvent(new Event('taskUpdated'));
        await loadData();
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to update task');
      }
    } catch (err) {
      console.error('❌ Error updating task:', err);
      alert(`Failed to update task: ${err.message}`);
      return false;
    }
  };

  // ✅ NEW: Approve Task
  const handleApprove = async (taskId) => {
    try {
      const response = await adminApi.approveTask(taskId, { feedback: 'Approved' });
      if (response.data.success) {
        alert('✅ Task approved successfully!');
        await loadData();
      } else {
        alert('❌ Failed to approve task: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error approving task:', err);
      alert('Failed to approve task: ' + (err.response?.data?.message || err.message));
    }
  };

  // ✅ NEW: Reject Task
  const handleReject = async (taskId) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason === null) return; // User cancelled
    
    try {
      const response = await adminApi.rejectTask(taskId, { reason });
      if (response.data.success) {
        alert('❌ Task rejected successfully!');
        await loadData();
      } else {
        alert('❌ Failed to reject task: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error rejecting task:', err);
      alert('Failed to reject task: ' + (err.response?.data?.message || err.message));
    }
  };

  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    const userFound = users.find(u => u.id === userId);
    return userFound ? userFound.fullName : userId;
  };

  const getProjectName = (projectId) => {
    if (!projectId) return 'No Project';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown';
  };

  const handleDelete = (task) => {
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedTask) {
      const success = await deleteTask(selectedTask.id);
      if (success) {
        alert('✅ Task deleted successfully!');
        setShowDeleteModal(false);
        setSelectedTask(null);
      }
    }
  };

  const handleEdit = (task) => {
    setEditForm({
      ...task,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    const taskData = {
      taskName: editForm.taskName,
      description: editForm.description,
      dueDate: editForm.dueDate ? `${editForm.dueDate}T00:00:00` : null,
      priority: editForm.priority,
      status: editForm.status,
      progress: editForm.progress || 0
    };
    
    const success = await updateTask(editForm.id, taskData);
    if (success) {
      alert('✅ Task updated successfully!');
      setShowEditModal(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    const taskData = {
      title: createForm.taskName,
      description: createForm.description,
      projectId: createForm.projectId,
      assignedTo: createForm.assignedTo,
      dueDate: createForm.dueDate ? `${createForm.dueDate}T00:00:00` : null,
      priority: createForm.priority
    };
    
    console.log('📤 Creating task with data:', taskData);
    
    const success = await createTask(taskData);
    if (success) {
      alert('✅ Task created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        taskName: '',
        description: '',
        projectId: '',
        assignedTo: '',
        dueDate: '',
        priority: 'MEDIUM'
      });
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED': return <span className="admin-task-status-badge admin-task-approved">✅ Approved</span>;
      case 'SUBMITTED': return <span className="admin-task-status-badge admin-task-submitted">📤 Submitted</span>;
      case 'IN_PROGRESS': return <span className="admin-task-status-badge admin-task-progress">🔄 In Progress</span>;
      case 'REJECTED': return <span className="admin-task-status-badge admin-task-rejected">❌ Rejected</span>;
      default: return <span className="admin-task-status-badge admin-task-pending">⏳ Pending</span>;
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'HIGH': return 'admin-task-priority-high';
      case 'MEDIUM': return 'admin-task-priority-medium';
      case 'LOW': return 'admin-task-priority-low';
      default: return '';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter !== 'all' && task.status !== filter.toUpperCase()) return false;
    if (searchTerm && !task.title?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !task.assignedToName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="admin-task-wrapper"><div className="admin-task-loading-container">Loading tasks...</div></div>;
  }

  return (
    <div className="admin-task-wrapper">
      <div className="admin-task-overview-container">
        <div className="admin-task-header">
          <h4>✅ Task Overview</h4>
          <button className="admin-task-btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Task
          </button>
        </div>

        <div className="admin-task-stats-small">
          <div className="admin-task-stat-small">
            <span>Total Users:</span>
            <strong>{users.length}</strong>
          </div>
          <div className="admin-task-stat-small">
            <span>Total Projects:</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="admin-task-stat-small">
            <span>Total Tasks:</span>
            <strong>{tasks.length}</strong>
          </div>
        </div>

        <div className="admin-task-filters">
          <div className="admin-task-filter-buttons">
            <button className={`admin-task-filter-btn ${filter === 'all' ? 'admin-task-active' : ''}`} onClick={() => setFilter('all')}>
              All ({tasks.length})
            </button>
            <button className={`admin-task-filter-btn ${filter === 'pending' ? 'admin-task-active' : ''}`} onClick={() => setFilter('pending')}>
              Pending ({tasks.filter(t => t.status === 'PENDING').length})
            </button>
            <button className={`admin-task-filter-btn ${filter === 'in_progress' ? 'admin-task-active' : ''}`} onClick={() => setFilter('in_progress')}>
              In Progress ({tasks.filter(t => t.status === 'IN_PROGRESS').length})
            </button>
            <button className={`admin-task-filter-btn ${filter === 'submitted' ? 'admin-task-active' : ''}`} onClick={() => setFilter('submitted')}>
              Submitted ({tasks.filter(t => t.status === 'SUBMITTED').length})
            </button>
            <button className={`admin-task-filter-btn ${filter === 'approved' ? 'admin-task-active' : ''}`} onClick={() => setFilter('approved')}>
              Approved ({tasks.filter(t => t.status === 'APPROVED').length})
            </button>
            <button className={`admin-task-filter-btn ${filter === 'rejected' ? 'admin-task-active' : ''}`} onClick={() => setFilter('rejected')}>
              Rejected ({tasks.filter(t => t.status === 'REJECTED').length})
            </button>
          </div>
          <div className="admin-task-search-box">
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="admin-task-search-input" 
            />
          </div>
        </div>

        <div className="admin-task-stats">
          <div className="admin-task-stat">
            <span>Total Tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="admin-task-stat admin-task-pending-stat">
            <span>Pending</span>
            <strong>{tasks.filter(t => t.status === 'PENDING').length}</strong>
          </div>
          <div className="admin-task-stat admin-task-progress-stat">
            <span>In Progress</span>
            <strong>{tasks.filter(t => t.status === 'IN_PROGRESS').length}</strong>
          </div>
          <div className="admin-task-stat admin-task-submitted-stat">
            <span>Submitted</span>
            <strong>{tasks.filter(t => t.status === 'SUBMITTED').length}</strong>
          </div>
          <div className="admin-task-stat admin-task-approved-stat">
            <span>Approved</span>
            <strong>{tasks.filter(t => t.status === 'APPROVED').length}</strong>
          </div>
          <div className="admin-task-stat admin-task-rejected-stat">
            <span>Rejected</span>
            <strong>{tasks.filter(t => t.status === 'REJECTED').length}</strong>
          </div>
        </div>

        <div className="admin-task-table-wrapper">
          <table className="admin-task-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Project</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{getProjectName(task.projectId)}</td>
                  <td>{getUserName(task.assignedTo)}</td>
                  <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                  <td><span className={`admin-task-priority-text ${getPriorityClass(task.priority)}`}>{task.priority || 'MEDIUM'}</span></td>
                  <td>
                    <div className="admin-task-progress-cell">
                      <span>{task.progress || 0}%</span>
                      <div className="admin-task-mini-progress-bar">
                        <div className="admin-task-mini-progress-fill" style={{ width: `${task.progress || 0}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td>{getStatusBadge(task.status)}</td>
                  <td>
                    {/* ✅ UPDATED: Show Approve/Reject for SUBMITTED tasks */}
                    {task.status === 'SUBMITTED' ? (
                      <div className="admin-task-approve-reject">
                        <button 
                          className="admin-task-approve-btn" 
                          onClick={() => handleApprove(task.id)}
                          title="Approve Task"
                        >
                          ✅ Approve
                        </button>
                        <button 
                          className="admin-task-reject-btn" 
                          onClick={() => handleReject(task.id)}
                          title="Reject Task"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    ) : (
                      <>
                        <button className="admin-task-edit-btn" onClick={() => handleEdit(task)} title="Edit">✏️</button>
                        <button className="admin-task-delete-btn" onClick={() => handleDelete(task)} title="Delete">🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTasks.length === 0 && (
            <div className="admin-task-empty-state">
              <p>No tasks found</p>
            </div>
          )}
        </div>

        {/* ===== CREATE TASK MODAL ===== */}
        {showCreateModal && (
          <div className="admin-task-modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="admin-task-modal-content" onClick={e => e.stopPropagation()}>
              <div className="admin-task-modal-header">
                <h4>➕ Create Task</h4>
                <button className="admin-task-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="admin-task-modal-body">
                  <div className="admin-task-form-group">
                    <label>Task Name *</label>
                    <input 
                      type="text" 
                      className="admin-task-form-control" 
                      value={createForm.taskName} 
                      onChange={e => setCreateForm({...createForm, taskName: e.target.value})} 
                      required 
                      placeholder="Enter task name"
                    />
                  </div>
                  <div className="admin-task-form-group">
                    <label>Description</label>
                    <textarea 
                      className="admin-task-form-control" 
                      rows="2" 
                      value={createForm.description} 
                      onChange={e => setCreateForm({...createForm, description: e.target.value})} 
                      placeholder="Enter task description"
                    />
                  </div>
                  <div className="admin-task-form-group">
                    <label>Project</label>
                    <select 
                      className="admin-task-form-control" 
                      value={createForm.projectId} 
                      onChange={e => setCreateForm({...createForm, projectId: e.target.value})}
                      required
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-task-form-group">
                    <label>Assign To</label>
                    <select 
                      className="admin-task-form-control" 
                      value={createForm.assignedTo} 
                      onChange={e => setCreateForm({...createForm, assignedTo: e.target.value})}
                      required
                    >
                      <option value="">Select Employee</option>
                      {users.filter(u => u.role === 'EMPLOYEE').map(u => (
                        <option key={u.id} value={u.id}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-task-form-group">
                    <label>Due Date</label>
                    <input 
                      type="date" 
                      className="admin-task-form-control" 
                      value={createForm.dueDate} 
                      onChange={e => setCreateForm({...createForm, dueDate: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="admin-task-form-group">
                    <label>Priority</label>
                    <select 
                      className="admin-task-form-control" 
                      value={createForm.priority} 
                      onChange={e => setCreateForm({...createForm, priority: e.target.value})}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                </div>
                <div className="admin-task-modal-footer">
                  <button type="button" className="admin-task-btn-cancel" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-task-btn-submit">
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== EDIT MODAL ===== */}
        {showEditModal && editForm && (
          <div className="admin-task-modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="admin-task-modal-content" onClick={e => e.stopPropagation()}>
              <div className="admin-task-modal-header">
                <h4>✏️ Edit Task</h4>
                <button className="admin-task-modal-close" onClick={() => setShowEditModal(false)}>✕</button>
              </div>
              <div className="admin-task-modal-body">
                <div className="admin-task-form-group">
                  <label>Task Name</label>
                  <input 
                    type="text" 
                    className="admin-task-form-control" 
                    value={editForm.title || ''} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})} 
                  />
                </div>
                <div className="admin-task-form-group">
                  <label>Description</label>
                  <textarea 
                    className="admin-task-form-control" 
                    rows="2" 
                    value={editForm.description || ''} 
                    onChange={e => setEditForm({...editForm, description: e.target.value})} 
                  />
                </div>
                <div className="admin-task-form-group">
                  <label>Due Date</label>
                  <input 
                    type="date" 
                    className="admin-task-form-control" 
                    value={editForm.dueDate || ''} 
                    onChange={e => setEditForm({...editForm, dueDate: e.target.value})} 
                  />
                </div>
                <div className="admin-task-form-group">
                  <label>Priority</label>
                  <select 
                    className="admin-task-form-control" 
                    value={editForm.priority || 'MEDIUM'} 
                    onChange={e => setEditForm({...editForm, priority: e.target.value})}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
                <div className="admin-task-form-group">
                  <label>Status</label>
                  <select 
                    className="admin-task-form-control" 
                    value={editForm.status || 'PENDING'} 
                    onChange={e => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div className="admin-task-form-group">
                  <label>Progress</label>
                  <input 
                    type="number" 
                    className="admin-task-form-control" 
                    min="0" 
                    max="100" 
                    value={editForm.progress || 0} 
                    onChange={e => setEditForm({...editForm, progress: parseInt(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <div className="admin-task-modal-footer">
                <button className="admin-task-btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="admin-task-btn-submit" onClick={saveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== DELETE MODAL ===== */}
        {showDeleteModal && selectedTask && (
          <div className="admin-task-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="admin-task-modal-content admin-task-delete-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-task-modal-header">
                <h4>🗑️ Delete Task</h4>
                <button className="admin-task-modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
              </div>
              <div className="admin-task-modal-body">
                <div className="admin-task-delete-warning">
                  <span className="admin-task-warning-icon">⚠️</span>
                  <p>Delete <strong>"{selectedTask.title}"</strong>?</p>
                  <p className="admin-task-warning-text">This action cannot be undone!</p>
                </div>
              </div>
              <div className="admin-task-modal-footer">
                <button className="admin-task-btn-cancel" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="admin-task-btn-danger" onClick={confirmDelete}>
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskOverview;