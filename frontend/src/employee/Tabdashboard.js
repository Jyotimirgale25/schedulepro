import React, { useState, useEffect, useCallback } from 'react';
import './Tabdashboard.css';
import { employeeApi } from '../services/api';

const Dashboard = ({ user, setActiveTab, isSidebarCollapsed }) => { // ✅ Added isSidebarCollapsed prop
  const [schedules, setSchedules] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingCount: 0,
    completionRate: 0,
    onTimeRate: 0,
    productivityScore: 0
  });
  const [stats, setStats] = useState({
    shiftsThisMonth: 0,
    leavesTaken: 0,
    hoursWorked: 0,
    attendanceRate: 0
  });
  // ============================================
// CALCULATE ON-TIME RATE
// ============================================
const calculateOnTimeRate = (tasks) => {
  // Get only completed/approved tasks
  const completedTasks = tasks.filter(t => 
    t.status === 'COMPLETED' || t.status === 'APPROVED'
  );
  
  if (completedTasks.length === 0) return 0;
  
  let onTimeCount = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  completedTasks.forEach(task => {
    // If task has due date
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      // If task was completed on or before due date
      const completedAt = task.completedAt || task.updatedAt || task.createdAt;
      if (completedAt) {
        const completedDate = new Date(completedAt);
        completedDate.setHours(0, 0, 0, 0);
        
        if (completedDate <= dueDate) {
          onTimeCount++;
        }
      } else {
        // If no completion date, assume it's on time (or handle differently)
        onTimeCount++;
      }
    } else {
      // No due date = on time
      onTimeCount++;
    }
  });
  
  return Math.round((onTimeCount / completedTasks.length) * 100);
};

  // ===== LOAD SCHEDULES =====
const loadSchedules = useCallback(async () => {
  try {
    console.log('📤 Dashboard: Loading schedules for attendance...');
    
    const response = await employeeApi.getSchedules('all', new Date().toISOString());
    
    if (response && response.data && Array.isArray(response.data)) {
      const schedulesData = response.data;
      const upcomingSchedules = schedulesData.slice(0, 2);
      setSchedules(upcomingSchedules);
      
      // ✅ DEBUG: Log all statuses
      const allStatuses = schedulesData.map(s => s.status);
      console.log('📊 ALL SCHEDULE STATUSES:', allStatuses);
      console.log('📊 UNIQUE STATUSES:', [...new Set(allStatuses)]);
      
      const totalSchedules = schedulesData.length;
      
      // ✅ Check if any schedule is completed/attended
      const attendedShifts = schedulesData.filter(s => {
        const status = s.status?.toUpperCase() || '';
        return status === 'COMPLETED' || 
               status === 'ATTENDED' || 
               status === 'APPROVED' ||
               status === 'DONE' ||
               status === 'FINISHED';
      }).length;
      
      console.log(`📊 Total: ${totalSchedules}, Attended: ${attendedShifts}`);
      
      const attendanceRate = totalSchedules > 0 
        ? Math.round((attendedShifts / totalSchedules) * 100) 
        : 0;
      
      console.log(`📊 Attendance Rate: ${attendanceRate}%`);
      
      setStats(prev => ({ 
        ...prev, 
        shiftsThisMonth: totalSchedules,
        hoursWorked: totalSchedules * 8,
        attendanceRate: attendanceRate
      }));
    } else {
      setSchedules([]);
    }
  } catch (err) {
    console.error('❌ Error loading schedules:', err);
    setSchedules([]);
  }
}, []);

  // ===== LOAD LEAVE REQUESTS =====
  const loadLeaveRequests = useCallback(async () => {
    try {
      const response = await employeeApi.getLeaves();
      const leavesData = Array.isArray(response.data) ? response.data : [];
      const pendingLeaves = leavesData.filter(leave => leave.status === 'PENDING');
      setLeaveRequests(pendingLeaves.slice(0, 2));
      
      const approvedLeaves = leavesData.filter(leave => leave.status === 'APPROVED');
      const leavesTaken = approvedLeaves.reduce((total, leave) => total + (leave.totalDays || 1), 0);
      setStats(prev => ({ ...prev, leavesTaken }));
    } catch (err) {
      console.error('Error loading leaves:', err);
      setLeaveRequests([]);
    }
  }, []);

  // ===== LOAD PENDING TASKS =====
  const loadPendingTasks = useCallback(async () => {
    try {
      console.log('📤 Dashboard: Loading tasks from backend...');
      const response = await employeeApi.getTasks();
      console.log('📥 Tasks response:', response);
      
      if (response && response.data) {
        let allTasks = [];
        if (Array.isArray(response.data)) {
          allTasks = response.data;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          allTasks = response.data.content;
        } else if (response.data.tasks && Array.isArray(response.data.tasks)) {
          allTasks = response.data.tasks;
        } else if (typeof response.data === 'object' && response.data !== null) {
          if (response.data.id) {
            allTasks = [response.data];
          } else {
            allTasks = [];
          }
        }
        
        console.log('📊 Total tasks:', allTasks.length);
        
        const pending = allTasks
          .filter(task => 
            task.status !== 'APPROVED' && 
            task.status !== 'COMPLETED' &&
            task.status !== 'REJECTED'
          )
          .slice(0, 3);
        
        console.log('📋 Pending tasks to display:', pending);
        setPendingTasks(pending);
        
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
        const pendingCount = allTasks.filter(t => t.status === 'PENDING' || t.status === 'TODO' || t.status === 'NEW').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

// ✅ ADD THIS LINE - Call the function!
const onTimeRate = calculateOnTimeRate(allTasks);

const productivityScore = Math.round((completionRate + onTimeRate) / 2);
        setAnalytics({
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingCount,
          completionRate,
          onTimeRate: 85,
          productivityScore
        });
        
        console.log(`✅ Loaded ${pending.length} pending tasks out of ${totalTasks} total tasks`);
      } else {
        console.warn('⚠️ No tasks data received');
        setPendingTasks([]);
      }
    } catch (err) {
      console.error('❌ Error loading tasks:', err);
      setPendingTasks([]);
    }
  }, []);

  // ===== COMBINED LOADER =====
  const loadAllData = useCallback(() => {
    loadSchedules();
    loadLeaveRequests();
    loadPendingTasks();
  }, [loadSchedules, loadLeaveRequests, loadPendingTasks]);

  // ===== USE EFFECT =====
  useEffect(() => {
    loadAllData();
    
    const handleScheduleUpdate = () => loadSchedules();
    const handleLeaveUpdate = () => loadLeaveRequests();
    const handleTaskUpdate = () => loadPendingTasks();
    
    window.addEventListener('scheduleCreated', handleScheduleUpdate);
    window.addEventListener('leaveRequestCreated', handleLeaveUpdate);
    window.addEventListener('leaveRequestUpdated', handleLeaveUpdate);
    window.addEventListener('taskCreated', handleTaskUpdate);
    window.addEventListener('taskUpdated', handleTaskUpdate);
    window.addEventListener('storage', handleScheduleUpdate);
    
    return () => {
      window.removeEventListener('scheduleCreated', handleScheduleUpdate);
      window.removeEventListener('leaveRequestCreated', handleLeaveUpdate);
      window.removeEventListener('leaveRequestUpdated', handleLeaveUpdate);
      window.removeEventListener('taskCreated', handleTaskUpdate);
      window.removeEventListener('taskUpdated', handleTaskUpdate);
      window.removeEventListener('storage', handleScheduleUpdate);
    };
  }, [loadAllData, loadSchedules, loadLeaveRequests, loadPendingTasks]);



  const goToSchedule = () => {
    if (setActiveTab) {
      setActiveTab('schedule');
    } else {
      document.querySelector('.nav-item[data-tab="schedule"]')?.click();
    }
  };

  const goToTasks = () => {
    if (setActiveTab) {
      setActiveTab('tasks');
    } else {
      document.querySelector('.nav-item[data-tab="tasks"]')?.click();
    }
  };

  const goToLeaves = () => {
    if (setActiveTab) {
      setActiveTab('leave');
    } else {
      document.querySelector('.nav-item[data-tab="leave"]')?.click();
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED': return <span className="dash-badge dash-bg-success">✅ Approved</span>;
      case 'COMPLETED': return <span className="dash-badge dash-bg-success">✅ Completed</span>;
      case 'PENDING': return <span className="dash-badge dash-bg-warning">⏳ Pending</span>;
      case 'IN_PROGRESS': return <span className="dash-badge dash-bg-info">🔄 In Progress</span>;
      case 'Scheduled': return <span className="dash-badge dash-bg-success">✓ Scheduled</span>;
      case 'REJECTED': return <span className="dash-badge dash-bg-danger">❌ Rejected</span>;
      case 'TODO': return <span className="dash-badge dash-bg-secondary">📋 Todo</span>;
      case 'NEW': return <span className="dash-badge dash-bg-primary">🆕 New</span>;
      default: return <span className="dash-badge dash-bg-secondary">{status}</span>;
    }
  };

  const getDaysLeft = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    // ✅ Added dynamic margin based on sidebar state
    <div className={`dash-container ${isSidebarCollapsed ? 'dash-sidebar-collapsed' : ''}`}>
      <div className="dash-welcome-card">
        <div className="dash-welcome-avatar">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profile" className="dash-welcome-avatar-img" />
          ) : (
            <div className="dash-welcome-avatar-emoji">👤</div>
          )}
        </div>
        <div className="dash-welcome-info">
          <h3>Hello, {user?.fullName}! 👋</h3>
          <p>Welcome back to Schedule Pro. Here's what's happening with your schedule today.</p>
        </div>
      </div>

   
      <br></br>

      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-icon">📅</div>
          <div className="dash-stat-info">
            <h3>{stats.shiftsThisMonth}</h3>
            <p>Shifts This Month</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon">📋</div>
          <div className="dash-stat-info">
            <h3>{stats.leavesTaken}</h3>
            <p>Leaves Taken</p>
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-icon">⏰</div>
          <div className="dash-stat-info">
            <h3>{stats.hoursWorked}</h3>
            <p>Hours Worked</p>
          </div>
        </div>
        
      </div>

      <div className="dash-schedule-preview">
        <div className="dash-section-header">
          <h4>📅 Upcoming Schedule</h4>
          <button onClick={goToSchedule}>View All →</button>
        </div>
        <div className="dash-schedule-list">
          {schedules.length === 0 ? (
            <div className="dash-no-data">
              <p>No upcoming schedules</p>
              <small>Ask your manager to assign shifts</small>
            </div>
          ) : (
            schedules.map(schedule => (
              <div key={schedule.id} className="dash-schedule-item">
                <div>
                  <strong>{schedule.date}</strong>
                  <br />
                  <small>{new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'long' })}</small>
                </div>
                <div>⏰ {schedule.shift}</div>
                <div>{getStatusBadge(schedule.status)}</div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="dash-pending-tasks-preview">
        <div className="dash-section-header">
          <h4>⏰ Next Pending Work</h4>
          <button onClick={goToTasks}>View All →</button>
        </div>
        <div className="dash-pending-tasks-list">
          {pendingTasks.length === 0 ? (
            <div className="dash-no-data">
              <p>No pending tasks</p>
              <small>Great job! All tasks are complete.</small>
            </div>
          ) : (
            pendingTasks.map(task => {
              const daysLeft = getDaysLeft(task.dueDate);
              const isUrgent = daysLeft <= 3 && task.status !== 'COMPLETED' && task.status !== 'APPROVED';
              
              return (
                <div key={task.id} className={`dash-pending-task-item ${isUrgent ? 'dash-urgent' : ''}`}>
                  <div className="dash-task-info">
                    <div className="dash-task-name">
                      <strong>{task.title || task.taskName}</strong>
                      <span className="dash-task-project-badge">📁 {task.projectName || task.project?.name || 'No Project'}</span>
                    </div>
                    <div className="dash-task-due">
                      <span>📅 Due: {task.dueDate || 'No deadline'}</span>
                      {isUrgent ? (
                        <span className="dash-urgent-badge">⚠️ {daysLeft} days left</span>
                      ) : (
                        task.dueDate && <span className="dash-days-left">{daysLeft} days left</span>
                      )}
                    </div>
                    {task.status === 'IN_PROGRESS' && (
                      <div className="dash-task-progress-mini">
                        <div className="dash-progress-bar-mini">
                          <div className="dash-progress-fill-mini" style={{ width: `${task.progress || 0}%` }}></div>
                        </div>
                        <span>{task.progress || 0}%</span>
                      </div>
                    )}
                  </div>
                  <div className="dash-task-status-badge">
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="dash-analytics-dashboard">
        <div className="dash-analytics-header">
          <h4>📊 Performance Analytics</h4>
          <div className="dash-productivity-score">
            <span>Productivity Score</span>
            <div className="dash-score-value">{analytics.productivityScore}</div>
            <div className="dash-score-bar">
              <div className="dash-score-fill" style={{ width: `${analytics.productivityScore}%` }}></div>
            </div>
          </div>
        </div>

        <div className="dash-leaves-preview">
          <div className="dash-section-header">
            <h4>📋 Pending Leave Requests</h4>
            <button onClick={goToLeaves}>View All →</button>
          </div>
          <div className="dash-leaves-list">
            {leaveRequests.length === 0 ? (
              <div className="dash-no-data">No pending leave requests</div>
            ) : (
              leaveRequests.map(leave => (
                <div key={leave.id} className="dash-leave-item">
                  <div>
                    <strong>{leave.startDate} to {leave.endDate}</strong>
                    <p>{leave.reason}</p>
                  </div>
                  <div>{getStatusBadge(leave.status)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div> 
      
      <div className="dash-analytics-grid">
        <div className="dash-analytics-card">
          <div className="dash-analytics-icon">✅</div>
          <div className="dash-analytics-info">
            <span>Task Completion</span>
            <strong>{analytics.completionRate}%</strong>
            <small>{analytics.completedTasks}/{analytics.totalTasks} tasks</small>
          </div>
        </div>
        <div className="dash-analytics-card">
          <div className="dash-analytics-icon">⏰</div>
          <div className="dash-analytics-info">
            <span>On-Time Delivery</span>
            <strong>{analytics.onTimeRate}%</strong>
            <small>Completed before deadline</small>
          </div>
        </div>
        <div className="dash-analytics-card">
          <div className="dash-analytics-icon">📋</div>
          <div className="dash-analytics-info">
            <span>Task Status</span>
            <div className="dash-status-breakdown">
              <span className="dash-completed">✓ {analytics.completedTasks}</span>
              <span className="dash-in-progress">🔄 {analytics.inProgressTasks}</span>
              <span className="dash-pending">⏳ {analytics.pendingCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;