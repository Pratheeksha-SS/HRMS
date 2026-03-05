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
      console.log("🔑 Attempting login for:", username);
      
      const response = await axios.post('http://localhost:8000/api/token/', {
        username,
        password
      });

      console.log("✅ Login response full data:", response.data);
      console.log("✅ Role received:", response.data.role);
      console.log("✅ Username received:", response.data.username);

      // Store everything
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_role', response.data.role);
      localStorage.setItem('username', response.data.username);

      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

      // Verify what was stored
      console.log("💾 Stored in localStorage:", {
        role: localStorage.getItem('user_role'),
        username: localStorage.getItem('username')
      });

      // Update user state
      setUser({
        username: response.data.username,
        role: response.data.role
      });

    } catch (error) {
      console.error("❌ Login error:", error);
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <form onSubmit={handleSubmit} style={{ 
        padding: '40px', 
        border: '1px solid #ccc', 
        borderRadius: '8px',
        width: '300px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>HRMS Login</h2>
        
        {error && (
          <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>

        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;