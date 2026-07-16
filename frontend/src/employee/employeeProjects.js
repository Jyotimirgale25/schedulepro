import React, { useState, useEffect, useCallback } from 'react';
import './employeeProjects.css';
import { employeeApi } from '../services/api';

const Projects = ({ user, onViewTasks }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📤 Fetching all projects...');
      const response = await employeeApi.getMyProjects();
      console.log('📥 Response:', response);
      
      if (response.data) {
        setProjects(response.data);
        console.log('📁 Projects loaded:', response.data.length);
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

  // ===== VIEW TASKS - Store project and navigate =====
  const handleViewTasks = (projectId, projectName) => {
    console.log('📁 Viewing tasks for project:', { projectId, projectName });
    
    // ✅ Store selected project in localStorage
    localStorage.setItem('selectedProject', JSON.stringify({ 
      id: projectId, 
      name: projectName 
    }));
    
    // ✅ Dispatch custom event for real-time update
    window.dispatchEvent(new CustomEvent('projectSelected', { 
      detail: { projectId, projectName } 
    }));
    
    // ✅ Navigate to tasks tab
    if (onViewTasks) {
      onViewTasks();
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  };

  useEffect(() => {
    loadProjects();
    
    const handleProjectUpdate = () => {
      loadProjects();
    };
    
    const handleProgressUpdate = () => {
      console.log('🔄 Progress updated, reloading projects...');
      loadProjects();
    };
    
    window.addEventListener('projectCreated', handleProjectUpdate);
    window.addEventListener('projectUpdated', handleProjectUpdate);
    window.addEventListener('taskCreated', handleProjectUpdate);
    window.addEventListener('taskUpdated', handleProjectUpdate);
    window.addEventListener('projectProgressUpdated', handleProgressUpdate);
    window.addEventListener('storage', handleProjectUpdate);
    
    return () => {
      window.removeEventListener('projectCreated', handleProjectUpdate);
      window.removeEventListener('projectUpdated', handleProjectUpdate);
      window.removeEventListener('taskCreated', handleProjectUpdate);
      window.removeEventListener('taskUpdated', handleProjectUpdate);
      window.removeEventListener('projectProgressUpdated', handleProgressUpdate);
      window.removeEventListener('storage', handleProjectUpdate);
    };
  }, [loadProjects]);

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="employee-projects-container">
      <div className="projects-header">
        <h4>📁 My Projects</h4>
        <p className="subtitle">All projects available</p>
      </div>

      {projects.length === 0 ? (
        <div className="no-projects">
          <div className="empty-icon">📭</div>
          <h5>No Projects Available</h5>
          <p>No projects have been created yet</p>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.name}</h3>
                <span className={`priority-badge ${getPriorityClass(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
              <p className="project-desc">{project.description || 'No description'}</p>
              <div className="project-dates">
                <span>📅 {project.startDate} → {project.endDate}</span>
              </div>
              <div className="project-progress">
                <div className="progress-label">
                  <span style={{fontWeight:'bold'}}>Overall Progress</span>
                  <strong>{project.progress || 0}%</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progress || 0}%` }}></div>
                </div>
                <div className="progress-stats">
                  <small>
                    {project.progress === 0 ? 'No tasks approved yet' :
                     project.progress === 100 ? 'All tasks completed!' : 
                     `${project.progress}% complete`}
                  </small>
                </div>
              </div>
              <div className="project-status">
                <span className={`status-${project.status?.toLowerCase() || 'planned'}`}>
                  {project.status || 'PLANNED'}
                </span>
              </div>
              <button 
                className="view-tasks-btn" 
                onClick={() => {
                  console.log('🔘 View Tasks clicked for:', project.name);
                  handleViewTasks(project.id, project.name);
                }}
              >
                View Tasks →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;