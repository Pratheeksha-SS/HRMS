import { useState } from 'react';

const EmployeeDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Sample data for employee
  const employeeInfo = {
    name: user?.username || 'Employee',
    id: 'EMP001',
    department: 'Information Technology',
    designation: 'Software Developer',
    joiningDate: '2024-01-15',
    email: 'employee@company.com',
    phone: '+1234567890'
  };

  const recentLeaves = [
    { type: 'Sick Leave', from: '2024-03-01', to: '2024-03-02', status: 'Approved', days: 2 },
    { type: 'Casual Leave', from: '2024-02-15', to: '2024-02-16', status: 'Approved', days: 2 },
    { type: 'Paid Leave', from: '2024-01-20', to: '2024-01-22', status: 'Rejected', days: 3 }
  ];

  const attendance = [
    { date: '2024-03-01', status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM' },
    { date: '2024-02-29', status: 'Present', checkIn: '08:55 AM', checkOut: '06:05 PM' },
    { date: '2024-02-28', status: 'Present', checkIn: '09:10 AM', checkOut: '06:00 PM' },
    { date: '2024-02-27', status: 'Present', checkIn: '08:50 AM', checkOut: '06:00 PM' },
    { date: '2024-02-26', status: 'Present', checkIn: '09:00 AM', checkOut: '05:30 PM' }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'leaves', label: 'Leave Requests', icon: '📝' },
    { id: 'salary', label: 'Salary', icon: '💰' },
    { id: 'holidays', label: 'Holidays', icon: '🎉' }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700',
            color: '#4361ee',
            margin: 0
          }}>
            HRMS
          </h1>
          <p style={{ 
            fontSize: '11px', 
            color: '#666',
            margin: '4px 0 0 0'
          }}>
            Employee Portal
          </p>
        </div>

        {/* Employee Profile Summary */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '45px',
              height: '45px',
              backgroundColor: '#10b981',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '20px'
            }}>
              {employeeInfo.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{employeeInfo.name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{employeeInfo.designation}</div>
              <div style={{ 
                fontSize: '11px', 
                color: '#10b981',
                backgroundColor: '#e6f7ee',
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-block',
                marginTop: '4px'
              }}>
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div style={{ flex: 1, padding: '20px 0' }}>
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                padding: '12px 20px',
                margin: '4px 8px',
                borderRadius: '8px',
                backgroundColor: activeTab === item.id ? '#eef2ff' : 'transparent',
                color: activeTab === item.id ? '#4361ee' : '#666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: activeTab === item.id ? '500' : '400'
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        {/* Employee ID */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Employee ID</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>{employeeInfo.id}</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px' 
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '600',
              margin: '0 0 4px 0',
              color: '#1a1a1a'
            }}>
              Welcome back, {employeeInfo.name}!
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#666',
              margin: 0
            }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          {/* Quick Actions */}
          <button style={{
            backgroundColor: '#4361ee',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📋</span> Apply for Leave
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Leave Balance</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>12</div>
            <div style={{ color: '#10b981', fontSize: '13px', marginTop: '4px' }}>Days Available</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Attendance This Month</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>18</div>
            <div style={{ color: '#10b981', fontSize: '13px', marginTop: '4px' }}>Days Present</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Pending Approvals</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>1</div>
            <div style={{ color: '#f59e0b', fontSize: '13px', marginTop: '4px' }}>Leave Request</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>Next Holiday</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>Holi</div>
            <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>March 25, 2024</div>
          </div>
        </div>

        {/* Employee Info Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600',
            margin: '0 0 20px 0',
            color: '#1a1a1a'
          }}>
            Employee Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Department</div>
              <div style={{ fontSize: '15px', fontWeight: '500' }}>{employeeInfo.department}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Designation</div>
              <div style={{ fontSize: '15px', fontWeight: '500' }}>{employeeInfo.designation}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Joining Date</div>
              <div style={{ fontSize: '15px', fontWeight: '500' }}>{employeeInfo.joiningDate}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Email</div>
              <div style={{ fontSize: '15px', fontWeight: '500' }}>{employeeInfo.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Phone</div>
              <div style={{ fontSize: '15px', fontWeight: '500' }}>{employeeInfo.phone}</div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Recent Leave Requests */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: '#1a1a1a'
            }}>
              Recent Leave Requests
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Duration</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.map((leave, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 0', fontSize: '14px' }}>{leave.type}</td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>{leave.days} days</td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: leave.status === 'Approved' ? '#d1fae5' : '#fee2e2',
                        color: leave.status === 'Approved' ? '#065f46' : '#991b1b'
                      }}>
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button style={{
              marginTop: '16px',
              color: '#4361ee',
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0
            }}>
              View All Requests →
            </button>
          </div>

          {/* Recent Attendance */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: '#1a1a1a'
            }}>
              Recent Attendance
            </h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Check In</th>
                  <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '13px', color: '#666' }}>Check Out</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 0', fontSize: '14px' }}>{record.date}</td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{
                        color: '#10b981',
                        fontWeight: '500'
                      }}>
                        {record.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>{record.checkIn}</td>
                    <td style={{ padding: '12px 0', fontSize: '14px', color: '#666' }}>{record.checkOut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button style={{
              marginTop: '16px',
              color: '#4361ee',
              background: 'none',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              padding: 0
            }}>
              View Full Attendance →
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          gap: '30px'
        }}>
          <div>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📄</span>
            <span style={{ fontSize: '14px', color: '#4361ee', cursor: 'pointer' }}>Download Salary Slip</span>
          </div>
          <div>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📅</span>
            <span style={{ fontSize: '14px', color: '#4361ee', cursor: 'pointer' }}>View Holiday Calendar</span>
          </div>
          <div>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📊</span>
            <span style={{ fontSize: '14px', color: '#4361ee', cursor: 'pointer' }}>Download Attendance Report</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
