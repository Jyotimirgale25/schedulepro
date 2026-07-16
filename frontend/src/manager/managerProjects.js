import React, { useState, useEffect } from 'react';
import './managerProjects.css';  // ← External CSS import
import { managerApi } from '../services/api';

const Projects = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    priority: 'MEDIUM'
  });

  // ===== LOAD PROJECTS =====
  const loadProjects = async () => {
    setLoading(true);
    try {
      console.log('📤 Fetching projects...');
      const response = await managerApi.getProjects();
      console.log('📥 Projects response:', response);
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          setProjects(response.data);
          console.log('📁 Projects loaded:', response.data.length, 'projects');
        } else {
          console.warn('⚠️ Response data is not an array:', response.data);
          setProjects([]);
        }
      } else {
        console.warn('⚠️ No projects data received');
        setProjects([]);
      }
    } catch (err) {
      console.error('❌ Error loading projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== CREATE PROJECT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await managerApi.createProject({
        name: projectForm.name,
        description: projectForm.description,
        startDate: projectForm.startDate,
        endDate: projectForm.endDate,
        priority: projectForm.priority
      });

      if (response.data) {
        console.log('✅ Project created:', response.data);
        alert('✅ Project created successfully!');
        setShowModal(false);
        setProjectForm({ name: '', description: '', startDate: '', endDate: '', priority: 'MEDIUM' });
        await loadProjects();
        window.dispatchEvent(new Event('projectCreated'));
      }
    } catch (err) {
      console.error('❌ Error creating project:', err);
      alert('❌ Failed to create project: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ===== DELETE PROJECT =====
  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await managerApi.deleteProject(projectToDelete.id);
      alert(`✅ Project "${projectToDelete.name}" deleted successfully.`);
      setShowDeleteModal(false);
      setProjectToDelete(null);
      await loadProjects();
      window.dispatchEvent(new Event('projectUpdated'));
    } catch (err) {
      console.error('❌ Error deleting project:', err);
      alert('❌ Failed to delete project: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    loadProjects();

    const handleProjectUpdate = () => {
      loadProjects();
    };

    window.addEventListener('projectCreated', handleProjectUpdate);
    window.addEventListener('projectUpdated', handleProjectUpdate);
    window.addEventListener('taskUpdated', handleProjectUpdate);

    return () => {
      window.removeEventListener('projectCreated', handleProjectUpdate);
      window.removeEventListener('projectUpdated', handleProjectUpdate);
      window.removeEventListener('taskUpdated', handleProjectUpdate);
    };
  }, []);

  if (loading) return <div className="projects-loading">Loading projects...</div>;

  return (
    <div className="mgr-project-wrapper">
      <div className="projects-manager-container">
        <div className="projects-header">
          <h4>📁 Projects</h4>
          <button className="projects-btn-primary" onClick={() => setShowModal(true)}>+ Create Project</button>
        </div>

        <div className="projects-list">
          {projects.length === 0 ? (
            <div className="projects-no-projects">
              <div className="projects-empty-icon">📭</div>
              <p>No projects created yet</p>
              <small>Click "Create Project" to get started</small>
            </div>
          ) : (
            projects.map(p => {
              const projectName = p.name || 'Untitled Project';
              const projectDesc = p.description || 'No description';
              const projectPriority = p.priority || 'MEDIUM';
              const projectStatus = p.status || 'PLANNED';
              const startDate = p.startDate || 'Not set';
              const endDate = p.endDate || 'Not set';
              const progress = p.progress || 0;

              return (
                <div key={p.id || Math.random()} className={`projects-project-card priority-${projectPriority.toLowerCase()}`}>
                  <div className="projects-project-header">
                    <h3>{projectName}</h3>
                    <div className="projects-project-actions-header">
                      <span className={`projects-priority-badge projects-priority-${projectPriority.toLowerCase()}`}>
                        {projectPriority}
                      </span>
                      <button
                        className="projects-delete-project-btn"
                        onClick={() => { setProjectToDelete(p); setShowDeleteModal(true); }}
                        title="Delete Project"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="projects-project-desc">{projectDesc}</p>
                  <div className="projects-project-dates">
                    <span>📅 {startDate} → {endDate}</span>
                  </div>
                  <div className="projects-project-progress">
                    <div className="projects-progress-label">
                      <span style={{fontWeight:'bold'}}>Project Progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div className="projects-progress-bar">
                      <div className="projects-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="projects-progress-stats">
                      <small>
                        {progress === 0 ? 'No tasks approved yet' :
                         progress === 100 ? 'All tasks completed!' : 
                         `${progress}% complete`}
                      </small>
                    </div>
                  </div>
                  <div className="projects-project-status">
                    <span className={`projects-status-${projectStatus.toLowerCase()}`}>
                      {projectStatus}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ===== CREATE PROJECT MODAL ===== */}
        {showModal && (
          <div className="projects-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="projects-modal-content" onClick={e => e.stopPropagation()}>
              <div className="projects-modal-header">
                <h4>📝 Create Project</h4>
                <button onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="projects-modal-body">
                  <div className="projects-form-group">
                    <label>Project Name *</label>
                    <input
                      type="text"
                      className="projects-form-control"
                      placeholder="Enter project name"
                      value={projectForm.name}
                      onChange={e => setProjectForm({...projectForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="projects-form-group">
                    <label>Description</label>
                    <textarea
                      className="projects-form-control"
                      rows="3"
                      placeholder="Enter project description"
                      value={projectForm.description}
                      onChange={e => setProjectForm({...projectForm, description: e.target.value})}
                    />
                  </div>
                  <div className="projects-form-row">
                    <div className="projects-form-group">
                      <label>Start Date *</label>
                      <input
                        type="date"
                        className="projects-form-control"
                        value={projectForm.startDate}
                        onChange={e => setProjectForm({...projectForm, startDate: e.target.value})}
                        required
                      />
                    </div>
                    <div className="projects-form-group">
                      <label>End Date *</label>
                      <input
                        type="date"
                        className="projects-form-control"
                        value={projectForm.endDate}
                        onChange={e => setProjectForm({...projectForm, endDate: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="projects-form-group">
                    <label>Priority</label>
                    <select
                      className="projects-form-control"
                      value={projectForm.priority}
                      onChange={e => setProjectForm({...projectForm, priority: e.target.value})}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                
                {/* ===== MODAL BUTTONS ===== */}
                <div className="projects-modal-buttons">
                  <button type="button" className="projects-btn-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="projects-btn-submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== DELETE CONFIRMATION MODAL ===== */}
        {showDeleteModal && projectToDelete && (
          <div className="projects-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="projects-modal-content projects-delete-modal" onClick={e => e.stopPropagation()}>
              <div className="projects-modal-header">
                <h4>🗑️ Delete Project</h4>
                <button onClick={() => setShowDeleteModal(false)}>✕</button>
              </div>
              <div className="projects-modal-body">
                <div className="projects-delete-warning">
                  <span className="projects-warning-icon">⚠️</span>
                  <p>Are you sure you want to delete <strong>"{projectToDelete.name}"</strong>?</p>
                  <p className="projects-warning-text">This will also delete ALL tasks associated with this project.</p>
                  <p className="projects-warning-text">This action cannot be undone.</p>
                </div>
              </div>
              <div className="projects-modal-buttons">
                <button className="projects-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="projects-btn-delete" onClick={confirmDelete}>Delete Project</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;