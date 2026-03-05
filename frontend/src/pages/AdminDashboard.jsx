import { useState } from 'react';

const AdminDashboard = ({ user }) => {
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
        <div style={{ padding: '24px 20px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700',
            color: '#4361ee',
            margin: 0
          }}>
            HRMS
          </h1>
          <p style={{ 
            fontSize: '12px', 
            color: '#666',
            margin: '4px 0 0 0'
          }}>
            HRMS PROJECT
          </p>
        </div>

        {/* Admin Profile */}
        <div style={{ padding: '0 20px 20px 20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#4361ee',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '18px'
            }}>
              A
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>Admin</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Administrator</div>
            </div>
            <div style={{ marginLeft: 'auto', color: '#4361ee', fontSize: '18px' }}>O</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div style={{ flex: 1, padding: '20px 0' }}>
          {['Dashboard', 'Employees', 'Attendance', 'Leave Management', 'Departments', 'Recruitment'].map((item, index) => (
            <div
              key={item}
              style={{
                padding: '12px 20px',
                margin: '4px 8px',
                borderRadius: '8px',
                backgroundColor: item === 'Dashboard' ? '#eef2ff' : 'transparent',
                color: item === 'Dashboard' ? '#4361ee' : '#666',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: item === 'Dashboard' ? '500' : '400'
              }}
            >
              {item}
            </div>
          ))}
          
          {/* Logout Button */}
          <div
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('user_role');
              localStorage.removeItem('username');
              window.location.href = '/';
            }}
            style={{
              padding: '12px 20px',
              margin: '20px 8px 4px 8px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Logout
          </div>
        </div>

        {/* Getting Started */}
        <div style={{ padding: '20px' }}>
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '16px',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Getting Started
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
              30% Complete
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#e5e7eb',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                backgroundColor: '#4361ee',
                borderRadius: '3px'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            margin: '0 0 8px 0',
            color: '#1a1a1a'
          }}>
            Hello, Admin
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#666',
            margin: 0
          }}>
            Welcome Back, Admin
          </p>
        </div>

        {/* New Employee Button */}
        <button style={{
          backgroundColor: '#4361ee',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>+</span> New Employee
        </button>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* Total Employees */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Total Employees</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>2</div>
            <div style={{ color: '#10b981', fontSize: '14px', marginTop: '4px' }}>~18%</div>
          </div>

          {/* Departments */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Departments</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>2</div>
            <div style={{ color: '#10b981', fontSize: '14px', marginTop: '4px' }}>~5%</div>
          </div>

          {/* Success Rate */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>Success Rate</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>97.3%</div>
            <div style={{ color: '#10b981', fontSize: '14px', marginTop: '4px' }}>2.4%</div>
          </div>

          {/* P95 Latency */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>P95 Latency</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>234ms</div>
            <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>12%</div>
          </div>
        </div>

        {/* HRMS Control Room */}
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
            HRMS Control Room
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* Left Column */}
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Dept</span>
                  <span style={{ color: '#4361ee', fontWeight: '600' }}>8</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: '70%', 
                    height: '100%', 
                    backgroundColor: '#4361ee',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>New Employee</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>8</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: '85%', 
                    height: '100%', 
                    backgroundColor: '#10b981',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Attendance Pulse</span>
                  <span style={{ color: '#f59e0b', fontWeight: '600' }}>94%</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: '94%', 
                    height: '100%', 
                    backgroundColor: '#f59e0b',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Database Connection Active</span>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>✓</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    backgroundColor: '#10b981',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '16px 24px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <span style={{ color: '#666' }}>2 Departments Configured</span>
          <span style={{ color: '#666' }}>Review Pending Leave Requests</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;