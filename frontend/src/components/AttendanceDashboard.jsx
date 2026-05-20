import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import api from '../utils/axiosConfig';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  orange:       '#F97316',
  orangeDark:   '#EA580C',
  orangeLight:  '#FFF7ED',
  orangeMid:    '#FED7AA',
  green:        '#16A34A',
  greenLight:   '#F0FDF4',
  greenMid:     '#BBF7D0',
  red:          '#DC2626',
  redLight:     '#FEF2F2',
  redMid:       '#FECACA',
  amber:        '#D97706',
  amberLight:   '#FFFBEB',
  blue:         '#2563EB',
  blueLight:    '#EFF6FF',
  purple:       '#7C3AED',
  purpleLight:  '#F5F3FF',
  slate:        '#475569',
  slateLight:   '#F8FAFC',
  border:       '#E2E8F0',
  borderMid:    '#F1F5F9',
  text:         '#0F172A',
  textMid:      '#475569',
  textMuted:    '#94A3B8',
  white:        '#FFFFFF',
  shadow:       '0 2px 8px rgba(0,0,0,0.06)',
  shadowMd:     '0 4px 16px rgba(0,0,0,0.08)',
  shadowLg:     '0 8px 32px rgba(0,0,0,0.12)',
  radius:       '12px',
  radiusSm:     '8px',
  radiusLg:     '16px',
  font:         "'Nunito','Segoe UI',sans-serif",
};

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  P:    { bg: T.greenLight,  color: T.green,  border: T.greenMid,  label: 'Present' },
  P_MO: { bg: T.amberLight,  color: T.amber,  border: '#FCD34D',   label: 'Present*'},
  A:    { bg: T.redLight,    color: T.red,    border: T.redMid,    label: 'Absent'},
  WO:   { bg: T.slateLight,  color: T.slate,  border: T.border,    label: 'Week Off'},
  LEAVE:{ bg: T.blueLight,   color: T.blue,   border: '#BFDBFE',   label: 'Leave' },
  HALF: { bg: T.orangeLight, color: T.orangeDark, border: T.orangeMid, label: 'Half Day'},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().split('T')[0];
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatusBadge = memo(({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.A;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      backgroundColor: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
      whiteSpace: 'nowrap', letterSpacing: '0.2px',
    }}>
      <span>{cfg.icon}</span>{cfg.label}
    </span>
  );
});

const StatCard = memo(({ label, value, color, icon, sub, trend }) => (
  <div style={{
    background: T.white, borderRadius: T.radiusLg, padding: '20px 22px',
    boxShadow: T.shadow, border: `1px solid ${T.borderMid}`,
    transition: 'all 0.2s', cursor: 'default',
    position: 'relative', overflow: 'hidden',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = T.shadowMd; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
      <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: T.textMuted }}>{sub}</div>}
    {trend !== undefined && (
      <div style={{ fontSize: 11, color: trend >= 0 ? T.green : T.red, fontWeight: 700, marginTop: 4 }}>
        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs yesterday
      </div>
    )}
  </div>
));

const SkeletonRow = () => (
  <tr>
    {[120, 80, 140, 100, 90, 80, 80, 90, 70, 70, 70, 90].map((w, i) => (
      <td key={i} style={{ padding: '12px 14px' }}>
        <div style={{ height: 14, width: w, borderRadius: 6, background: '#E2E8F0', animation: 'skPulse 1.4s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceDashboard = ({ selectedDate: controlledSelectedDate, onDateChange }) => {
  const today = fmt(new Date());
  const [localSelectedDate, setLocalSelectedDate] = useState(controlledSelectedDate || today);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter]     = useState('ALL');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [data, setData] = useState({ records: [], summary: {} });
  const selectedDate = controlledSelectedDate || localSelectedDate;
  const setSelectedDate = useCallback((date) => {
    setLocalSelectedDate(date);
    onDateChange?.(date);
  }, [onDateChange]);

  const fetchData = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true); setError('');
    try {
      const res = await api.get('/attendance/date-view/', { params: { date: selectedDate } });
      setData(res.data || { records: [], summary: {} });
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load attendance data');
      setData({ records: [], summary: {} });
    } finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const departments = useMemo(() => {
    const s = new Set((data.records || []).map(r => r.department).filter(Boolean));
    return ['ALL', ...Array.from(s).sort()];
  }, [data.records]);

  const filtered = useMemo(() => {
    let r = data.records || [];
    if (statusFilter !== 'ALL') r = r.filter(x => x.status === statusFilter);
    if (deptFilter   !== 'ALL') r = r.filter(x => x.department === deptFilter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.employee_name?.toLowerCase().includes(q) ||
        x.employee_code?.toLowerCase().includes(q) ||
        x.department?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [data.records, statusFilter, deptFilter, search]);

  const s = data.summary || {};
  const attendancePct = s.attendance_pct || (s.total && s.present ? Math.round((s.present / s.total) * 100) : 0);

  const navigate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(fmt(d));
  };

  const formatDisplay = () => new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const isToday = selectedDate === today;

  const navBtn = {
    width: 36, height: 36, borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
    background: T.white, cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s', flexShrink: 0, fontFamily: T.font,
  };

  const selStyle = {
    padding: '8px 12px', borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
    fontSize: 13, fontFamily: T.font, background: T.white, cursor: 'pointer',
    outline: 'none', color: T.text, transition: 'all 0.2s',
  };

  return (
    <div style={{ fontFamily: T.font, background: T.slateLight, minHeight: '100vh', padding: '28px 32px' }}>
      <style>{`
        @keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .attn-row:hover { background: ${T.orangeLight} !important; }
        .ctrl-input:focus { border-color: ${T.orange} !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important; }
        .nav-btn:hover { border-color: ${T.orange} !important; background: ${T.orangeLight} !important; color: ${T.orangeDark} !important; }
        .today-btn:hover { background: #FFEDD5 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28, animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: T.radius, flexShrink: 0,
            background: `linear-gradient(135deg,${T.orange},${T.orangeDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
          }}>📅</div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.5px' }}>
              Attendance Dashboard
            </h1>
            <p style={{ color: T.textMuted, fontSize: 13, margin: '3px 0 0', fontWeight: 500 }}>
              Daily attendance overview • {formatDisplay()}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {!loading && s.total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24, animation: 'fadeIn 0.5s ease' }}>
          <StatCard label="Total Employees" value={s.total || 0}           color={T.text} />
          <StatCard label="Present"         value={s.present || 0}         color={T.green} sub={`${attendancePct}% attendance`} />
          <StatCard label="Absent"          value={s.absent || 0}          color={T.red} />
          <StatCard label="Late Arrivals"   value={s.late || 0}            color={T.amber} />
          <StatCard label="Early Exit"      value={s.early_exit || 0}      color={T.purple} />
          <StatCard label="Attendance %"    value={`${attendancePct}%`}    color={attendancePct >= 80 ? T.green : T.red} />
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{
        background: T.white, borderRadius: T.radiusLg, padding: 20, marginBottom: 20,
        boxShadow: T.shadow, border: `1px solid ${T.borderMid}`,
      }}>
        {/* Date nav row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <button className="nav-btn" style={navBtn} onClick={() => navigate(-1)}>◀</button>

          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="ctrl-input" style={{ ...selStyle, fontWeight: 600 }} />

          <button className="nav-btn" style={navBtn} onClick={() => navigate(1)}>▶</button>

          {!isToday && (
            <button className="today-btn" onClick={() => setSelectedDate(today)} style={{
              padding: '7px 16px', borderRadius: T.radiusSm, border: `1.5px solid ${T.orangeMid}`,
              background: T.orangeLight, color: T.orangeDark, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s',
            }}>Today</button>
          )}

          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, marginLeft: 6 }}>{formatDisplay()}</span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={fetchData} disabled={loading} style={{
              padding: '7px 16px', borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
              background: T.white, color: loading ? T.textMuted : T.textMid, fontSize: 12,
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: T.font,
              opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
            }}>
              {loading ? '⟳ Loading…' : '↺ Refresh'}
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search name, code, department…"
            className="ctrl-input" style={{ ...selStyle, flex: 1, minWidth: 220 }} />

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="ctrl-input" style={selStyle}>
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>

          {departments.length > 2 && (
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="ctrl-input" style={selStyle}>
              {departments.map(d => <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>)}
            </select>
          )}

          {(search || statusFilter !== 'ALL' || deptFilter !== 'ALL') && (
            <button onClick={() => { setSearch(''); setStatusFilter('ALL'); setDeptFilter('ALL'); }}
              style={{
                padding: '7px 14px', borderRadius: T.radiusSm, border: `1.5px solid ${T.redMid}`,
                background: T.redLight, color: T.red, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: T.font,
              }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: T.radius, marginBottom: 20,
          background: T.redLight, color: T.red, border: `1px solid ${T.redMid}`,
          fontSize: 13, fontWeight: 600,
        }}>⚠ {error}</div>
      )}

      {/* ── Status legend strip ── */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => {
            const cnt = filtered.filter(r => r.status === k).length;
            if (!cnt) return null;
            return (
              <button key={k} onClick={() => setStatusFilter(statusFilter === k ? 'ALL' : k)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                  background: statusFilter === k ? v.bg : T.white,
                  border: `1.5px solid ${statusFilter === k ? v.border : T.border}`,
                  color: statusFilter === k ? v.color : T.textMid,
                  fontSize: 12, fontWeight: 700, fontFamily: T.font, transition: 'all 0.15s',
                }}>
                <span>{v.icon}</span>{v.label}<span style={{
                  background: v.bg, color: v.color, border: `1px solid ${v.border}`,
                  borderRadius: 10, padding: '0 7px', fontSize: 11, fontWeight: 800,
                }}>{cnt}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div style={{ background: T.white, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadow }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.slateLight }}>
                {['ID','Code','Name','Dept','Designation','In','Out','Hours','Late','Early','OT','Status'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: T.white, borderRadius: T.radiusLg, padding: '60px 24px',
          textAlign: 'center', boxShadow: T.shadow,
        }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.textMid, marginBottom: 6 }}>
            No attendance records
          </div>
          <div style={{ fontSize: 13, color: T.textMuted }}>
            {search || statusFilter !== 'ALL' || deptFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'No data available for this date'}
          </div>
        </div>
      ) : (
        <div style={{
          background: T.white, borderRadius: T.radiusLg, overflow: 'hidden',
          boxShadow: T.shadow, animation: 'fadeIn 0.35s ease',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.slateLight, borderBottom: `2px solid ${T.border}` }}>
                  {['Emp ID','Code','Name','Department','Designation','In Time','Out Time','Working Hrs','Late By','Early By','Overtime','Status'].map(h => (
                    <th key={h} style={{
                      padding: '12px 14px', textAlign: 'left', color: T.textMuted,
                      fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.5px', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const base = i % 2 === 0 ? T.white : '#FAFBFC';
                  return (
                    <tr key={r.id || i} className="attn-row" style={{ borderBottom: `1px solid ${T.borderMid}`, background: base, transition: 'background 0.15s' }}>
                      <td style={{ padding: '11px 14px', color: T.textMid, fontFamily: 'monospace', fontSize: 12 }}>{r.employee_id || '—'}</td>
                      <td style={{ padding: '11px 14px', color: T.orange, fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{r.employee_code}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>{r.employee_name}</td>
                      <td style={{ padding: '11px 14px' }}>
                        {r.department ? (
                          <span style={{ background: T.orangeLight, color: T.orangeDark, border: `1px solid ${T.orangeMid}`, padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{r.department}</span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', color: T.textMid, fontSize: 12 }}>{r.designation || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.green, fontWeight: 600 }}>{r.in_time || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.red, fontWeight: 600 }}>{r.out_time || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.blue, fontWeight: 700 }}>{r.working_hours}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: r.late_by !== '00:00' ? T.red : T.textMuted, fontWeight: r.late_by !== '00:00' ? 700 : 500 }}>{r.late_by}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: r.early_by !== '00:00' ? T.amber : T.textMuted, fontWeight: r.early_by !== '00:00' ? 700 : 500 }}>{r.early_by}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: r.overtime && r.overtime !== '00:00' ? T.purple : T.textMuted, fontWeight: r.overtime && r.overtime !== '00:00' ? 700 : 500 }}>{r.overtime || '00:00'}</td>
                      <td style={{ padding: '11px 14px' }}><StatusBadge status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: '10px 16px', borderTop: `1px solid ${T.borderMid}`,
            background: T.slateLight, fontSize: 12, color: T.textMuted, fontWeight: 600,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>Showing {filtered.length} of {(data.records || []).length} records</span>
            {search && <span>Filtered by: "{search}"</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;
