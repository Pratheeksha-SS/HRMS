import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { extractListData } from '../utils/extractListData';
import AdminLeaveManagement from './AdminLeaveManagement';
import HolidayCalendar from '../components/HolidayCalendar';
import AdminAttendance from './admin/AdminAttendance';
import AdminAnnouncements from './AdminAnnouncements';
import AnnouncementDetail from './AnnouncementDetail';
import HRReports from './admin/HRReports';

/* ─── Design Tokens (mirrors AdminDashboard) ──────────────────────────
   Primary     : #F97316  orange-500
   Primary Dark: #EA580C  orange-600
   Primary Light:#FFF7ED  orange-50
   Accent      : #16A34A  green-600
   Neutral BG  : #F8FAFC
   Surface     : #FFFFFF
   Border      : #E2E8F0 / #F1F5F9
   Text Main   : #0F172A
   Text Muted  : #64748B
   ─────────────────────────────────────────────────────────────────── */

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
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      {status?.charAt(0) + (status?.slice(1).toLowerCase() || '')}
    </span>
  );
};

const ManagerAdminDashboard = ({ user, setUser, activePage }) => {
  const navigate = useNavigate();

  const [activeSection, setActiveSection]     = useState(() => activePage || 'dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [managerProfile, setManagerProfile]   = useState(null);
  const [notification, setNotification]       = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                    = useState('');

  const [stats, setStats] = useState({
    totalEmployees: 0, pendingLeaves: 0, attendanceRate: 95.2, totalLeaves: 0,
  });
  const [teamMembers, setTeamMembers]   = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const cancelRef = useRef(null);


  const menuItems = [
    { name: 'Dashboard',        icon: '\u{1F4CA}', section: 'dashboard' },
    { name: 'Team Members',     icon: '\u{1F465}', section: 'team-members' },
    { name: 'Leave Management', icon: '\u{1F4DD}', section: 'leave-management' },
    { name: 'Attendance',       icon: '\u{1F4C5}', section: 'attendance' },
    { name: 'Reports',          icon: '\u{1F4C8}', section: 'reports' },
    { name: 'Announcements',    icon: '\u{1F4E2}', section: 'announcements' },
    { name: 'Holiday Calendar', icon: '\u{1F5D3}', section: 'holidays' },
    { name: 'My Profile',       icon: '\u{1F464}', section: 'profile' },
  ];

  const showNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  /* ── Fetch all dashboard data ─────────────────────────────────── */
  const fetchDashboardData = useCallback(async () => {
    if (cancelRef.current) cancelRef.current.abort();
    cancelRef.current = new AbortController();
    setLoading(true);
    setError('');

    try {
      const signal = cancelRef.current.signal;
      const [statsRes, teamRes, leavesRes, annRes] = await Promise.all([
        api.get('/dashboard-stats/', { signal }),
        api.get('/department-employees/?limit=100', { signal }),
        api.get('/manager-leaves/?limit=10', { signal }),
        api.get('/announcements/', { signal }),
      ]);

      const s = statsRes?.data || {};
      setStats({
        totalEmployees: Number(s.total_employees)   || 0,
        pendingLeaves:  Number(s.pending_leaves)    || 0,
        attendanceRate: Number(s.attendance_rate)   || 95.2,
        totalLeaves:    Number(s.total_leaves)      || 0,
      });

      setTeamMembers(Array.isArray(teamRes?.data) ? extractListData(teamRes.data) : extractListData(teamRes?.data || []));
      setLeaveRequests(Array.isArray(leavesRes?.data) ? extractListData(leavesRes.data) : extractListData(leavesRes?.data || []));
      setAnnouncements(Array.isArray(annRes?.data) ? extractListData(annRes.data) : extractListData(annRes?.data || []));
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
      console.error('Dashboard fetch error:', err);
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load dashboard data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);


  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/employees/me/');
      setManagerProfile(res.data);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (activeSection === 'dashboard') fetchDashboardData();
    if (activeSection === 'profile')   fetchProfile();
    return () => { if (cancelRef.current) cancelRef.current.abort(); };
  }, [activeSection]);

  useEffect(() => { if (activePage) setActiveSection(activePage); }, [activePage]);

  const isMenuActive = (item) => item.section === activeSection;

  /* ── SIDEBAR ──────────────────────────────────────────────────── */
  const renderSidebar = () => (
    <div style={{
      width: sidebarCollapsed ? '72px' : '260px',
      backgroundColor: 'white', borderRight: '1.5px solid #F1F5F9',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      transition: 'width 0.25s ease', boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 10px', textAlign: 'center', borderBottom: '1.5px solid #F1F5F9' }}>
        {!sidebarCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', letterSpacing: '-1px', fontFamily: "'Montserrat',sans-serif" }}>EL</span>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', fontFamily: "'Montserrat',sans-serif" }}>O</span>
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '4px', height: '4px', backgroundColor: '#0F172A', borderRadius: '50%' }} />
            </div>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', fontFamily: 'sans-serif' }}>G</span>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#F97316', letterSpacing: '-1px', fontFamily: "'Montserrat',sans-serif" }}>IXA</span>
          </div>
        ) : (
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#F97316' }}>M</span>
        )}
        {!sidebarCollapsed && (
          <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Manager Portal
          </div>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {menuItems.map(item => {
          const active = isMenuActive(item);
          return (
            <div key={item.name} onClick={() => setActiveSection(item.section)}
              title={sidebarCollapsed ? item.name : ''}
              style={{
                padding: sidebarCollapsed ? '11px' : '11px 16px',
                margin: '2px 8px', borderRadius: '10px',
                backgroundColor: active ? '#FFF7ED' : 'transparent',
                color: active ? '#EA580C' : '#64748B',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: sidebarCollapsed ? 0 : '10px',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                fontSize: '14px', fontWeight: active ? '700' : '500',
                transition: 'all 0.15s',
                borderLeft: active ? '3px solid #F97316' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#FFF7ED'; e.currentTarget.style.color = '#F97316'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>}
              {!sidebarCollapsed && active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F97316', marginLeft: 'auto', flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <div style={{ padding: '8px', borderTop: '1.5px solid #F1F5F9' }}>
        <button onClick={() => setSidebarCollapsed(v => !v)}
          style={{ width: '100%', padding: '8px', backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
          {sidebarCollapsed ? '>' : '< Collapse'}
        </button>
      </div>

      {/* Employee Dashboard link */}
      {!sidebarCollapsed && (
        <div style={{ padding: '12px 16px', borderTop: '1.5px solid #F1F5F9' }}>
          <button onClick={() => navigate('/employee')}
            style={{ width: '100%', padding: '10px 14px', background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            &#x2190; Employee View
          </button>
        </div>
      )}

      {/* Logout */}
      <div style={{ borderTop: '1.5px solid #F1F5F9', padding: sidebarCollapsed ? '12px 8px' : '14px 16px', flexShrink: 0 }}>
        <button onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          title={sidebarCollapsed ? 'Logout' : ''}
          style={{ width: '100%', padding: sidebarCollapsed ? '10px' : '10px 14px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: '8px', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}>
          <span style={{ fontSize: '16px' }}>&#x23CE;</span>
          {!sidebarCollapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  /* ── TOP BAR ──────────────────────────────────────────────────── */
  const renderTopBar = () => {
    const currentPage = menuItems.find(m => m.section === activeSection);
    return (
      <div style={{ backgroundColor: 'white', padding: '0 28px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, height: '62px', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>Manager</span>
          <span style={{ color: '#CBD5E1' }}>&rsaquo;</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
            {currentPage?.icon} {currentPage?.name || 'Dashboard'}
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
          <span style={{ backgroundColor: '#FFFBEB', color: '#D97706', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #FDE68A' }}>
            &#x1F454; Manager
          </span>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white', border: '2px solid #FED7AA' }}>
            {(managerProfile?.first_name || user?.username || 'M').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  /* ── fetch team + leaves when those sections are opened ──────── */
  useEffect(() => {
    if (activeSection === 'team-members' && teamMembers.length === 0) {
      api.get('/department-employees/?limit=100').then(r => setTeamMembers(extractListData(r.data))).catch(console.error);
    }
    if (activeSection === 'leave-management' && leaveRequests.length === 0) {
      api.get('/manager-leaves/?limit=100').then(r => setLeaveRequests(extractListData(r.data))).catch(console.error);
    }
    if (activeSection === 'announcements' && announcements.length === 0) {
      api.get('/announcements/').then(r => setAnnouncements(extractListData(r.data))).catch(console.error);
    }
  }, [activeSection]);

  const [leaveTab, setLeaveTab] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewLeave, setReviewLeave]     = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  const handleLeaveAction = async (leaveId, action) => {
    setActionLoading(true);
    try {
      await api.patch(`/leaves/${leaveId}/approve/`, { status: action, comments: reviewComment });
      showNotif(`Leave ${action.toLowerCase()} successfully`, 'success');
      setReviewLeave(null);
      setReviewComment('');
      // refresh
      const r = await api.get('/manager-leaves/?limit=100');
      setLeaveRequests(extractListData(r.data));
      // refresh stats
      const s = await api.get('/dashboard-stats/');
      const sd = s.data || {};
      setStats({
        totalEmployees: Number(sd.total_employees) || 0,
        pendingLeaves:  Number(sd.pending_leaves)  || 0,
        attendanceRate: Number(sd.attendance_rate) || 95.2,
        totalLeaves:    Number(sd.total_leaves)    || 0,
      });
    } catch (err) {
      showNotif(err?.response?.data?.error || 'Action failed', 'error');
    } finally { setActionLoading(false); }
  };

  /* ── TEAM MEMBERS ─────────────────────────────────────────────── */
  const renderTeamMembers = () => (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Team Members</h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>Your department employees</p>
        </div>
        <span style={{ backgroundColor: '#FFF7ED', color: '#EA580C', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid #FED7AA' }}>
          {teamMembers.length} Members
        </span>
      </div>
      {teamMembers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', backgroundColor: 'white', borderRadius: '14px', border: '1.5px solid #F1F5F9' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
          <div style={{ fontSize: '15px', fontWeight: '600' }}>No team members found</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>You may not be assigned to a department yet.</div>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  {['Employee', 'Email', 'Phone', 'Designation', 'Joining Date'].map(h => (
                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #F1F5F9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((m, idx) => {
                  const name = m.full_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.username || 'Employee';
                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid #F8FAFC', backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#FAFAFA'}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', flexShrink: 0 }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{name}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>ID: {m.employee_id || m.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>{m.email || m.user_email || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>{m.phone || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>{m.designation || 'Employee'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                        {m.joining_date ? new Date(m.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  /* ── LEAVE MANAGEMENT ─────────────────────────────────────────── */
  const renderLeaveManagement = () => {
    const pending  = leaveRequests.filter(l => l.status === 'PENDING');
    const approved = leaveRequests.filter(l => l.status === 'APPROVED');
    const rejected = leaveRequests.filter(l => l.status === 'REJECTED');
    const displayed = leaveTab === 'pending' ? pending : leaveTab === 'approved' ? approved : leaveTab === 'rejected' ? rejected : leaveRequests;

    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Leave Management</h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>Review and manage your team's leave requests</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'all',      label: `All (${leaveRequests.length})`,  color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
              { key: 'pending',  label: `Pending (${pending.length})`,    color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
              { key: 'approved', label: `Approved (${approved.length})`,  color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
              { key: 'rejected', label: `Rejected (${rejected.length})`,  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
            ].map(t => (
              <button key={t.key} onClick={() => setLeaveTab(t.key)}
                style={{ padding: '6px 14px', borderRadius: '20px', border: `1.5px solid ${leaveTab === t.key ? t.border : '#E2E8F0'}`, backgroundColor: leaveTab === t.key ? t.bg : 'white', color: leaveTab === t.key ? t.color : '#64748B', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', backgroundColor: 'white', borderRadius: '14px', border: '1.5px solid #F1F5F9' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <div style={{ fontSize: '15px', fontWeight: '600' }}>No leave requests found</div>
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    {['Employee', 'Leave Type', 'Duration', 'Days', 'Reason', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '13px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #F1F5F9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((leave, idx) => {
                    const days = leave.start_date && leave.end_date
                      ? Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / 86400000) + 1 : '—';
                    return (
                      <tr key={leave.id} style={{ borderBottom: '1px solid #F8FAFC', backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#FAFAFA'}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                              {(leave.employee_name || 'E').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>{leave.employee_name || `Employee #${leave.employee}`}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: '1px solid #BFDBFE' }}>
                            {leaveTypeLabels[leave.leave_type] || leave.leave_type}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {leave.start_date} – {leave.end_date}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#F97316' }}>{days}d</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: '#64748B' }}>
                            {leave.reason || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}><StatusBadge status={leave.status} /></td>
                        <td style={{ padding: '14px 16px' }}>
                          {leave.status === 'PENDING' ? (
                            <button onClick={() => { setReviewLeave(leave); setReviewComment(''); }}
                              style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}>
                              Review
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewLeave && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease' }}
            onClick={e => e.target === e.currentTarget && setReviewLeave(null)}>
            <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }}>
              <div style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', padding: '22px 28px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Review Leave Request</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', opacity: 0.85 }}>{reviewLeave.employee_name || `Employee #${reviewLeave.employee}`}</p>
                </div>
                <button onClick={() => setReviewLeave(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <div style={{ padding: '24px 28px' }}>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1.5px solid #F1F5F9' }}>
                  {[
                    ['Leave Type', leaveTypeLabels[reviewLeave.leave_type] || reviewLeave.leave_type],
                    ['Start Date', reviewLeave.start_date],
                    ['End Date',   reviewLeave.end_date],
                    ['Reason',     reviewLeave.reason || '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: '1px' }}>{label}</span>
                      <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '500' }}>{val}</span>
                    </div>
                  ))}
                </div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comments (Optional)</label>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                  placeholder="Add a comment for this decision..."
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
              </div>
              <div style={{ padding: '0 28px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setReviewLeave(null)} style={{ padding: '10px 20px', backgroundColor: '#F8FAFC', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button disabled={actionLoading} onClick={() => handleLeaveAction(reviewLeave.id, 'REJECTED')}
                  style={{ padding: '10px 20px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? '...' : 'Reject'}
                </button>
                <button disabled={actionLoading} onClick={() => handleLeaveAction(reviewLeave.id, 'APPROVED')}
                  style={{ padding: '10px 20px', backgroundColor: '#16A34A', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.7 : 1, boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                  {actionLoading ? '...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ── MY PROFILE ───────────────────────────────────────────────── */
  const renderProfile = () => (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: 0 }}>My Profile</h2>
        <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>Your manager account details</p>
      </div>
      {!managerProfile ? (
        <div style={{ textAlign: 'center', padding: '64px', color: '#94A3B8' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid #FED7AA', borderTop: '3px solid #F97316', borderRadius: '50%', animation: 'mgSpin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading profile...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Personal Info */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '800', border: '3px solid #FED7AA' }}>
                {(managerProfile.first_name || 'M').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  {managerProfile.first_name} {managerProfile.last_name}
                </div>
                <span style={{ backgroundColor: '#FFFBEB', color: '#D97706', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #FDE68A' }}>
                  👔 Manager
                </span>
              </div>
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>Personal Information</div>
            {[
              ['Employee ID',  managerProfile.employee_id || '—'],
              ['Email',        managerProfile.email || managerProfile.user_email || '—'],
              ['Phone',        managerProfile.phone || '—'],
              ['Department',   managerProfile.department || '—'],
              ['Designation',  managerProfile.designation || 'Manager'],
              ['Joining Date', managerProfile.joining_date ? new Date(managerProfile.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'],
              ['Gender',       managerProfile.gender || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', marginBottom: '10px', alignItems: 'start' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: '1px' }}>{label}</span>
                <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '500' }}>{val}</span>
              </div>
            ))}
          </div>
          {/* Department Stats */}
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '20px' }}>Department Stats</div>
            {[
              { label: 'Team Size',       value: stats.totalEmployees, color: '#F97316', icon: '👥' },
              { label: 'Pending Leaves',  value: stats.pendingLeaves,  color: '#F59E0B', icon: '⏳' },
              { label: 'Total Leaves',    value: stats.totalLeaves,    color: '#2563EB', icon: '📋' },
              { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, color: '#16A34A', icon: '📅' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '10px', marginBottom: '10px', border: '1.5px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{label}</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: '800', color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ── renderContent ────────────────────────────────────────────── */
  const renderContent = () => {
    switch (activeSection) {
      case 'team-members':     return renderTeamMembers();
      case 'leave-management': return renderLeaveManagement();
      case 'attendance':       return <div style={{ padding: '24px' }}><AdminAttendance /></div>;
      case 'reports':          return <div style={{ padding: '24px' }}><HRReports user={user} isManager={true} /></div>;
      case 'announcements':    return <div style={{ padding: '24px' }}><AdminAnnouncements user={user} /></div>;
      case 'holidays':         return <div style={{ padding: '24px' }}><HolidayCalendar /></div>;
      case 'profile':          return renderProfile();
      default:                 return renderDashboard();
    }
  };

  /* ── DASHBOARD ────────────────────────────────────────────────── */
  const renderDashboard = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '28px 32px', fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      {error && !loading && (
        <div style={{
          background: '#FEF2F2',
          border: '1.5px solid #FECACA',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '600',
        }}>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠️</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={fetchDashboardData}
            style={{
              background: 'white',
              border: '1.5px solid #FECACA',
              borderRadius: '10px',
              padding: '8px 14px',
              cursor: 'pointer',
              color: '#DC2626',
              fontSize: '13px',
              fontWeight: '800',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>&#x1F4CA;</div>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Welcome back, {managerProfile?.first_name || user?.username || 'Manager'}!
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '20px', marginBottom: '28px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ background: '#E2E8F0', padding: '20px 24px', borderRadius: '16px', height: '110px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '20px', marginBottom: '28px' }}>
          {[
            { label: 'Team Size',       value: stats.totalEmployees, sub: 'Dept employees',    icon: '&#x1F465;', gradient: 'linear-gradient(135deg,#F97316,#EA580C)', shadow: 'rgba(249,115,22,0.25)', section: 'team-members' },
            { label: 'Pending Leaves',  value: stats.pendingLeaves,  sub: 'Awaiting approval', icon: '&#x23F3;',  gradient: 'linear-gradient(135deg,#F59E0B,#D97706)', shadow: 'rgba(245,158,11,0.25)', section: 'leave-management' },
            { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, sub: 'Current period', icon: '&#x1F4C5;', gradient: 'linear-gradient(135deg,#16A34A,#15803D)', shadow: 'rgba(22,163,74,0.25)', section: 'attendance' },
            { label: 'Total Leaves',    value: stats.totalLeaves,    sub: 'All requests',      icon: '&#x1F4DD;', gradient: 'linear-gradient(135deg,#2563EB,#1D4ED8)', shadow: 'rgba(37,99,235,0.25)', section: 'leave-management' },
          ].map(card => (
            <div key={card.label} onClick={() => setActiveSection(card.section)}
              style={{ background: card.gradient, padding: '22px 24px', borderRadius: '16px', color: 'white', boxShadow: `0 6px 20px ${card.shadow}`, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <div style={{ fontSize: '28px', marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: card.icon }} />
              <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{card.label}</div>
              <div style={{ fontSize: '36px', fontWeight: '800', lineHeight: 1, marginBottom: '6px' }}>{card.value}</div>
              <div style={{ fontSize: '12px', opacity: 0.75, fontWeight: '500' }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Control Room + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Control Room */}
        <div style={{ backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>&#x1F3DB;</div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>Department Overview</span>
          </div>
          <div style={{ padding: '24px' }}>
            {[
              { label: 'Team Members',    value: stats.totalEmployees, color: '#F97316', pct: Math.min(100, stats.totalEmployees * 5) },
              { label: 'Pending Leaves',  value: stats.pendingLeaves,  color: '#F59E0B', pct: Math.min(100, stats.pendingLeaves * 10) },
              { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, color: '#16A34A', pct: parseFloat(stats.attendanceRate) || 0 },
              { label: 'Total Leaves',    value: stats.totalLeaves,    color: '#2563EB', pct: Math.min(100, stats.totalLeaves * 3) },
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

        {/* Quick Actions */}
        <div style={{ backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#16A34A,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>&#x26A1;</div>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>Quick Actions</span>
          </div>
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Review Leaves',  icon: '&#x1F4DD;', color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', section: 'leave-management' },
              { label: 'Team Members',   icon: '&#x1F465;', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', section: 'team-members' },
              { label: 'Attendance',     icon: '&#x1F4C5;', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', section: 'attendance' },
              { label: 'Announcements',  icon: '&#x1F4E2;', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', section: 'announcements' },
            ].map(qa => (
              <button key={qa.label} onClick={() => setActiveSection(qa.section)}
                style={{ padding: '16px 14px', backgroundColor: qa.bg, color: qa.color, border: `1.5px solid ${qa.border}`, borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${qa.border}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <span style={{ fontSize: '24px' }} dangerouslySetInnerHTML={{ __html: qa.icon }} />
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Recent Leave Requests</span>
            {leaveRequests.length > 0 && <span style={{ backgroundColor: '#FFF7ED', color: '#EA580C', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #FED7AA' }}>{leaveRequests.length}</span>}
          </div>
          <button onClick={() => setActiveSection('leave-management')} style={{ fontSize: '12px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>View All &rarr;</button>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid #FED7AA', borderTop: '3px solid #F97316', borderRadius: '50%', animation: 'mgSpin 0.8s linear infinite', margin: '0 auto 10px' }} />
            Loading...
          </div>
        ) : leaveRequests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>&#x1F4ED;</div>
            No leave requests in your department.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  {['Employee', 'Leave Type', 'Duration', 'Status'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #F1F5F9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveRequests.slice(0, 6).map((leave, idx) => (
                  <tr key={leave.id} style={{ borderBottom: '1px solid #F8FAFC', backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#FAFAFA'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                          {(leave.employee_name || 'E').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>{leave.employee_name || `Employee #${leave.employee}`}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{leave.department || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', border: '1px solid #BFDBFE' }}>
                        {leaveTypeLabels[leave.leave_type] || leave.leave_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748B' }}>{leave.start_date} &ndash; {leave.end_date}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={leave.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
  /* ── MAIN RETURN ──────────────────────────────────────────────── */
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F8FAFC', fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes mgSpin  { to { transform: rotate(360deg) } }
        @keyframes pulse   { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }
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

      {/* Toast notification */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
          padding: '14px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
          background: '#0F172A', color: 'white', fontSize: '14px', fontWeight: '600',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', animation: 'slideUp 0.3s ease',
          borderLeft: `4px solid ${notification.type === 'error' ? '#EF4444' : '#10B981'}`,
          maxWidth: '360px',
        }}>
          <span>{notification.type === 'error' ? '⚠' : '✓'}</span>
          {notification.message}
        </div>
      )}

      {renderSidebar()}

      <div style={{ flex: 1, overflowY: 'auto', height: '100vh', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {renderTopBar()}
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F8FAFC', animation: 'fadeIn 0.25s ease' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ManagerAdminDashboard;

