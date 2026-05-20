import { useState, useEffect } from 'react';
import axios from 'axios';
import { extractListData } from '../../utils/extractListData';

const VisitManagement = ({ user }) => {
  const [visits, setVisits] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    visitor: '',
    purpose: 'MEETING',
    purpose_other: '',
    host: '',
    host_name: '',
    department: '',
    meeting_subject: '',
    meeting_room: '',
    expected_check_in: '',
    entry_gate: 'MAIN',
    vehicle_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchVisits();
    fetchVisitors();
    fetchEmployees();
  }, [filterStatus]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = filterStatus !== 'all' 
        ? `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visits/?status=${filterStatus}`
        : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(extractListData(response.data));
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitors = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisitors(extractListData(response.data));
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setVisitors([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/employees/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(extractListData(response.data));
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visits/`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Visit scheduled successfully!');
      setShowForm(false);
      resetForm();
      fetchVisits();
    } catch (error) {
      console.error('Error creating visit:', error);
      alert(error.response?.data?.message || 'Failed to schedule visit');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (visitId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visits/${visitId}/check-in/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Visitor checked in successfully!');
      fetchVisits();
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in visitor');
    }
  };

  const handleCheckOut = async (visitId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visits/${visitId}/check-out/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Visitor checked out successfully!');
      fetchVisits();
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to check out visitor');
    }
  };

  const resetForm = () => {
    setFormData({
      visitor: '',
      purpose: 'MEETING',
      purpose_other: '',
      host: '',
      host_name: '',
      department: '',
      meeting_subject: '',
      meeting_room: '',
      expected_check_in: '',
      entry_gate: 'MAIN',
      vehicle_number: '',
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'EXPECTED': '#f59e0b',
      'CHECKED_IN': '#10b981',
      'COMPLETED': '#6b7280',
      'CANCELLED': '#ef4444',
      'NO_SHOW': '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusBadge = (status) => {
    const labels = {
      'EXPECTED': 'Expected',
      'CHECKED_IN': 'Checked In',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
      'NO_SHOW': 'No Show'
    };
    return labels[status] || status;
  };

  const getGateIcon = (gate) => {
    const icons = {
      'MAIN': '🚪',
      'EAST': '➡️',
      'WEST': '⬅️',
      'NORTH': '⬆️',
      'SOUTH': '⬇️',
      'SERVICE': '🔧'
    };
    return icons[gate] || '🚪';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1a1a1a' }}>Visit Management</h1>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Schedule and track visitor visits</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            backgroundColor: '#4361ee',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>+</span> Schedule Visit
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['all', 'EXPECTED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '8px 16px',
              backgroundColor: filterStatus === status ? '#4361ee' : '#f3f4f6',
              color: filterStatus === status ? 'white' : '#666',
              border: 'none',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {status === 'all' ? 'All' : getStatusBadge(status)}
          </button>
        ))}
      </div>

      {/* Visits Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #4361ee', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading visits...
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Visitor</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Purpose</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Host</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Department</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Expected</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Gate</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#666' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(visit => (
                <tr key={visit.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{visit.visitor_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{visit.visitor_phone}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#666' }}>{visit.purpose_display}</td>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{visit.host_name_display || '-'}</td>
                  <td style={{ padding: '16px', color: '#666' }}>{visit.department || '-'}</td>
                  <td style={{ padding: '16px', color: '#666' }}>
                    {new Date(visit.expected_check_in).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '18px' }}>{getGateIcon(visit.entry_gate)}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: `${getStatusColor(visit.status)}20`,
                      color: getStatusColor(visit.status)
                    }}>
                      {getStatusBadge(visit.status)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {visit.status === 'EXPECTED' && (
                        <button
                          onClick={() => handleCheckIn(visit.id)}
                          style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Check In
                        </button>
                      )}
                      {visit.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => handleCheckOut(visit.id)}
                          style={{ padding: '6px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Check Out
                        </button>
                      )}
                    </div>
                   </td>
                 </tr>
              ))}
              {visits.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
                    No visits found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {showForm && (
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
            borderRadius: '20px',
            padding: '32px',
            width: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Schedule Visit</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Select Visitor *</label>
                <select
                  name="visitor"
                  value={formData.visitor}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="">Select a visitor</option>
                  {visitors.map(visitor => (
                    <option key={visitor.id} value={visitor.id}>
                      {visitor.full_name} ({visitor.visitor_id} - {visitor.visitor_type_display})
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Purpose of Visit *</label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="MEETING">Business Meeting</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="SERVICE">Service/Maintenance</option>
                  <option value="TRAINING">Training</option>
                  <option value="EVENT">Event</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              {formData.purpose === 'OTHER' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Specify Purpose</label>
                  <input
                    type="text"
                    name="purpose_other"
                    value={formData.purpose_other}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Host Name *</label>
                  <input
                    type="text"
                    name="host_name"
                    value={formData.host_name}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Meeting Subject</label>
                <input
                  type="text"
                  name="meeting_subject"
                  value={formData.meeting_subject}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Meeting Room</label>
                <input
                  type="text"
                  name="meeting_room"
                  value={formData.meeting_room}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Expected Check-in Time *</label>
                <input
                  type="datetime-local"
                  name="expected_check_in"
                  value={formData.expected_check_in}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Entry Gate</label>
                <select
                  name="entry_gate"
                  value={formData.entry_gate}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="MAIN">Main Gate</option>
                  <option value="EAST">East Gate</option>
                  <option value="WEST">West Gate</option>
                  <option value="NORTH">North Gate</option>
                  <option value="SOUTH">South Gate</option>
                  <option value="SERVICE">Service Gate</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Vehicle Number</label>
                <input
                  type="text"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                  placeholder="For parking pass"
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ padding: '12px 24px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '12px 24px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Scheduling...' : 'Schedule Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitManagement;
