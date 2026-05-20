import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import api from '../utils/axiosConfig';

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
  radius:      '12px',
  radiusSm:    '8px',
  radiusLg:    '16px',
  font:        "'Nunito','Segoe UI',sans-serif",
};

const STATUS_CFG = {
  P:    { bg: T.greenLight,  color: T.green,      border: T.greenMid,  label: 'Present',   icon: '✓' },
  P_MO: { bg: T.amberLight,  color: T.amber,      border: '#FCD34D',   label: 'Present*',  icon: '◐' },
  A:    { bg: T.redLight,    color: T.red,        border: T.redMid,    label: 'Absent',    icon: '✕' },
  WO:   { bg: T.slateLight,  color: T.slate,      border: T.border,    label: 'Week Off',  icon: '−' },
  LEAVE:{ bg: '#EFF6FF',     color: T.blue,       border: '#BFDBFE',   label: 'Leave',     icon: '◊' },
  HALF: { bg: T.orangeLight, color: T.orangeDark, border: T.orangeMid, label: 'Half Day',  icon: '◐' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().split('T')[0];
};

const addDays = (dateStr, n) => {
  const d = new Date(dateStr); d.setDate(d.getDate() + n); return fmt(d);
};

const getWeekRange = (dateStr) => {
  const d = new Date(dateStr);
  const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: fmt(mon), end: fmt(sun) };
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Badge = memo(({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.A;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      backgroundColor: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}><span>{cfg.icon}</span>{cfg.label}</span>
  );
});

const SummaryPill = memo(({ label, value, color }) => (
  <div style={{
    background: T.white, borderRadius: 10, padding: '12px 16px',
    border: `1px solid ${T.borderMid}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    minWidth: 90, textAlign: 'center',
  }}>
    <div style={{ fontSize: 22, fontWeight: 800, color: color || T.text }}>{value}</div>
    <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 3 }}>{label}</div>
  </div>
));

const SkeletonRow = () => (
  <tr>
    {[80,100,140,110,110,80,80,85,70,70,70,80].map((w, i) => (
      <td key={i} style={{ padding: '12px 13px' }}>
        <div style={{ height: 13, width: w, borderRadius: 5, background: '#E2E8F0', animation: 'skPulse 1.4s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AttendanceDateView = ({ role = 'ADMIN', initialDate }) => {
  const today = fmt(new Date());
  const [mode, setMode]       = useState('day');
  const [date, setDate]       = useState(initialDate || today);
  const [search, setSearch]   = useState('');
  const [statusF, setStatusF] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [data, setData]       = useState({ records: [], summary: {}, dates: [] });

  const getParams = useCallback(() => {
    if (mode === 'day') return { date };
    if (mode === 'week') { const { start, end } = getWeekRange(date); return { start, end }; }
    const d = new Date(date); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0');
    const last = new Date(y, d.getMonth() + 1, 0).getDate();
    return { start: `${y}-${m}-01`, end: `${y}-${m}-${String(last).padStart(2,'0')}` };
  }, [mode, date]);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = getParams();
      const qs = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
      const res = await api.get(`/attendance/date-view/?${qs}`);
      setData(res.data || { records: [], summary: {}, dates: [] });
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load attendance data.');
      setData({ records: [], summary: {}, dates: [] });
    } finally { setLoading(false); }
  }, [getParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const navigate = (dir) => {
    if (mode === 'day')   setDate(addDays(date, dir));
    if (mode === 'week')  setDate(addDays(date, dir * 7));
    if (mode === 'month') { const d = new Date(date); d.setMonth(d.getMonth() + dir); setDate(fmt(d)); }
  };

  const rangeLabel = () => {
    if (mode === 'day') return new Date(date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (mode === 'week') {
      const { start, end } = getWeekRange(date);
      return `${new Date(start).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} — ${new Date(end).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const filtered = useMemo(() => {
    let r = data.records || [];
    if (statusF !== 'ALL') r = r.filter(x => x.status === statusF);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => x.employee_name?.toLowerCase().includes(q) || x.employee_code?.toLowerCase().includes(q) || x.department?.toLowerCase().includes(q));
    }
    return r;
  }, [data.records, statusF, search]);

  const s = data.summary || {};

  const btnBase = (active) => ({
    padding: '7px 16px', borderRadius: T.radiusSm, border: 'none', cursor: 'pointer',
    fontFamily: T.font, fontSize: 12, fontWeight: 700,
    background: active ? T.orange : T.white,
    color: active ? T.white : T.textMid,
    transition: 'all 0.15s',
  });

  const navBtn = {
    width: 34, height: 34, borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
    background: T.white, cursor: 'pointer', fontSize: 15, display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontFamily: T.font, transition: 'all 0.15s', flexShrink: 0,
  };

  const selStyle = {
    padding: '7px 12px', borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
    fontSize: 13, fontFamily: T.font, background: T.white, cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
  };

  // Columns based on mode/role
  const cols = useMemo(() => {
    const c = [];
    if (mode !== 'day')           c.push({ key: 'date',          label: 'Date' });
    if (mode !== 'day')           c.push({ key: 'day',           label: 'Day' });
    if (role !== 'EMPLOYEE')      c.push({ key: 'employee_name', label: 'Employee' });
    if (role !== 'EMPLOYEE')      c.push({ key: 'employee_code', label: 'Code' });
    if (role === 'ADMIN')         c.push({ key: 'department',    label: 'Dept' });
                                  c.push({ key: 'designation',   label: 'Designation' });
                                  c.push({ key: 'in_time',       label: 'In Time' });
                                  c.push({ key: 'out_time',      label: 'Out Time' });
                                  c.push({ key: 'working_hours', label: 'Working Hrs' });
                                  c.push({ key: 'late_by',       label: 'Late By' });
                                  c.push({ key: 'early_by',      label: 'Early By' });
                                  c.push({ key: 'overtime',      label: 'Overtime' });
                                  c.push({ key: 'status',        label: 'Status' });
    return c;
  }, [mode, role]);

  return (
    <div style={{ fontFamily: T.font }}>
      <style>{`
        @keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .adv-row:hover { background: ${T.orangeLight} !important; }
        .adv-nav:hover { border-color: ${T.orange} !important; background: ${T.orangeLight} !important; }
        .adv-input:focus { border-color: ${T.orange} !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important; }
        .date-chip:hover { border-color: ${T.orange} !important; background: ${T.orangeLight} !important; }
      `}</style>

      {/* ── Controls bar ── */}
      <div style={{
        background: T.white, borderRadius: T.radiusLg, padding: 18, marginBottom: 18,
        boxShadow: T.shadow, border: `1px solid ${T.borderMid}`,
      }}>
        {/* Row 1: mode + nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', background: T.slateLight, borderRadius: 9, border: `1.5px solid ${T.border}`, overflow: 'hidden' }}>
            {['day', 'week', 'month'].map(m => (
              <button key={m} style={btnBase(mode === m)} onClick={() => setMode(m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          <button className="adv-nav" style={navBtn} onClick={() => navigate(-1)}>←</button>

          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="adv-input" style={{ ...selStyle, fontWeight: 600 }} />

          <button className="adv-nav" style={navBtn} onClick={() => navigate(1)}>→</button>

          {date !== today && (
            <button onClick={() => setDate(today)} style={{
              padding: '7px 14px', borderRadius: T.radiusSm, border: `1.5px solid ${T.orangeMid}`,
              background: T.orangeLight, color: T.orangeDark, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s',
            }}>Today</button>
          )}

          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{rangeLabel()}</span>

          <button onClick={fetchData} disabled={loading} style={{
            marginLeft: 'auto', padding: '7px 14px', borderRadius: T.radiusSm,
            border: `1.5px solid ${T.border}`, background: T.white,
            color: loading ? T.textMuted : T.textMid, fontSize: 12, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: T.font, opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Loading…' : '↺ Refresh'}
          </button>
        </div>

        {/* Row 2: search + filter */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search name, code, department…"
            className="adv-input" style={{ ...selStyle, flex: 1, minWidth: 200 }} />

          <select value={statusF} onChange={e => setStatusF(e.target.value)}
            className="adv-input" style={selStyle}>
            <option value="ALL">All Statuses</option>
            {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>

          {(search || statusF !== 'ALL') && (
            <button onClick={() => { setSearch(''); setStatusF('ALL'); }} style={{
              padding: '7px 12px', borderRadius: T.radiusSm, border: `1.5px solid ${T.redMid}`,
              background: T.redLight, color: T.red, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', fontFamily: T.font,
            }}>✕ Clear</button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '11px 16px', borderRadius: T.radius, marginBottom: 16, background: T.redLight, color: T.red, border: `1px solid ${T.redMid}`, fontSize: 13, fontWeight: 600 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Summary pills ── */}
      {!loading && s.total_records > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, animation: 'fadeIn 0.4s ease' }}>
          <SummaryPill label="Total"     value={s.total_records}   color={T.text}   />
          <SummaryPill label="Present"   value={s.total_present}   color={T.green}  />
          <SummaryPill label="Absent"    value={s.total_absent}    color={T.red}    />
          <SummaryPill label="Week Off"  value={s.total_weekly_off} color={T.slate} />
          <SummaryPill label="Late"      value={s.total_late}      color={T.amber}  />
          <SummaryPill label="Early Exit" value={s.total_early_exit} color={T.purple} />
        </div>
      )}

      {/* ── Week/Month date chips ── */}
      {!loading && mode !== 'day' && (data.dates || []).length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {(data.dates || []).map(d => (
            <button key={d.date} className="date-chip" onClick={() => { setDate(d.date); setMode('day'); }}
              style={{
                padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${T.border}`,
                background: T.white, cursor: 'pointer', fontFamily: T.font,
                textAlign: 'left', transition: 'all 0.15s', minWidth: 105,
              }}>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700 }}>{d.day}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{d.date}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: T.green, fontWeight: 700 }}>P:{d.present}</span>
                <span style={{ fontSize: 10, color: T.red,   fontWeight: 700 }}>A:{d.absent}</span>
                {d.late > 0 && <span style={{ fontSize: 10, color: T.amber, fontWeight: 700 }}>L:{d.late}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ background: T.white, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadow }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.slateLight }}>
                {cols.map(c => <th key={c.key} style={{ padding: '11px 13px', textAlign: 'left', color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</tbody>
          </table>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && !error && (
        <div style={{
          background: T.white, borderRadius: T.radiusLg, padding: '52px 24px',
          textAlign: 'center', color: T.textMuted, boxShadow: T.shadow,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.textMid, marginBottom: 6 }}>
            No attendance records
          </div>
          <div style={{ fontSize: 13 }}>
            {search || statusF !== 'ALL' ? 'Try adjusting your filters.' : 'No data for this period.'}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && filtered.length > 0 && (
        <div style={{ background: T.white, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadow, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.slateLight, borderBottom: `2px solid ${T.border}` }}>
                  {cols.map(c => (
                    <th key={c.key} style={{ padding: '11px 13px', textAlign: 'left', color: T.textMuted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const base = i % 2 === 0 ? T.white : '#FAFBFC';
                  return (
                    <tr key={r.id || i} className="adv-row" style={{ borderBottom: `1px solid ${T.borderMid}`, background: base, transition: 'background 0.15s' }}>
                      {mode !== 'day' && <td style={{ padding: '11px 13px', fontFamily: 'monospace', color: T.slate, fontSize: 12 }}>{r.date}</td>}
                      {mode !== 'day' && <td style={{ padding: '11px 13px', color: T.textMid }}>{r.day}</td>}
                      {role !== 'EMPLOYEE' && <td style={{ padding: '11px 13px', fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>{r.employee_name}</td>}
                      {role !== 'EMPLOYEE' && <td style={{ padding: '11px 13px', fontFamily: 'monospace', color: T.orange, fontWeight: 700, fontSize: 12 }}>{r.employee_code}</td>}
                      {role === 'ADMIN' && <td style={{ padding: '11px 13px', color: T.textMid, fontSize: 12 }}>{r.department || '—'}</td>}
                      <td style={{ padding: '11px 13px', color: T.textMid, fontSize: 12 }}>{r.designation || '—'}</td>
                      <td style={{ padding: '11px 13px', fontFamily: 'monospace', color: T.green, fontWeight: 600 }}>{r.in_time || '—'}</td>
                      <td style={{ padding: '11px 13px', fontFamily: 'monospace', color: T.red, fontWeight: 600 }}>{r.out_time || '—'}</td>
                      <td style={{ padding: '11px 13px', fontFamily: 'monospace', color: T.blue, fontWeight: 700 }}>{r.working_hours}</td>
                      <td style={{ padding: '11px 13px', fontFamily: 'monospace', color: r.late_by !== '00:00' ? T.red : T.textMuted, fontWeight: r.late_by !== '00:00' ? 700 : 500 }}>{r.late_by}</td>
                      <td style={{ padding: '11px 13px', fontFamily: 'monospace', color: r.early_by !== '00:00' ? T.amber : T.textMuted, fontWeight: r.early_by !== '00:00' ? 700 : 500 }}>{r.early_by}</td>
                      <td style={{ padding: '11px 13px', fontFamily: 'monospace', color: r.overtime && r.overtime !== '00:00' ? '#7C3AED' : T.textMuted, fontWeight: r.overtime && r.overtime !== '00:00' ? 700 : 500 }}>{r.overtime || '00:00'}</td>
                      <td style={{ padding: '11px 13px' }}><Badge status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.borderMid}`, background: T.slateLight, fontSize: 12, color: T.textMuted, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing {filtered.length} of {(data.records || []).length} records</span>
            {search && <span>"{search}"</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDateView;