import { useState, useEffect } from 'react';
import axios from 'axios';

const InternManagement = ({ user }) => {
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [internDetails, setInternDetails] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taskForm, setTaskForm] = useState({
    task_name: '',
    task_description: '',
    due_date: '',
    total_marks: '',
    marks_obtained: '',
    feedback: ''
  });
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    check_in_time: '',
    check_out_time: '',
    remarks: ''
  });

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/?visitor_type=INTERN`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterns(response.data);
    } catch (error) {
      console.error('Error fetching interns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInternFullDetails = async (internId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/interns/${internId}/full-details/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInternDetails(response.data);
      setAttendance(response.data.recent_attendance || []);
      setTasks(response.data.recent_tasks || []);
    } catch (error) {
      console.error('Error fetching intern details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIntern = async (intern) => {
    setSelectedIntern(intern);
    await fetchInternFullDetails(intern.id);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/interns/${selectedIntern.id}/tasks/`, taskForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Task added successfully!');
      setShowTaskModal(false);
      setTaskForm({
        task_name: '',
        task_description: '',
        due_date: '',
        total_marks: '',
        marks_obtained: '',
        feedback: ''
      });
      await fetchInternFullDetails(selectedIntern.id);
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttendance = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/interns/${selectedIntern.id}/attendance/`, attendanceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Attendance recorded successfully!');
      setShowAttendanceModal(false);
      setAttendanceForm({
        date: new Date().toISOString().split('T')[0],
        status: 'PRESENT',
        check_in_time: '',
        check_out_time: '',
        remarks: ''
      });
      await fetchInternFullDetails(selectedIntern.id);
    } catch (error) {
      console.error('Error recording attendance:', error);
      alert('Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PRESENT': '#10b981',
      'ABSENT': '#ef4444',
      'LATE': '#f59e0b',
      'HALF_DAY': '#8b5cf6',
      'LEAVE': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getTaskStatusColor = (status) => {
    const colors = {
      'PENDING': '#f59e0b',
      'IN_PROGRESS': '#4361ee',
      'SUBMITTED': '#8b5cf6',
      'REVIEWED': '#10b981',
      'COMPLETED': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1a1a1a' }}>Intern Management</h1>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Manage interns, track attendance, and evaluate performance</p>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Left Panel - Intern List */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>Interns List</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading...</div>
          ) : interns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No interns found</div>
          ) : (
            interns.map(intern => (
              <div
                key={intern.id}
                onClick={() => handleSelectIntern(intern)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  backgroundColor: selectedIntern?.id === intern.id ? '#eef2ff' : '#f9fafb',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: selectedIntern?.id === intern.id ? '1px solid #4361ee' : '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {intern.photo ? (
                    <img src={intern.photo} alt={intern.full_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4361ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600' }}>
                      {intern.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{intern.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>ID: {intern.visitor_id}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Panel - Intern Details */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {!selectedIntern ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
              <span style={{ fontSize: '48px' }}>👨‍🎓</span>
              <p style={{ marginTop: '16px' }}>Select an intern from the list to view details</p>
            </div>
          ) : (
            <>
              {/* Intern Profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
                {selectedIntern.photo ? (
                  <img src={selectedIntern.photo} alt={selectedIntern.full_name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#4361ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: '600' }}>
                    {selectedIntern.full_name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>{selectedIntern.full_name}</h2>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>ID: {selectedIntern.visitor_id}</p>
                  <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    📞 {selectedIntern.phone_number} | ✉️ {selectedIntern.email || 'No email'}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    style={{ padding: '10px 16px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    + Add Task
                  </button>
                  <button
                    onClick={() => setShowAttendanceModal(true)}
                    style={{ padding: '10px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    + Mark Attendance
                  </button>
                </div>
              </div>

              {/* Intern Details Summary */}
              {internDetails?.intern_details && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>Course</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{internDetails.intern_details.course_name || '-'}</div>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>CGPA</div>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>{internDetails.intern_details.cgpa || '-'}</div>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>Attendance</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>{internDetails.intern_details.attendance_percentage || 0}%</div>
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>Task Completion</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#4361ee' }}>
                      {internDetails.total_tasks > 0 ? Math.round((internDetails.completed_tasks / internDetails.total_tasks) * 100) : 0}%
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs for Attendance and Tasks */}
              <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <button
                    onClick={() => document.getElementById('attendance-section').scrollIntoView({ behavior: 'smooth' })}
                    style={{ padding: '10px 0', background: 'none', border: 'none', color: '#4361ee', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Attendance Records
                  </button>
                  <button
                    onClick={() => document.getElementById('tasks-section').scrollIntoView({ behavior: 'smooth' })}
                    style={{ padding: '10px 0', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
                  >
                    Tasks & Marks
                  </button>
                </div>
              </div>

              {/* Attendance Records */}
              <div id="attendance-section" style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Attendance Records</h3>
                {attendance.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    No attendance records found
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Date</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Check In</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Check Out</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map(record => (
                          <tr key={record.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px', fontSize: '14px' }}>{record.date}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: `${getStatusColor(record.status)}20`,
                                color: getStatusColor(record.status)
                              }}>
                                {record.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#666' }}>{record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '-'}</td>
                            <td style={{ padding: '12px', color: '#666' }}>{record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '-'}</td>
                            <td style={{ padding: '12px', color: '#666' }}>{record.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tasks & Marks */}
              <div id="tasks-section">
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Tasks & Performance Marks</h3>
                {tasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    No tasks assigned yet
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Task Name</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Due Date</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Marks</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map(task => (
                          <tr key={task.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px', fontWeight: '500' }}>{task.task_name}</td>
                            <td style={{ padding: '12px', color: '#666' }}>{task.due_date || '-'}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: `${getTaskStatusColor(task.status)}20`,
                                color: getTaskStatusColor(task.status)
                              }}>
                                {task.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#666' }}>{task.marks_obtained ? `${task.marks_obtained}/${task.total_marks}` : '-'}</td>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#4361ee' }}>{task.percentage ? `${task.percentage}%` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showTaskModal && selectedIntern && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Add New Task</h2>
            <form onSubmit={handleAddTask}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Task Name *</label>
                <input
                  type="text"
                  name="task_name"
                  value={taskForm.task_name}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, task_name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Description</label>
                <textarea
                  name="task_description"
                  value={taskForm.task_description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, task_description: e.target.value }))}
                  rows="3"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Total Marks</label>
                <input
                  type="number"
                  name="total_marks"
                  value={taskForm.total_marks}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, total_marks: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Marks Obtained</label>
                <input
                  type="number"
                  name="marks_obtained"
                  value={taskForm.marks_obtained}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, marks_obtained: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Feedback</label>
                <textarea
                  name="feedback"
                  value={taskForm.feedback}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, feedback: e.target.value }))}
                  rows="2"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} style={{ padding: '10px 20px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Attendance Modal */}
      {showAttendanceModal && selectedIntern && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '450px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Mark Attendance</h2>
            <form onSubmit={handleAddAttendance}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Status *</label>
                <select
                  name="status"
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, status: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LEAVE">On Leave</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Check In Time</label>
                  <input
                    type="time"
                    name="check_in_time"
                    value={attendanceForm.check_in_time}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, check_in_time: e.target.value }))}
                    style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Check Out Time</label>
                  <input
                    type="time"
                    name="check_out_time"
                    value={attendanceForm.check_out_time}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, check_out_time: e.target.value }))}
                    style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Remarks</label>
                <textarea
                  name="remarks"
                  value={attendanceForm.remarks}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, remarks: e.target.value }))}
                  rows="2"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAttendanceModal(false)} style={{ padding: '10px 20px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>Save Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternManagement;