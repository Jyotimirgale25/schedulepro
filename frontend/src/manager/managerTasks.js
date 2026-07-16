import React, { useState, useEffect } from 'react';
import './managerTasks.css';  // ← External CSS import
import { managerApi } from '../services/api';

const Tasks = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedToId: '',
    dueDate: '',
    priority: 'MEDIUM'
  });
  const [employees, setEmployees] = useState([]);

  // ===== LOAD PROJECTS =====
  const loadProjects = async () => {
    try {
      const response = await managerApi.getProjects();
      if (response.data) {
        setProjects(response.data);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  // ===== LOAD EMPLOYEES =====
  const loadEmployees = async () => {
    try {
      const response = await managerApi.getTeam();
      if (response.data) {
        const activeEmployees = response.data.filter(m => m.status === 'ACTIVE');
        setEmployees(activeEmployees);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  // ===== LOAD TASKS =====
  const loadTasks = async (projectId) => {
    setLoading(true);
    try {
      let response;
      
      if (projectId === 'all' || !projectId) {
        console.log('📋 Loading ALL tasks...');
        response = await managerApi.getTasks();
      } else {
        console.log('📋 Loading tasks for project:', projectId);
        response = await managerApi.getTasksForProject(projectId);
      }
      
      if (response.data) {
        setTasks(response.data);
        console.log('📋 Tasks loaded:', response.data.length);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== CREATE TASK =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedEmployee = employees.find(emp => emp.id === taskForm.assignedToId);
      
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        assignedTo: { 
          id: taskForm.assignedToId,
          fullName: selectedEmployee?.name || 'Unassigned',
          email: selectedEmployee?.email || ''
        },
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
        project: { id: selectedProjectId }
      };
      
      console.log('📤 Creating task with data:', taskData);
      
      const response = await managerApi.createTask(taskData);

      if (response.data) {
        alert('✅ Task created successfully!');
        setShowModal(false);
        setTaskForm({ title: '', description: '', assignedToId: '', dueDate: '', priority: 'MEDIUM' });
        await loadTasks(selectedProjectId);
        window.dispatchEvent(new Event('taskCreated'));
      }
    } catch (err) {
      console.error('❌ Error creating task:', err);
      alert('❌ Failed to create task: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ===== APPROVE TASK =====
  const handleApprove = async (taskId) => {
    if (!window.confirm('Approve this task?')) return;

    try {
      await managerApi.approveTask(taskId);
      alert('✅ Task approved!');
      await loadTasks(selectedProjectId);
      window.dispatchEvent(new Event('taskUpdated'));
    } catch (err) {
      console.error('Error approving task:', err);
      alert('❌ Failed to approve task');
    }
  };

  // ===== REJECT TASK =====
  const handleReject = async (taskId) => {
    const reason = prompt('Enter reason for rejection:');
    if (reason === null) return;

    try {
      await managerApi.rejectTask(taskId, { reason });
      alert('❌ Task rejected with reason');
      await loadTasks(selectedProjectId);
      window.dispatchEvent(new Event('taskUpdated'));
    } catch (err) {
      console.error('Error rejecting task:', err);
      alert('❌ Failed to reject task');
    }
  };

  // ===== DELETE TASK =====
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    alert('⏳ Delete functionality coming soon!');
  };

  useEffect(() => {
    loadProjects();
    loadEmployees();
  }, []);

  useEffect(() => {
    loadTasks(selectedProjectId);
  }, [selectedProjectId]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { label: '⏳ Pending', class: 'tasks-status-pending' },
      'IN_PROGRESS': { label: '🔄 In Progress', class: 'tasks-status-in-progress' },
      'SUBMITTED': { label: '📤 Submitted', class: 'tasks-status-submitted' },
      'APPROVED': { label: '✅ Approved', class: 'tasks-status-approved' },
      'REJECTED': { label: '❌ Rejected', class: 'tasks-status-rejected' }
    };
    const s = statusMap[status] || { label: status, class: '' };
    return <span className={`tasks-task-status-badge ${s.class}`}>{s.label}</span>;
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'HIGH': return 'tasks-priority-high';
      case 'MEDIUM': return 'tasks-priority-medium';
      case 'LOW': return 'tasks-priority-low';
      default: return '';
    }
  };

  const canApproveOrReject = (status) => {
    return status === 'SUBMITTED';
  };

  if (loading) return <div className="tasks-loading">Loading tasks...</div>;

  return (
    <div className="mgr-tasks-wrapper">
      <div className="tasks-manager-container">
        <div className="tasks-header">
          <h4>📋 Tasks</h4>
          <div className="tasks-header-actions">
            <select 
              className="tasks-project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="all">📋 All Tasks</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button className="tasks-btn-primary" onClick={() => setShowModal(true)}>
              + Create Task
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="tasks-no-tasks">
            <div className="tasks-empty-icon">📭</div>
            <p>No tasks found</p>
            <small>
              {selectedProjectId === 'all' 
                ? 'Create a task to assign to team members' 
                : 'No tasks created for this project'}
            </small>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map(task => (
              <div key={task.id} className={`tasks-task-card ${getPriorityClass(task.priority)}`}>
                <div className="tasks-task-header">
                  <div className="tasks-task-title-section">
                    <h4>{task.title}</h4>
                    <span className={`tasks-priority-badge ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="tasks-task-actions">
                    {canApproveOrReject(task.status) && (
                      <>
                        <button className="tasks-btn-approve" onClick={() => handleApprove(task.id)}>
                          ✅ Approve
                        </button>
                        <button className="tasks-btn-reject" onClick={() => handleReject(task.id)}>
                          ❌ Reject
                        </button>
                      </>
                    )}
                    <button className="tasks-btn-delete-task" onClick={() => handleDeleteTask(task.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
                <p className="tasks-task-description">{task.description || 'No description'}</p>
                <div className="tasks-task-details">
                  <div className="tasks-task-detail">
                    <span>👤 Assigned to:</span>
                    <strong>{task.assignedTo?.fullName || task.assignedToName || 'Unassigned'}</strong>
                  </div>
                  <div className="tasks-task-detail">
                    <span>📅 Due:</span>
                    <strong>{task.dueDate}</strong>
                  </div>
                  <div className="tasks-task-detail">
                    <span>📊 Progress:</span>
                    <div className="tasks-task-progress-mini">
                      <div className="tasks-progress-bar-mini">
                        <div className="tasks-progress-fill-mini" style={{ width: `${task.progress || 0}%` }}></div>
                      </div>
                      <span>{task.progress || 0}%</span>
                    </div>
                  </div>
                </div>
                <div className="tasks-task-footer">
                  {getStatusBadge(task.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== CREATE TASK MODAL ===== */}
        {showModal && (
          <div className="tasks-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="tasks-modal-content" onClick={e => e.stopPropagation()}>
              <div className="tasks-modal-header">
                <h4>📝 Create Task</h4>
                <button onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="tasks-modal-body">
                  <div className="tasks-form-group">
                    <label>Task Title</label>
                    <input
                      type="text"
                      className="tasks-form-control"
                      value={taskForm.title}
                      onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                      required
                      placeholder="Enter task title"
                    />
                  </div>
                  <div className="tasks-form-group">
                    <label>Description</label>
                    <textarea
                      className="tasks-form-control"
                      rows="3"
                      value={taskForm.description}
                      onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                      placeholder="Enter task description"
                    />
                  </div>
                  <div className="tasks-form-group">
                    <label>Assign to Employee</label>
                    <select
                      className="tasks-form-control"
                      value={taskForm.assignedToId}
                      onChange={e => setTaskForm({...taskForm, assignedToId: e.target.value})}
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
                  <div className="tasks-form-row">
                    <div className="tasks-form-group">
                      <label>Due Date</label>
                      <input
                        type="date"
                        className="tasks-form-control"
                        value={taskForm.dueDate}
                        onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="tasks-form-group">
                      <label>Priority</label>
                      <select
                        className="tasks-form-control"
                        value={taskForm.priority}
                        onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* ===== MODAL BUTTONS ===== */}
                <div className="tasks-modal-buttons">
                  <button type="button" className="tasks-btn-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="tasks-btn-submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;