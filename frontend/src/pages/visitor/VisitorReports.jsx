import { useState, useEffect } from 'react';
import axios from 'axios';
import { extractListData } from '../../utils/extractListData';

const VisitorReports = ({ user }) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [dailyLogs, setDailyLogs] = useState([]);
  const [visitorHistory, setVisitorHistory] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyLogs();
    } else if (activeTab === 'history') {
      fetchVisitorHistory();
    } else if (activeTab === 'department') {
      fetchDepartmentStats();
    } else if (activeTab === 'active') {
      fetchActiveVisitors();
    }
    fetchSummary();
  }, [activeTab, selectedDate, dateRange]);

  const fetchDailyLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reports/daily-logs/?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDailyLogs(response.data.visits || []);
    } catch (error) {
      console.error('Error fetching daily logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitorHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reports/history/?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisitorHistory(response.data.visits || []);
    } catch (error) {
      console.error('Error fetching visitor history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reports/department-stats/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartmentStats(extractListData(response.data));
    } catch (error) {
      console.error('Error fetching department stats:', error);
      setDepartmentStats([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveVisitors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reports/active-visitors/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveVisitors(response.data.active_visitors || []);
    } catch (error) {
      console.error('Error fetching active visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/reports/summary/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'EXPECTED': '#f59e0b',
      'CHECKED_IN': '#10b981',
      'COMPLETED': '#6b7280',
      'CANCELLED': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusBadge = (status) => {
    const labels = {
      'EXPECTED': 'Expected',
      'CHECKED_IN': 'Checked In',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return labels[status] || status;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1a1a1a' }}>Visitor Reports & Analytics</h1>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Comprehensive visitor statistics and reports</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Today's Visits</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#4361ee' }}>{summary.summary?.today_visits || 0}</div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>{summary.summary?.today_active || 0} Active</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Weekly Visits</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>{summary.summary?.weekly_visits || 0}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Last 7 days</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Monthly Visits</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#8b5cf6' }}>{summary.summary?.monthly_visits || 0}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Last 30 days</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Total Visitors</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>{summary.summary?.total_visitors || 0}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>All Time</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
        {[
          { id: 'daily', label: 'Daily Logs', icon: '📅' },
          { id: 'history', label: 'Visitor History', icon: '📜' },
          { id: 'department', label: 'Department Stats', icon: '🏢' },
          { id: 'active', label: 'Active Visitors', icon: '🟢' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === tab.id ? '#4361ee' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#666',
              border: activeTab === tab.id ? 'none' : '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily Logs */}
      {activeTab === 'daily' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Daily Visitor Logs</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
          ) : dailyLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No visits found for this date</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Visitor</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Purpose</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Host</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Check In</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Check Out</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLogs.map(visit => (
                    <tr key={visit.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{visit.visitor_name}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{visit.purpose_display}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{visit.host_name_display || '-'}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString() : '-'}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{visit.check_out_time ? new Date(visit.check_out_time).toLocaleTimeString() : '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: `${getStatusColor(visit.status)}20`,
                          color: getStatusColor(visit.status)
                        }}>
                          {getStatusBadge(visit.status)}
                        </span>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Visitor History */}
      {activeTab === 'history' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Visitor History</h2>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#666', marginRight: '8px' }}>From:</label>
                <input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#666', marginRight: '8px' }}>To:</label>
                <input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                  style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <button
                onClick={fetchVisitorHistory}
                style={{ padding: '8px 20px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Apply Filter
              </button>
            </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
          ) : visitorHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No visits found in this date range</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Visitor</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Purpose</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Host</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Duration</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visitorHistory.map(visit => (
                    <tr key={visit.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', color: '#666' }}>{new Date(visit.expected_check_in).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{visit.visitor_name}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{visit.purpose_display}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{visit.host_name_display || '-'}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{visit.duration_hours ? `${visit.duration_hours} hrs` : '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: `${getStatusColor(visit.status)}20`,
                          color: getStatusColor(visit.status)
                        }}>
                          {getStatusBadge(visit.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Department Statistics */}
      {activeTab === 'department' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Department-wise Visitor Statistics</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
          ) : departmentStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No department statistics available</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Department</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Total Visits</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Unique Visitors</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Completed</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Cancelled</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', color: '#666' }}>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentStats.map((dept, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{dept.department || 'Unassigned'}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{dept.total_visits}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{dept.unique_visitors}</td>
                      <td style={{ padding: '12px', color: '#10b981' }}>{dept.completed_visits || 0}</td>
                      <td style={{ padding: '12px', color: '#ef4444' }}>{dept.cancelled_visits || 0}</td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#4361ee' }}>
                        {dept.total_visits > 0 ? Math.round((dept.completed_visits / dept.total_visits) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Active Visitors */}
      {activeTab === 'active' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Currently Active Visitors</h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
          ) : activeVisitors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <span style={{ fontSize: '48px' }}>🟢</span>
              <p style={{ marginTop: '16px' }}>No active visitors currently in the premises</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {activeVisitors.map(visit => (
                <div
                  key={visit.id}
                  style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    padding: '16px',
                    borderLeft: `4px solid #10b981`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '24px' }}>👤</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px' }}>{visit.visitor_name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{visit.visitor_type}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#10b981', backgroundColor: '#d1fae5', padding: '4px 8px', borderRadius: '20px' }}>
                      🟢 Active
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#666' }}>
                    <div>📋 {visit.purpose_display}</div>
                    <div>👔 Host: {visit.host_name_display || '-'}</div>
                    <div>🏢 Dept: {visit.department || '-'}</div>
                    <div>🚪 Gate: {visit.entry_gate}</div>
                    <div>⏰ Check-in: {visit.check_in_time ? new Date(visit.check_in_time).toLocaleTimeString() : '-'}</div>
                    {visit.vehicle_number && <div>🚗 Vehicle: {visit.vehicle_number}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitorReports;
