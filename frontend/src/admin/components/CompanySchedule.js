import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import './CompanySchedule.css';  // ← External CSS import

const CompanySchedule = ({ user }) => {
  const [schedules, setSchedules] = useState([]);
  const [viewType, setViewType] = useState('week');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    employeeId: '',
    employeeName: '',
    employeeEmail: '',
    date: '',
    shift: ''
  });
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    weekly: 0,
    monthly: 0
  });

  // ============================================
  // LOAD DATA
  // ============================================
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📤 Fetching schedules...');
      
      const [schedulesRes, usersRes] = await Promise.all([
        adminApi.getSchedules(),
        adminApi.getUsers()
      ]);

      let allSchedules = [];
      if (schedulesRes && schedulesRes.data) {
        if (Array.isArray(schedulesRes.data)) {
          allSchedules = schedulesRes.data;
        } else if (schedulesRes.data.data && Array.isArray(schedulesRes.data.data)) {
          allSchedules = schedulesRes.data.data;
        } else if (schedulesRes.data.content && Array.isArray(schedulesRes.data.content)) {
          allSchedules = schedulesRes.data.content;
        }
      }
      
      if (allSchedules.length === 0 && Array.isArray(schedulesRes)) {
        allSchedules = schedulesRes;
      }

      console.log('📋 Extracted schedules:', allSchedules.length);
      
      let allUsers = [];
      if (usersRes && usersRes.data) {
        if (Array.isArray(usersRes.data)) {
          allUsers = usersRes.data;
        } else if (usersRes.data.data && Array.isArray(usersRes.data.data)) {
          allUsers = usersRes.data.data;
        }
      }
      
      const employeeList = allUsers.filter(u => u.role === 'EMPLOYEE');
      console.log('👥 All employees:', employeeList.length);

      setSchedules(allSchedules);
      setEmployees(employeeList);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);

      const weeklyCount = allSchedules.filter(s => {
        if (!s.date) return false;
        const scheduleDate = new Date(s.date);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate >= today && scheduleDate <= endOfWeek;
      }).length;

      const monthlyCount = allSchedules.filter(s => {
        if (!s.date) return false;
        const d = new Date(s.date);
        return d.getMonth() === currentMonth.getMonth() && 
               d.getFullYear() === currentMonth.getFullYear();
      }).length;

      setStats({
        total: allSchedules.length,
        weekly: weeklyCount,
        monthly: monthlyCount
      });

    } catch (err) {
      console.error('❌ Error loading data:', err);
      setError('Failed to load schedules: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    loadData();
    
    const handleUpdate = () => {
      loadData();
    };
    
    window.addEventListener('scheduleCreated', handleUpdate);
    window.addEventListener('scheduleUpdated', handleUpdate);
    window.addEventListener('scheduleDeleted', handleUpdate);
    
    return () => {
      window.removeEventListener('scheduleCreated', handleUpdate);
      window.removeEventListener('scheduleUpdated', handleUpdate);
      window.removeEventListener('scheduleDeleted', handleUpdate);
    };
  }, [loadData]);

  // ============================================
  // GET FILTERED SCHEDULES
  // ============================================
  const getWeekSchedules = (schedulesData) => {
    if (!schedulesData || schedulesData.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    
    const filtered = schedulesData.filter(s => {
      if (!s.date) return false;
      const scheduleDate = new Date(s.date);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate >= today && scheduleDate <= endOfWeek;
    });
    
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getMonthSchedules = (schedulesData) => {
    if (!schedulesData || schedulesData.length === 0) return [];
    
    const filtered = schedulesData.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear();
    });
    
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // ============================================
  // GET FILTERED EMPLOYEES
  // ============================================
  const getFilteredEmployees = () => {
    if (!searchTerm.trim()) return employees;
    return employees.filter(emp => 
      emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // ============================================
  // CREATE SCHEDULE
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('📝 Creating schedule for employee:', scheduleForm.employeeName);
      
      const newSchedule = {
        employeeId: scheduleForm.employeeId,
        employeeName: scheduleForm.employeeName,
        employeeEmail: scheduleForm.employeeEmail,
        date: scheduleForm.date,
        shift: scheduleForm.shift,
        status: 'SCHEDULED'
      };

      await adminApi.createSchedule(newSchedule);
      alert(`✅ Schedule created for ${scheduleForm.employeeName}!`);
      setShowModal(false);
      setScheduleForm({ employeeId: '', employeeName: '', employeeEmail: '', date: '', shift: '' });
      await loadData();
      window.dispatchEvent(new Event('scheduleCreated'));
    } catch (err) {
      console.error('❌ Error creating schedule:', err);
      alert('❌ Failed to create schedule: ' + (err.response?.data?.message || err.message));
    }
  };

  // ============================================
  // DELETE SCHEDULE
  // ============================================
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    
    try {
      await adminApi.deleteSchedule(id);
      alert('✅ Schedule deleted successfully!');
      await loadData();
      window.dispatchEvent(new Event('scheduleDeleted'));
    } catch (err) {
      console.error('❌ Error deleting schedule:', err);
      alert('❌ Failed to delete schedule: ' + (err.response?.data?.message || err.message));
    }
  };

  // ============================================
  // GET SCHEDULES FOR SELECTED DATE
  // ============================================
  const getSchedulesForSelectedDate = () => {
    if (!selectedDate) return [];
    return schedules.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return d.getDate() === selectedDate && 
             d.getMonth() === currentMonth.getMonth() && 
             d.getFullYear() === currentMonth.getFullYear();
    });
  };

  // ============================================
  // CALENDAR RENDER
  // ============================================
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const monthSchedules = getMonthSchedules(schedules);
    const scheduleMap = {};
    
    monthSchedules.forEach(s => {
      if (!s.date) return;
      const day = new Date(s.date).getDate();
      if (!scheduleMap[day]) scheduleMap[day] = [];
      scheduleMap[day].push(s);
    });
    
    const rows = [];
    let dayCount = 1;
    
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    for (let week = 0; week < 6; week++) {
      const cells = [];
      for (let day = 0; day < 7; day++) {
        if ((week === 0 && day < startingDay) || dayCount > daysInMonth) {
          const isNextMonth = dayCount > daysInMonth;
          cells.push(
            <td key={`empty-${week}-${day}`} className={`admin-schedule-calendar-cell admin-schedule-empty ${isNextMonth ? 'admin-schedule-next-month' : ''}`}>
              <div className="admin-schedule-calendar-day-number">
                {isNextMonth ? dayCount - daysInMonth : ''}
              </div>
            </td>
          );
          if (dayCount > daysInMonth) dayCount++;
        } else {
          const currentDay = dayCount;
          const daySchedules = scheduleMap[currentDay] || [];
          const hasSchedule = daySchedules.length > 0;
          const isSelected = selectedDate === currentDay;
          const isToday = currentDay === todayDate && month === todayMonth && year === todayYear;
          const isWeekend = day === 0 || day === 6;
          
          cells.push(
            <td 
              key={`day-${currentDay}`} 
              className={`admin-schedule-calendar-cell 
                ${hasSchedule ? 'admin-schedule-has-schedule' : ''} 
                ${isSelected ? 'admin-schedule-selected-date' : ''}
                ${isToday ? 'admin-schedule-today' : ''}
                ${isWeekend ? 'admin-schedule-weekend' : ''}`}
              onClick={() => handleDateClick(currentDay, daySchedules)}
              style={{ cursor: 'pointer' }}
            >
              <div className="admin-schedule-calendar-day-number">{currentDay}</div>
              
              {hasSchedule && (
                <div className="admin-schedule-calendar-events">
                  {daySchedules.slice(0, 3).map((s, idx) => (
                    <div 
                      key={idx} 
                      className={`admin-schedule-calendar-event 
                        ${s.shift?.toLowerCase().includes('morning') ? 'admin-schedule-event-morning' : 
                          s.shift?.toLowerCase().includes('evening') ? 'admin-schedule-event-evening' : 
                          s.shift?.toLowerCase().includes('night') ? 'admin-schedule-event-night' : 
                          'admin-schedule-event-default'}`}
                      title={`${s.employeeName}: ${s.shift}`}
                    >
                      <span className="admin-schedule-event-time">
                        {s.shift?.match(/\d{1,2}:\d{2}\s*[AP]M/g)?.[0] || 'All day'}
                      </span>
                      <span className="admin-schedule-event-title">
                        {s.employeeName || 'Schedule'}
                      </span>
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="admin-schedule-calendar-event admin-schedule-event-more">
                      +{daySchedules.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </td>
          );
          dayCount++;
        }
      }
      rows.push(<tr key={`week-${week}`}>{cells}</tr>);
      if (dayCount > daysInMonth + 7) break;
    }
    return rows;
  };

  // ============================================
  // DATE HANDLERS
  // ============================================
  const handleDateClick = (date, daySchedules = []) => {
    setSelectedDate(date);
  };

  const clearSelectedDate = () => {
    setSelectedDate(null);
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="admin-schedule-wrapper">
        <div className="admin-schedule-loading">
          <div className="admin-schedule-loading-spinner"></div>
          <p>Loading schedules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-schedule-wrapper">
        <div className="admin-schedule-error">
          <p>❌ {error}</p>
          <button onClick={loadData} className="admin-schedule-retry-btn">🔄 Retry</button>
        </div>
      </div>
    );
  }

  const filteredSchedules = viewType === 'week' ? getWeekSchedules(schedules) : getMonthSchedules(schedules);
  const selectedDateSchedules = getSchedulesForSelectedDate();
  const filteredEmployees = getFilteredEmployees();

  return (
    <div className="admin-schedule-wrapper">
      <div className="admin-schedule-container">
        <div className="admin-schedule-header">
          <h4>📅 Company Schedule</h4>
          <div className="admin-schedule-header-actions">
            {selectedDate && (
              <button className="admin-schedule-btn-clear-date" onClick={clearSelectedDate}>
                Clear Selected Date ✕
              </button>
            )}
            <button className="admin-schedule-btn-primary" onClick={() => setShowModal(true)}>
              + Create Schedule
            </button>
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="admin-schedule-selected-date-info">
            <div className="admin-schedule-selected-date-header">
              <strong>📅 Selected Date: {selectedDate}</strong>
              <span>
                {new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}
              </span>
            </div>
            {selectedDateSchedules.length > 0 ? (
              <div className="admin-schedule-selected-date-schedules">
                <p>Schedules on this day:</p>
                <ul>
                  {selectedDateSchedules.map((s, idx) => (
                    <li key={idx}>
                      <strong>{s.employeeName || s.employee?.fullName}</strong> - {s.shift}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="admin-schedule-no-schedule-message">No schedules on this day</p>
            )}
          </div>
        )}

        {/* View Toggle */}
        <div className="admin-schedule-view-toggle">
          <button className={`admin-schedule-view-btn ${viewType === 'week' ? 'admin-schedule-active' : ''}`} onClick={() => setViewType('week')}>
            Week View
          </button>
          <button className={`admin-schedule-view-btn ${viewType === 'month' ? 'admin-schedule-active' : ''}`} onClick={() => setViewType('month')}>
            Month View
          </button>
        </div>

        {/* Stats */}
        <div className="admin-schedule-stats">
          <div className="admin-schedule-stat">
            <span>Total Schedules</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="admin-schedule-stat">
            <span>This Week</span>
            <strong>{stats.weekly}</strong>
          </div>
          <div className="admin-schedule-stat">
            <span>This Month</span>
            <strong>{stats.monthly}</strong>
          </div>
        </div>

        {/* Week View */}
        {viewType === 'week' ? (
          <div className="admin-schedule-table-wrapper">
            <table className="admin-schedule-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Shift</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-schedule-no-data">No schedules for this week</td>
                  </tr>
                ) : (
                  filteredSchedules.map(s => (
                    <tr key={s.id}>
                      <td>{s.employeeName || s.employee?.fullName || 'N/A'}</td>
                      <td>{s.date || 'N/A'}</td>
                      <td>{s.shift || 'N/A'}</td>
                      <td><span className="admin-schedule-status-scheduled">✓ {s.status || 'SCHEDULED'}</span></td>
                      <td>
                        <button className="admin-schedule-delete-btn" onClick={() => handleDelete(s.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-schedule-calendar-view">
            <div className="admin-schedule-calendar-nav">
              <button className="admin-schedule-nav-arrow" onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(currentMonth.getMonth() - 1);
                setCurrentMonth(newDate);
              }}>◀</button>
              <h3>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
              <button className="admin-schedule-nav-arrow" onClick={() => {
                const newDate = new Date(currentMonth);
                newDate.setMonth(currentMonth.getMonth() + 1);
                setCurrentMonth(newDate);
              }}>▶</button>
              <button className="admin-schedule-today-btn" onClick={() => setCurrentMonth(new Date())}>Today</button>
            </div>
            <div className="admin-schedule-calendar-table-wrapper">
              <table className="admin-schedule-calendar-table">
                <thead>
                  <tr>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <th key={d}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{renderCalendar()}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== CREATE SCHEDULE MODAL ===== */}
        {showModal && (
          <div className="admin-schedule-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-schedule-modal-content" onClick={e => e.stopPropagation()}>
              <div className="admin-schedule-modal-header">
                <h4>📝 Create Schedule for Employee</h4>
                <button onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="admin-schedule-modal-body">
                  <div className="admin-schedule-form-group">
                    <label>Select Employee *</label>
                    <input
                      type="text"
                      className="admin-schedule-search-input"
                      placeholder="Search employee by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select 
                      className="admin-schedule-form-control" 
                      value={scheduleForm.employeeId} 
                      onChange={e => {
                        const emp = employees.find(emp => emp.id === e.target.value);
                        setScheduleForm({
                          ...scheduleForm, 
                          employeeId: emp?.id || '', 
                          employeeName: emp?.fullName || '', 
                          employeeEmail: emp?.email || ''
                        });
                      }} 
                      required
                    >
                      <option value="">-- Select Employee --</option>
                      {filteredEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} ({emp.email}) {emp.department ? `- ${emp.department}` : ''}
                        </option>
                      ))}
                    </select>
                    {scheduleForm.employeeName && (
                      <div className="admin-schedule-selected-employee">
                        Selected: {scheduleForm.employeeName}
                      </div>
                    )}
                  </div>
                  <div className="admin-schedule-form-group">
                    <label>Date *</label>
                    <input 
                      type="date" 
                      className="admin-schedule-form-control" 
                      value={scheduleForm.date} 
                      onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="admin-schedule-form-group">
                    <label>Shift *</label>
                    <select 
                      className="admin-schedule-form-control" 
                      value={scheduleForm.shift} 
                      onChange={e => setScheduleForm({...scheduleForm, shift: e.target.value})} 
                      required
                    >
                      <option value="">-- Select Shift --</option>
                      <option value="Morning (9:00 AM - 5:00 PM)">🌅 Morning (9:00 AM - 5:00 PM)</option>
                      <option value="Evening (2:00 PM - 10:00 PM)">🌆 Evening (2:00 PM - 10:00 PM)</option>
                      <option value="Night (10:00 PM - 6:00 AM)">🌙 Night (10:00 PM - 6:00 AM)</option>
                    </select>
                  </div>
                </div>
                <div className="admin-schedule-modal-buttons">
                  <button type="button" className="admin-schedule-btn-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-schedule-btn-submit">
                    {scheduleForm.employeeName ? `📅 Schedule ${scheduleForm.employeeName}` : 'Create Schedule'}
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

export default CompanySchedule;