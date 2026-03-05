// src/layout/sidebar.jsx
const Sidebar = () => {
  const menuItems = [
    'Dashboard',
    'Employees',
    'Attendance',
    'Leave Management',
    'Departments',
    'Recruitment'
  ];

  return (
    <div style={{
      width: '250px',
      backgroundColor: 'white',
      borderRight: '1px solid #e5e7eb',
      padding: '24px 0'
    }}>
      <div style={{ padding: '0 20px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>HRMS Project</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Administrator</span>
          <span style={{ fontSize: '12px', color: '#4361ee' }}>O</span>
        </div>
      </div>
      
      {menuItems.map((item, index) => (
        <div
          key={index}
          style={{
            padding: '12px 20px',
            backgroundColor: item === 'Dashboard' ? '#f0f4ff' : 'transparent',
            color: item === 'Dashboard' ? '#4361ee' : '#666',
            borderLeft: item === 'Dashboard' ? '3px solid #4361ee' : 'none',
            cursor: 'pointer'
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;