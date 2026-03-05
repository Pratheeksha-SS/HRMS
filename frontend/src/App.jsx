import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from "./components/Login";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

// Setup axios
axios.defaults.baseURL = "http://localhost:8000/api";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    
    console.log('🔍 App.jsx - Checking localStorage:', { 
      token: token ? 'exists' : 'missing', 
      role, 
      username 
    });
    
    if (token && role && username) {
      console.log('✅ User found in storage:', { username, role });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser({ username, role });
    } else {
      console.log('❌ No user found in storage');
    }
    setLoading(false);
  }, []);

  console.log('🔄 App.jsx - Current user state:', user);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      Loading...
    </div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            !user ? (
              <Login setUser={setUser} />
            ) : user.role === 'ADMIN' ? (
              <Navigate to="/admin" replace />
            ) : user.role === 'EMPLOYEE' ? (
              <Navigate to="/employee" replace />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        <Route
          path="/admin"
          element={
            user?.role === 'ADMIN' ? (
              <AdminDashboard user={user} setUser={setUser} />
            ) : (
              console.log('⛔ Not admin, redirecting to /') || <Navigate to="/" replace />
            )
          }
        />

        <Route
          path="/employee"
          element={
            user?.role === 'EMPLOYEE' ? (
              <EmployeeDashboard user={user} setUser={setUser} />
            ) : (
              console.log('⛔ Not employee, redirecting to /') || <Navigate to="/" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;