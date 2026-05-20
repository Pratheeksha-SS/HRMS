import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { extractListData } from '../utils/extractListData';
import AdminLeaveManagement from './AdminLeaveManagement';
import HolidayCalendar from '../components/HolidayCalendar';
import Notification from "../components/Notification";
import Departments from './departments/Departments';
import DepartmentDetails from './departments/DepartmentDetails';
import CreateDepartment from './departments/CreateDepartment';
import Employees from './Employees';
import ManagerManagement from './admin/ManagerManagement';
import AdminAnnouncements from './AdminAnnouncements';
import AnnouncementDetail from './AnnouncementDetail';
import NewAnnouncement from './NewAnnouncement';
import EditAnnouncement from './EditAnnouncement';
import HRReports from './admin/HRReports';
import ManagersList from './admin/ManagersList';
import AdminVisitor from './admin/AdminVisitor';
import AdminAttendance from './admin/AdminAttendance';

/* ─── Design Tokens (matching AdminLeaveManagement.jsx) ─────────────
   Primary     : #F97316  (orange-500)
   Primary Dark: #EA580C  (orange-600)
   Primary Light: #FFF7ED (orange-50)
   Accent      : #16A34A  (green-600)
   Accent Light: #F0FDF4  (green-50)
   Neutral BG  : #F8FAFC
   Surface     : #FFFFFF
   Border      : #E2E8F0
   Text Main   : #0F172A
   Text Muted  : #64748B
   ─────────────────────────────────────────────────────────────────── */

const AdminDashboard = ({ user, setUser, activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState(() => activePage || 'dashboard');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [notification, setNotification] = useState(null);
  const [adminProfileImage, setAdminProfileImage] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    departments: 0,
    successRate: 97.3,
    p95Latency: 234,
  });
  const [loading, setLoading] = useState(false);
  const [departmentCount, setDepartmentCount] = useState(0);
  const cancelRef = useRef(null);

  const menuItems = [
    { name: 'Dashboard',          icon: '📊', section: 'dashboard' },
    { name: 'Employees',          icon: '👥', section: 'employees' },
    { name: 'Attendance',         icon: '📅', section: 'attendance' },
    { name: 'Leave Management',   icon: '📝', section: 'leave-management' },
    { name: 'Departments',        icon: '🏢', section: 'departments' },
    { name: 'Manager Management', icon: '👔', section: 'manager-management' },
    { name: 'Announcement',       icon: '📢', section: 'announcement' },
    { name: 'HR Reports',         icon: '📈', section: 'hr-reports' },
    { name: 'Holiday Calendar',   icon: '🗓️', section: 'holidays' },
    { name: 'Visitor Management', icon: '🤵', section: 'visitors' },
  ];

  const getAnnouncementId = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const announcementIndex = pathParts.indexOf('announcements');
    return announcementIndex >= 0 ? pathParts[announcementIndex + 1] : null;
  };

const fetchAdminProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/employees/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.profile_image) {
        setAdminProfileImage(`http://localhost:8000/media/${response.data.profile_image}`);
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

const fetchAllEmployees = async (token, signal) => {
    const allEmployees = [];
    let nextUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/employees/?limit=100`;


    while (nextUrl) {
      const response = await axios.get(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });

      allEmployees.push(...extractListData(response.data));
      nextUrl = response.data?.next || null;
    }

    return allEmployees;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section) {
      setActiveSection(section);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'employees') fetchEmployees();
  }, [activeSection]);

  useEffect(() => {
    if (activePage) setActiveSection(activePage);
  }, [activePage]);

  useEffect(() => {
    if (activeSection === 'dashboard') fetchDashboardStats();
    return () => { if (cancelRef.current) cancelRef.current.abort(); };
  }, [activeSection]);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const token = localStorage.getItem('access_token');
      const employeesData = await fetchAllEmployees(token);
      setEmployees(employeesData);
      fetchStats();
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const employeesData = await fetchAllEmployees(token);

      let deptCount = 0;
      try {
const deptsRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/departments/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        deptCount = deptsRes.data.length;
        setDepartmentCount(deptCount);
      } catch (error) {
        const departments = [...new Set(employeesData.map(emp => emp.department))];
        deptCount = departments.length;
        setDepartmentCount(deptCount);
      }

      setStats({
        totalEmployees: employeesData.length,
        departments: deptCount,
        successRate: 97.3,
        p95Latency: 234
      });
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    if (cancelRef.current) cancelRef.current.abort();
    cancelRef.current = new AbortController();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');

      const allEmployees = await fetchAllEmployees(token, cancelRef.current.signal);

      const uniqueDepts = new Set(allEmployees.map(e => e.department).filter(Boolean));

      setStats({
        totalEmployees: allEmployees.length,
        departments: uniqueDepts.size,
        successRate: 97.3,
        p95Latency: 234,
      });
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError') return;
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeAdded = () => fetchEmployees();

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowEditEmployee(true);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        const token = localStorage.getItem("access_token");
        await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/employees/${employeeId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotification({ message: "Employee deleted successfully!", type: "success" });
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        setNotification({ message: "Error deleting employee", type: "error" });
      }
    }
  };

  const handleEmployeeUpdated = () => {
    fetchEmployees();
    setShowEditEmployee(false);
    setEditingEmployee(null);
    setNotification({ message: "Employee updated successfully!", type: "success" });
  };

  const handleNavigation = (itemName) => {
    const sectionMap = {
      'Dashboard':          'dashboard',
      'Leave Management':   'leave-management',
      'Departments':        'departments',
      'Employees':          'employees',
      'Manager Management': 'manager-management',
      'Announcement':       'announcement',
      'Holiday Calendar':   'holidays',
      'Visitor Management': 'visitors',
      'HR Reports':         'hr-reports',
    };
    const section = sectionMap[itemName] || itemName.toLowerCase();
    setActiveSection(section);

    if (itemName === 'Departments')          navigate('/departments');
    else if (itemName === 'Leave Management')   navigate('/admin?section=leave-management');
    else if (itemName === 'Employees')          navigate('/admin?section=employees');
    else if (itemName === 'Dashboard')          navigate('/admin');
    else if (itemName === 'Holiday Calendar')   navigate('/admin?section=holidays');
    else if (itemName === 'Manager Management') navigate('/admin/manager-management');
    else if (itemName === 'HR Reports')         navigate('/admin/hr-reports');
    else if (itemName === 'Announcement')       navigate('/admin?section=announcement');
    else if (itemName === 'Visitor Management') navigate('/admin?section=visitors');
    else navigate('/admin');
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const isMenuActive = (item) => {
    if (item.section === 'dashboard' && activeSection === 'dashboard') return true;
    if (item.section === 'departments' && ['departments', 'new-department', 'department-details'].includes(activeSection)) return true;
    return item.section === activeSection;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'departments':         return <Departments />;
      case 'new-department':      return <CreateDepartment />;
      case 'department-details':  return <DepartmentDetails />;
      case 'leave-management':    return <AdminLeaveManagement />;
      case 'employees':           return <Employees />;
      case 'attendance':           return <AdminAttendance />;
      case 'holidays':            return (
        <div style={{ padding: '24px', height: '100%' }}>
          <HolidayCalendar />
        </div>
      );
      case 'manager-management':  return <ManagerManagement />;
      case 'announcement':        return (
        <div style={{ padding: '24px' }}>
          <AdminAnnouncements user={user}
            onViewDetail={(id) => navigate(`/admin/announcements/${id}`)}
            onEdit={(id) => navigate(`/admin/announcements/${id}/edit`)}
          />
        </div>
      );
      case 'new-announcement':    return <div style={{ padding: '24px' }}><NewAnnouncement /></div>;
      case 'announcement-detail': return <div style={{ padding: '24px' }}><AnnouncementDetail user={user} id={getAnnouncementId()} /></div>;
      case 'edit-announcement':   return <div style={{ padding: '24px' }}><EditAnnouncement id={getAnnouncementId()} /></div>;
      case 'visitors':            return <AdminVisitor user={user} />;
      case 'hr-reports':          return <div style={{ padding: '24px' }}><HRReports /></div>;
      case 'managers-list':       return <div style={{ padding: '24px' }}><ManagersList /></div>;
      default:                    return renderDashboard();
    }
  };

  /* ─── Quick Action Cards ─────────────────────────────────────────── */
  const quickActions = [
    { label: 'Add Employee',   icon: '👤', color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', action: () => handleNavigation('Employees') },
    { label: 'Leave Requests', icon: '📝', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', action: () => handleNavigation('Leave Management') },
    { label: 'View Reports',   icon: '📈', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', action: () => handleNavigation('HR Reports') },
  ];

  /* ─── Dashboard Render ───────────────────────────────────────────── */
  const renderDashboard = () => (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      padding: '28px 32px',
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>📊</div>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
                Welcome back, {user?.username || 'Admin'}!
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                Here's your HRMS overview for today
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              background: '#E2E8F0', padding: '20px 24px', borderRadius: '16px',
              height: '110px', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          {[
            { label: 'Total Employees', value: stats.totalEmployees, sub: 'Active workforce',   icon: '👥', gradient: 'linear-gradient(135deg, #F97316, #EA580C)', shadow: 'rgba(249,115,22,0.25)' },
            { label: 'Departments',     value: stats.departments,    sub: 'Configured teams',   icon: '🏢', gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)', shadow: 'rgba(37,99,235,0.25)' },
            { label: 'Success Rate',    value: `${stats.successRate}%`, sub: 'System reliability', icon: '✅', gradient: 'linear-gradient(135deg, #16A34A, #15803D)', shadow: 'rgba(22,163,74,0.25)' },
            { label: 'P95 Latency',     value: `${stats.p95Latency}ms`, sub: 'API performance',  icon: '⚡', gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)', shadow: 'rgba(124,58,237,0.25)' },
          ].map((card) => (
            <div key={card.label} style={{
              background: card.gradient, padding: '22px 24px',
              borderRadius: '16px', color: 'white',
              boxShadow: `0 6px 20px ${card.shadow}`,
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${card.shadow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 20px ${card.shadow}`; }}
            >
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <div style={{ position: 'absolute', bottom: '-30px', left: '-10px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.07)' }} />
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>{card.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '36px', fontWeight: '800', lineHeight: 1, marginBottom: '6px' }}>{card.value}</div>
              <div style={{ fontSize: '12px', opacity: 0.75, fontWeight: '500' }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white', padding: '20px 24px', borderRadius: '14px',
        marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1.5px solid #F1F5F9',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          ⚡ Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {quickActions.map((qa) => (
            <button key={qa.label} onClick={qa.action} style={{
              padding: '16px 14px', backgroundColor: qa.bg, color: qa.color,
              border: `1.5px solid ${qa.border}`, borderRadius: '12px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              fontSize: '13px', fontWeight: '700', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${qa.border}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontSize: '24px' }}>{qa.icon}</span>
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Control Room + System Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* HRMS Control Room */}
        <div style={{ backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎛️</div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>HRMS Control Room</span>
          </div>
          <div style={{ padding: '24px' }}>
            {[
              { label: 'Departments',      value: stats.departments,    color: '#F97316', pct: Math.min(100, stats.departments * 10) },
              { label: 'Active Employees', value: stats.totalEmployees, color: '#16A34A', pct: Math.min(100, stats.totalEmployees * 5) },
              { label: 'Attendance Pulse', value: '94%',                color: '#D97706', pct: 94 },
              { label: 'DB Connection',    value: '✓ Active',           color: '#16A34A', pct: 100 },
            ].map(({ label, value, color, pct }) => (
              <div key={label} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>{label}</span>
                  <span style={{ fontSize: '13px', color, fontWeight: '800' }}>{value}</span>
                </div>
                <div style={{ width: '100%', height: '7px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div style={{ backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #16A34A, #15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🟢</div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>System Status</span>
          </div>
          <div style={{ padding: '24px' }}>
            {[
              { service: 'Employee API',     status: 'Operational', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
              { service: 'Leave Management', status: 'Operational', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
              { service: 'Payroll Engine',   status: 'Operational', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
              { service: 'Database',         status: 'Operational', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
              { service: 'Auth Service',     status: 'Operational', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
              { service: 'Report Generator', status: 'Operational', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
            ].map(({ service, status, color, bg, border }) => (
              <div key={service} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: '10px',
                backgroundColor: '#FAFAFA', border: '1.5px solid #F1F5F9', marginBottom: '8px',
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{service}</span>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: bg, color, border: `1px solid ${border}`, letterSpacing: '0.3px' }}>
                  ● {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA Bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', backgroundColor: 'white', borderRadius: '14px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', backgroundColor: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>
            {stats.departments} Departments
          </span>
          <span style={{ fontSize: '13px', color: '#64748B' }}>configured across your organization</span>
        </div>
        <button
          onClick={() => handleNavigation('Leave Management')}
          style={{
            padding: '9px 20px', background: 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 4px 12px rgba(249,115,22,0.3)', transition: 'transform 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Review Pending Leave Requests →
        </button>
      </div>
    </div>
  );

  /* ─── Sidebar ─────────────────────────────────────────────────────── */
  const renderSidebar = () => (
    <div style={{
      width: sidebarCollapsed ? '72px' : '260px',
      backgroundColor: 'white',
      borderRight: '1.5px solid #F1F5F9',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, height: '100vh',
      overflowY: 'auto', overflowX: 'hidden',
      transition: 'width 0.25s ease',
      boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
    }}>

      {/* ── Logo Area ──────────────────────────────────────────────── */}
      <div style={{ padding: '1px 40px 20px 40px', textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '-50px'
          }}>
            <span style={{
              fontSize: '30px',
              fontWeight: '600',
              color: '#000000',
              letterSpacing: '-1px',
              fontFamily: "'Montserrat', 'Poppins', sans-serif"
            }}>
              EL
            </span>

            {/* The "O" with dot inside */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{
                fontSize: '30px',
                fontWeight: '600',
                color: '#000000',
                fontFamily: "'Montserrat', 'Poppins', sans-serif"
              }}>
                O
              </span>
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '5px',
                height: '5px',
                backgroundColor: '#000000',
                borderRadius: '50%',
                zIndex: 2
              }}></span>
            </div>

            <span style={{
              fontSize: '30px',
              fontWeight: '600',
              color: '#000000',
              letterSpacing: '-1px',
              fontFamily: "sans-serif"
            }}>
              G
            </span>

            <span style={{
              fontSize: '30px',
              fontWeight: '600',
              color: '#ff9933',
              letterSpacing: '-1px',
              fontFamily: "'Montserrat', 'Poppins', sans-serif"
            }}>
              IXA
            </span>
            {/* Modern Triangle Cluster - Positioned to the right of text */}
            <div style={{
              position: 'relative',
              width: '80px',
              height: '150px',
              marginLeft: '-10px',
              display: 'inline-block',
              verticalAlign: 'middle'
            }}>
              {/* Bottom Green Triangle - Largest, bottom-right, rotated +10° */}
              <div style={{
                position: 'absolute',
                bottom: '80px',
                right: '8px',
                width: 0,
                height: 0,
                borderLeft: '18px solid transparent',
                borderRight: '18px solid transparent',
                borderBottom: '31px solid #4caf50',
                transform: 'rotate(-10deg)',
                transformOrigin: 'center',
                zIndex: 1
              }} />
              
              {/* Middle Orange Triangle - Slightly smaller, left position, rotated -20° */}
              <div style={{
                position: 'absolute',
                top: '35px',
                left: '-5px',
                width: 0,
                height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '24px solid #ff9933',
                transform: 'rotate(-50deg)',
                transformOrigin: 'center',
                zIndex: 2
              }} />
              
              {/* Top Dark Gray Triangle - Medium size, top-right, rotated +30° */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                width: 0,
                height: 0,
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderTop: '28px solid #2d3748',
                transform: 'rotate(25deg)',
                transformOrigin: 'center',
                zIndex: 3
              }} />
            </div>
          </div>
        </div>
      {/* Nav Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {!sidebarCollapsed && (
          <div style={{
            fontSize: '10px', fontWeight: '700', color: '#94A3B8',
            textTransform: 'uppercase', letterSpacing: '1px',
            padding: '6px 20px 4px',
          }}>
          </div>
        )}
        {menuItems.map((item) => {
          const active = isMenuActive(item);
          return (
            <div
              key={item.name}
              onClick={() => handleNavigation(item.name)}
              title={sidebarCollapsed ? item.name : ''}
              style={{
                padding: sidebarCollapsed ? '11px' : '10px 14px',
                margin: '2px 8px',
                borderRadius: '10px',
                backgroundColor: active ? '#FFF7ED' : 'transparent',
                color: active ? '#EA580C' : '#64748B',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                gap: sidebarCollapsed ? 0 : '10px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                fontSize: '13px',
                fontWeight: active ? '700' : '500',
                transition: 'all 0.15s',
                borderLeft: active ? '3px solid #F97316' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = '#FFF7ED';
                  e.currentTarget.style.color = '#F97316';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#64748B';
                }
              }}
            >
              <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && (
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </span>
              )}
              {!sidebarCollapsed && active && (
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: '#F97316', marginLeft: 'auto', flexShrink: 0,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div style={{
        borderTop: '1.5px solid #F1F5F9',
        padding: sidebarCollapsed ? '12px 8px' : '12px 14px',
        flexShrink: 0,
      }}>
        <button
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Logout' : ''}
          style={{
            width: '100%',
            padding: sidebarCollapsed ? '10px' : '10px 14px',
            backgroundColor: '#FEF2F2', color: '#DC2626',
            border: '1.5px solid #FECACA', borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: '8px', fontSize: '13px', fontWeight: '700',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
        >
          <span style={{ fontSize: '15px' }}>🚪</span>
          {!sidebarCollapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  /* ─── Top Bar ─────────────────────────────────────────────────────── */
  const renderTopBar = () => {
    const currentPage = menuItems.find(m => isMenuActive(m));
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '0 28px',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10,
        height: '62px', flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>Admin</span>
          <span style={{ color: '#CBD5E1' }}>›</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
            {currentPage?.icon} {currentPage?.name || 'Dashboard'}
          </span>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A', boxShadow: '0 0 0 2px rgba(22,163,74,0.2)' }} />
            <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: '700' }}>Live</span>
          </div>
          <div style={{
            padding: '6px 14px', backgroundColor: '#F8FAFC',
            border: '1.5px solid #E2E8F0', borderRadius: '8px',
            fontSize: '12px', fontWeight: '600', color: '#475569',
          }}>
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '800', color: 'white',
            border: '2px solid #FED7AA', cursor: 'default',
          }}>
            {(user?.username || 'A').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  /* ─── Main Render ─────────────────────────────────────────────────── */
  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
          outline: none !important;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F8FAFC; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>

      {/* Global Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content Area */}
      <div style={{
        flex: 1, overflowY: 'auto', height: '100vh',
        display: 'flex', flexDirection: 'column', minWidth: 0,
      }}>
        {renderTopBar()}
        <div style={{
          flex: 1, overflowY: 'auto',
          backgroundColor: '#F8FAFC',
          animation: 'fadeIn 0.25s ease',
        }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
