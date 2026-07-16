// src/manager/Reports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { managerApi } from '../services/api';
import './managerReports.css';

const Reports = ({ user }) => {
  const [reportType, setReportType] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({
    taskStats: { completed: 0, total: 0, inProgress: 0, pending: 0, rejected: 0, completionRate: 0 },
    leaveStats: { totalTaken: 0, pending: 0, approved: 0, rejected: 0 },
    attendanceStats: { average: 0, presentDays: 0, totalDays: 0, lateArrivals: 0 },
    employees: [],
    reportPeriod: '',
    generatedAt: ''
  });

  // ============================================
  // LOAD REPORT DATA
  // ============================================
  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await managerApi.getReports(reportType);
      console.log('📊 Report data:', response.data);
      
      if (response.data) {
        setReportData(response.data);
      }
    } catch (err) {
      console.error('❌ Error loading report:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  // ============================================
  // EXPORT CSV
  // ============================================
  const handleExportCsv = useCallback(async () => {
    try {
      const response = await managerApi.exportReportCsv(reportType);
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('❌ Error exporting report:', err);
      alert('Failed to export report');
    }
  }, [reportType]);

  // ============================================
  // GET PERFORMANCE CLASS
  // ============================================
  const getPerformanceClass = useCallback((performance) => {
    switch(performance?.toLowerCase()) {
      case 'excellent': return 'reports-performance-excellent';
      case 'good': return 'reports-performance-good';
      case 'average': return 'reports-performance-average';
      case 'needs improvement': return 'reports-performance-needs-improvement';
      case 'poor': return 'reports-performance-poor';
      default: return '';
    }
  }, []);

  // ============================================
  // USE EFFECT
  // ============================================
  useEffect(() => {
    loadReportData();
    
    const handleDataUpdate = () => {
      loadReportData();
    };
    
    window.addEventListener('taskUpdated', handleDataUpdate);
    window.addEventListener('leaveRequestUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('taskUpdated', handleDataUpdate);
      window.removeEventListener('leaveRequestUpdated', handleDataUpdate);
    };
  }, [loadReportData]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="reports-loading">
        <div className="reports-loading-spinner"></div>
        <p>Loading report...</p>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <div className="reports-error">
        <p>❌ {error}</p>
        <button onClick={loadReportData} className="reports-retry-btn">🔄 Retry</button>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="reports-container">
      <div className="reports-header">
        <h4>Team Reports</h4>
        <div className="reports-actions">
          <div className="reports-filters">
            <button 
              className={`reports-filter-btn ${reportType === 'weekly' ? 'reports-active' : ''}`} 
              onClick={() => setReportType('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`reports-filter-btn ${reportType === 'monthly' ? 'reports-active' : ''}`} 
              onClick={() => setReportType('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`reports-filter-btn ${reportType === 'quarterly' ? 'reports-active' : ''}`} 
              onClick={() => setReportType('quarterly')}
            >
              Quarterly
            </button>
            <button 
              className={`reports-filter-btn ${reportType === 'yearly' ? 'reports-active' : ''}`} 
              onClick={() => setReportType('yearly')}
            >
              Yearly
            </button>
          </div>
          <button onClick={handleExportCsv} className="reports-export-btn">
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="reports-cards">
        <div className="reports-card">
          <div className="reports-card-icon">✅</div>
          <div className="reports-card-info">
            <span>Tasks Completed</span>
            <strong>{reportData.taskStats?.completed || 0}/{reportData.taskStats?.total || 0}</strong>
            <small>{reportData.taskStats?.completionRate || 0}% completion rate</small>
          </div>
        </div>
        <div className="reports-card">
          <div className="reports-card-icon">📋</div>
          <div className="reports-card-info">
            <span>Leaves Taken</span>
            <strong>{reportData.leaveStats?.totalTaken || 0}</strong>
            <small>{reportData.reportPeriod || 'This period'}</small>
          </div>
        </div>
        <div className="reports-card">
          <div className="reports-card-icon">📅</div>
          <div className="reports-card-info">
            <span>Attendance Rate</span>
            <strong>{reportData.attendanceStats?.average || 0}%</strong>
            <small>Average</small>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="reports-table-wrapper">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Position</th>
              <th>Tasks Completed</th>
              <th>Task Rate</th>
              <th>Leaves</th>
              <th>Attendance</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {reportData.employees && reportData.employees.length > 0 ? (
              reportData.employees.map((emp, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="reports-employee-cell">
                      <span className="reports-employee-name">{emp.employeeName || 'N/A'}</span>
                    </div>
                  </td>
                  <td>{emp.department || 'N/A'}</td>
                  <td>{emp.position || 'N/A'}</td>
                  <td>{emp.tasks?.completed || 0}/{emp.tasks?.total || 0}</td>
                  <td>{emp.tasks?.completionRate || 0}%</td>
                  <td>{emp.leaves?.totalTaken || 0}</td>
                  <td>{emp.attendance?.average || 0}%</td>
                  <td className={getPerformanceClass(emp.performance)}>
                    {emp.performance || 'N/A'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="reports-no-data">
                  No employees found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Report Footer */}
      <div className="reports-footer">
        <span className="reports-period">
          📅 Period: {reportData.reportPeriod || reportType}
        </span>
        <span className="reports-generated">
          Generated: {reportData.generatedAt ? new Date(reportData.generatedAt).toLocaleString() : new Date().toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default Reports;