import React, { useState, useEffect } from 'react';
import './managerTeamSchedule.css';
import { managerApi } from '../services/api';

const TeamSchedule = ({ user }) => {
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ 
    employeeId: '', 
    employeeName: '', 
    date: '', 
    shift: '' 
  });
  const [activeEmployees, setActiveEmployees] = useState([]);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadSchedules();
    loadActiveEmployees();
    
    const handleStorageChange = () => {
      loadSchedules();
      loadActiveEmployees();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('scheduleCreated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('scheduleCreated', handleStorageChange);
    };
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await managerApi.getTeamSchedules('week', new Date().toISOString());
      if (response.data) {
        setSchedules(response.data);
      }
    } catch (err) {
      console.error('Error loading schedules:', err);
    }
  };

  const loadActiveEmployees = async () => {
    try {
      const response = await managerApi.getTeam();
      if (response.data) {
        console.log('👥 Raw team data:', response.data);
        
        // ✅ Ensure we're using UUID from backend
        const active = response.data.filter(member => member.status === 'ACTIVE');
        setActiveEmployees(active);
        console.log('✅ Active employees:', active);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🖱️ CLICKED - Create Schedule');
    
    setLoading(true);
    
    try {
      // ✅ Find selected employee by UUID (String comparison)
      const selectedEmp = activeEmployees.find(e => String(e.id) === String(scheduleForm.employeeId));
      
      if (!selectedEmp) {
        alert('Please select an employee');
        setLoading(false);
        return;
      }
      
      console.log('✅ Selected Employee:', selectedEmp);
      
      const newSchedule = {
        // ✅ Send the UUID as string
        employeeId: String(selectedEmp.id),
        employeeName: selectedEmp.name || selectedEmp.fullName,
        employeeEmail: selectedEmp.email,
        date: scheduleForm.date,
        shift: scheduleForm.shift
      };
      
      console.log('📤 Creating schedule with UUID:', newSchedule);
      
      const response = await managerApi.createSchedule(newSchedule);
      console.log('✅ Schedule created:', response.data);
      
      await loadSchedules();
      setShowModal(false);
      setScheduleForm({ employeeId: '', employeeName: '', date: '', shift: '' });
      alert(`✅ Schedule created for ${newSchedule.employeeName}!`);
      window.dispatchEvent(new Event('scheduleCreated'));
    } catch (err) {
      console.error('❌ Error creating schedule:', err);
      console.error('❌ Error response:', err.response?.data);
      alert('❌ Failed to create schedule: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    console.log('🗑️ Delete clicked for ID:', id);
    
    if (!window.confirm('Delete this schedule?')) return;
    
    setLoading(true);
    try {
      await managerApi.deleteSchedule(String(id));
      await loadSchedules();
      window.dispatchEvent(new Event('scheduleCreated'));
      alert('✅ Schedule deleted successfully');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('❌ Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="team-schedule-container">
      <div className="team-schedule-header">
        <h4>📅 Team Schedule</h4>
        <button className="team-schedule-btn-primary" onClick={() => setShowModal(true)}>+ Create Schedule</button>
      </div>

      <div className="team-schedule-employee-count">
        <span>👥 Active Team Members: {activeEmployees.length}</span>
      </div>

      <div className="team-schedule-table-wrapper">
        <table className="team-schedule-table">
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
            {schedules.length === 0 ? (
              <tr>
                <td colSpan="5" className="team-schedule-no-data">No schedules created yet</td>
              </tr>
            ) : (
              schedules.map(s => (
                <tr key={s.id}>
                  <td>{s.employeeName || 'Unknown'}</td>
                  <td>{s.date}</td>
                  <td>{s.shift}</td>
                  <td><span className="team-schedule-status-scheduled">✓ Scheduled</span></td>
                  <td>
                    <button 
                      className="team-schedule-delete-btn" 
                      onClick={() => handleDelete(s.id)}
                      disabled={loading}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Schedule Modal */}
      {showModal && (
        <div className="team-schedule-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="team-schedule-modal-content" onClick={e => e.stopPropagation()}>
            <div className="team-schedule-modal-header">
              <h4>📝 Create Schedule</h4>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="team-schedule-form-group">
                <label>Select Employee *</label>
                <select 
                  className="team-schedule-form-control" 
                  value={scheduleForm.employeeId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedEmp = activeEmployees.find(emp => String(emp.id) === selectedId);
                    setScheduleForm({
                      ...scheduleForm,
                      employeeId: selectedId,
                      employeeName: selectedEmp?.name || selectedEmp?.fullName || ''
                    });
                  }}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.name || emp.fullName} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="team-schedule-form-group">
                <label>Date *</label>
                <input 
                  type="date" 
                  id="teamScheduleDate"
                  name="teamScheduleDate"
                  className="team-schedule-form-control" 
                  min={today}
                  value={scheduleForm.date} 
                  onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="team-schedule-form-group">
                <label>Shift *</label>
                <select 
                  id="teamScheduleShift"
                  name="teamScheduleShift"
                  className="team-schedule-form-control" 
                  value={scheduleForm.shift} 
                  onChange={e => setScheduleForm({...scheduleForm, shift: e.target.value})} 
                  required
                >
                  <option value="">Select Shift</option>
                  <option value="Morning (9:00 AM - 5:00 PM)">Morning (9:00 AM - 5:00 PM)</option>
                  <option value="Evening (2:00 PM - 10:00 PM)">Evening (2:00 PM - 10:00 PM)</option>
                  <option value="Night (10:00 PM - 6:00 AM)">Night (10:00 PM - 6:00 AM)</option>
                </select>
              </div>
              
              <div className="team-schedule-modal-buttons">
                <button type="button" className="team-schedule-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="team-schedule-btn-submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSchedule;