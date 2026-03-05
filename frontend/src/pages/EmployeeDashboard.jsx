import { useState } from 'react';

const EmployeeDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Sample data for employee
  const employeeInfo = {
    name: user?.username || 'Employee',
    id: 'EMP001',
    department: 'Information Technology',
    designation: 'Software Developer',
    joiningDate: '2024-01-15',
    email: 'employee@company.com',
    phone: '+1234567890'
  };

  const recentLeaves = [
    { type: 'Sick Leave', from: '2024-03-01', to: '2024-03-02', status: 'Approved', days: 2 },
    { type: 'Casual Leave', from: '2024-02-15', to: '2024-02-16', status: 'Approved', days: 2 },
    { type: 'Paid Leave', from: '2024-01-20', to: '2024-01-22', status: 'Rejected', days: 3 }
  ];

  const attendance = [
    { date: '2024-03-01', status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM' },
    { date: '2024-02-29', status: 'Present', checkIn: '08:55 AM', checkOut: '06:05 PM' },
    { date: '2024-02-28', status: 'Present', checkIn: '09:10 AM', checkOut: '06:00 PM' },
    { date: '2024-02-27', status: 'Present', checkIn: '08:50 AM', checkOut: '06:00 PM' },
    { date: '2024-02-26', status: 'Present', checkIn: '09:00 AM', checkOut: '05:30 PM' }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'leaves', label: 'Leave Requests', icon: '📝' },
    { id: 'salary', label: 'Salary', icon: '💰' },
    { id: 'holidays', label: 'Holidays', icon: '🎉' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Employee Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
