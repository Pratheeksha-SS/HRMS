// src/layout/navbar.jsx
const Navbar = ({ user, onLogout }) => {
  return (
    <div style={{
      height: '64px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>HRMS</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span>Hello, {user?.username}</span>
        <span style={{ 
          backgroundColor: '#4361ee', 
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Admin
        </span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Navbar;