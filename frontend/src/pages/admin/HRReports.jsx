import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../utils/axiosConfig';
import { extractListData } from '../../utils/extractListData';
import { Eye, Calendar, X } from 'lucide-react';
import ReportExport from '../../components/reports/ReportExport';
import ReportFilters from '../../components/reports/ReportFilters';
import ReportSummaryCard from '../../components/reports/ReportSummaryCards';
import ReportTable from '../../components/reports/ReportTable';
import { formatDate } from '../../utils/reportUtils';

/* ─── Design Tokens ──────────────────────────────────────────────────
   Primary:       #F97316  (orange-500)
   Primary Dark:  #EA580C  (orange-600)
   Primary Light: #FFF7ED  (orange-50)
   Accent:        #16A34A  (green-600)
   Accent Light:  #F0FDF4  (green-50)
   Neutral BG:    #F8FAFC
   Surface:       #FFFFFF
   Border:        #E2E8F0 / #F1F5F9
   Text Main:     #0F172A
   Text Muted:    #64748B
   ─────────────────────────────────────────────────────────────────── */

/* ─── Shared Style Objects ─────────────────────────────────────────── */
const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #E2E8F0',
  borderRadius: '8px',
  fontSize: '14px',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  outline: 'none',
  color: '#0F172A',
  backgroundColor: '#fff',
  fontFamily: 'inherit',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '36px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

/* ─── Summary card configurations per report type ──────────────────── */
const getSummaryCards = (reportType, summary) => {
  switch (reportType) {
    case 'attendance':
      return [
        { label: 'Total Employees', value: summary.total_employees ?? 0,  sub: 'In selected period', gradient: 'linear-gradient(135deg, #F97316, #EA580C)', shadow: 'rgba(249,115,22,0.25)'},
        { label: 'Present',         value: summary.present ?? 0,          sub: 'Marked present',     gradient: 'linear-gradient(135deg, #16A34A, #15803D)', shadow: 'rgba(22,163,74,0.25)'},
        { label: 'Absent',          value: summary.absent ?? 0,           sub: 'Not marked in',      gradient: 'linear-gradient(135deg, #DC2626, #B91C1C)', shadow: 'rgba(220,38,38,0.25)'},
        { label: 'On Leave',        value: summary.on_leave ?? 0,         sub: 'Approved leave',     gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', shadow: 'rgba(245,158,11,0.25)'},
      ];
    case 'leave':
      return [
        { label: 'Total Requests', value: summary.total_leaves ?? 0, sub: 'All requests', gradient: 'linear-gradient(135deg, #F97316, #EA580C)', shadow: 'rgba(249,115,22,0.25)' },
        { label: 'Approved',       value: summary.approved ?? 0,     sub: 'Leaves granted',gradient: 'linear-gradient(135deg, #16A34A, #15803D)', shadow: 'rgba(22,163,74,0.25)'   },
        { label: 'Pending',        value: summary.pending ?? 0,      sub: 'Awaiting review',gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', shadow: 'rgba(245,158,11,0.25)'  },
        { label: 'Rejected',       value: summary.rejected ?? 0,     sub: 'Leaves declined', gradient: 'linear-gradient(135deg, #DC2626, #B91C1C)', shadow: 'rgba(220,38,38,0.25)'   },
      ];
    case 'employee':
      return [
        { label: 'Total Employees', value: summary.total_employees ?? 0,   sub: 'Total headcount', gradient: 'linear-gradient(135deg, #F97316, #EA580C)', shadow: 'rgba(249,115,22,0.25)' },
        { label: 'Active',          value: summary.active_employees ?? 0,   sub: 'Currently active', gradient: 'linear-gradient(135deg, #16A34A, #15803D)', shadow: 'rgba(22,163,74,0.25)'   },
        { label: 'New Joins',       value: summary.new_joins ?? 0,          sub: 'Recent joiners', gradient: 'linear-gradient(135deg, #2563EB, #1D4ED8)', shadow: 'rgba(37,99,235,0.25)'   },
        { label: 'Top Performers',  value: summary.excellent_performers ?? 0, sub: 'Excellent rating', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', shadow: 'rgba(245,158,11,0.25)'  },
      ];
    default:
      return [];
  }
};

/* ─── Date range label helper ───────────────────────────────────────── */
const getDateLabel = (dateMode, filters) =>
  dateMode === 'single'
    ? formatDate(filters.singleDate)
    : `${formatDate(filters.startDate)} → ${formatDate(filters.endDate)}`;

/* ═══════════════════════════════════════════════════════════════════
   PRINT REPORT GENERATORS
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Attendance Print HTML ─────────────────────────────────────────── */
const generateAttendancePrintHTML = ({ title, subtitle, data, summary }) => {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const summaryStats = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
      ${[
        ['Total Employees', summary.total_employees ?? data.length, '#2563eb'],
        ['Present',         summary.present ?? data.filter(r => r.status === 'Present' || r.status === 'PRESENT').length, '#16a34a'],
        ['Absent',          summary.absent  ?? data.filter(r => r.status === 'Absent'  || r.status === 'ABSENT').length,  '#dc2626'],
        ['On Leave',        summary.on_leave ?? data.filter(r => (r.status || '').toLowerCase().includes('leave')).length, '#d97706'],
      ].map(([label, val, color]) => `
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center;border-top:3px solid ${color}">
          <div style="font-size:28px;font-weight:800;color:${color}">${val}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:500">${label}</div>
        </div>
      `).join('')}
    </div>
  `;

  const getStatusStyle = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PRESENT') return 'background:#dcfce7;color:#166534;';
    if (s === 'ABSENT')  return 'background:#fee2e2;color:#991b1b;';
    return 'background:#fef3c7;color:#92400e;';
  };

  const rows = data.map(r => `
    <tr>
      <td>${r.employee_name || 'N/A'}</td>
      <td style="font-family:monospace;color:#f97316;font-weight:700">${r.employee_id || 'N/A'}</td>
      <td>${r.department || 'N/A'}</td>
      <td>${r.date || '—'}</td>
      <td><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;${getStatusStyle(r.status)}">${r.status || 'N/A'}</span></td>
      <td>${r.login_time || '—'}</td>
      <td>${r.logout_time || '—'}</td>
      <td style="text-align:center;font-weight:700;color:#2563eb">${r.working_hours ? r.working_hours + 'h' : '—'}</td>
      <td style="text-align:center;font-weight:700;color:#16a34a">${r.attendance_percentage != null ? r.attendance_percentage + '%' : '—'}</td>
    </tr>
  `).join('');

  return generateBasePrintHTML({
    title,
    subtitle,
    today,
    summaryStats,
    tableHeaders: ['Employee', 'Emp ID', 'Department', 'Date', 'Status', 'Login', 'Logout', 'Hours', 'Attendance %'],
    tableRows: rows,
    totalRecords: data.length,
  });
};

/* ─── Leave Print HTML ──────────────────────────────────────────────── */
const generateLeavePrintHTML = ({ title, subtitle, data, summary }) => {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const summaryStats = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
      ${[
        ['Total Requests', summary.total_leaves ?? data.length,                                          '#2563eb'],
        ['Approved',       summary.approved ?? data.filter(r => r.status === 'APPROVED').length,         '#16a34a'],
        ['Pending',        summary.pending  ?? data.filter(r => r.status === 'PENDING').length,          '#d97706'],
        ['Rejected',       summary.rejected ?? data.filter(r => r.status === 'REJECTED').length,         '#dc2626'],
      ].map(([label, val, color]) => `
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center;border-top:3px solid ${color}">
          <div style="font-size:28px;font-weight:800;color:${color}">${val}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:500">${label}</div>
        </div>
      `).join('')}
    </div>
  `;

  const getStatusStyle = (status) => {
    if (status === 'APPROVED') return 'background:#dcfce7;color:#166534;';
    if (status === 'REJECTED') return 'background:#fee2e2;color:#991b1b;';
    return 'background:#fef3c7;color:#92400e;';
  };

  const rows = data.map(r => `
    <tr>
      <td>${r.employee_name || 'N/A'}</td>
      <td style="font-family:monospace;color:#f97316;font-weight:700">${r.employee_id || 'N/A'}</td>
      <td>${r.department || 'N/A'}</td>
      <td>${r.leave_type || 'N/A'}</td>
      <td>${r.start_date || '—'}</td>
      <td>${r.end_date || '—'}</td>
      <td style="text-align:center;font-weight:700">${r.total_days || r.leave_days || 0}</td>
      <td><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;${getStatusStyle(r.status)}">${r.status || 'N/A'}</span></td>
      <td>${r.reason || '—'}</td>
    </tr>
  `).join('');

  return generateBasePrintHTML({
    title,
    subtitle,
    today,
    summaryStats,
    tableHeaders: ['Employee', 'Emp ID', 'Department', 'Leave Type', 'From', 'To', 'Days', 'Status', 'Reason'],
    tableRows: rows,
    totalRecords: data.length,
  });
};

/* ─── Employee Print HTML ───────────────────────────────────────────── */
const generateEmployeePrintHTML = ({ title, subtitle, data, summary }) => {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const summaryStats = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
      ${[
        ['Total Employees', summary.total_employees ?? data.length,                                                                    '#2563eb'],
        ['Active',          summary.active_employees ?? data.filter(r => (r.status || '').toUpperCase() === 'ACTIVE').length,          '#16a34a'],
        ['New Joins',       summary.new_joins ?? 0,                                                                                    '#7c3aed'],
        ['Top Performers',  summary.excellent_performers ?? data.filter(r => (r.performance_rating || '').toUpperCase() === 'EXCELLENT').length, '#d97706'],
      ].map(([label, val, color]) => `
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center;border-top:3px solid ${color}">
          <div style="font-size:28px;font-weight:800;color:${color}">${val}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:500">${label}</div>
        </div>
      `).join('')}
    </div>
  `;

  const getPerfStyle = (rating) => {
    const r = (rating || '').toUpperCase();
    if (r === 'EXCELLENT') return 'background:#dbeafe;color:#1d4ed8;';
    if (r === 'GOOD')      return 'background:#dcfce7;color:#166534;';
    if (r === 'AVERAGE')   return 'background:#fef3c7;color:#92400e;';
    return 'background:#f1f5f9;color:#475569;';
  };

  const rows = data.map(r => `
    <tr>
      <td>${r.employee_name || 'N/A'}</td>
      <td style="font-family:monospace;color:#f97316;font-weight:700">${r.employee_id || 'N/A'}</td>
      <td>${r.department || 'N/A'}</td>
      <td>${r.designation || 'N/A'}</td>
      <td>${r.joining_date ? new Date(r.joining_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</td>
      <td style="text-align:center;font-weight:700;color:#2563eb">${r.tenure_years != null ? r.tenure_years + 'y' : '—'}</td>
      <td style="text-align:center;font-weight:700">${r.leaves_taken ?? '—'}</td>
      <td><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;${getPerfStyle(r.performance_rating)}">${r.performance_rating || 'N/A'}</span></td>
      <td style="font-weight:700;color:#16a34a">${r.last_salary ? '₹' + Number(r.last_salary).toLocaleString() : '—'}</td>
    </tr>
  `).join('');

  return generateBasePrintHTML({
    title,
    subtitle,
    today,
    summaryStats,
    tableHeaders: ['Employee', 'Emp ID', 'Department', 'Designation', 'Joined', 'Tenure', 'Leaves', 'Performance', 'Salary'],
    tableRows: rows,
    totalRecords: data.length,
  });
};

/* ─── Base print HTML template (shared layout) ──────────────────────── */
const generateBasePrintHTML = ({ title, subtitle, today, summaryStats, tableHeaders, tableRows, totalRecords }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background: #fff; color: #111827; padding: 0; }
    .page { padding: 40px 48px; max-width: 1200px; margin: 0 auto; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 22px; border-bottom: 3px solid #f97316; }
    .company-block { display: flex; align-items: center; gap: 14px; }
    .company-icon { width: 48px; height: 48px; background: #f97316; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; color: white; }
    .company-name { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }
    .company-sub { font-size: 12px; color: #6b7280; margin-top: 3px; }
    .report-meta { text-align: right; }
    .report-title { font-size: 18px; font-weight: 700; color: #111827; }
    .report-date { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .report-subtitle { font-size: 12px; color: #f97316; font-weight: 600; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { padding: 11px 13px; background: #111827; color: #fff; font-weight: 600; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.7px; }
    thead th:first-child { border-radius: 8px 0 0 0; }
    thead th:last-child { border-radius: 0 8px 0 0; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #fff7ed; }
    tbody td { padding: 11px 13px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 24px 28px; }
      thead th { background: #111827 !important; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="report-header">
    <div class="company-block">
      <div class="company-icon">📋</div>
      <div>
        <div class="company-name">HR Management System</div>
        <div class="company-sub">HR Reports Portal</div>
      </div>
    </div>
    <div class="report-meta">
      <div class="report-title">${title}</div>
      <div class="report-subtitle">${subtitle}</div>
      <div class="report-date">Generated: ${today}</div>
    </div>
  </div>
  ${summaryStats}
  <table>
    <thead>
      <tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>${tableRows || '<tr><td colspan="20" style="text-align:center;padding:40px;color:#9ca3af;">No data available</td></tr>'}</tbody>
  </table>
  <div class="footer">
    <span>Total Records: <strong>${totalRecords}</strong></span>
    <span>Confidential — HR Use Only</span>
    <span>Page 1 of 1</span>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

const openPrintWindow = (html) => {
  const win = window.open('', '_blank', 'width=1200,height=800');
  if (!win) { alert('Please allow popups to print reports.'); return; }
  win.document.write(html);
  win.document.close();
};

/* ═══════════════════════════════════════════════════════════════════
   HR REPORTS PRINT MODAL
   ═══════════════════════════════════════════════════════════════════ */
const HRPrintModal = ({
  onClose,
  reportData,
  summary,
  reportType,
  employees,
  departments,
  dateMode,
  filters,
  flatExportData,
}) => {
  const [printScope, setPrintScope]       = useState('current');
  const [selectedDept, setSelectedDept]   = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [statusFilter, setStatusFilter]   = useState('ALL');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');

  /* ── Flatten range attendance data ────────────────────────────── */
  const allData = useMemo(() => {
    if (!Array.isArray(reportData)) return [];
    if (dateMode === 'range' && reportType === 'attendance') {
      return reportData.flatMap(group =>
        (group.employees || []).map(emp => ({ ...emp, date: group.date }))
      );
    }
    return reportData;
  }, [reportData, dateMode, reportType]);

  /* ── Apply optional extra filters ─────────────────────────────── */
  const applyFilters = (data) => {
    let result = [...data];
    if (statusFilter !== 'ALL') {
      result = result.filter(r =>
        (r.status || '').toUpperCase() === statusFilter
      );
    }
    if (dateFrom) result = result.filter(r => (r.date || r.start_date || '') >= dateFrom);
    if (dateTo)   result = result.filter(r => (r.date || r.end_date   || '') <= dateTo);
    return result;
  };

  /* ── Print option definitions per report type ──────────────────── */
  const getPrintOptions = () => {
    if (reportType === 'attendance') {
      return [
        { id: 'current', label: 'Current Report',       desc: 'Print the currently loaded data' },
        { id: 'department', label: 'By Department',         desc: 'Filter to a specific department' },
        { id: 'employee', label: 'By Employee',           desc: 'Individual employee attendance' },
        { id: 'present', label: 'Present Only',          desc: 'Only present records' },
        { id: 'absent', label: 'Absent Only',           desc: 'Only absent records' },
      ];
    }
    if (reportType === 'leave') {
      return [
        { id: 'current', label: 'Current Report',       desc: 'Print the currently loaded data' },
        { id: 'department', label: 'By Department',         desc: 'Filter to a specific department' },
        { id: 'employee', label: 'By Employee',           desc: 'Individual employee leaves' },
        { id: 'approved', label: 'Approved Only',         desc: 'Only approved leave requests' },
        { id: 'pending', label: 'Pending Only',          desc: 'Only pending requests' },
        { id: 'rejected', label: 'Rejected Only',         desc: 'Only rejected requests' },
      ];
    }
    if (reportType === 'employee') {
      return [
        { id: 'current', label: 'All Employees',         desc: 'Print full employee activity report' },
        { id: 'department', label: 'By Department',         desc: 'Filter to a specific department' },
        { id: 'excellent', label: 'Top Performers',        desc: 'Excellent performance rating only' },
        { id: 'new_joins', label: 'New Joiners',           desc: 'Recently joined employees' },
      ];
    }
    return [{ id: 'current', label: 'Current Report', desc: 'Print current report data' }];
  };

  const printOptions = getPrintOptions();

  const showFilters = printScope && !['present', 'absent', 'approved', 'pending', 'rejected', 'excellent', 'new_joins'].includes(printScope);
  const isDisabled  = !printScope
    || (printScope === 'department' && !selectedDept)
    || (printScope === 'employee'   && !selectedEmpId);

  const handlePrint = () => {
    let printData, title, subtitle;
    const dateLabel = getDateLabel(dateMode, filters);

    /* ── Determine print data based on scope ── */
    if (printScope === 'current') {
      printData = applyFilters(allData);
      title     = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      subtitle  = dateLabel;
    } else if (printScope === 'department') {
      printData = applyFilters(allData.filter(r => r.department === selectedDept));
      title     = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — ${selectedDept}`;
      subtitle  = `Department: ${selectedDept} · ${dateLabel}`;
    } else if (printScope === 'employee') {
      printData = applyFilters(allData.filter(r =>
        r.employee_id === selectedEmpId || String(r.employee) === selectedEmpId
      ));
      const empInfo = employees.find(e =>
        (e.employee_id || String(e.id)) === selectedEmpId
      );
      const empName = empInfo
        ? `${empInfo.first_name || ''} ${empInfo.last_name || ''}`.trim()
        : selectedEmpId;
      title    = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report — ${empName}`;
      subtitle = `Individual Report · ${dateLabel}`;
    } else if (printScope === 'present') {
      printData = allData.filter(r => (r.status || '').toUpperCase() === 'PRESENT');
      title     = 'Attendance Report — Present';
      subtitle  = `Present employees · ${dateLabel}`;
    } else if (printScope === 'absent') {
      printData = allData.filter(r => (r.status || '').toUpperCase() === 'ABSENT');
      title     = 'Attendance Report — Absent';
      subtitle  = `Absent employees · ${dateLabel}`;
    } else if (printScope === 'approved') {
      printData = allData.filter(r => (r.status || '').toUpperCase() === 'APPROVED');
      title     = 'Leave Report — Approved';
      subtitle  = `Approved leaves · ${dateLabel}`;
    } else if (printScope === 'pending') {
      printData = allData.filter(r => (r.status || '').toUpperCase() === 'PENDING');
      title     = 'Leave Report — Pending';
      subtitle  = `Pending requests · ${dateLabel}`;
    } else if (printScope === 'rejected') {
      printData = allData.filter(r => (r.status || '').toUpperCase() === 'REJECTED');
      title     = 'Leave Report — Rejected';
      subtitle  = `Rejected requests · ${dateLabel}`;
    } else if (printScope === 'excellent') {
      printData = allData.filter(r => (r.performance_rating || '').toUpperCase() === 'EXCELLENT');
      title     = 'Employee Activity — Top Performers';
      subtitle  = `Excellent performance rating · ${dateLabel}`;
    } else if (printScope === 'new_joins') {
      printData = allData.filter(r => r.is_new_join || r.new_join);
      title     = 'Employee Activity — New Joiners';
      subtitle  = `Recently joined employees · ${dateLabel}`;
    } else {
      printData = applyFilters(allData);
      title     = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      subtitle  = dateLabel;
    }

    if (!printData || printData.length === 0) {
      alert('No data found for the selected criteria.');
      return;
    }

    /* ── Generate HTML based on report type ── */
    let html;
    if (reportType === 'attendance') {
      html = generateAttendancePrintHTML({ title, subtitle, data: printData, summary });
    } else if (reportType === 'leave') {
      html = generateLeavePrintHTML({ title, subtitle, data: printData, summary });
    } else {
      html = generateEmployeePrintHTML({ title, subtitle, data: printData, summary });
    }

    openPrintWindow(html);
  };

  const reportTypeLabel = { attendance: 'Attendance', leave: 'Leave', employee: 'Employee Activity' }[reportType] || 'HR';

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px',
      animation: 'fadeIn 0.25s ease',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        width: '90%', maxWidth: '700px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          padding: '22px 28px', color: 'white',
          borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 3px 0', letterSpacing: '-0.3px' }}>
                🖨️ Print {reportTypeLabel} Report
              </h2>
              <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>
                Choose what to include in the printed report
              </p>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              fontSize: '22px', cursor: 'pointer', width: '36px', height: '36px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: '28px' }}>
          {/* Current data info banner */}
          <div style={{
            backgroundColor: '#FFF7ED', border: '1.5px solid #FED7AA',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '13px', color: '#C2410C', fontWeight: '600',
          }}>
            <span style={{ fontSize: '16px' }}>📊</span>
            {allData.length} records loaded · {getDateLabel(dateMode, filters)}
          </div>

          {/* Print scope options */}
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
            Select Print Scope
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {printOptions.map(opt => (
              <div key={opt.id} onClick={() => setPrintScope(opt.id)} style={{
                padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                border: `2px solid ${printScope === opt.id ? '#F97316' : '#E2E8F0'}`,
                backgroundColor: printScope === opt.id ? '#FFF7ED' : 'white',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: printScope === opt.id ? '#EA580C' : '#0F172A' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Conditional options */}
          {printScope && (
            <div style={{
              backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '18px',
              border: '1.5px solid #E2E8F0', marginBottom: '4px',
            }}>
              <div style={{ ...labelStyle, marginBottom: '14px' }}>Report Options</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                {/* Department selector */}
                {printScope === 'department' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Select Department</label>
                    <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} style={selectStyle}>
                      <option value="">— Choose Department —</option>
                      {(Array.isArray(departments) ? departments : []).map(d => {
                        const name = typeof d === 'string' ? d : d.name;
                        return <option key={name} value={name}>{name}</option>;
                      })}
                    </select>
                  </div>
                )}

                {/* Employee selector */}
                {printScope === 'employee' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Select Employee</label>
                    <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} style={selectStyle}>
                      <option value="">— Choose Employee —</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.employee_id || String(emp.id)}>
                          {`${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.full_name} ({emp.employee_id || emp.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Generic date + status filters */}
                {showFilters && (
                  <>
                    {/* Status filter — only for attendance and leave */}
                    {(reportType === 'attendance' || reportType === 'leave') && (
                      <div>
                        <label style={labelStyle}>Status Filter</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
                          <option value="ALL">All Statuses</option>
                          {reportType === 'attendance' && <>
                            <option value="PRESENT">Present Only</option>
                            <option value="ABSENT">Absent Only</option>
                          </>}
                          {reportType === 'leave' && <>
                            <option value="PENDING">Pending Only</option>
                            <option value="APPROVED">Approved Only</option>
                            <option value="REJECTED">Rejected Only</option>
                          </>}
                        </select>
                      </div>
                    )}
                    <div>
                      <label style={labelStyle}>From Date</label>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>To Date</label>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '18px 28px 24px', borderTop: '1.5px solid #F1F5F9',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          backgroundColor: '#F8FAFC', borderRadius: '0 0 20px 20px',
        }}>
          <button onClick={onClose} style={{
            padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
            border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px',
            fontWeight: '700', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handlePrint} disabled={isDisabled} style={{
            padding: '10px 24px',
            background: isDisabled ? '#CBD5E1' : 'linear-gradient(135deg, #F97316, #EA580C)',
            color: 'white', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '700',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(249,115,22,0.3)',
          }}>
            🖨️ Generate &amp; Print
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Detail Modal ───────────────────────────────────────────────────── */
const DetailModal = ({ detail, onClose }) => {
  if (!detail) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '20px',
        animation: 'hrFadeIn 0.25s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: '20px',
          width: '90%', maxWidth: '720px', maxHeight: '88vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
          animation: 'hrSlideUp 0.3s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          padding: '20px 26px', color: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 2px 0', letterSpacing: '-0.3px' }}>
              📅 {formatDate(detail.date)}
            </h2>
            <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>
              {(detail.details || []).length} employee records
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              width: '34px', height: '34px', borderRadius: '50%',
              fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {['Employee', 'Emp ID', 'Department', 'Status', 'Login', 'Logout'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    color: '#64748B', fontSize: '11px', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                    borderBottom: '1.5px solid #F1F5F9',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(detail.details || []).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No detail records available
                  </td>
                </tr>
              ) : (detail.details || []).map((item, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid #F8FAFC',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                >
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0F172A' }}>{item.employee_name}</td>
                  <td style={{ padding: '12px 16px', color: '#F97316', fontFamily: 'monospace', fontWeight: '700' }}>{item.employee_id}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      backgroundColor: '#FFF7ED', color: '#EA580C',
                      padding: '2px 8px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '600', border: '1px solid #FED7AA',
                    }}>{item.department || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                      backgroundColor: item.status === 'Present' ? '#F0FDF4' : item.status === 'Absent' ? '#FEF2F2' : '#FFFBEB',
                      color: item.status === 'Present' ? '#166534' : item.status === 'Absent' ? '#991B1B' : '#92400E',
                      border: `1px solid ${item.status === 'Present' ? '#BBF7D0' : item.status === 'Absent' ? '#FECACA' : '#FDE68A'}`,
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{item.login_time || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{item.logout_time || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1.5px solid #F1F5F9',
          backgroundColor: '#FAFAFA', display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 22px', backgroundColor: '#F8FAFC', color: '#475569',
              border: '1.5px solid #E2E8F0', borderRadius: '10px',
              cursor: 'pointer', fontWeight: '700', fontSize: '13px',
            }}
          >Close</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Date-group Card (range mode for attendance) ───────────────────── */
const DateGroupCard = ({ group, onViewDetail }) => (
  <div style={{
    backgroundColor: 'white', borderRadius: '14px',
    border: '1.5px solid #F1F5F9', overflow: 'hidden',
    marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    animation: 'hrFadeIn 0.3s ease',
  }}>
    {/* Card Header */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 20px', backgroundColor: '#FAFAFA',
      borderBottom: '1.5px solid #F1F5F9',
    }}>
      <Calendar size={18} color="#F97316" />
      <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', flex: 1 }}>
        {formatDate(group.date)}
      </span>
      <button
        onClick={() => onViewDetail(group)}
        style={{
          padding: '6px 14px', fontSize: '12px', fontWeight: '700',
          backgroundColor: '#FFF7ED', color: '#EA580C',
          border: '1.5px solid #FED7AA', borderRadius: '8px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F97316'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#F97316'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFF7ED'; e.currentTarget.style.color = '#EA580C'; e.currentTarget.style.borderColor = '#FED7AA'; }}
      >
        <Eye size={13} /> View Details
      </button>
    </div>

    {/* Quick Stats Row */}
    <div style={{ display: 'flex', gap: '0', padding: '0', borderBottom: '1px solid #F8FAFC' }}>
      {[
        { label: 'Present',      value: group.present ?? 0,             color: '#16A34A', bg: '#F0FDF4' },
        { label: 'Absent',       value: group.absent ?? 0,              color: '#DC2626', bg: '#FEF2F2' },
        { label: 'On Leave',     value: group.on_leave ?? 0,            color: '#D97706', bg: '#FFFBEB' },
        { label: 'Attendance %', value: `${group.attendance_percentage || 0}%`, color: '#2563EB', bg: '#EFF6FF' },
      ].map(({ label, value, color, bg }, i, arr) => (
        <div key={label} style={{
          flex: 1, padding: '14px 16px', textAlign: 'center',
          backgroundColor: bg,
          borderRight: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
        }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</div>
          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
        </div>
      ))}
    </div>

    {/* Mini employee preview */}
    {group.employees && group.employees.length > 0 && (
      <div style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {group.employees.slice(0, 6).map((emp, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px',
              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
              fontSize: '12px', fontWeight: '600', color: '#475569',
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: emp.status === 'Present' ? '#16A34A' : emp.status === 'Absent' ? '#DC2626' : '#D97706',
              }} />
              {emp.employee_name}
            </div>
          ))}
          {group.employees.length > 6 && (
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
              +{group.employees.length - 6} more
            </span>
          )}
        </div>
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   HRReports — Main Component
   ═══════════════════════════════════════════════════════════════════ */
const HRReports = ({ user, isManager = false }) => {
  const [loading, setLoading]           = useState(false);
  const [reportData, setReportData]     = useState([]);
  const [summary, setSummary]           = useState({});
  const [employees, setEmployees]       = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [dateMode, setDateMode]         = useState('single');
  const [detailModal, setDetailModal]   = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const [filters, setFilters] = useState({
    reportType: 'attendance',
    scope:      'all',
    employeeId: '',
    department: 'all',
    singleDate: new Date().toISOString().split('T')[0],
    startDate:  new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate:    new Date().toISOString().split('T')[0],
    frequency:  'daily',
  });

  /* ── Fetch ALL employees (handles pagination) ───────────────────── */
  const fetchAllEmployees = async () => {
    const all = [];
    let nextUrl = '/employees/?limit=100';
    while (nextUrl) {
      const res = await api.get(nextUrl);
      const page = extractListData(res.data);
      all.push(...page);
      // Handle both absolute and relative next URLs
      const raw = res.data?.next || null;
      if (!raw) break;
      try {
        const url = new URL(raw);
        nextUrl = url.pathname.replace('/api', '') + url.search;
      } catch {
        nextUrl = null;
      }
    }
    return all;
  };

  /* ── Initial data fetch ─────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const [allEmps, deptRes] = await Promise.all([
          fetchAllEmployees(),
          api.get('/departments/list/'),
        ]);
        setEmployees(allEmps);
        setDepartments(extractListData(deptRes.data));
      } catch (err) {
        console.error('Error fetching employees/departments:', err);
      }
    })();
  }, []);

  /* ── Auto-generate on filter change ────────────────────────────── */
  useEffect(() => {
    generateReport();
  }, [filters, dateMode]);

  /* ── Report API call ────────────────────────────────────────────── */
  const generateReport = async () => {
    setLoading(true);
    try {
      const endpointMap = {
        attendance: '/reports/attendance/',
        leave:      '/reports/leaves/',
        employee:   '/reports/employees/',
      };
      const endpoint = endpointMap[filters.reportType];
      if (!endpoint) return;

      const params = {
        report_type: filters.reportType,
        scope:       filters.scope,
        department:  filters.department !== 'all' ? filters.department : null,
        frequency:   filters.frequency,
        date_mode:   dateMode,
      };

      if (dateMode === 'single') {
        params.date = filters.singleDate;
      } else {
        params.start_date = filters.startDate;
        params.end_date   = filters.endDate;
      }

      if (filters.scope === 'individual' && filters.employeeId) {
        params.employee_id = filters.employeeId;
      }

      const res = await api.get(endpoint, { params });
      setReportData(res.data.data || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      console.error('Error generating report:', err);
      setReportData([]);
      setSummary({});
      showNotice('Failed to generate report. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  /* ── Flatten range data for export / print ──────────────────────── */
  const flatExportData = useMemo(() => {
    if (!Array.isArray(reportData)) return [];
    if (dateMode === 'range' && filters.reportType === 'attendance') {
      return reportData.flatMap(group =>
        (group.employees || []).map(emp => ({ ...emp, date: group.date }))
      );
    }
    return reportData;
  }, [reportData, dateMode, filters.reportType]);

  const summaryCards  = getSummaryCards(filters.reportType, summary);
  const dateLabel     = getDateLabel(dateMode, filters);
  const isRangeAttend = dateMode === 'range' && filters.reportType === 'attendance';

  const reportTitleMap = {
    attendance: '📅 Attendance Report',
    leave:      '📝 Leave Report',
    employee:   '👥 Employee Activity',
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes hrFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes hrSlideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp   { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes hrSpin    { to { transform: rotate(360deg); } }
        @keyframes summaryPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
          outline: none !important;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #F8FAFC; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        @media print { .no-print { display: none; } }
      `}</style>

      {/* ── Toast Notification ─────────────────────────────────────── */}
      {notification && (
        <div style={{
          position: 'fixed', top: '22px', right: '22px', zIndex: 2500,
          padding: '13px 20px', borderRadius: '12px', color: '#fff',
          fontSize: '14px', fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          backgroundColor: notification.type === 'success' ? '#16A34A'
            : notification.type === 'error' ? '#DC2626' : '#2563EB',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'hrSlideUp 0.3s ease',
        }}>
          <span style={{ fontSize: '16px' }}>
            {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {notification.message}
        </div>
      )}

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div style={{
        marginBottom: '26px',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>📈</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              {isManager ? 'Team Reports' : 'HR Reports'}
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            {isManager
              ? "Analyze your team's attendance, leave, and performance"
              : 'Generate and export detailed HR analytics across the organization'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="no-print">
          <ReportExport
            data={flatExportData}
            reportType={filters.reportType}
            summary={summary}
            dateLabel={dateLabel}
            filename={`${filters.reportType}_report_${filters.singleDate || filters.startDate}`}
          />
          {/* ── Print Report Button ── */}
          <button
            onClick={() => setShowPrintModal(true)}
            disabled={flatExportData.length === 0 && reportData.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white', color: '#475569',
              border: '1.5px solid #E2E8F0', borderRadius: '10px',
              fontSize: '14px', fontWeight: '700',
              cursor: (flatExportData.length === 0 && reportData.length === 0) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              transition: 'all 0.2s',
              opacity: (flatExportData.length === 0 && reportData.length === 0) ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (flatExportData.length > 0 || reportData.length > 0) e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            🖨️ Print Report
          </button>
        </div>
      </div>

      {/* ── Summary Cards — right below the title ──────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '18px', marginBottom: '26px',
      }}>
        {loading
          ? [1, 2, 3, 4].map(i => <ReportSummaryCard key={i} loading={true} />)
          : summaryCards.map((card, i) => (
              <ReportSummaryCard key={i} {...card} />
            ))
        }
      </div>

      {/* ── Filters Panel ──────────────────────────────────────────── */}
      <div className="no-print">
        <ReportFilters
          filters={filters}
          setFilters={setFilters}
          dateMode={dateMode}
          setDateMode={setDateMode}
          employees={employees}
          departments={departments}
          isManager={isManager}
          onGenerate={generateReport}
          loading={loading}
        />
      </div>

      {/* ── Results Header ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', flexWrap: 'wrap', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>
            {reportTitleMap[filters.reportType] || 'Report'} — {dateLabel}
          </span>
          <span style={{
            backgroundColor: '#FFF7ED', color: '#EA580C',
            padding: '2px 10px', borderRadius: '20px',
            fontSize: '12px', fontWeight: '700', border: '1px solid #FED7AA',
          }}>
            {loading ? '…' : flatExportData.length} records
          </span>
        </div>
        {!loading && flatExportData.length === 0 && (
          <span style={{ fontSize: '12px', color: '#94A3B8' }}>
            No data — try adjusting date or filters
          </span>
        )}
      </div>

      {/* ── Main Report Output ─────────────────────────────────────── */}
      {isRangeAttend ? (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: '140px', backgroundColor: 'white', borderRadius: '14px',
                border: '1.5px solid #F1F5F9',
                animation: 'summaryPulse 1.5s ease-in-out infinite',
              }} />
            ))}
          </div>
        ) : reportData.length === 0 ? (
          <div style={{
            backgroundColor: 'white', borderRadius: '14px',
            border: '1.5px solid #F1F5F9', padding: '64px',
            textAlign: 'center', color: '#94A3B8',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: '#64748B' }}>
              No data found
            </div>
            <div style={{ fontSize: '13px' }}>
              Try selecting a different date range or adjusting your filters
            </div>
          </div>
        ) : (
          reportData.map((group, idx) => (
            <DateGroupCard
              key={idx}
              group={group}
              onViewDetail={grp => setDetailModal({ date: grp.date, details: grp.employees || grp.details || [] })}
            />
          ))
        )
      ) : (
        <ReportTable
          data={reportData}
          reportType={filters.reportType}
          loading={loading}
        />
      )}

      {/* ── Detail Modal ───────────────────────────────────────────── */}
      {detailModal && (
        <DetailModal
          detail={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}

      {/* ── Print Modal ────────────────────────────────────────────── */}
      {showPrintModal && (
        <HRPrintModal
          onClose={() => setShowPrintModal(false)}
          reportData={reportData}
          summary={summary}
          reportType={filters.reportType}
          employees={employees}
          departments={departments}
          dateMode={dateMode}
          filters={filters}
          flatExportData={flatExportData}
        />
      )}
    </div>
  );
};

export default HRReports;
