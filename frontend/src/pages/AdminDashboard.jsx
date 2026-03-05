import { useState, useEffect } from 'react';
import axios from 'axios';
// Import your layout components
import Navbar from '../layout/navbar';
import Sidebar from '../layout/sidebar';
import StatCard from '../components/StatCard';

const AdminDashboard = ({ user, setUser }) => {
  const [stats, setStats] = useState({
    totalEmployees: 2,
    departments: 2,
    successRate: 97.3,
    p95Latency: 234,
    payrollForecast: 3890
  });

  const [newEmployees, setNewEmployees] = useState([
    { name: 'Sumit', role: 'IT', status: 'Live' },
    { name: 'Rani', role: 'IT', status: 'Live' }
  ]);

  useEffect(() => {
    console.log("Admin Dashboard mounted - User:", user);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch real data from your backend
      const employeesRes = await axios.get('/employees/');
      const leavesRes = await axios.get('/leaves/');
      
      console.log("Fetched employees:", employeesRes.data);
      console.log("Fetched leaves:", leavesRes.data);
      
      // Update stats with real data
      setStats(prev => ({
        ...prev,
        totalEmployees: employeesRes.data.length || 2,
        // Add more stats as needed
      }));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const logout = () => {
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Navbar */}
        <Navbar user={user} onLogout={logout} />
        
        {/* Dashboard Content */}
        <div style={{ padding: '24px', backgroundColor: '#f5f7fa', flex: 1 }}>
          {/* Welcome Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
              Hello, {user?.username || 'Admin'}
            </h1>
            <p style={{ color: '#666' }}>
              Welcome Back, {user?.username || 'Admin'}
            </p>
          </div>

          {/* New Employee Button */}
          <div style={{ marginBottom: '24px' }}>
            <button style={{
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              + New Employee
            </button>
          </div>

          {/* Stats Cards Row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '20px',
            marginBottom: '24px'
          }}>
            <StatCard 
              title="Total Employees" 
              value={stats.totalEmployees} 
              change="+18%" 
              icon="👥"
            />
            <StatCard 
              title="Departments" 
              value={stats.departments} 
              change="+5%" 
              icon="🏢"
            />
            <StatCard 
              title="Success Rate" 
              value={`${stats.successRate}%`} 
              change="+2.4%" 
              icon="✅"
            />
            <StatCard 
              title="P95 Latency" 
              value={`${stats.p95Latency}ms`} 
              change="+12%" 
              icon="⏱️"
            />
          </div>

          {/* Second Row - Payroll Forecast */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '16px' }}>30-Day Payroll Forecast</h3>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold' }}>
                ${stats.payrollForecast}
              </span>
              <span style={{ color: '#10b981', marginLeft: '12px' }}>
                +12% Projected Spend
              </span>
            </div>
          </div>

          {/* Live New Employees Table */}
          <div style={{ 
            backgroundColor: 'white', 
            padding: '24px', 
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Live New Employees</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0' }}>NAME</th>
                  <th style={{ textAlign: 'left', padding: '12px 0' }}>ROLE</th>
                  <th style={{ textAlign: 'left', padding: '12px 0' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {newEmployees.map((emp, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 0' }}>{emp.name}</td>
                    <td style={{ padding: '12px 0' }}>{emp.role}</td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{ 
                        backgroundColor: '#d1fae5', 
                        color: '#065f46',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subscribe Section */}
          <div style={{ 
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <span>+ Subscribe</span>
            <div>
              <span style={{ marginRight: '16px' }}>Unused</span>
              <span>Used</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;