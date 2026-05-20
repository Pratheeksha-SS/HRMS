import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/password-reset/confirm/`,
        {
          uid,
          token,
          new_password: password,
          confirm_password: confirmPassword
        },
        {
          // This endpoint should work without an auth token.
          // The app global axios config may still include one (from login), so we clear it here.
          headers: { Authorization: null }
        }
      );

      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
    }}>
      <div style={{ 
        width: '400px',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          fontSize: '28px', 
          color: '#1e3a8a',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          Reset Password
        </h2>

        {message && (
          <div style={{ 
            color: '#4caf50', 
            marginBottom: '20px', 
            padding: '12px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ 
            color: '#d32f2f', 
            marginBottom: '20px', 
            padding: '12px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none'
              }}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              backgroundColor: '#4caf50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;