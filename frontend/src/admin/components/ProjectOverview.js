import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import './ProjectOverview.css';

const ProjectOverview = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'MEDIUM'
});

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching projects from backend...');
      const response = await adminApi.getProjects();
      console.log('📡 Response:', response.data);
      
      if (response.data.success && response.data.data) {
        setProjects(response.data.data);
      } else if (Array.isArray(response.data)) {
        setProjects(response.data);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error('❌ Error loading projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (projectData) => {
    try {
      console.log('📡 Creating project...', projectData);
      const response = await adminApi.createProject(projectData);
      console.log('📡 Response:', response.data);
      
      if (response.data.success) {
        window.dispatchEvent(new Event('projectCreated'));
        await loadProjects();
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to create project');
      }
    } catch (err) {
      console.error('❌ Error creating project:', err);
      alert(`Failed to create project: ${err.message}`);
      return false;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      console.log('📡 Deleting project:', projectId);
      const response = await adminApi.deleteProject(projectId);
      console.log('📡 Response:', response.data);
      
      if (response.data.success) {
        window.dispatchEvent(new Event('projectUpdated'));
        await loadProjects();
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete project');
      }
    } catch (err) {
      console.error('❌ Error deleting project:', err);
      alert(`Failed to delete project: ${err.message}`);
      return false;
    }
  };

  // ✅ NEW: Mark project as COMPLETED
  const handleMarkComplete = async (projectId) => {
    if (!window.confirm('Mark this project as COMPLETED? All tasks must be approved first.')) return;
    
    try {
      const response = await adminApi.updateProjectStatus(projectId, 'COMPLETED');
      console.log('📡 Mark Complete Response:', response.data);
      
      if (response.data.success) {
        alert('✅ Project marked as COMPLETED!');
        await loadProjects();
      } else {
        alert('❌ Failed to complete project: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error completing project:', err);
      alert('❌ Failed to complete project: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    loadProjects();
    
    const handleUpdate = () => {
      loadProjects();
    };
    
    window.addEventListener('projectCreated', handleUpdate);
    window.addEventListener('projectUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('projectCreated', handleUpdate);
      window.removeEventListener('projectUpdated', handleUpdate);
    };
  }, [loadProjects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const projectData = {
      name: projectForm.name,
      description: projectForm.description || '',
      startDate: `${projectForm.startDate}T00:00:00`,
      endDate: `${projectForm.endDate}T23:59:59`,
      priority: projectForm.priority,
      status: 'PLANNED'
    };
    
    const success = await createProject(projectData);
    if (success) {
      setShowModal(false);
      setProjectForm({ name: '', description: '', startDate: '', endDate: '', priority: 'MEDIUM' });
      alert('✅ Project created successfully!');
    }
  };

  const handleDelete = (project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedProject) {
      const success = await deleteProject(selectedProject.id);
      if (success) {
        alert(`✅ Project "${selectedProject.name}" deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedProject(null);
      }
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'HIGH': return 'admin-projects-priority-high';
      case 'MEDIUM': return 'admin-projects-priority-medium';
      case 'LOW': return 'admin-projects-priority-low';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'COMPLETED': return 'admin-projects-status-completed';
      case 'IN_PROGRESS': return 'admin-projects-status-in-progress';
      case 'PLANNED': return 'admin-projects-status-planned';
      case 'ACTIVE': return 'admin-projects-status-in-progress';
      default: return 'admin-projects-status-planned';
    }
  };

  // ✅ FIXED: Filter includes ACTIVE status
  const getFilteredProjects = () => {
    if (filter === 'all') return projects;
    
    if (filter === 'in_progress') {
      return projects.filter(p => 
        p.status === 'IN_PROGRESS' || p.status === 'ACTIVE'
      );
    }
    
    return projects.filter(p => p.status === filter.toUpperCase());
  };

  // ✅ FIXED: Stats calculations
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(p => 
    p.status === 'IN_PROGRESS' || p.status === 'ACTIVE'
  ).length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const plannedProjects = projects.filter(p => p.status === 'PLANNED').length;

  const filteredProjects = getFilteredProjects();

  if (loading) {
    return <div className="admin-projects-wrapper"><div className="admin-projects-loading-container">Loading projects...</div></div>;
  }

  return (
    <div className="admin-projects-wrapper">
      <div className="admin-projects-container">
        {/* Header */}
        <div className="admin-projects-header">
          <h4>📁 Project Overview</h4>
          <button className="admin-projects-btn-primary" onClick={() => setShowModal(true)}>
            + Create Project
          </button>
        </div>

        {/* Stats Cards */}
        <div className="admin-projects-stats">
          <div className="admin-projects-stat">
            <span>Total Projects</span>
            <strong>{totalProjects}</strong>
          </div>
          <div className="admin-projects-stat">
            <span>In Progress</span>
            <strong>{inProgressProjects}</strong>
          </div>
         
          <div className="admin-projects-stat">
            <span>Planned</span>
            <strong>{plannedProjects}</strong>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="admin-projects-filter-bar">
          <button className={`admin-projects-filter-btn ${filter === 'all' ? 'admin-projects-active' : ''}`} onClick={() => setFilter('all')}>
            All ({totalProjects})
          </button>
          <button className={`admin-projects-filter-btn ${filter === 'planned' ? 'admin-projects-active' : ''}`} onClick={() => setFilter('planned')}>
            Planned ({plannedProjects})
          </button>
          <button className={`admin-projects-filter-btn ${filter === 'in_progress' ? 'admin-projects-active' : ''}`} onClick={() => setFilter('in_progress')}>
            In Progress ({inProgressProjects})
          </button>
          <button className={`admin-projects-filter-btn ${filter === 'completed' ? 'admin-projects-active' : ''}`} onClick={() => setFilter('completed')}>
            Completed ({completedProjects})
          </button>
        </div>

        {/* Projects Grid */}
        <div className="admin-projects-grid">
          {filteredProjects.map(project => (
            <div key={project.id} className={`admin-projects-card ${getPriorityClass(project.priority)}`}>
              <div className="admin-projects-card-header">
                <h3>{project.name}</h3>
                <div className="admin-projects-card-actions">
                  <span className={`admin-projects-priority-badge ${getPriorityClass(project.priority)}`}>
                    {project.priority}
                  </span>
                  {/* ✅ NEW: Mark Complete Button */}
                  {project.progress === 100 && project.status !== 'COMPLETED' && (
                    <button 
                      className="admin-projects-complete-btn"
                      onClick={() => handleMarkComplete(project.id)}
                      title="Mark as Completed"
                    >
                      ✅ Complete
                    </button>
                  )}
                  <button className="admin-projects-delete-btn" onClick={() => handleDelete(project)}>
                    🗑️
                  </button>
                </div>
              </div>
              <p className="admin-projects-desc">{project.description || 'No description'}</p>
              <div className="admin-projects-dates">
                <span>📅 {project.startDate} → {project.endDate}</span>
              </div>
              <div className="admin-projects-stats-mini">
                <div className="admin-projects-mini-stat">
                  <span>Tasks</span>
                  <strong>{project.taskCount || 0}</strong>
                </div>
                <div className="admin-projects-mini-stat">
                  <span>Completed</span>
                  <strong>{project.completedCount || 0}</strong>
                </div>
                <div className="admin-projects-mini-stat">
                  <span>Progress</span>
                  <strong>{project.progress || 0}%</strong>
                </div>
              </div>
              <div className="admin-projects-progress">
                <div className="admin-projects-progress-bar">
                  <div className="admin-projects-progress-fill" style={{ width: `${project.progress || 0}%` }}></div>
                </div>
              </div>
              <div className="admin-projects-status">
                <span className={getStatusClass(project.status)}>
                  {project.status || 'PLANNED'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="admin-projects-empty-state">
            <p>No projects found</p>
          </div>
        )}

        {/* ===== CREATE PROJECT MODAL ===== */}
        {showModal && (
          <div className="admin-projects-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-projects-modal-content" onClick={e => e.stopPropagation()}>
              <div className="admin-projects-modal-header">
                <h4>Create Project</h4>
                <button className="admin-projects-modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="admin-projects-modal-body">
                  <div className="admin-projects-form-group">
                    <label>Project Name *</label>
                    <input 
                      type="text" 
                      className="admin-projects-form-control" 
                      value={projectForm.name} 
                      onChange={e => setProjectForm({...projectForm, name: e.target.value})} 
                      required 
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="admin-projects-form-group">
                    <label>Description</label>
                    <textarea 
                      className="admin-projects-form-control" 
                      rows="3" 
                      value={projectForm.description} 
                      onChange={e => setProjectForm({...projectForm, description: e.target.value})} 
                      placeholder="Enter project description"
                    />
                  </div>
                  <div className="admin-projects-form-row">
                    <div className="admin-projects-form-group">
                      <label>Start Date *</label>
                      <input 
                        type="date" 
                        className="admin-projects-form-control" 
                        value={projectForm.startDate} 
                        onChange={e => setProjectForm({...projectForm, startDate: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="admin-projects-form-group">
                      <label>End Date *</label>
                      <input 
                        type="date" 
                        className="admin-projects-form-control" 
                        value={projectForm.endDate} 
                        onChange={e => setProjectForm({...projectForm, endDate: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="admin-projects-form-group">
                    <label>Priority</label>
                    <select 
                      className="admin-projects-form-control" 
                      value={projectForm.priority} 
                      onChange={e => setProjectForm({...projectForm, priority: e.target.value})}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                </div>
                <div className="admin-projects-modal-buttons">
                  <button type="button" className="admin-projects-btn-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-projects-btn-submit">
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== DELETE MODAL ===== */}
        {showDeleteModal && selectedProject && (
          <div className="admin-projects-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="admin-projects-modal-content admin-projects-delete-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-projects-modal-header">
                <h4>Delete Project</h4>
                <button className="admin-projects-modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
              </div>
              <div className="admin-projects-modal-body">
                <div className="admin-projects-delete-warning">
                  <span className="admin-projects-warning-icon">⚠️</span>
                  <p>Delete <strong>"{selectedProject.name}"</strong>?</p>
                  <p className="admin-projects-warning-text">This will also delete ALL tasks in this project!</p>
                </div>
              </div>
              <div className="admin-projects-modal-buttons">
                <button className="admin-projects-btn-cancel" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="admin-projects-btn-delete" onClick={confirmDelete}>
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;