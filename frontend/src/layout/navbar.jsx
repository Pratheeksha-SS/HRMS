import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    
    // Set user to null to trigger redirect to login
    setUser(null);
    navigate('/');
  };
  
  return (
    <div style={{
      height: '70px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '16px', color: '#666' }}>Hello,</span>
        <span style={{ fontSize: '18px', fontWeight: '600' }}>{user?.username || 'Admin'}</span>
        <span style={{
          backgroundColor: '#f0f4ff',
          color: '#4361ee',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '500'
        }}>
          Admin
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>Administrator</span>
        <button 
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#4361ee',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer'
        }}>
          O
        </div>
      </div>
    </div>
  );
};

export default Navbar;