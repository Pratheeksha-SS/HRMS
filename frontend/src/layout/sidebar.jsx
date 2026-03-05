import { useState } from 'react';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Employees', icon: '👥' },
    { name: 'Attendance', icon: '📅' },
    { name: 'Leave Management', icon: '📝' },
    { name: 'Departments', icon: '🏢' },
    { name: 'Recruitment', icon: '🎯' }
  ];

  return (
    <div style={{
      width: '260px',
      backgroundColor: 'white',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo Area */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700',
          color: '#4361ee',
          marginBottom: '4px'
        }}>
          HRMS
        </h1>
        <div style={{ 
          fontSize: '14px',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>HRMS Project</span>
          <span style={{
            backgroundColor: '#f0f4ff',
            color: '#4361ee',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px'
          }}>
            v1.0
          </span>
        </div>
      </div>

      {/* Admin Info */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
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
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Admin</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Administrator</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div style={{ flex: 1, padding: '20px 0' }}>
        {menuItems.map((item) => (
          <div
            key={item.name}
            onClick={() => setActiveItem(item.name)}
            style={{
              padding: '12px 20px',
              margin: '4px 8px',
              borderRadius: '8px',
              backgroundColor: activeItem === item.name ? '#f0f4ff' : 'transparent',
              color: activeItem === item.name ? '#4361ee' : '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: activeItem === item.name ? '500' : '400' }}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Getting Started Section */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #e5e7eb'
      }}>
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
  );
};

export default Sidebar;