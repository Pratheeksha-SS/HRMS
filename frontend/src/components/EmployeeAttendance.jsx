import { useState, useEffect, useMemo, memo } from 'react';
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
  radius:      '12px',
  radiusSm:    '8px',
  radiusLg:    '16px',
  font:        "'Nunito','Segoe UI',sans-serif",
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_CFG = {
  P:    { bg: T.greenLight,  color: T.green,      border: T.greenMid,  label: 'Present', calBg: '#DCFCE7' },
  P_MO: { bg: T.amberLight,  color: T.amber,      border: '#FCD34D',   label: 'Present*', calBg: '#FEF9C3' },
  A:    { bg: T.redLight,    color: T.red,        border: T.redMid,    label: 'Absent', calBg: '#FEE2E2' },
  WO:   { bg: T.slateLight,  color: T.slate,      border: T.border,    label: 'Week Off', calBg: '#F3F4F6' },
  LEAVE:{ bg: T.blueLight,   color: T.blue,       border: '#BFDBFE',   label: 'Leave', calBg: '#DBEAFE' },
  HALF: { bg: T.orangeLight, color: T.orangeDark, border: T.orangeMid, label: 'Half Day', calBg: '#FFEDD5' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Badge = memo(({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.A;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      backgroundColor: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, whiteSpace: 'nowrap',
    }}><span>{cfg.icon}</span>{cfg.label}</span>
  );
});

const SummaryCard = memo(({ label, value, color, icon, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: active ? color + '18' : T.white,
      borderRadius: T.radius, padding: '16px 18px',
      boxShadow: active ? `0 0 0 2.5px ${color}` : T.shadow,
      border: active ? `2px solid ${color}` : `1px solid ${T.borderMid}`,
      transition: 'all 0.18s', cursor: 'pointer',
      transform: active ? 'translateY(-2px)' : 'none',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.09)'; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; } }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <div style={{ fontSize: 10, color: active ? color : T.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 18 }}>{icon}</div>
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: color || T.text, lineHeight: 1 }}>{value}</div>
    {active && (
      <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        Filtered ✓ — click to clear
      </div>
    )}
  </div>
));

const SkeletonRow = () => (
  <tr>
    {[80, 60, 80, 80, 90, 70, 70, 80].map((w, i) => (
      <td key={i} style={{ padding: '11px 14px' }}>
        <div style={{ height: 13, width: w, borderRadius: 5, background: '#E2E8F0', animation: 'skPulse 1.4s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
);

// ─── Calendar Grid Component ──────────────────────────────────────────────────
const CalendarView = memo(({ records, month, year }) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const dayMap = {};
  (records || []).forEach(r => { dayMap[r.date] = r; });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, date: ds, record: dayMap[ds] || null });
  }

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div style={{ background: T.white, borderRadius: T.radiusLg, padding: 22, boxShadow: T.shadow }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, color: T.textMuted, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const cfg = cell.record ? (STATUS_CFG[cell.record.status] || STATUS_CFG.A) : null;
          const isToday = cell.date === new Date().toISOString().split('T')[0];
          return (
            <div key={i} title={cell.record ? `${cfg.label} | In: ${cell.record.in_time || '--'} | Out: ${cell.record.out_time || '--'} | ${cell.record.working_hours}` : ''}
              style={{
                borderRadius: 10, padding: '7px 4px', minHeight: 64, textAlign: 'center',
                background: cfg ? cfg.calBg : T.slateLight,
                border: `1.5px solid ${isToday ? T.orange : cfg ? cfg.border : T.borderMid}`,
                transition: 'all 0.15s', cursor: cell.record ? 'pointer' : 'default',
                position: 'relative',
              }}>
              {isToday && <div style={{ position: 'absolute', top: 3, right: 3, width: 6, height: 6, borderRadius: '50%', background: T.orange }} />}
              <div style={{ fontSize: 13, fontWeight: 700, color: cfg ? cfg.color : T.textMuted }}>{cell.day}</div>
              {cell.record && (
                <>
                  <div style={{ fontSize: 9, fontWeight: 800, color: cfg.color, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{cfg.label}</div>
                  {cell.record.in_time && <div style={{ fontSize: 9, color: T.textMid, marginTop: 2 }}>{cell.record.in_time}</div>}
                  {cell.record.working_hours !== '00:00' && (
                    <div style={{ fontSize: 9, color: T.blue, fontWeight: 700 }}>{cell.record.working_hours}h</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap', borderTop: `1px solid ${T.borderMid}`, paddingTop: 14 }}>
        {Object.entries(STATUS_CFG).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: v.calBg, border: `1.5px solid ${v.border}` }} />
            <span style={{ fontSize: 11, color: T.textMid, fontWeight: 600 }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Attendance Progress Bar ──────────────────────────────────────────────────
const AttendanceBar = memo(({ pct }) => {
  const color = pct >= 80 ? T.green : pct >= 60 ? T.amber : T.red;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: T.textMid, fontWeight: 600 }}>Monthly Attendance Rate</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: T.borderMid, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeeAttendance = ({ initialData }) => {
  const today = new Date();
  const [month, setMonth]       = useState(today.getMonth() + 1);
  const [year, setYear]         = useState(today.getFullYear());
  const [view, setView]         = useState('table');
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState(initialData || { records: [], summary: null });
  const [statusFilter, setStatusFilter] = useState(null); // null = show all

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const isCurrentMonth = month === currentMonth && year === currentYear;
      if (isCurrentMonth && initialData) {
        setStatusFilter(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setStatusFilter(null); // reset filter on month/year change
      try {
        const res = await api.get(`/attendance/my/?month=${month}&year=${year}`);
        if (!cancelled) setData(res.data || { records: [], summary: null });
      } catch (e) {
        console.error('Attendance fetch error:', e);
        if (!cancelled) setData({ records: [], summary: null });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [month, year, initialData]);

  const { records, summary } = data;

  // Map summary card labels → status codes for filtering
  const FILTER_MAP = {
    'Present':  ['P', 'P_MO'],
    'Absent':   ['A'],
    'Week Off': ['WO'],
    'Leave':    ['LEAVE'],
    'Half Day': ['HALF'],
  };

  const filteredRecords = useMemo(() => {
    if (!statusFilter || !records) return records || [];
    const codes = FILTER_MAP[statusFilter] || [];
    return records.filter(r => codes.includes(r.status));
  }, [records, statusFilter]);

  const selStyle = {
    padding: '8px 12px', borderRadius: T.radiusSm, border: `1.5px solid ${T.border}`,
    fontSize: 13, fontFamily: T.font, background: T.white, cursor: 'pointer',
    outline: 'none', transition: 'all 0.2s', color: T.text,
  };

  const viewBtnStyle = (active) => ({
    padding: '7px 16px', border: 'none', cursor: 'pointer', fontFamily: T.font,
    fontSize: 12, fontWeight: 700,
    background: active ? T.orange : T.white,
    color:      active ? T.white  : T.textMid,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ fontFamily: T.font }}>
      <style>{`
        @keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .ea-row:hover { background: ${T.orangeLight} !important; }
        .ea-sel:focus { border-color: ${T.orange} !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important; }
      `}</style>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={month} onChange={e => setMonth(+e.target.value)} className="ea-sel" style={selStyle}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(+e.target.value)} className="ea-sel" style={selStyle}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.textMid }}>
            {MONTHS[month-1]} {year}
          </span>
        </div>
        <div style={{ display: 'flex', background: T.white, borderRadius: 9, border: `1.5px solid ${T.border}`, overflow: 'hidden' }}>
          {[['table','📋 Table'],['calendar','📅 Calendar']].map(([v, l]) => (
            <button key={v} style={viewBtnStyle(view === v)} onClick={() => setView(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards — click to filter */}
      {summary && !loading && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <AttendanceBar pct={summary.attendance_percentage || 0} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Present',       value: summary.total_present,    color: T.green,},
              { label: 'Absent',        value: summary.total_absent,     color: T.red,},
              { label: 'Week Off',      value: summary.total_weekly_off, color: T.slate,},
              { label: 'Total Hours',   value: summary.total_duration,   color: T.blue, noFilter: true },
              { label: 'Late (min)',    value: summary.total_late_mins,  color: T.amber, noFilter: true },
              { label: 'Attendance %',  value: `${summary.attendance_percentage}%`, color: summary.attendance_percentage >= 80 ? T.green : T.red, noFilter: true },
            ].map(({ label, value, color, icon, noFilter }) => (
              <SummaryCard
                key={label}
                label={label}
                value={value}
                color={color}
                icon={icon}
                active={!noFilter && statusFilter === label}
                onClick={noFilter ? undefined : () => setStatusFilter(prev => prev === label ? null : label)}
              />
            ))}
          </div>
          {statusFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 16px', backgroundColor: T.orangeLight, borderRadius: T.radiusSm, border: `1.5px solid ${T.orangeMid}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.orangeDark }}>
                Showing: <strong>{statusFilter}</strong> ({filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''})
              </span>
              <button onClick={() => setStatusFilter(null)}
                style={{ marginLeft: 'auto', padding: '4px 12px', background: T.orangeDark, color: T.white, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Clear Filter ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ background: T.white, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadow, marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.slateLight }}>
                {['Date','Day','In Time','Out Time','Working Hrs','Late By','Early By','Status'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</tbody>
          </table>
        </div>
      )}

      {/* Empty */}
      {!loading && (!records || records.length === 0) && (
        <div style={{ background: T.white, borderRadius: T.radiusLg, padding: '56px 24px', textAlign: 'center', boxShadow: T.shadow }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.textMid, marginBottom: 6 }}>
            No attendance data for {MONTHS[month-1]} {year}
          </div>
          <div style={{ fontSize: 13, color: T.textMuted }}>
            Your attendance will appear here once the admin uploads the monthly report.
          </div>
        </div>
      )}

      {/* Table View */}
      {!loading && records && records.length > 0 && view === 'table' && (
        <div style={{ background: T.white, borderRadius: T.radiusLg, overflow: 'hidden', boxShadow: T.shadow, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.slateLight, borderBottom: `2px solid ${T.border}` }}>
                  {['Date','Day','In Time','Out Time','Working Hrs','Late By','Early By','Status'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: T.textMuted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: T.textMuted, fontSize: 14 }}>
                      No <strong>{statusFilter}</strong> records found for {MONTHS[month-1]} {year}
                    </td>
                  </tr>
                ) : filteredRecords.map((r, i) => {
                  const dayName = new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                  const base = i % 2 === 0 ? T.white : '#FAFBFC';
                  return (
                    <tr key={r.id || i} className="ea-row" style={{ borderBottom: `1px solid ${T.borderMid}`, background: base, transition: 'background 0.15s' }}>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.slate, fontSize: 12 }}>{r.date}</td>
                      <td style={{ padding: '11px 14px', color: T.textMid, fontSize: 12 }}>{dayName}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.green, fontWeight: 600 }}>{r.in_time || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.red, fontWeight: 600 }}>{r.out_time || '—'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: T.blue, fontWeight: 700 }}>{r.working_hours}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: r.late_by !== '00:00' ? T.red : T.textMuted, fontWeight: r.late_by !== '00:00' ? 700 : 500 }}>{r.late_by}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: r.early_by !== '00:00' ? T.amber : T.textMuted, fontWeight: r.early_by !== '00:00' ? 700 : 500 }}>{r.early_by}</td>
                      <td style={{ padding: '11px 14px' }}><Badge status={r.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.borderMid}`, background: T.slateLight, fontSize: 12, color: T.textMuted, fontWeight: 600 }}>
            {statusFilter
              ? `${filteredRecords.length} of ${records.length} records (filtered: ${statusFilter})`
              : `${records.length} records for ${MONTHS[month-1]} ${year}`}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {!loading && records && records.length > 0 && view === 'calendar' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <CalendarView records={records} month={month} year={year} />
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendance;