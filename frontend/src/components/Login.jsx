import { useState } from 'react';
import axios from 'axios';

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log('🔑 Login attempt for:', username);
      
      const response = await axios.post('http://localhost:8000/api/token/', {
        username,
        password
      });

      console.log('✅ Login response:', response.data);

      // Check what role we received
      const receivedRole = response.data.role;
      console.log('📋 Received role:', receivedRole);

      // Save to localStorage
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_role', receivedRole);
      localStorage.setItem('username', response.data.username);

      // Verify what was saved
      console.log('💾 Saved to localStorage:', {
        role: localStorage.getItem('user_role'),
        username: localStorage.getItem('username')
      });

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

      // Update user state
      setUser({
        username: response.data.username,
        role: receivedRole
      });

    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#f5f7fa'
    }}>
      <form onSubmit={handleSubmit} style={{ 
        padding: '40px', 
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        width: '350px'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          color: '#4361ee',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          HRMS
        </h1>
        <p style={{ 
          textAlign: 'center', 
          color: '#666',
          marginBottom: '32px'
        }}>
          Sign in to your account
        </p>
        
        {error && (
          <div style={{ 
            color: '#ef4444', 
            marginBottom: '20px', 
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            required
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#4361ee', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Sign In
        </button>
      </form>
    </div>
  );
};

export default Login;