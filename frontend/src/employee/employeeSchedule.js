import React, { useState, useEffect, useCallback } from 'react';
import './employeeSchedule.css';
import { employeeApi } from '../services/api';

const Schedule = ({ user }) => {
  const [schedules, setSchedules] = useState([]);
  const [viewType, setViewType] = useState('week');
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ===== LOAD SCHEDULES =====
  const loadSchedules = useCallback(async () => {
    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await employeeApi.getSchedules("week", today);

      console.log("Schedules from API:", response.data);

      if (Array.isArray(response.data)) {
        setSchedules(response.data);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error loading schedules:", error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeekSchedules = useCallback(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return schedules
      .filter((schedule) => {
        const scheduleDate = new Date(schedule.date);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [schedules]);

  // ===== GET MONTH SCHEDULES =====
  const getMonthSchedules = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.getFullYear() === year && scheduleDate.getMonth() === month;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [schedules, currentMonth]);

  // ===== RENDER CALENDAR =====
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthSchedules = getMonthSchedules();
    const calendarRows = [];
    let dayCount = 1;
    
    const scheduleMap = {};
    monthSchedules.forEach(schedule => {
      const day = new Date(schedule.date).getDate();
      if (!scheduleMap[day]) {
        scheduleMap[day] = [];
      }
      scheduleMap[day].push(schedule);
    });
    
    for (let week = 0; week < 6; week++) {
      const cells = [];
      for (let day = 0; day < 7; day++) {
        if ((week === 0 && day < startingDayOfWeek) || dayCount > daysInMonth) {
          cells.push(<td key={`empty-${week}-${day}`} className="sched-calendar-cell sched-calendar-empty"></td>);
        } else {
          const hasSchedule = scheduleMap[dayCount] && scheduleMap[dayCount].length > 0;
          const daySchedules = scheduleMap[dayCount] || [];
          const isToday = dayCount === new Date().getDate() && 
                         month === new Date().getMonth() && 
                         year === new Date().getFullYear();
          
          cells.push(
            <td key={`day-${dayCount}`} className={`sched-calendar-cell ${hasSchedule ? 'sched-has-schedule' : ''} ${isToday ? 'sched-today' : ''}`}>
              <div className="sched-calendar-day-number">{dayCount}</div>
              {hasSchedule && (
                <div className="sched-calendar-shift-info">
                  {daySchedules.map((s, idx) => (
                    <div key={idx} className="sched-shift-badge" title={s.shift}>
                      {s.shift.substring(0, 10)}...
                    </div>
                  ))}
                </div>
              )}
            </td>
          );
          dayCount++;
        }
      }
      calendarRows.push(<tr key={`week-${week}`}>{cells}</tr>);
      if (dayCount > daysInMonth) break;
    }
    
    return calendarRows;
  };

  // ===== CHANGE MONTH =====
  const changeMonth = (delta) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  // ===== STATUS BADGE =====
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Scheduled': return <span className="sched-badge-scheduled">✓ Scheduled</span>;
      case 'Pending': return <span className="sched-badge-pending">⏳ Pending</span>;
      case 'Completed': return <span className="sched-badge-completed">✅ Completed</span>;
      default: return <span className="sched-badge-secondary">{status}</span>;
    }
  };

  // ===== USE EFFECT =====
  useEffect(() => {
    loadSchedules();
    
    const handleScheduleUpdate = () => {
      loadSchedules();
    };
    
    window.addEventListener('scheduleCreated', handleScheduleUpdate);
    window.addEventListener('storage', handleScheduleUpdate);
    
    return () => {
      window.removeEventListener('scheduleCreated', handleScheduleUpdate);
      window.removeEventListener('storage', handleScheduleUpdate);
    };
  }, [loadSchedules]);

  useEffect(() => {
    console.log('📅 React schedules state:', schedules);
    console.log('📅 React schedules length:', schedules.length);
  }, [schedules]);

  const weekSchedules = getWeekSchedules();
  const monthSchedules = getMonthSchedules();

  if (loading) return <div className="sched-loading">Loading schedule...</div>;

  return (
    <div className="sched-container">
      <div className="sched-header">
        <h4>📅 My Work Schedule</h4>
        <div className="sched-view-toggle">
          <button className={`sched-view-btn ${viewType === 'week' ? 'sched-view-active' : ''}`} onClick={() => setViewType('week')}>
            📆 Week View
          </button>
          <button className={`sched-view-btn ${viewType === 'month' ? 'sched-view-active' : ''}`} onClick={() => setViewType('month')}>
            📅 Month View
          </button>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="sched-no-data">
          <div className="sched-no-data-icon">📅</div>
          <p>No schedule assigned yet</p>
          <small>Your manager will assign shifts here</small>
        </div>
      ) : viewType === 'week' ? (
        <div className="sched-table-wrapper">
          <table className="sched-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Shift</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {weekSchedules.length === 0 ? (
                <tr>
                  <td colSpan="4" className="sched-no-data-cell">No schedules this week</td>
                </tr>
              ) : (
                weekSchedules.map(schedule => (
                  <tr key={schedule.id}>
                    <td className="sched-date-cell">
                      <span className="sched-date-number">{new Date(schedule.date).getDate()}</span>
                      <span className="sched-date-month">{new Date(schedule.date).toLocaleString('default', { month: 'short' })}</span>
                    </td>
                    <td className="sched-day-cell">{new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                    <td className="sched-shift-cell">⏰ {schedule.shift}</td>
                    <td className="sched-status-cell">{getStatusBadge(schedule.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sched-calendar-view">
          <div className="sched-calendar-nav">
            <button onClick={() => changeMonth(-1)} className="sched-calendar-nav-btn">◀</button>
            <h3 className="sched-calendar-month-title">
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => changeMonth(1)} className="sched-calendar-nav-btn">▶</button>
            <button onClick={() => setCurrentMonth(new Date())} className="sched-calendar-today-btn">Today</button>
          </div>
          
          <div className="sched-calendar-stats">
            <div className="sched-cal-stat">
              <span>📋 Total Shifts</span>
              <strong>{monthSchedules.length}</strong>
            </div>
            <div className="sched-cal-stat sched-cal-stat-scheduled">
              <span>✓ Scheduled</span>
              <strong>{monthSchedules.filter(s => s.status === 'Scheduled').length}</strong>
            </div>
            <div className="sched-cal-stat sched-cal-stat-pending">
              <span>⏳ Pending</span>
              <strong>{monthSchedules.filter(s => s.status === 'Pending').length}</strong>
            </div>
          </div>
          
          <div className="sched-calendar-table-wrapper">
            <table className="sched-calendar-table">
              <thead>
                <tr>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <th key={day} className="sched-calendar-weekday">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderCalendar()}
              </tbody>
            </table>
          </div>
          
          <div className="sched-calendar-legend">
            <span><span className="sched-legend-dot sched-legend-scheduled"></span> Has Schedule</span>
            <span><span className="sched-legend-dot sched-legend-today"></span> Today</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;