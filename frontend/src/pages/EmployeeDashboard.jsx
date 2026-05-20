import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import ApplyLeave from '../components/ApplyLeave';
import Notification from '../components/Notification';
import EmployeeHolidayPage from './EmployeeHolidayPage';
import { extractListData } from '../utils/extractListData';
import EmployeeAttendance from '../components/EmployeeAttendance';
import { Edit2, Lock } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
  outline: 'none', color: '#0F172A', backgroundColor: '#fff',
  fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s',
};
const labelStyle = {
  display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '700',
  color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px',
};
const leaveTypeLabels = {
  SICK: 'Sick Leave', CASUAL: 'Casual Leave', PAID: 'Paid Leave',
  MATERNITY: 'Maternity Leave', PATERNITY: 'Paternity Leave', MARRIAGE: 'Marriage Leave',
};
const StatusBadge = ({ status }) => {
  const cfg = {
    PENDING:  { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    APPROVED: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    REJECTED: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  }[status?.toUpperCase()] || { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
      display: 'inline-block', letterSpacing: '0.4px', textTransform: 'uppercase',
      backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {status?.charAt(0) + (status?.slice(1).toLowerCase() || '')}
    </span>
  );
};
const LockedField = ({ label, value, accent = false }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A', padding: '10px 13px',
      backgroundColor: accent ? '#FFF7ED' : '#F8FAFC', borderRadius: '8px',
      border: `1.5px solid ${accent ? '#FED7AA' : '#E2E8F0'}`,
      display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Lock size={13} color="#94A3B8" />
      <span>{value || 'Not set'}</span>
    </div>
  </div>
);
const EditableField = ({ label, name, value, onChange, type = 'text', placeholder = '' }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder}
      style={{ ...inputStyle, backgroundColor: '#FFFBEB', borderColor: '#FED7AA' }}
      onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
      onBlur={e => { e.target.style.borderColor = '#FED7AA'; e.target.style.boxShadow = 'none'; }} />
  </div>
);

const EmployeeDashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]           = useState('dashboard');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveHistory, setLeaveHistory]     = useState([]);
  const [announcements, setAnnouncements]   = useState([]);
  const [notification, setNotification]     = useState(null);
  const [leaveBalance, setLeaveBalance]     = useState({ SICK: 12, CASUAL: 10, PAID: 15 });
  const [leaveHistoryLoading, setLeaveHistoryLoading] = useState(false);
  const [profileSaving, setProfileSaving]   = useState(false);
  const [employeeData, setEmployeeData]     = useState(null);
  const [editMode, setEditMode]             = useState(false);
  const [formData, setFormData] = useState({
    emergency_contact_name: '', emergency_contact_relationship: '',
    emergency_contact_phone: '', emergency_contact_occupation: '',
    education_level: '', institute_name: '', year_of_passing: '',
    marks_type: '', marks_value: '',
    account_holder_name: '', account_number: '', bank_name: '',
    ifsc_code: '', branch_name: '', account_type: '',
  });
  const [selectedImage, setSelectedImage]   = useState(null);
  const [imagePreview, setImagePreview]     = useState(null);
  const [nextHoliday, setNextHoliday]       = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Attendance summary for dashboard stat card
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  // Full attendance cache — shared with the Attendance tab to avoid double fetch
  const [attendanceCache, setAttendanceCache] = useState(null);

  const userRole  = localStorage.getItem('user_role') || '';
  const isManager = userRole === 'MANAGER';

  const menuItems = [
    { id: 'dashboard',     label: 'Dashboard',      icon: '\u{1F4CA}' },
    { id: 'announcements', label: 'Announcements',  icon: '\u{1F4E2}' },
    { id: 'profile',       label: 'My Profile',     icon: '\u{1F464}' },
    { id: 'attendance',    label: 'Attendance',     icon: '\u{1F4C5}' },
    { id: 'leaves',        label: 'Leave Requests', icon: '\u{1F4DD}' },
    { id: 'holidays',      label: 'Holidays',       icon: '\u{1F5D3}' },
  ];

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  const formatDate = (ds) => {
    if (!ds) return 'Not set';
    return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };
  const getImageUrl = (p) => {
    if (!p) return null;
    if (p.startsWith('http')) return p;
    return `http://localhost:8000${p.startsWith('/') ? p : `/${p}`}`;
  };
  const getEmployeeId = () => employeeData?.employee_id || 'Not assigned';
  const getMarksDisplay = () => {
    if (!employeeData?.marks_value) return 'Not set';
    const { marks_type: t, marks_value: v } = employeeData;
    if (t === 'percentage') return `${v}%`;
    if (t === 'cgpa') return `${v} / 10 CGPA`;
    if (t === 'gpa')  return `${v} / 4 GPA`;
    if (t === 'grade') return `Grade: ${v}`;
    return v;
  };
  const maskSensitiveData = (value, mask = '****') => {
    if (!value) return 'Not set';
    const s = value.toString();
    return s.length <= 4 ? mask : mask + s.slice(-4);
  };
  const safeLeaveHistory   = extractListData(leaveHistory);
  const pendingLeavesCount = safeLeaveHistory.filter(l => l.status === 'PENDING').length;
  const getTotalLeaveDays  = () =>
    safeLeaveHistory.reduce((t, l) => l.status === 'APPROVED' ? t + (l.leave_days || 0) : t, 0);

  /* ── API calls ─────────────────────────────────────────────── */
  const fetchEmployeeProfile = async ({ refresh = false } = {}) => {
    setProfileLoading(true);
    if (!refresh) {
      const cached = localStorage.getItem('employee_profile');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          setEmployeeData(data);
          setLeaveBalance({
            SICK:   data.sick_leave_balance   ?? 12,
            CASUAL: data.casual_leave_balance ?? 10,
            PAID:   data.paid_leave_balance   ?? 15,
          });
          setFormData({
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_contact_relationship: data.emergency_contact_relationship || '',
            emergency_contact_phone: data.emergency_contact_phone || '',
            emergency_contact_occupation: data.emergency_contact_occupation || '',
            education_level: data.education_level || '', institute_name: data.institute_name || '',
            year_of_passing: data.year_of_passing || '', marks_type: data.marks_type || '',
            marks_value: data.marks_value || '', account_holder_name: data.account_holder_name || '',
            account_number: data.account_number || '', bank_name: data.bank_name || '',
            ifsc_code: data.ifsc_code || '', branch_name: data.branch_name || '',
            account_type: data.account_type || '',
          });
          if (data.profile_image) setImagePreview(getImageUrl(data.profile_image));
        } catch {}
      }
    }

    try {
      const res = await api.get('/employees/me/');
      setEmployeeData(res.data);
      // Populate real leave balances from the employee profile
      setLeaveBalance({
        SICK:   res.data.sick_leave_balance   ?? 12,
        CASUAL: res.data.casual_leave_balance ?? 10,
        PAID:   res.data.paid_leave_balance   ?? 15,
      });
      setFormData({
        emergency_contact_name: res.data.emergency_contact_name || '',
        emergency_contact_relationship: res.data.emergency_contact_relationship || '',
        emergency_contact_phone: res.data.emergency_contact_phone || '',
        emergency_contact_occupation: res.data.emergency_contact_occupation || '',
        education_level: res.data.education_level || '', institute_name: res.data.institute_name || '',
        year_of_passing: res.data.year_of_passing || '', marks_type: res.data.marks_type || '',
        marks_value: res.data.marks_value || '', account_holder_name: res.data.account_holder_name || '',
        account_number: res.data.account_number || '', bank_name: res.data.bank_name || '',
        ifsc_code: res.data.ifsc_code || '', branch_name: res.data.branch_name || '',
        account_type: res.data.account_type || '',
      });
      if (res.data.profile_image) setImagePreview(getImageUrl(res.data.profile_image));
      localStorage.setItem('employee_profile', JSON.stringify(res.data));
    } catch (err) {
      console.error('Error fetching employee profile:', err);
      showNotification('Failed to load profile', 'error');
    } finally { setProfileLoading(false); }
  };

  const fetchLeaveHistory = async ({ showSpinner = true } = {}) => {
    if (showSpinner) setLeaveHistoryLoading(true);
    try {
      const res = await api.get('/leaves/');
      setLeaveHistory(extractListData(res.data));
    } catch (err) {
      console.error('Error fetching leave history:', err);
      setLeaveHistory([]);
    } finally { if (showSpinner) setLeaveHistoryLoading(false); }
  };

  const fetchDashboardSummary = async ({ refresh = false } = {}) => {
    setAnnouncementsLoading(true);
    try {
      if (!refresh) {
        const cached = localStorage.getItem('dashboard_summary_v1');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.pinned_announcements) {
              setAnnouncements(extractListData(parsed.pinned_announcements).slice(0, 6));
            }
            if (parsed?.next_holiday) {
              setNextHoliday(parsed.next_holiday);
            }
          } catch {}
        }
      }

      const res = await api.get('/dashboard-stats/');
      const summary = res.data || {};
      const list = extractListData(summary.pinned_announcements || []).slice(0, 6);
      setAnnouncements(list);
      setNextHoliday(summary.next_holiday || null);
      try { localStorage.setItem('dashboard_summary_v1', JSON.stringify({
        pinned_announcements: list,
        next_holiday: summary.next_holiday || null,
      })); } catch {}
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      if (!announcements || announcements.length === 0) setAnnouncements([]);
    } finally { setAnnouncementsLoading(false); }
  };

  // Fetch this employee's attendance summary for the current month
  const fetchAttendanceSummary = async () => {
    try {
      const now = new Date();
      const res = await api.get(`/attendance/my/?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      if (res.data) {
        setAttendanceSummary(res.data.summary || null);
        // Cache the full response so the Attendance tab can use it without re-fetching
        setAttendanceCache(res.data);
      }
    } catch (err) { console.error('Error fetching attendance summary:', err); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const payload = new FormData();
      Object.entries(formData).forEach(([k, v]) => payload.append(k, v || ''));
      if (selectedImage) payload.append('profile_image', selectedImage);
      await axios.patch('http://127.0.0.1:8000/api/employees/me/update/', payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      await fetchEmployeeProfile();
      setEditMode(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating profile:', err);
      showNotification('Failed to update profile', 'error');
    } finally { setProfileSaving(false); }
  };
  const handleMenuItemClick = (item) => setActiveTab(item.id);

  useEffect(() => {
    // Parallelize dashboard data fetching to speed initial render
    fetchEmployeeProfile();
    Promise.allSettled([
      fetchLeaveHistory({ showSpinner: false }),
      fetchDashboardSummary(),
      fetchAttendanceSummary(),
    ]).catch(err => console.error('Dashboard parallel fetch error:', err));
  }, []);
  useEffect(() => {
    if (showApplyModal) return undefined;
    const interval = setInterval(() => fetchLeaveHistory({ showSpinner: false }), 30000);
    return () => clearInterval(interval);
  }, [showApplyModal]);

  /* ── SIDEBAR ──────────────────────────────────────────────── */
  const renderSidebar = () => (
    <div style={{ width: sidebarCollapsed ? '72px' : '260px', backgroundColor: 'white',
      borderRight: '1.5px solid #F1F5F9', display: 'flex', flexDirection: 'column',
      flexShrink: 0, height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      transition: 'width 0.25s ease', boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>
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
      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {menuItems.map(item => {
          const active = activeTab === item.id;
          return (
            <div key={item.id} onClick={() => handleMenuItemClick(item)}
              title={sidebarCollapsed ? item.label : ''}
              style={{ padding: sidebarCollapsed ? '11px' : '11px 16px', margin: '2px 8px',
                borderRadius: '10px', backgroundColor: active ? '#FFF7ED' : 'transparent',
                color: active ? '#EA580C' : '#64748B', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: sidebarCollapsed ? 0 : '10px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                fontSize: '14px', fontWeight: active ? '700' : '500', transition: 'all 0.15s',
                borderLeft: active ? '3px solid #F97316' : '3px solid transparent' }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#FFF7ED'; e.currentTarget.style.color = '#F97316'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
              {!sidebarCollapsed && active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F97316', marginLeft: 'auto', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
      {/* Collapse toggle */}
      <div style={{ padding: '8px', borderTop: '1.5px solid #F1F5F9' }}>
        <button onClick={() => setSidebarCollapsed(v => !v)}
          style={{ width: '100%', padding: '8px', backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0',
            borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
          {sidebarCollapsed ? '>' : '< Collapse'}
        </button>
      </div>
      {/* Manager link */}
      {isManager && !sidebarCollapsed && (
        <div style={{ padding: '12px 16px', borderTop: '1.5px solid #F1F5F9' }}>
          <button onClick={() => navigate('/manager')}
            style={{ width: '100%', padding: '10px 14px', background: 'linear-gradient(135deg,#F97316,#EA580C)',
              color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer',
              fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
            Manager Dashboard
          </button>
        </div>
      )}
      {/* Logout */}
      <div style={{ borderTop: '1.5px solid #F1F5F9', padding: sidebarCollapsed ? '12px 8px' : '14px 16px', flexShrink: 0 }}>
        <button onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          title={sidebarCollapsed ? 'Logout' : ''}
          style={{ width: '100%', padding: sidebarCollapsed ? '10px' : '10px 14px',
            backgroundColor: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA',
            borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: '8px', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}>
          <span style={{ fontSize: '16px' }}>&#x23CE;</span>
          {!sidebarCollapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  /* ── TOP BAR ──────────────────────────────────────────────── */
  const renderTopBar = () => {
    const currentPage = menuItems.find(m => m.id === activeTab);
    return (
      <div style={{ backgroundColor: 'white', padding: '0 28px', borderBottom: '1.5px solid #F1F5F9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10, height: '62px', flexShrink: 0,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>Employee</span>
          <span style={{ color: '#CBD5E1' }}>&rsaquo;</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
            {currentPage?.icon} {currentPage?.label || 'Dashboard'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A', boxShadow: '0 0 0 2px rgba(22,163,74,0.2)' }} />
            <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: '700' }}>Active</span>
          </div>
          <div style={{ padding: '6px 14px', backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          {isManager && (
            <span style={{ backgroundColor: '#FFFBEB', color: '#D97706', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #FDE68A' }}>
              Manager
            </span>
          )}
          <div style={{ width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#F97316,#EA580C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '800', color: 'white', border: '2px solid #FED7AA' }}>
            {(employeeData?.first_name || user?.username || 'E').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  /* ── DASHBOARD TAB ────────────────────────────────────────── */
  const renderDashboard = () => {
    const presentDays = attendanceSummary?.total_present ?? null;
    const attendancePct = attendanceSummary?.attendance_percentage ?? null;
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '28px 32px', fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>&#x1F44B;</div>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
                Welcome back, {employeeData?.first_name || 'Employee'}!
              </h1>
              <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '20px', marginBottom: '28px' }}>
          {/* Leave Balance */}
          <div style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', padding: '22px 24px', borderRadius: '16px', color: 'white', boxShadow: '0 6px 20px rgba(249,115,22,0.25)', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.13)' }} />
            <div style={{ fontSize: '26px', marginBottom: '10px' }}>&#x2696;&#xFE0F;</div>
            <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Leave Balance</div>
            <div style={{ fontSize: '34px', fontWeight: '800', lineHeight: 1, marginBottom: '8px' }}>
              {leaveBalance.SICK + leaveBalance.CASUAL + leaveBalance.PAID - getTotalLeaveDays()}
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontWeight: '700' }}>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>S: {leaveBalance.SICK}</span>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>C: {leaveBalance.CASUAL}</span>
              <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>P: {leaveBalance.PAID}</span>
            </div>
            <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '6px' }}>Used: {getTotalLeaveDays()} days</div>
          </div>

          {/* Attendance — real data */}
          <div style={{ background: 'linear-gradient(135deg,#16A34A,#15803D)', padding: '22px 24px', borderRadius: '16px', color: 'white', boxShadow: '0 6px 20px rgba(22,163,74,0.25)', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'pointer' }}
            onClick={() => setActiveTab('attendance')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.13)' }} />
            <div style={{ fontSize: '26px', marginBottom: '10px' }}>&#x1F4C5;</div>
            <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Attendance</div>
            <div style={{ fontSize: '34px', fontWeight: '800', lineHeight: 1, marginBottom: '6px' }}>
              {presentDays !== null ? presentDays : '—'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.78, fontWeight: '500' }}>
              {attendancePct !== null ? `${attendancePct}% this month` : 'Days present this month'}
            </div>
          </div>

          {/* Pending Leaves */}
          <div style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)', padding: '22px 24px', borderRadius: '16px', color: 'white', boxShadow: '0 6px 20px rgba(245,158,11,0.25)', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'pointer' }}
            onClick={() => setActiveTab('leaves')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.13)' }} />
            <div style={{ fontSize: '26px', marginBottom: '10px' }}>&#x23F3;</div>
            <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Pending</div>
            <div style={{ fontSize: '34px', fontWeight: '800', lineHeight: 1, marginBottom: '6px' }}>{pendingLeavesCount}</div>
            <div style={{ fontSize: '12px', opacity: 0.78, fontWeight: '500' }}>Leave request{pendingLeavesCount !== 1 ? 's' : ''} pending</div>
          </div>

          {/* Next Holiday */}
          <div style={{ background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', padding: '22px 24px', borderRadius: '16px', color: 'white', boxShadow: '0 6px 20px rgba(37,99,235,0.25)', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'pointer' }}
            onClick={() => setActiveTab('holidays')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.13)' }} />
            <div style={{ fontSize: '26px', marginBottom: '10px' }}>&#x1F5D3;&#xFE0F;</div>
            <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Next Holiday</div>
            {nextHoliday ? (
              <>
                <div style={{ fontSize: '18px', fontWeight: '800', lineHeight: 1.2, marginBottom: '4px' }}>{nextHoliday.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.78, fontWeight: '500' }}>{new Date(nextHoliday.date).toLocaleDateString()}</div>
                <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', display: 'inline-block' }}>
                  {nextHoliday.holiday_type || 'Holiday'}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '14px', opacity: 0.75 }}>No upcoming holidays</div>
            )}
          </div>
        </div>

        {/* Employee Info Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '22px 24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            Employee Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '18px' }}>
            {[
              { label: 'Department',   value: employeeData?.department },
              { label: 'Designation',  value: employeeData?.designation },
              { label: 'Joining Date', value: formatDate(employeeData?.joining_date) },
              { label: 'Email',        value: employeeData?.email },
              { label: 'Phone',        value: employeeData?.phone },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '14px', backgroundColor: '#FAFAFA', borderRadius: '10px', border: '1.5px solid #F1F5F9' }}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{value || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leave + Attendance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Recent Leave Requests */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Recent Leave Requests</span>
                {safeLeaveHistory.length > 0 && (
                  <span style={{ backgroundColor: '#FFF7ED', color: '#EA580C', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #FED7AA' }}>{safeLeaveHistory.length}</span>
                )}
              </div>
              <button onClick={() => setActiveTab('leaves')} style={{ fontSize: '12px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>View All &rarr;</button>
            </div>
            {leaveHistoryLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                <div style={{ width: '28px', height: '28px', border: '3px solid #FED7AA', borderTop: '3px solid #F97316', borderRadius: '50%', animation: 'empSpin 0.8s linear infinite', margin: '0 auto 10px' }} />
                Loading...
              </div>
            ) : safeLeaveHistory.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#x1F4DD;</div>
                No leave requests found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC' }}>
                      {['Type', 'Duration', 'Status'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #F1F5F9' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {safeLeaveHistory.slice(0, 5).map((leave, idx) => {
                      const days = leave.leave_days || Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / 86400000) + 1;
                      return (
                        <tr key={leave.id} style={{ borderBottom: '1px solid #F8FAFC', backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#FAFAFA'}>
                          <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{leaveTypeLabels[leave.leave_type] || leave.leave_type}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ backgroundColor: '#F0FDF4', color: '#15803D', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #BBF7D0' }}>{days}d</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}><StatusBadge status={leave.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Attendance Summary Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>This Month's Attendance</span>
              <button onClick={() => setActiveTab('attendance')} style={{ fontSize: '12px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>Full Report &rarr;</button>
            </div>
            {attendanceSummary ? (
              <div style={{ padding: '20px 24px' }}>
                {/* Attendance % bar */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Attendance Rate</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: attendanceSummary.attendance_percentage >= 80 ? '#16A34A' : '#DC2626' }}>
                      {attendanceSummary.attendance_percentage}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${attendanceSummary.attendance_percentage}%`, background: attendanceSummary.attendance_percentage >= 80 ? '#16A34A' : '#DC2626', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { label: 'Present', value: attendanceSummary.total_present, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
                    { label: 'Absent',  value: attendanceSummary.total_absent,  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                    { label: 'Week Off', value: attendanceSummary.total_weekly_off, color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
                    { label: 'Total Hours', value: attendanceSummary.total_duration, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                  ].map(s => (
                    <div key={s.label} style={{ padding: '12px', backgroundColor: s.bg, borderRadius: '10px', border: `1.5px solid ${s.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: s.color }}>{s.value ?? 0}</div>
                      <div style={{ fontSize: '10px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '3px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {attendanceSummary.total_late_mins > 0 && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '12px', color: '#92400E', fontWeight: '600' }}>
                    &#x26A0;&#xFE0F; Late by {attendanceSummary.total_late_mins} min total this month
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>&#x1F4C5;</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#64748B', marginBottom: '8px' }}>No attendance data yet</div>
                <div style={{ fontSize: '12px', marginBottom: '14px' }}>Data appears once admin uploads the monthly report</div>
                <button onClick={() => setActiveTab('attendance')}
                  style={{ padding: '9px 20px', background: 'linear-gradient(135deg,#16A34A,#15803D)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  View Attendance &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── ANNOUNCEMENTS TAB ────────────────────────────────────── */
  const renderAnnouncements = () => (
    <div style={{ padding: '28px 32px', fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>&#x1F4E2;</div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0F172A' }}>Announcements</h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Company-wide updates and notices</p>
        </div>
      </div>
      {announcementsLoading && announcements.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '60px', textAlign: 'center', color: '#94A3B8', border: '1.5px solid #F1F5F9' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #FED7AA', borderTop: '3px solid #F97316', borderRadius: '50%', animation: 'empSpin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '60px', textAlign: 'center', color: '#94A3B8', border: '1.5px solid #F1F5F9' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>&#x1F4ED;</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#64748B', marginBottom: '6px' }}>No announcements yet</div>
          <div style={{ fontSize: '13px' }}>Check back later for updates</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {announcementsLoading && announcements.length > 0 && (
            <div style={{ padding: '12px 16px', marginBottom: '10px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '12px', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid #92400E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'empSpin 0.8s linear infinite' }} />
              Refreshing announcements...
            </div>
          )}
          {announcements.map(ann => (
            <div key={ann.id} onClick={() => setSelectedAnnouncement(ann)}
              style={{ backgroundColor: 'white', borderRadius: '14px', padding: '20px 24px',
                border: '1.5px solid #F1F5F9', borderLeft: `4px solid ${ann.is_pinned ? '#F97316' : '#16A34A'}`,
                cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  {ann.is_pinned && (
                    <span style={{ fontSize: '10px', color: '#92400E', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '10px', marginBottom: '8px', display: 'inline-block', fontWeight: '700', border: '1px solid #FDE68A' }}>
                      &#x1F4CC; Pinned
                    </span>
                  )}
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '4px 0 8px 0', color: '#0F172A' }}>{ann.title}</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.6' }}>
                    {ann.description?.substring(0, 160)}{ann.description?.length > 160 ? '...' : ''}
                  </p>
                  {ann.attachment && <span style={{ fontSize: '11px', color: '#F97316', marginTop: '8px', display: 'inline-block', fontWeight: '600' }}>&#x1F4CE; Has attachment</span>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F8FAFC', padding: '4px 10px', borderRadius: '20px', border: '1px solid #E2E8F0', fontWeight: '600' }}>
                    {new Date(ann.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#F97316', fontWeight: '700' }}>Read more &rarr;</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ── ATTENDANCE TAB ───────────────────────────────────────── */
  const renderAttendance = () => (
    <div style={{ padding: '28px 32px', fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#16A34A,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>&#x1F4C5;</div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0F172A' }}>Attendance History</h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Your daily attendance records</p>
        </div>
      </div>
      <EmployeeAttendance initialData={attendanceCache} />
    </div>
  );

  /* ── LEAVES TAB ───────────────────────────────────────────── */
  const renderLeaves = () => (
    <div style={{ padding: '28px 32px', fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>&#x1F4DD;</div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0F172A' }}>Leave Requests</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Manage and track your leave applications</p>
          </div>
        </div>
        <button onClick={() => setShowApplyModal(true)}
          style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          + Apply for Leave
        </button>
      </div>
      <div style={{ backgroundColor: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FAFAFA' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>All Leave Requests</span>
          <span style={{ backgroundColor: '#FFF7ED', color: '#EA580C', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #FED7AA' }}>{safeLeaveHistory.length}</span>
        </div>
        {leaveHistoryLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid #FED7AA', borderTop: '3px solid #F97316', borderRadius: '50%', animation: 'empSpin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading leave requests...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  {['Leave Type', 'Duration', 'Start Date', 'End Date', 'Reason', 'Status', 'Applied On'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #F1F5F9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {safeLeaveHistory.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>&#x1F4ED;</div>
                    No leave requests. Click "Apply for Leave" to create one.
                  </td></tr>
                ) : safeLeaveHistory.map((leave, idx) => {
                  const days = leave.leave_days || Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / 86400000) + 1;
                  return (
                    <tr key={leave.id} style={{ borderBottom: '1px solid #F8FAFC', backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#FAFAFA'}>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{leaveTypeLabels[leave.leave_type] || leave.leave_type}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ backgroundColor: '#F0FDF4', color: '#15803D', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #BBF7D0' }}>{days}d</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{leave.start_date}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{leave.end_date}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leave.reason || '—'}</td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={leave.status} /></td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>
                        {leave.applied_at ? new Date(leave.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* ── PROFILE TAB ──────────────────────────────────────────── */
  const renderProfile = () => {
    if (profileLoading && !employeeData) {
      return (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #FED7AA', borderTop: '3px solid #F97316', borderRadius: '50%', animation: 'empSpin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading profile...
        </div>
      );
    }
    const canEditEmergency = userRole === 'EMPLOYEE';
    return (
      <div style={{ padding: '28px 32px', fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>&#x1F464;</div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0F172A' }}>My Profile</h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>View and manage your personal information</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left: Profile Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9', position: 'sticky', top: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {imagePreview || employeeData?.profile_image ? (
                <img src={imagePreview || getImageUrl(employeeData.profile_image)} alt="Profile"
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #FED7AA', boxShadow: '0 4px 16px rgba(249,115,22,0.2)' }} />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '40px', fontWeight: '800', color: 'white', border: '4px solid #FED7AA' }}>
                  {(employeeData?.first_name || 'E').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', textAlign: 'center', color: '#0F172A' }}>
              {employeeData?.first_name} {employeeData?.last_name}
            </h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', margin: '0 0 16px 0', fontWeight: '600' }}>
              ID: <span style={{ color: '#F97316' }}>{getEmployeeId()}</span>
            </p>
            <div style={{ backgroundColor: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '10px', padding: '12px 16px', textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#EA580C' }}>{employeeData?.department || 'No Department'}</div>
              <div style={{ fontSize: '12px', color: '#F97316', fontWeight: '500', marginTop: '3px' }}>{employeeData?.designation || 'Employee'}</div>
            </div>
            <div style={{ height: '1.5px', backgroundColor: '#F1F5F9', margin: '0 0 18px' }} />
            {[
              { label: 'Email',  value: employeeData?.email },
              { label: 'Phone',  value: employeeData?.phone },
              { label: 'Joined', value: formatDate(employeeData?.joining_date) },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: '600', wordBreak: 'break-all' }}>{value || 'Not set'}</div>
              </div>
            ))}
            <button onClick={() => setEditMode(true)}
              style={{ width: '100%', padding: '11px 16px', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Edit2 size={15} /> Edit Profile
            </button>
          </div>

          {/* Right: Info Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              {
                icon: '&#x1F464;', iconBg: '#FFF7ED', title: 'Personal Information',
                content: (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <LockedField label="Full Name" value={`${employeeData?.first_name || ''} ${employeeData?.last_name || ''}`.trim()} />
                      <LockedField label="Email Address" value={employeeData?.email} />
                      <LockedField label="Phone Number" value={employeeData?.phone} accent />
                      <LockedField label="Gender" value={employeeData?.gender} />
                      <LockedField label="Language" value="English" />
                      <LockedField label="Date Joined" value={formatDate(employeeData?.joining_date)} />
                    </div>
                    <div style={{ marginTop: '14px' }}>
                      <LockedField label="Address" value={employeeData?.address} />
                    </div>
                  </>
                ),
              },
              {
                icon: '&#x1F465;', iconBg: '#FFFBEB', title: 'Emergency Contact',
                badge: canEditEmergency ? { text: 'Editable', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' } : null,
                content: (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <LockedField label="Name" value={employeeData?.emergency_contact_name} accent={canEditEmergency} />
                    <LockedField label="Relationship" value={employeeData?.emergency_contact_relationship} accent={canEditEmergency} />
                    <LockedField label="Contact Number" value={employeeData?.emergency_contact_phone} accent={canEditEmergency} />
                    <LockedField label="Occupation" value={employeeData?.emergency_contact_occupation} accent={canEditEmergency} />
                  </div>
                ),
              },
              {
                icon: '&#x1F393;', iconBg: '#EFF6FF', title: 'Education Details',
                badge: { text: 'Admin Only', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
                content: (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <LockedField label="Education Level" value={employeeData?.education_level} />
                    <LockedField label="Institution" value={employeeData?.institute_name} />
                    <LockedField label="Year of Passing" value={employeeData?.year_of_passing} />
                    <LockedField label="Marks" value={getMarksDisplay()} />
                  </div>
                ),
              },
              {
                icon: '&#x1F3E6;', iconBg: '#FCE7F3', title: 'Bank Details',
                badge: { text: 'Confidential', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
                content: (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <LockedField label="Bank Name" value={employeeData?.bank_name} />
                      <LockedField label="Account Number" value={maskSensitiveData(employeeData?.account_number)} />
                      <LockedField label="IFSC Code" value={employeeData?.ifsc_code} />
                      <LockedField label="Account Type" value={employeeData?.account_type} />
                    </div>
                    <div style={{ marginTop: '14px' }}>
                      <LockedField label="Branch" value={employeeData?.branch_name} />
                    </div>
                  </>
                ),
              },
            ].map(({ icon, iconBg, title, badge, content }) => (
              <div key={title} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }} dangerouslySetInnerHTML={{ __html: icon }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0F172A' }}>{title}</h3>
                  {badge && (
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: badge.color, backgroundColor: badge.bg, padding: '3px 10px', borderRadius: '20px', border: `1px solid ${badge.border}`, fontWeight: '700' }}>
                      {badge.text}
                    </span>
                  )}
                </div>
                {content}
              </div>
            ))}
          </div>
        </div>

        {/* Edit Modal */}
        {editMode && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'empFadeIn 0.25s ease' }}>
            <div style={{ width: '100%', maxWidth: '540px', backgroundColor: 'white', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', animation: 'empSlideUp 0.3s ease' }}>
              <div style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', padding: '22px 28px', color: 'white', borderRadius: '20px 20px 0 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 2px 0' }}>Edit Profile</h2>
                    <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>Update your profile photo and emergency contact</p>
                  </div>
                  <button onClick={() => setEditMode(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                </div>
              </div>
              <div style={{ padding: '28px' }}>
                <form onSubmit={handleProfileUpdate} encType="multipart/form-data">
                  <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>Profile Photo</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                      {imagePreview || employeeData?.profile_image ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img src={imagePreview || getImageUrl(employeeData?.profile_image)} alt="Preview" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FED7AA' }} />
                          {selectedImage && (
                            <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(employeeData?.profile_image ? getImageUrl(employeeData.profile_image) : null); }} style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>&times;</button>
                          )}
                        </div>
                      ) : (
                        <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'white', fontWeight: '800' }}>
                          {(employeeData?.first_name || 'E').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '13px', color: '#64748B' }} />
                    <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>JPG, PNG, or GIF accepted</p>
                  </div>
                  <div style={{ height: '1.5px', backgroundColor: '#F1F5F9', marginBottom: '22px' }} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>Emergency Contact</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {[
                      { name: 'emergency_contact_name', label: 'Contact Name' },
                      { name: 'emergency_contact_relationship', label: 'Relationship' },
                      { name: 'emergency_contact_phone', label: 'Phone Number' },
                      { name: 'emergency_contact_occupation', label: 'Occupation' },
                    ].map(({ name, label }) => (
                      <EditableField key={name} label={label} name={name} value={formData[name]} onChange={handleInputChange} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '26px', paddingTop: '20px', borderTop: '1.5px solid #F1F5F9' }}>
                    <button type="button" onClick={() => setEditMode(false)} style={{ padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Cancel</button>
                    <button type="submit" disabled={profileSaving} style={{ padding: '10px 24px', background: profileSaving ? '#CBD5E1' : 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', border: 'none', borderRadius: '10px', cursor: profileSaving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px' }}>
                      {profileSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── CONTENT ROUTER ───────────────────────────────────────── */
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':     return renderDashboard();
      case 'announcements': return renderAnnouncements();
      case 'profile':       return renderProfile();
      case 'attendance':    return renderAttendance();
      case 'leaves':        return renderLeaves();
      case 'holidays':      return <EmployeeHolidayPage />;
      default:              return renderDashboard();
    }
  };

  /* ── MAIN RENDER ──────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F8FAFC', fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes empFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes empSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes empSpin    { to{transform:rotate(360deg)} }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
          outline: none !important;
        }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#F8FAFC; }
        ::-webkit-scrollbar-thumb { background:#E2E8F0; border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover { background:#CBD5E1; }
      `}</style>

      {/* Notification toast */}
      {notification && (
        <div style={{ position: 'fixed', top: '22px', right: '22px', zIndex: 2500,
          padding: '13px 20px', borderRadius: '12px', color: '#fff', fontSize: '14px',
          fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          backgroundColor: notification.type === 'success' ? '#16A34A' : notification.type === 'error' ? '#DC2626' : '#2563EB',
          display: 'flex', alignItems: 'center', gap: '10px', animation: 'empSlideUp 0.3s ease' }}>
          {notification.message}
        </div>
      )}

      {renderSidebar()}

      <div style={{ flex: 1, overflowY: 'auto', height: '100vh', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {renderTopBar()}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8FAFC', animation: 'empFadeIn 0.25s ease' }}>
          {renderContent()}
        </div>
      </div>

      {/* Apply Leave Modal */}
      <ApplyLeave
        show={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        onSuccess={() => {
          fetchLeaveHistory({ showSpinner: false });
          showNotification('Leave request submitted successfully!', 'success');
        }}
      />

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'empFadeIn 0.25s ease' }}
          onClick={() => setSelectedAnnouncement(null)}>
          <div style={{ width: '100%', maxWidth: '680px', backgroundColor: 'white', borderRadius: '20px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', animation: 'empSlideUp 0.3s ease' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', padding: '22px 28px', color: 'white', borderRadius: '20px 20px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {selectedAnnouncement.is_pinned && (
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(255,255,255,0.25)', color: 'white', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginBottom: '8px', fontWeight: '700' }}>Pinned</span>
                  )}
                  <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>{selectedAnnouncement.title}</h1>
                </div>
                <button onClick={() => setSelectedAnnouncement(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '16px' }}>&times;</button>
              </div>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: '#64748B', backgroundColor: '#F8FAFC', padding: '4px 12px', borderRadius: '20px', border: '1px solid #E2E8F0', fontWeight: '600' }}>
                  {new Date(selectedAnnouncement.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                {selectedAnnouncement.expiry_date && (
                  <span style={{ fontSize: '12px', color: '#DC2626', backgroundColor: '#FEF2F2', padding: '4px 12px', borderRadius: '20px', border: '1px solid #FECACA', fontWeight: '600' }}>
                    Expires: {new Date(selectedAnnouncement.expiry_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div style={{ height: '1.5px', backgroundColor: '#F1F5F9', marginBottom: '20px' }} />
              <p style={{ fontSize: '15px', color: '#374151', lineHeight: '1.8', margin: '0 0 24px 0' }}>{selectedAnnouncement.description}</p>
              {selectedAnnouncement.attachment && (
                <div style={{ backgroundColor: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#EA580C', fontWeight: '600' }}>File attached</div>
                  <button onClick={async () => {
                    try {
                      const token = localStorage.getItem('access_token');
                      const url = selectedAnnouncement.attachment.startsWith('http') ? selectedAnnouncement.attachment : `http://127.0.0.1:8000${selectedAnnouncement.attachment}`;
                      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                      if (!res.ok) throw new Error('Download failed');
                      const blob = await res.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      const fileName = url.split('/').pop();
                      const ext = fileName.split('.').pop().toLowerCase();
                      if (['pdf','png','jpg','jpeg','gif','webp'].includes(ext)) { window.open(blobUrl, '_blank'); }
                      else { const a = document.createElement('a'); a.href = blobUrl; a.download = fileName; a.click(); }
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                    } catch (err) { alert('Download failed: ' + err.message); }
                  }} style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                    Download
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button onClick={() => setSelectedAnnouncement(null)} style={{ padding: '9px 22px', backgroundColor: '#F8FAFC', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
