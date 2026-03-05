// src/pages/EmployeeDashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const EmployeeDashboard = ({ user, setUser }) => {
  const [myLeaves, setMyLeaves] = useState([]);

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      const response = await axios.get('/leaves/');
      setMyLeaves(response.data);
    } catch (error) {
      console.error("Error fetching leaves:", error);
    }
  };

  const logout = () => {
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Employee Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>
      <p>Welcome, {user?.username}</p>
      {/* Add employee-specific content here */}
    </div>
  );
};

export default EmployeeDashboard;