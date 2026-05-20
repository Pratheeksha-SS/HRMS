import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import api from '../../utils/axiosConfig';
import AttendanceDashboard from '../../components/AttendanceDashboard';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  orange:      '#F97316',
  orangeDark:  '#EA580C',
  orangeLight: '#FFF7ED',
  orangeMid:   '#FED7AA',
  green:       '#16A34A',
  greenLight:  '#F0FDF4',
  greenMid:    '#BBF7D0',
  red:         '#DC2626',
  redLight:    '#FEF2F2',
  redMid:      '#FECACA',
  amber:       '#D97706',
  amberLight:  '#FFFBEB',
  blue:        '#2563EB',
  blueLight:   '#EFF6FF',
  purple:      '#7C3AED',
  slate:       '#475569',
  slateLight:  '#F8FAFC',
  border:      '#E2E8F0',
  borderMid:   '#F1F5F9',
  text:        '#0F172A',
  textMid:     '#475569',
  textMuted:   '#94A3B8',
  white:       '#FFFFFF',
  shadow:      '0 2px 8px rgba(0,0,0,0.06)',
  shadowMd:    '0 4px 16px rgba(0,0,0,0.08)',
  shadowLg:    '0 12px 40px rgba(0,0,0,0.16)',
  radius:      '12px',
  radiusSm:    '8px',
  radiusLg:    '16px',
  radiusXl:    '20px',
  font:        "'Nunito','Segoe UI',sans-serif",
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_COLORS = {
  P:    { bg: T.greenLight,  color: T.green,      border: T.greenMid,  label: 'Present'   },
  P_MO: { bg: T.amberLight,  color: T.amber,      border: '#FCD34D',   label: 'Present*'  },
  A:    { bg: T.redLight,    color: T.red,        border: T.redMid,    label: 'Absent'    },
  WO:   { bg: T.slateLight,  color: T.slate,      border: T.border,    label: 'Week Off'  },
  LEAVE:{ bg: T.blueLight,   color: T.blue,       border: '#BFDBFE',   label: 'Leave'     },
  HALF: { bg: T.orangeLight, color: T.orangeDark, border: T.orangeMid, label: 'Half Day'  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Badge = memo(({ status }) => {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.A;
  return (
    <span style={{
      padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      backgroundColor: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>{cfg.label}</span>
  );
});

const SkeletonRows = ({ cols = 9, rows = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} style={{ padding: '12px 14px' }}>
            <div style={{ height: 13, width: 60 + (j * 20) % 80, borderRadius: 5, background: '#E2E8F0', animation: 'skPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.05}s` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const StatCard = memo(({ label, value, sub, color = T.orange, icon }) => (
  <div style={{
    background: T.white, borderRadius: T.radiusLg, padding: '20px 22px',
    boxShadow: T.shadow, border: `1px solid ${T.borderMid}`, position: 'relative', overflow: 'hidden',
    transition: 'all 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadowMd; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
      <div style={{ fontSize: 22 }}>{icon}</div>
    </div>
    <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMuted }}>{sub}</div>}
  </div>
));

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminAttendance = () => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [dashboardDate, setDashboardDate] = useState(() => sessionStorage.getItem('adminAttendanceDashboardDate') || today);
  const [tab, setTab]                   = useState('overview');
  const [month, setMonth]               = useState(() => Number((sessionStorage.getItem('adminAttendanceDashboardDate') || today).split('-')[1]));
  const [year, setYear]                 = useState(() => Number((sessionStorage.getItem('adminAttendanceDashboardDate') || today).split('-')[0]));
  const [records, setRecords]           = useState([]);
  const [summaries, setSummaries]       = useState([]);
  const [dashStats, setDashStats]       = useState(null);
  const [uploads, setUploads]           = useState([]);
  const [loading, setLoading]           = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMsg, setUploadMsg]       = useState(null);
  const [unregistered, setUnregistered] = useState([]);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const fileRef = useRef();

  const updateDashboardDate = useCallback((date) => {
    if (!date) return;
    const [nextYear, nextMonth] = date.split('-').map(Number);
    setDashboardDate(date);
    setMonth(nextMonth);
    setYear(nextYear);
    sessionStorage.setItem('adminAttendanceDashboardDate', date);
  }, []);

  const updateMonth = useCallback((nextMonth) => {
    const parts = dashboardDate.split('-');
    const day = Number(parts[2] || 1);
    const maxDay = new Date(year, nextMonth, 0).getDate();
    updateDashboardDate(`${year}-${String(nextMonth).padStart(2, '0')}-${String(Math.min(day, maxDay)).padStart(2, '0')}`);
  }, [dashboardDate, year, updateDashboardDate]);

  const updateYear = useCallback((nextYear) => {
    const parts = dashboardDate.split('-');
    const nextMonth = month;
    const day = Number(parts[2] || 1);
    const maxDay = new Date(nextYear, nextMonth, 0).getDate();
    updateDashboardDate(`${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(Math.min(day, maxDay)).padStart(2, '0')}`);
  }, [dashboardDate, month, updateDashboardDate]);

  const fetchAll = useCallback(async (options = {}) => {
    const {
      includeRecords = tab === 'daily',
      includeSummary = tab === 'overview',
      includeStats = tab !== 'dashboard' && tab !== 'uploads',
      includeUploads = tab === 'uploads',
    } = options;

    if (!includeRecords && !includeSummary && !includeStats && !includeUploads) return;

    setLoading(true);
    try {
      const requests = [];

      if (includeRecords) {
        requests.push(api.get(`/attendance/?month=${month}&year=${year}`).then(res => {
          setRecords(res.data || []);
        }));
      }
      if (includeSummary) {
        requests.push(api.get(`/attendance/summary/?month=${month}&year=${year}`).then(res => {
          setSummaries(res.data || []);
        }));
      }
      if (includeStats) {
        requests.push(api.get(`/attendance/dashboard-stats/?month=${month}&year=${year}`).then(res => {
          setDashStats(res.data || null);
        }));
      }
      if (includeUploads) {
        requests.push(api.get('/attendance/upload/').then(res => {
          setUploads(res.data || []);
        }));
      }

      await Promise.all(requests);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [month, year, tab]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadMsg(null); setUnregistered([]); setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 12, 85));
    }, 200);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('month', month);
    fd.append('year', year);
    try {
      const res = await api.post('/attendance/upload/', fd);
      clearInterval(progressInterval);
      setUploadProgress(100);
      const d = res.data;
      const unreg = d.unregistered_employees || [];
      setUnregistered(unreg);
      const base = d.message || `Processed ${d.records_processed} records.`;
      const warn = unreg.length > 0 ? ` ${unreg.length} employee code(s) not registered.` : '';
      setUploadMsg({ type: unreg.length > 0 ? 'warning' : 'success', text: base + warn });
      fetchAll({ includeRecords: true, includeSummary: true, includeStats: true, includeUploads: true });
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setUploadMsg({ type: 'error', text: err.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
      e.target.value = '';
    }
  };

  const exportCSV = () => {
    const rows = [['Employee Code','Employee Name','Date','In Time','Out Time','Working Hours','Late By','Early By','Status']];
    filteredRecords.forEach(r => rows.push([r.employee_code,r.employee_name,r.date,r.in_time||'',r.out_time||'',r.working_hours,r.late_by,r.early_by,r.status_display]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `attendance_${MONTHS[month-1]}_${year}.csv`;
    a.click();
  };

  const handleDeleteUpload = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/attendance/upload/${deleteTarget.id}/`);
      setUploadMsg({ type: 'success', text: res.data?.message || 'Upload deleted.' });
      setDeleteTarget(null);
      fetchAll({ includeRecords: true, includeSummary: true, includeStats: true, includeUploads: true });
    } catch (err) {
      setUploadMsg({ type: 'error', text: err.response?.data?.error || 'Failed to delete.' });
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const filteredRecords = useMemo(() => records.filter(r => {
    const mS = !search || r.employee_name.toLowerCase().includes(search.toLowerCase()) || r.employee_code.toLowerCase().includes(search.toLowerCase());
    const mT = statusFilter === 'ALL' || r.status === statusFilter;
    return mS && mT;
  }), [records, search, statusFilter]);

  const filteredSummaries = useMemo(() => summaries.filter(s =>
    !search || s.employee_name.toLowerCase().includes(search.toLowerCase()) || s.employee_code.toLowerCase().includes(search.toLowerCase())
  ), [summaries, search]);

  const tabStyle = (t) => ({
    padding: '8px 20px', borderRadius: T.radiusSm, border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: 13, fontFamily: T.font,
    background: tab === t ? T.orange : T.white,
    color:      tab === t ? T.white   : T.textMid,
    boxShadow:  tab === t ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
    transition: 'all 0.15s',
  });

  const msgColor = {
    success: { bg: T.greenLight,  color: T.green,      border: T.greenMid },
    warning: { bg: T.amberLight,  color: T.amber,      border: '#FDE68A' },
    error:   { bg: T.redLight,    color: T.red,        border: T.redMid },
  };

  const selStyle = {
    padding: '8px 12px', borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
    fontSize: 13, fontFamily: T.font, background: T.white, cursor: 'pointer',
    outline: 'none', color: T.text,
  };

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh', background: T.slateLight, fontFamily: T.font }}>
      <style>{`
        @keyframes skPulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeBlur { from{opacity:0;backdrop-filter:blur(0)} to{opacity:1;backdrop-filter:blur(6px)} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes progBar  { from{width:0} to{width:100%} }
        .aa-row:hover { background: ${T.orangeLight} !important; }
        .aa-sel:focus { border-color: ${T.orange} !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.1) !important; }
        .tab-btn:hover { background: ${T.orangeLight} !important; color: ${T.orange} !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12, animation: 'fadeIn 0.4s ease' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.5px' }}>Attendance Management</h1>
          <p style={{ color: T.textMuted, fontSize: 13, margin: '4px 0 0', fontWeight: 500 }}>
            Upload Excel reports • Track employee attendance • {MONTHS[month-1]} {year}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={month} onChange={e => updateMonth(+e.target.value)} className="aa-sel" style={selStyle}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => updateYear(+e.target.value)} className="aa-sel" style={selStyle}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
            padding: '9px 18px', borderRadius: T.radiusSm, border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
            background: uploading ? T.border : `linear-gradient(135deg,${T.orange},${T.orangeDark})`,
            color: T.white, fontWeight: 700, fontSize: 13, fontFamily: T.font,
            boxShadow: uploading ? 'none' : '0 4px 12px rgba(249,115,22,0.3)',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
          }}>
            {uploading ? '⏳ Uploading…' : '📤 Upload Excel'}
          </button>
          <button onClick={exportCSV} style={{
            padding: '9px 18px', borderRadius: T.radiusSm, border: `1.5px solid ${T.orangeMid}`,
            background: T.orangeLight, color: T.orangeDark, fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s',
          }}>⬇ Export CSV</button>
        </div>
      </div>

      {/* ── Upload Progress Bar ── */}
      {uploading && uploadProgress > 0 && (
        <div style={{ marginBottom: 12, background: T.white, borderRadius: T.radiusSm, padding: '10px 16px', boxShadow: T.shadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.textMid }}>Uploading & processing…</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: T.orange }}>{uploadProgress}%</span>
          </div>
          <div style={{ height: 6, background: T.borderMid, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${uploadProgress}%`, background: `linear-gradient(90deg,${T.orange},${T.orangeDark})`, borderRadius: 3, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* ── Upload message ── */}
      {uploadMsg && (
        <div style={{
          padding: '12px 16px', borderRadius: T.radius,
          marginBottom: unregistered.length > 0 ? 0 : 16,
          background: msgColor[uploadMsg.type].bg,
          color: msgColor[uploadMsg.type].color,
          border: `1px solid ${msgColor[uploadMsg.type].border}`,
          fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.3s ease',
        }}>
          <span>{uploadMsg.type === 'success' ? '✓' : uploadMsg.type === 'warning' ? '⚠' : '✕'}</span>
          {uploadMsg.text}
          <button onClick={() => setUploadMsg(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* ── Unregistered employees panel ── */}
      {unregistered.length > 0 && (
        <div style={{ marginBottom: 16, background: T.amberLight, border: `1.5px solid #FDE68A`, borderRadius: T.radius, overflow: 'hidden', animation: 'fadeIn 0.35s ease' }}>
          <div style={{ padding: '10px 16px', background: '#FEF3C7', borderBottom: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#92400E' }}>⚠ {unregistered.length} Employee Code(s) Not Registered</span>
            <span style={{ fontSize: 12, color: '#B45309' }}>Attendance saved but not linked. Register with the exact code below.</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#FEF9C3' }}>
                  {['Employee Code (Excel)','Employee Name (Excel)','Action Required'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#92400E', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unregistered.map((u, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #FDE68A' }}>
                    <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#B45309' }}>{u.employee_code}</td>
                    <td style={{ padding: '9px 14px', color: T.text, fontWeight: 600 }}>{u.employee_name}</td>
                    <td style={{ padding: '9px 14px', color: T.textMid, fontSize: 12 }}>
                      Go to <strong>Employee Management</strong> → Add Employee → set Code to <code style={{ background: '#FEF3C7', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{u.employee_code}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: T.white, padding: 6, borderRadius: T.radiusLg, width: 'fit-content', boxShadow: T.shadow }}>
        {[['dashboard','📊 Dashboard'],['overview','📋 Summary'],['daily','📅 Daily Records'],['uploads','📁 Upload History']].map(([t, l]) => (
          <button key={t} className="tab-btn" style={tabStyle(t)} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>

      {/* ── Search + filter (non-dashboard/upload tabs) ── */}
      {tab !== 'uploads' && tab !== 'dashboard' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search employee…"
            className="aa-sel" style={{ ...selStyle, width: 230 }} />
          {tab === 'daily' && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="aa-sel" style={selStyle}>
              <option value="ALL">All Statuses</option>
              {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          )}
          {(search || statusFilter !== 'ALL') && (
            <button onClick={() => { setSearch(''); setStatusFilter('ALL'); }} style={{
              padding: '8px 14px', borderRadius: T.radiusSm, border: `1.5px solid ${T.redMid}`,
              background: T.redLight, color: T.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            }}>✕ Clear</button>
          )}
        </div>
      )}

      {/* ── Dashboard Stats Cards (above dashboard tab) ── */}
      {tab === 'overview' && dashStats && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 20, animation: 'fadeIn 0.4s ease' }}>
          <StatCard label="Total Present"   value={dashStats.total_present   || 0} color={T.green}  icon="✅" sub={`${MONTHS[month-1]} ${year}`} />
          <StatCard label="Total Absent"    value={dashStats.total_absent    || 0} color={T.red}    icon="❌" />
          <StatCard label="Avg Attendance"  value={`${dashStats.avg_attendance_pct || 0}%`} color={T.orange} icon="📊" />
          <StatCard label="Late Check-ins"  value={dashStats.total_late      || 0} color={T.amber}  icon="⏱" />
        </div>
      )}

      {/* ── Tab content ── */}
      {loading ? (
        <div style={{ background: T.white, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadow }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.slateLight }}>
                {(tab === 'overview'
                  ? ['Employee','Code','Present','Absent','Week Off','Working Days','Total Hrs','Avg Hrs','Late (min)','Att %']
                  : tab === 'daily'
                  ? ['Date','Employee','Code','In','Out','Hours','Late','Early','Status']
                  : ['File','Month/Year','Records','Failed','Status','Uploaded At','Action']
                ).map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody><SkeletonRows cols={tab === 'daily' ? 9 : tab === 'overview' ? 10 : 7} /></tbody>
          </table>
        </div>
      ) : (
        <>
          {/* DASHBOARD TAB */}
          {tab === 'dashboard' && (
            <div style={{ marginTop: '-24px', marginLeft: '-28px', marginRight: '-28px', marginBottom: '-24px' }}>
              <AttendanceDashboard selectedDate={dashboardDate} onDateChange={updateDashboardDate} />
            </div>
          )}

          {/* SUMMARY TAB */}
          {tab === 'overview' && (
            <div style={{ background: T.white, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadow, animation: 'fadeIn 0.3s ease' }}>
              {filteredSummaries.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.textMuted }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: T.textMid, marginBottom: 6 }}>No data for {MONTHS[month-1]} {year}</div>
                  <div style={{ fontSize: 13 }}>Upload an Excel file to get started</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: T.slateLight, borderBottom: `2px solid ${T.border}` }}>
                        {['Employee','Code','Present','Absent','Week Off','Working Days','Total Hours','Avg Hours','Late (min)','Attendance %'].map(h => (
                          <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textMuted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSummaries.map((s, i) => {
                        const base = i % 2 === 0 ? T.white : '#FAFBFC';
                        return (
                          <tr key={i} className="aa-row" style={{ borderBottom: `1px solid ${T.borderMid}`, background: base, transition: 'background 0.15s' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>{s.employee_name}</td>
                            <td style={{ padding: '12px 14px', color: T.orange, fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{s.employee_code}</td>
                            <td style={{ padding: '12px 14px' }}><span style={{ color: T.green, fontWeight: 700 }}>{s.total_present}</span></td>
                            <td style={{ padding: '12px 14px' }}><span style={{ color: T.red, fontWeight: 700 }}>{s.total_absent}</span></td>
                            <td style={{ padding: '12px 14px', color: T.textMid }}>{s.total_weekly_off}</td>
                            <td style={{ padding: '12px 14px', color: T.text }}>{s.total_working_days}</td>
                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: T.blue, fontWeight: 600 }}>{s.total_duration}</td>
                            <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: T.textMid }}>{s.avg_working_hours}</td>
                            <td style={{ padding: '12px 14px', color: s.total_late_mins > 60 ? T.red : T.textMid }}>{s.total_late_mins}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 6, background: T.borderMid, borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                                  <div style={{ height: '100%', width: `${s.attendance_percentage}%`, borderRadius: 3,
                                    background: s.attendance_percentage >= 80 ? T.green : s.attendance_percentage >= 60 ? T.orange : T.red }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: s.attendance_percentage >= 80 ? T.green : s.attendance_percentage >= 60 ? T.orange : T.red }}>
                                  {s.attendance_percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DAILY RECORDS TAB */}
          {tab === 'daily' && (
            <div style={{ background: T.white, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadow, animation: 'fadeIn 0.3s ease' }}>
              {filteredRecords.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.textMuted }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: T.textMid }}>No daily records found</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: T.slateLight, borderBottom: `2px solid ${T.border}` }}>
                        {['Date','Employee','Code','In Time','Out Time','Working Hrs','Late By','Early By','Status'].map(h => (
                          <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textMuted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r, i) => {
                        const base = i % 2 === 0 ? T.white : '#FAFBFC';
                        return (
                          <tr key={i} className="aa-row" style={{ borderBottom: `1px solid ${T.borderMid}`, background: base, transition: 'background 0.15s' }}>
                            <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.slate, fontSize: 12 }}>{r.date}</td>
                            <td style={{ padding: '11px 14px', fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>
                              {r.employee_name}
                              {r.is_registered === false && (
                                <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: T.redLight, color: T.red, border: `1px solid ${T.redMid}` }}>Not Registered</span>
                              )}
                            </td>
                            <td style={{ padding: '11px 14px', color: T.orange, fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{r.employee_code}</td>
                            <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.green, fontWeight: 600 }}>{r.in_time || '—'}</td>
                            <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.red, fontWeight: 600 }}>{r.out_time || '—'}</td>
                            <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.blue, fontWeight: 700 }}>{r.working_hours}</td>
                            <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: r.late_by !== '00:00' ? T.red : T.textMuted }}>{r.late_by}</td>
                            <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: r.early_by !== '00:00' ? T.amber : T.textMuted }}>{r.early_by}</td>
                            <td style={{ padding: '11px 14px' }}><Badge status={r.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.borderMid}`, background: T.slateLight, fontSize: 12, color: T.textMuted, fontWeight: 600 }}>
                {filteredRecords.length} of {records.length} records
              </div>
            </div>
          )}

          {/* UPLOAD HISTORY TAB */}
          {tab === 'uploads' && (
            <div style={{ background: T.white, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadow, animation: 'fadeIn 0.3s ease' }}>
              {uploads.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: T.textMuted }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: T.textMid, marginBottom: 6 }}>No uploads yet</div>
                  <div style={{ fontSize: 13 }}>Upload your first attendance Excel file to get started</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: T.slateLight, borderBottom: `2px solid ${T.border}` }}>
                        {['File Name','Period','Records','Failed','Status','Uploaded At','Action'].map(h => (
                          <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textMuted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploads.map((u, i) => (
                        <tr key={i} className="aa-row" style={{ borderBottom: `1px solid ${T.borderMid}`, background: i % 2 === 0 ? T.white : '#FAFBFC', transition: 'background 0.15s' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: T.text }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16 }}>📄</span>
                              <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.original_filename}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', color: T.textMid }}>{MONTHS[u.month-1]} {u.year}</td>
                          <td style={{ padding: '12px 14px', color: T.green, fontWeight: 700 }}>{u.records_processed}</td>
                          <td style={{ padding: '12px 14px', color: u.records_failed > 0 ? T.red : T.textMuted, fontWeight: u.records_failed > 0 ? 700 : 400 }}>{u.records_failed}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                              background: u.status === 'DONE' ? T.greenLight : u.status === 'FAILED' ? T.redLight : T.amberLight,
                              color: u.status === 'DONE' ? T.green : u.status === 'FAILED' ? T.red : T.amber,
                              border: `1px solid ${u.status === 'DONE' ? T.greenMid : u.status === 'FAILED' ? T.redMid : '#FDE68A'}`,
                            }}>{u.status}</span>
                          </td>
                          <td style={{ padding: '12px 14px', color: T.textMid, fontSize: 12 }}>{u.uploaded_at}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <button onClick={() => setDeleteTarget(u)} style={{
                              padding: '6px 14px', borderRadius: T.radiusSm, border: `1.5px solid ${T.redMid}`,
                              background: T.redLight, color: T.red, fontSize: 12, fontWeight: 700,
                              cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s',
                            }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = T.redLight; }}>
                              🗑 Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Top Absentees ── */}
      {tab === 'overview' && dashStats?.top_absentees?.length > 0 && (
        <div style={{ marginTop: 20, background: T.white, borderRadius: T.radiusLg, padding: '20px 22px', boxShadow: T.shadow, animation: 'fadeIn 0.5s ease' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚠️</span> Top Absentees — {MONTHS[month-1]} {year}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dashStats.top_absentees.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: T.redLight, borderRadius: 10, border: `1px solid ${T.redMid}` }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.red, color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                  {(e.employee_name || 'E').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{e.employee_name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{e.employee_code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: T.red, fontWeight: 800, fontSize: 18 }}>{e.total_absent}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>absent days</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: 20,
          animation: 'fadeBlur 0.2s ease',
        }}>
          <div style={{
            background: T.white, borderRadius: T.radiusXl, padding: '32px 36px',
            maxWidth: 480, width: '100%', boxShadow: T.shadowLg,
            animation: 'slideUp 0.25s ease',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.redLight, border: `2px solid ${T.redMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 20px' }}>🗑️</div>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, textAlign: 'center', margin: '0 0 10px' }}>Delete Attendance Upload?</h2>
            <p style={{ fontSize: 13, color: T.textMid, textAlign: 'center', margin: '0 0 18px', lineHeight: 1.6 }}>
              You are about to permanently delete:
            </p>

            <div style={{ background: T.slateLight, borderRadius: 10, padding: '14px 18px', border: `1.5px solid ${T.border}`, marginBottom: 18 }}>
              {[
                ['File', deleteTarget.original_filename],
                ['Period', `${MONTHS[deleteTarget.month - 1]} ${deleteTarget.year}`],
                ['Records', `${deleteTarget.records_processed} attendance records`],
                ['Uploaded', deleteTarget.uploaded_at],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>{l}</span>
                  <span style={{ fontSize: 13, color: T.text, fontWeight: 700, maxWidth: 240, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: T.amberLight, border: `1px solid #FDE68A`, borderRadius: 8, padding: '10px 14px', marginBottom: 22, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
              <strong>⚠ Warning:</strong> This will permanently delete {deleteTarget.records_processed} attendance records and monthly summaries. This action cannot be undone.
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{
                padding: '10px 24px', borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
                background: T.white, color: T.textMid, fontSize: 13, fontWeight: 700,
                cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: T.font, opacity: deleting ? 0.6 : 1,
              }}>Cancel</button>
              <button onClick={handleDeleteUpload} disabled={deleting} style={{
                padding: '10px 24px', borderRadius: T.radiusSm, border: 'none',
                background: deleting ? T.border : `linear-gradient(135deg,${T.red},#B91C1C)`,
                color: T.white, fontSize: 13, fontWeight: 700,
                cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: T.font,
                boxShadow: deleting ? 'none' : '0 4px 12px rgba(220,38,38,0.3)',
                minWidth: 130, transition: 'all 0.15s',
              }}>
                {deleting ? '⏳ Deleting…' : '🗑 Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
