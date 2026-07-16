// src/components/Tasks.js
import React, { useState, useEffect, useCallback } from 'react';
import './employeeTasks.css';
import { employeeApi } from '../services/api';

const Tasks = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectName, setSelectedProjectName] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressValue, setProgressValue] = useState(0);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitReason, setResubmitReason] = useState('');

  // ===== LOAD ALL TASKS =====
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📤 Fetching employee tasks...');
      const response = await employeeApi.getTasks();
      console.log('📥 Tasks response:', response);
      
      let tasksData = response.data || [];
      
      if (tasksData.data && Array.isArray(tasksData.data)) {
        tasksData = tasksData.data;
      }
      if (tasksData.content && Array.isArray(tasksData.content)) {
        tasksData = tasksData.content;
      }
      
      console.log('📋 All tasks loaded:', tasksData.length);
      setTasks(tasksData);
      
      if (selectedProjectId) {
        const filtered = tasksData.filter(task => {
          const taskProjectId = task.project?.id || task.projectId || task.project_id;
          return taskProjectId === selectedProjectId;
        });
        setFilteredTasks(filtered);
        console.log('📋 Filtered tasks for project:', filtered.length);
      } else {
        setFilteredTasks(tasksData);
      }
      
    } catch (err) {
      console.error('❌ Error loading tasks:', err);
      setTasks([]);
      setFilteredTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  // ===== LISTEN FOR PROJECT SELECTION =====
  useEffect(() => {
    const handleProjectSelected = (event) => {
      console.log('🔔 Project selected event received in Tasks:', event);
      const { projectId, projectName } = event.detail || {};
      console.log('📁 Project ID:', projectId, 'Name:', projectName);
      
      if (projectId) {
        setSelectedProjectId(projectId);
        setSelectedProjectName(projectName);
        
        const filtered = tasks.filter(task => {
          const taskProjectId = task.project?.id || task.projectId || task.project_id;
          return taskProjectId === projectId;
        });
        setFilteredTasks(filtered);
        console.log('📋 Filtered tasks:', filtered.length);
      }
    };

    const checkStoredProject = () => {
      try {
        const stored = localStorage.getItem('selectedProject');
        if (stored) {
          const project = JSON.parse(stored);
          console.log('📁 Found stored project:', project);
          setSelectedProjectId(project.id);
          setSelectedProjectName(project.name);
        }
      } catch (e) {
        console.error('Error reading stored project:', e);
      }
    };

    window.addEventListener('projectSelected', handleProjectSelected);
    checkStoredProject();
    
    return () => {
      window.removeEventListener('projectSelected', handleProjectSelected);
    };
  }, [tasks]);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ===== CLEAR PROJECT FILTER =====
  const clearProjectFilter = () => {
    setSelectedProjectId(null);
    setSelectedProjectName(null);
    setFilteredTasks(tasks);
    localStorage.removeItem('selectedProject');
  };

  // ===== UPDATE TASK PROGRESS =====
  const handleUpdateProgress = async () => {
    try {
      await employeeApi.updateTaskProgress(selectedTask.id, progressValue);
      alert(`✅ Progress updated to ${progressValue}%`);
      setShowProgressModal(false);
      await loadTasks();
      window.dispatchEvent(new Event('taskUpdated'));
    } catch (err) {
      console.error('Error updating progress:', err);
      alert('❌ Failed to update progress');
    }
  };

  // ===== SUBMIT TASK =====
  const handleSubmitTask = async (taskId) => {
    if (!window.confirm('Submit this task for review?')) return;

    try {
      await employeeApi.submitTask(taskId);
      alert('✅ Task submitted for review!');
      await loadTasks();
      window.dispatchEvent(new Event('taskUpdated'));
    } catch (err) {
      console.error('Error submitting task:', err);
      alert('❌ Failed to submit task');
    }
  };

  // ===== RESUBMIT TASK =====
  const handleResubmitTask = async (taskId) => {
    if (!resubmitReason.trim()) {
      alert('Please provide a brief explanation of what you changed.');
      return;
    }

    try {
      await employeeApi.resubmitTask(taskId, { note: resubmitReason });
      alert('✅ Task resubmitted for review!');
      setShowResubmitModal(false);
      setResubmitReason('');
      await loadTasks();
    } catch (err) {
      console.error('Error resubmitting task:', err);
      alert('❌ Failed to resubmit task');
    }
  };

  const openProgressModal = (task) => {
    setSelectedTask(task);
    setProgressValue(task.progress || 0);
    setShowProgressModal(true);
  };

  const openResubmitModal = (task) => {
    setSelectedTask(task);
    setShowResubmitModal(true);
    setResubmitReason('');
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': { label: '⏳ Pending', class: 'status-pending' },
      'IN_PROGRESS': { label: '🔄 In Progress', class: 'status-in-progress' },
      'SUBMITTED': { label: '📤 Submitted', class: 'status-submitted' },
      'APPROVED': { label: '✅ Approved', class: 'status-approved' },
      'REJECTED': { label: '❌ Rejected', class: 'status-rejected' }
    };
    const s = statusMap[status] || { label: status, class: '' };
    return <span className={`task-status-badge ${s.class}`}>{s.label}</span>;
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <div className="employee-tasks-container">
      <div className="tasks-header">
        <div>
          <h4>✅ My Tasks</h4>
          <p className="subtitle">
            {selectedProjectId 
              ? `Tasks for "${selectedProjectName || 'Selected Project'}" (${filteredTasks.length})` 
              : `All tasks (${filteredTasks.length})`
            }
          </p>
        </div>
        <div className="header-actions">
          {selectedProjectId && (
            <button className="btn-view-all" onClick={clearProjectFilter}>
              📂 View All Projects
            </button>
          )}
          <button className="btn-refresh" onClick={loadTasks}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="no-tasks">
          <div className="empty-icon">✅</div>
          <h5>No Tasks Found</h5>
          <p>
            {selectedProjectId 
              ? `No tasks assigned to you in "${selectedProjectName || 'this project'}"` 
              : 'Your manager hasn\'t assigned any tasks to you yet'
            }
          </p>
          {tasks.length > 0 && selectedProjectId && (
            <button className="btn-link" onClick={clearProjectFilter}>
              View all tasks ({tasks.length})
            </button>
          )}
        </div>
      ) : (
        <div className="tasks-list">
          {filteredTasks.map(task => (
            <div key={task.id} className={`task-card ${task.status === 'APPROVED' ? 'task-approved' : ''}`}>
              <div className="task-header">
                <div className="task-title-section">
                  <h4>{task.title}</h4>
                  <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                {getStatusBadge(task.status)}
              </div>

              <p className="task-description">{task.description || 'No description'}</p>

              <div className="task-details">
                <div className="task-detail">
                  <span>📁 Project:</span>
                  <strong>{task.project?.name || 'N/A'}</strong>
                </div>
                <div className="task-detail">
                  <span>📅 Due:</span>
                  <strong>{task.dueDate || 'No deadline'}</strong>
                </div>
                <div className="task-detail">
                  <span>📊 Progress:</span>
                  <div className="task-progress-mini">
                    <div className="progress-bar-mini">
                      <div className="progress-fill-mini" style={{ width: `${task.progress || 0}%` }}></div>
                    </div>
                    <span>{task.progress || 0}%</span>
                  </div>
                </div>
              </div>

              <div className="task-actions">
                {task.status !== 'APPROVED' && task.status !== 'REJECTED' && (
                  <>
                    <button className="btn-update-progress" onClick={() => openProgressModal(task)}>
                      📊 Update Progress
                    </button>
                    {task.progress === 100 && (
                      <button className="btn-submit-task" onClick={() => handleSubmitTask(task.id)}>
                        📤 Submit for Review
                      </button>
                    )}
                  </>
                )}

                {task.status === 'REJECTED' && (
                  <div className="task-rejected-container">
                    <div className="task-rejected-message">
                      <span>❌ Task Rejected</span>
                      {task.rejectionReason && (
                        <div className="rejection-details">
                          <strong>Reason:</strong> {task.rejectionReason}
                        </div>
                      )}
                    </div>
                    <button className="btn-resubmit-task" onClick={() => openResubmitModal(task)}>
                      🔄 Resubmit
                    </button>
                  </div>
                )}

                {task.status === 'APPROVED' && (
                  <div className="task-approved-message">✅ Task Approved! 🎉</div>
                )}
                
                {task.status === 'SUBMITTED' && (
                  <div className="task-review-message">⏳ Waiting for manager review...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>📊 Update Progress</h4>
              <button onClick={() => setShowProgressModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Task:</strong> {selectedTask.title}</p>
              <p><strong>Current Progress:</strong> {selectedTask.progress || 0}%</p>
              <div className="form-group">
                <label>Set Progress: {progressValue}%</label>
                <input
                  type="range"
                  className="form-control"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={e => setProgressValue(parseInt(e.target.value))}
                />
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowProgressModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleUpdateProgress}>Update Progress</button>
            </div>
          </div>
        </div>
      )}

      {/* Resubmit Modal */}
      {showResubmitModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowResubmitModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>🔄 Resubmit Task</h4>
              <button onClick={() => setShowResubmitModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Task:</strong> {selectedTask.title}</p>
              <div className="form-group">
                <label>What changes did you make?</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Describe what you fixed or changed..."
                  value={resubmitReason}
                  onChange={e => setResubmitReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowResubmitModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={() => handleResubmitTask(selectedTask.id)}>
                Resubmit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;