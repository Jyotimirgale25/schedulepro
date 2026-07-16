import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import './adminReports.css';

const Reports = ({ user }) => {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📡 Generating report...');
      const response = await adminApi.getReport(dateRange.start, dateRange.end);
      console.log('📡 Response:', response.data);
      
      if (response.data.success && response.data.data) {
        setReportData(response.data.data);
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('❌ Error generating report:', err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const downloadReport = async () => {
    try {
      const response = await adminApi.exportReportJson(dateRange.start, dateRange.end);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report');
    }
  };

  const downloadCsv = async () => {
    try {
      const response = await adminApi.exportReportCsv(dateRange.start, dateRange.end);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Failed to download CSV');
    }
  };

  if (loading) {
    return <div className="admin-reports-loading-container">Generating report...</div>;
  }

  if (!reportData) {
    return <div className="admin-reports-empty-state">No data available for the selected date range</div>;
  }

  return (
    <div className="admin-reports-container">
      <div className="admin-reports-header">
        <h4>📊 System Reports</h4>
        <div className="admin-reports-header-actions">
          <button className="admin-reports-btn-download" onClick={downloadReport}>📥 Download JSON</button>
          <button className="admin-reports-btn-download-csv" onClick={downloadCsv}>📥 Download CSV</button>
        </div>
      </div>

      <div className="admin-reports-date-range-filter">
        <label>From:</label>
        <input 
          type="date" 
          value={dateRange.start} 
          onChange={e => setDateRange({...dateRange, start: e.target.value})} 
        />
        <label>To:</label>
        <input 
          type="date" 
          value={dateRange.end} 
          onChange={e => setDateRange({...dateRange, end: e.target.value})} 
        />
        <button className="admin-reports-btn-filter" onClick={generateReport}>Apply Filter</button>
        {(dateRange.start || dateRange.end) && (
          <span className="admin-reports-filter-info">Showing: {reportData.overview?.dateRange || 'All time'}</span>
        )}
      </div>

      <div className="admin-reports-controls">
        <div className="admin-reports-tabs">
          <button className={`admin-reports-tab ${reportType === 'overview' ? 'admin-reports-active' : ''}`} onClick={() => setReportType('overview')}>
            Overview
          </button>
          <button className={`admin-reports-tab ${reportType === 'tasks' ? 'admin-reports-active' : ''}`} onClick={() => setReportType('tasks')}>
            Tasks
          </button>
          <button className={`admin-reports-tab ${reportType === 'users' ? 'admin-reports-active' : ''}`} onClick={() => setReportType('users')}>
            Users
          </button>
        </div>
      </div>

      {reportType === 'overview' && reportData.overview && (
        <div className="admin-reports-overview">
          <div className="admin-reports-card admin-reports-large">
            <h5>
              System Overview 
              {reportData.overview.dateRange !== 'All time' && (
                <span> ({reportData.overview.dateRange})</span>
              )}
            </h5>
            <div className="admin-reports-stats-grid-4">
              <div className="admin-reports-stat-item"><span>Total Users</span><strong>{reportData.overview.totalUsers}</strong></div>
              <div className="admin-reports-stat-item"><span>Managers</span><strong>{reportData.overview.totalManagers}</strong></div>
              <div className="admin-reports-stat-item"><span>Employees</span><strong>{reportData.overview.totalEmployees}</strong></div>
              <div className="admin-reports-stat-item"><span>Projects</span><strong>{reportData.overview.totalProjects}</strong></div>
              <div className="admin-reports-stat-item"><span>Total Tasks</span><strong>{reportData.overview.totalTasks}</strong></div>
              <div className="admin-reports-stat-item"><span>Completed Tasks</span><strong>{reportData.overview.completedTasks}</strong></div>
              <div className="admin-reports-stat-item"><span>Pending Leaves</span><strong>{reportData.overview.pendingLeaves}</strong></div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'tasks' && reportData.tasks && (
        <div className="admin-reports-tasks">
          <div className="admin-reports-card">
            <h5>Task Status Distribution</h5>
            <div className="admin-reports-stats-grid-5">
              <div className="admin-reports-stat-item admin-reports-pending"><span>Pending</span><strong>{reportData.tasks.byStatus?.pending || 0}</strong></div>
              <div className="admin-reports-stat-item admin-reports-progress"><span>In Progress</span><strong>{reportData.tasks.byStatus?.inProgress || 0}</strong></div>
              <div className="admin-reports-stat-item admin-reports-submitted"><span>Submitted</span><strong>{reportData.tasks.byStatus?.submitted || 0}</strong></div>
              <div className="admin-reports-stat-item admin-reports-approved"><span>Approved</span><strong>{reportData.tasks.byStatus?.approved || 0}</strong></div>
              <div className="admin-reports-stat-item admin-reports-rejected"><span>Rejected</span><strong>{reportData.tasks.byStatus?.rejected || 0}</strong></div>
            </div>
          </div>
          <div className="admin-reports-card">
            <h5>Task Priority Distribution</h5>
            <div className="admin-reports-stats-grid-3">
              <div className="admin-reports-stat-item admin-reports-high"><span>High Priority</span><strong>{reportData.tasks.byPriority?.high || 0}</strong></div>
              <div className="admin-reports-stat-item admin-reports-medium"><span>Medium Priority</span><strong>{reportData.tasks.byPriority?.medium || 0}</strong></div>
              <div className="admin-reports-stat-item admin-reports-low"><span>Low Priority</span><strong>{reportData.tasks.byPriority?.low || 0}</strong></div>
            </div>
            <div className="admin-reports-completion-rate">
              <span>Task Completion Rate</span>
              <div className="admin-reports-rate-bar"><div className="admin-reports-rate-fill" style={{ width: `${reportData.tasks.completionRate || 0}%` }}></div></div>
              <strong>{reportData.tasks.completionRate || 0}%</strong>
            </div>
          </div>
        </div>
      )}

      {reportType === 'users' && reportData.users && (
        <div className="admin-reports-users">
          <div className="admin-reports-card">
            <h5>Employee Performance</h5>
            <div className="admin-reports-user-table-wrapper">
              <table className="admin-reports-user-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Tasks Assigned</th>
                    <th>Tasks Completed</th>
                    <th>Leaves Taken</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.users.map((userItem, idx) => (
                    <tr key={idx}>
                      <td>{userItem.name}</td>
                      <td>{userItem.email}</td>
                      <td>{userItem.role}</td>
                      <td>{userItem.tasksAssigned}</td>
                      <td>{userItem.tasksCompleted}</td>
                      <td>{userItem.leavesTaken}</td>
                      <td className={userItem.performance >= 70 ? 'admin-reports-good' : userItem.performance >= 50 ? 'admin-reports-average' : 'admin-reports-poor'}>
                        {userItem.performance}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;