import React, { useState, useMemo } from 'react';

/* ─── Shared style constants ─────────────────────────────────────── */
const inputStyle = {
  padding: '9px 13px',
  border: '1.5px solid #E2E8F0',
  borderRadius: '8px',
  fontSize: '13px',
  outline: 'none',
  color: '#0F172A',
  backgroundColor: '#fff',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

/* ─── Status Badge ─────────────────────────────────────────────────── */
const StatusBadge = ({ value }) => {
  const v = (value || '').toString().toUpperCase();
  const cfg = {
    PRESENT:     { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    APPROVED:    { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    PAID:        { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    ACTIVE:      { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    EXCELLENT:   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    GOOD:        { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    ABSENT:      { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
    REJECTED:    { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
    UNPAID:      { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
    PENDING:     { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    ON_LEAVE:    { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    'ON LEAVE':  { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    AVERAGE:     { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  }[v] || { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };

  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
      fontWeight: '700', display: 'inline-block', letterSpacing: '0.4px',
      textTransform: 'uppercase',
      backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {value}
    </span>
  );
};

/* ─── Avatar Cell ──────────────────────────────────────────────────── */
const AvatarCell = ({ name, sub }) => {
  const initials = (name || 'NA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #F97316, #EA580C)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '800', color: 'white', flexShrink: 0,
        border: '2px solid #FED7AA',
      }}>
        {initials}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{name || 'N/A'}</div>
        {sub && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>{sub}</div>}
      </div>
    </div>
  );
};

/* ─── Column Definitions per report type ───────────────────────────── */
const getColumns = (reportType) => {
  switch (reportType) {
    case 'attendance':
      return [
        { key: 'employee_name',      label: 'Employee',      render: (v, r) => <AvatarCell name={v} sub={r.employee_id} image={r.profile_image_url} /> },
        { key: 'department',         label: 'Department',    render: v => <DeptChip value={v} /> },
        { key: 'attendance_percentage', label: 'Attendance %', render: v => v != null ? <span style={{ fontWeight: '700', color: '#2563EB' }}>{v}%</span> : '—' },
        { key: 'present_days',       label: 'Present',       render: v => v != null ? v : '—' },
        { key: 'absent_days',        label: 'Absent',        render: v => v != null ? v : '—' },
        { key: 'leave_days',         label: 'Leave Days',    render: v => v != null ? v : '—' },
        { key: 'actual_hours',       label: 'Total Hrs',     render: v => v ? <span style={{ fontWeight: '700', color: '#16A34A' }}>{v}h</span> : '—' },
        { key: 'status',             label: 'Status',        render: v => <StatusBadge value={v} /> },
      ];
    case 'leave':
      return [
        { key: 'employee_name', label: 'Employee',   render: (v, r) => <AvatarCell name={v} sub={r.employee_id} image={r.profile_image_url} /> },
        { key: 'department',    label: 'Department', render: v => <DeptChip value={v} /> },
        { key: 'leave_type',    label: 'Leave Type', render: v => v || '—' },
        { key: 'start_date',    label: 'From',       render: (v, r) => v || r.from_date || '—' },
        { key: 'end_date',      label: 'To',         render: (v, r) => v || r.to_date || '—' },
        { key: 'total_days',    label: 'Days',       render: (v, r) => {
          const d = v || r.days || r.leave_days;
          return d ? <DaysChip value={d} /> : '—';
        }},
        { key: 'status',        label: 'Status',     render: v => <StatusBadge value={v} /> },
        { key: 'reason',        label: 'Reason',     render: v => v ? <span style={{ fontSize: '12px', color: '#64748B', maxWidth: '180px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span> : '—' },
      ];
    case 'employee':
      return [
        { key: 'employee_name',     label: 'Employee',     render: (v, r) => <AvatarCell name={v} sub={r.employee_id} image={r.profile_image_url} /> },
        { key: 'department',        label: 'Department',   render: v => <DeptChip value={v} /> },
        { key: 'designation',       label: 'Designation',  render: v => v || '—' },
        { key: 'joining_date',      label: 'Joined',       render: v => v ? new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—' },
        { key: 'tenure_years',      label: 'Tenure',       render: v => v ? <span style={{ fontWeight: '700', color: '#2563EB' }}>{v}y</span> : '—' },
        { key: 'leaves_taken',      label: 'Leaves',       render: v => v ?? '—' },
        { key: 'performance_rating',label: 'Performance',  render: v => <StatusBadge value={v} /> },
        { key: 'last_salary',       label: 'Salary',       render: v => v ? <span style={{ fontWeight: '700', color: '#16A34A' }}>₹{Number(v).toLocaleString()}</span> : '—' },
      ];
    default:
      return [
        { key: 'employee_name', label: 'Employee',   render: (v, r) => <AvatarCell name={v} sub={r.employee_id} /> },
        { key: 'department',    label: 'Department', render: v => <DeptChip value={v} /> },
        { key: 'status',        label: 'Status',     render: v => <StatusBadge value={v} /> },
      ];
  }
};

/* ─── Small chips ──────────────────────────────────────────────────── */
const DeptChip = ({ value }) => (
  <span style={{
    backgroundColor: '#FFF7ED', color: '#EA580C',
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '600', border: '1px solid #FED7AA',
    whiteSpace: 'nowrap',
  }}>{value || 'N/A'}</span>
);

const DaysChip = ({ value }) => (
  <span style={{
    backgroundColor: '#F0FDF4', color: '#15803D',
    padding: '3px 10px', borderRadius: '20px',
    fontSize: '11px', fontWeight: '700', border: '1px solid #BBF7D0',
  }}>{value}d</span>
);

/* ─── ReportTable (main export) ────────────────────────────────────── */
const ReportTable = ({ data = [], reportType = 'attendance', loading = false }) => {
  const [searchTerm, setSearchTerm]         = useState('');
  const [sortField, setSortField]           = useState('');
  const [sortDir, setSortDir]               = useState('asc');
  const [currentPage, setCurrentPage]       = useState(1);
  const itemsPerPage = 12;

  const columns = getColumns(reportType);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      rows = rows.filter(r =>
        (r.employee_name || '').toLowerCase().includes(t) ||
        (r.employee_id || '').toString().toLowerCase().includes(t) ||
        (r.department || '').toLowerCase().includes(t)
      );
    }
    if (sortField) {
      rows.sort((a, b) => {
        const av = a[sortField] ?? '', bv = b[sortField] ?? '';
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }
    return rows;
  }, [data, searchTerm, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageData   = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key) => {
    if (sortField === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(key); setSortDir('asc'); }
  };

  const arrow = (key) => sortField === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  if (loading) {
    return (
      <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1.5px solid #F1F5F9', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9' }}>
          <div style={{ height: '20px', width: '200px', background: '#F1F5F9', borderRadius: '6px', animation: 'summaryPulse 1.5s infinite' }} />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            padding: '14px 24px', borderBottom: '1px solid #F8FAFC',
            display: 'flex', gap: '16px', alignItems: 'center',
          }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#F1F5F9', animation: 'summaryPulse 1.5s infinite' }} />
            <div style={{ flex: 1, height: '14px', background: '#F1F5F9', borderRadius: '4px', animation: 'summaryPulse 1.5s infinite' }} />
            <div style={{ width: '80px', height: '14px', background: '#F1F5F9', borderRadius: '4px', animation: 'summaryPulse 1.5s infinite' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '14px',
      border: '1.5px solid #F1F5F9', overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* Table Toolbar */}
      <div style={{
        padding: '16px 24px', borderBottom: '1.5px solid #F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', flexWrap: 'wrap', backgroundColor: '#FAFAFA',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
            Report Records
          </span>
          <span style={{
            backgroundColor: '#FFF7ED', color: '#EA580C',
            padding: '2px 10px', borderRadius: '20px',
            fontSize: '12px', fontWeight: '700', border: '1px solid #FED7AA',
          }}>{filtered.length}</span>
        </div>
        <input
          type="text"
          placeholder="Search employee, ID, department…"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          style={{ ...inputStyle, width: '240px' }}
          onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
          onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC' }}>
              <th style={thStyle}>#</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                >
                  {col.label}{arrow(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '60px 24px', color: '#94A3B8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '40px' }}>📭</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>No records found</span>
                    <span style={{ fontSize: '12px' }}>Try adjusting your search or filters</span>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #F8FAFC',
                      backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                  >
                    <td style={{ ...tdStyle, color: '#94A3B8', fontWeight: '600', fontSize: '12px' }}>{globalIdx}</td>
                    {columns.map(col => (
                      <td key={col.key} style={tdStyle}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div style={{
          padding: '14px 24px', borderTop: '1.5px solid #F1F5F9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '12px', backgroundColor: '#FAFAFA',
        }}>
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
            Showing <strong>{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> records
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={paginationBtnStyle(currentPage === 1)}
            >← Prev</button>
            <span style={{
              padding: '7px 16px', backgroundColor: '#F97316', color: 'white',
              borderRadius: '8px', fontSize: '13px', fontWeight: '700',
              minWidth: '80px', textAlign: 'center',
            }}>{currentPage} / {totalPages || 1}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={paginationBtnStyle(currentPage === totalPages || totalPages === 0)}
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: '12px 16px', textAlign: 'left', color: '#64748B',
  fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
  letterSpacing: '0.6px', borderBottom: '1.5px solid #F1F5F9',
};

const tdStyle = {
  padding: '13px 16px', fontSize: '13px', color: '#475569', verticalAlign: 'middle',
};

const paginationBtnStyle = (disabled) => ({
  padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
  border: '1.5px solid #E2E8F0',
  cursor: disabled ? 'not-allowed' : 'pointer',
  backgroundColor: disabled ? '#F8FAFC' : 'white',
  color: disabled ? '#CBD5E1' : '#0F172A',
  transition: 'all 0.15s',
});

export default ReportTable;