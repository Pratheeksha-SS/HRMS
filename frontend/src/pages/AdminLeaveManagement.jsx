import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import api, { API_BASE_URL } from '../utils/axiosConfig';

/* ─── Helpers ───────────────────────────────────────────────────────── */
const extractListData = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
};

export const leaveTypeLabels = {
  SICK: 'Sick Leave',
  CASUAL: 'Casual Leave',
  PAID: 'Paid Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  MARRIAGE: 'Marriage Leave',
};

/* ─── Design Tokens (matching Employees.jsx) ─────────────────────────
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

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '90px',
};

/* ─── Print Report Generator (unchanged) ────────────────────────────── */
const generatePrintHTML = ({ title, subtitle, leaves, employees, groupByDept = false, singleEmployee = null }) => {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const getStatusStyle = (status) => {
    if (status === 'APPROVED') return 'background:#dcfce7;color:#166534;';
    if (status === 'REJECTED') return 'background:#fee2e2;color:#991b1b;';
    return 'background:#fef3c7;color:#92400e;';
  };

  const renderRows = (data) => data.map((l) => `
    <tr>
      <td>${l.employee_name || 'N/A'}</td>
      <td>${l.employee_id || 'N/A'}</td>
      <td>${l.department || 'N/A'}</td>
      <td>${leaveTypeLabels[l.leave_type] || l.leave_type || 'N/A'}</td>
      <td>${l.start_date || '—'}</td>
      <td>${l.end_date || '—'}</td>
      <td style="text-align:center;font-weight:700">${l.total_days || l.leave_days || 0}</td>
      <td><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;${getStatusStyle(l.status)}">${l.status || 'N/A'}</span></td>
      <td>${l.reason || '—'}</td>
    </tr>
  `).join('');

  const deptGroups = {};
  leaves.forEach((l) => {
    const dept = l.department || 'Unassigned';
    if (!deptGroups[dept]) deptGroups[dept] = [];
    deptGroups[dept].push(l);
  });

  const summaryStats = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
      ${[
        ['Total Requests', leaves.length, '#2563eb'],
        ['Pending', leaves.filter(l => l.status === 'PENDING').length, '#d97706'],
        ['Approved', leaves.filter(l => l.status === 'APPROVED').length, '#16a34a'],
        ['Rejected', leaves.filter(l => l.status === 'REJECTED').length, '#dc2626'],
      ].map(([label, val, color]) => `
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:16px;text-align:center;border-top:3px solid ${color}">
          <div style="font-size:28px;font-weight:800;color:${color}">${val}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:500">${label}</div>
        </div>
      `).join('')}
    </div>
  `;

  const tableBody = groupByDept
    ? Object.entries(deptGroups).map(([dept, rows]) => `
        <tr><td colspan="9" style="background:linear-gradient(90deg,#fff7ed,#fff);padding:14px 16px;font-weight:700;font-size:14px;color:#c2410c;border-top:2px solid #fed7aa;">
          🏢 ${dept} <span style="font-size:11px;font-weight:500;color:#6b7280;margin-left:8px">${rows.length} request${rows.length !== 1 ? 's' : ''}</span>
        </td></tr>
        ${renderRows(rows)}
      `).join('')
    : renderRows(leaves);

  const empInfo = singleEmployee ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:18px;margin-bottom:24px;display:flex;gap:20px;align-items:center">
      <div style="width:60px;height:60px;border-radius:50%;background:#f97316;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;flex-shrink:0">
        ${(singleEmployee.employee_name || 'NA').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
      </div>
      <div>
        <div style="font-size:18px;font-weight:700;color:#111827">${singleEmployee.employee_name || 'N/A'}</div>
        <div style="font-size:13px;color:#6b7280;margin-top:4px">ID: <strong>${singleEmployee.employee_id || 'N/A'}</strong> · ${singleEmployee.department || 'N/A'}</div>
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; background: #fff; color: #111827; padding: 0; }
    .page { padding: 40px 48px; max-width: 1100px; margin: 0 auto; }
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
        <div class="company-sub">Leave Administration Portal</div>
      </div>
    </div>
    <div class="report-meta">
      <div class="report-title">${title}</div>
      <div class="report-subtitle">${subtitle}</div>
      <div class="report-date">Generated: ${today}</div>
    </div>
  </div>
  ${empInfo}
  ${!singleEmployee ? summaryStats : ''}
  <table>
    <thead>
      <tr>
        <th>Employee</th><th>Emp ID</th><th>Department</th><th>Leave Type</th>
        <th>From</th><th>To</th><th style="text-align:center">Days</th><th>Status</th><th>Reason</th>
      </tr>
    </thead>
    <tbody>${tableBody}</tbody>
  </table>
  <div class="footer">
    <span>Total Records: <strong>${leaves.length}</strong></span>
    <span>Confidential — HR Use Only</span>
    <span>Page 1 of 1</span>
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
};

const openPrintWindow = (html) => {
  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) { alert('Please allow popups to print reports.'); return; }
  win.document.write(html);
  win.document.close();
};

/* ─── Status Badge ──────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = {
    PENDING: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    APPROVED: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    REJECTED: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  }[status?.toUpperCase()] || { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };

  return (
    <span style={{
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
      fontWeight: '700', display: 'inline-block', letterSpacing: '0.5px',
      textTransform: 'uppercase', backgroundColor: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }}>
      {status?.charAt(0) + (status?.slice(1).toLowerCase() || '')}
    </span>
  );
};

/* ─── Print Modal ───────────────────────────────────────────────────── */
const PrintModal = ({ onClose, leaves, employees, departments, getLeaveEmployeeName, getLeaveEmployeeId, getEmployeeRecordForLeave }) => {
  const [printType, setPrintType] = useState(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const enrichedLeaves = useMemo(() => leaves.map((l) => ({
    ...l,
    employee_name: getLeaveEmployeeName(l),
    employee_id: getLeaveEmployeeId(l),
    department: getEmployeeRecordForLeave(l)?.department || 'Unassigned',
    total_days: l.leave_days || l.total_days || 0,
  })), [leaves, getLeaveEmployeeName, getLeaveEmployeeId, getEmployeeRecordForLeave]);

  const applyFilters = (data) => {
    let result = [...data];
    if (statusFilter !== 'ALL') result = result.filter(l => l.status === statusFilter);
    if (dateFrom) result = result.filter(l => l.start_date >= dateFrom);
    if (dateTo) result = result.filter(l => l.end_date <= dateTo);
    return result;
  };

  const handlePrint = () => {
    let printData, title, subtitle, groupByDept = false, singleEmp = null;
    if (printType === 'all') {
      printData = applyFilters(enrichedLeaves);
      title = 'All Leave Requests Report';
      subtitle = statusFilter !== 'ALL' ? `Status: ${statusFilter}` : 'Complete Leave Register';
    } else if (printType === 'department') {
      printData = applyFilters(enrichedLeaves.filter(l => l.department === selectedDept));
      title = `Department Report — ${selectedDept}`;
      subtitle = `Leave requests for ${selectedDept} department`;
    } else if (printType === 'all_departments') {
      printData = applyFilters(enrichedLeaves);
      title = 'Department-wise Leave Report';
      subtitle = 'All departments consolidated';
      groupByDept = true;
    } else if (printType === 'employee') {
      const empLeaves = applyFilters(enrichedLeaves.filter(l => l.employee_id === selectedEmpId || String(l.employee) === selectedEmpId));
      printData = empLeaves;
      const empInfo = empLeaves[0] || {};
      singleEmp = { employee_name: empInfo.employee_name, employee_id: empInfo.employee_id, department: empInfo.department };
      title = 'Employee Leave Report';
      subtitle = empInfo.employee_name || selectedEmpId;
    } else if (printType === 'pending') {
      printData = enrichedLeaves.filter(l => l.status === 'PENDING');
      title = 'Pending Leave Requests';
      subtitle = 'Awaiting admin review';
    } else if (printType === 'today_absentees') {
      const today = new Date().toISOString().split('T')[0];
      printData = enrichedLeaves.filter(l => l.status === 'APPROVED' && l.start_date <= today && l.end_date >= today);
      title = "Today's Absentee Report";
      subtitle = `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    }
    if (!printData || printData.length === 0) { alert('No data found for the selected criteria.'); return; }
    openPrintWindow(generatePrintHTML({ title, subtitle, leaves: printData, employees, groupByDept, singleEmployee: singleEmp }));
  };

  const printOptions = [
    { id: 'all', icon: '📄', label: 'All Leave Requests', desc: 'Complete leave register with filters' },
    { id: 'all_departments', icon: '🏢', label: 'Department-wise Report', desc: 'All departments grouped by team' },
    { id: 'department', icon: '📂', label: 'Single Department', desc: 'Leave report for one department' },
    { id: 'employee', icon: '👤', label: 'Employee Report', desc: 'Individual employee leave history' },
    { id: 'pending', icon: '⏳', label: 'Pending Requests', desc: 'Only requests awaiting review' },
    { id: 'today_absentees', icon: '🏖️', label: "Today's Absentees", desc: 'Employees on approved leave today' },
  ];

  const showFilters = printType && !['pending', 'today_absentees'].includes(printType);
  const isDisabled = !printType
    || (printType === 'department' && !selectedDept)
    || (printType === 'employee' && !selectedEmpId);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px',
      animation: 'fadeIn 0.25s ease',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        width: '90%', maxWidth: '680px', maxHeight: '92vh', overflow: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          padding: '22px 28px', color: 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 3px 0', letterSpacing: '-0.3px' }}>
                🖨️ Print Reports
              </h2>
              <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>
                Choose a report type and configure options
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
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
            Select Report Type
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {printOptions.map(opt => (
              <div key={opt.id} onClick={() => setPrintType(opt.id)} style={{
                padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
                border: `2px solid ${printType === opt.id ? '#F97316' : '#E2E8F0'}`,
                backgroundColor: printType === opt.id ? '#FFF7ED' : 'white',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
              }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{opt.icon}</span>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: printType === opt.id ? '#EA580C' : '#0F172A' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {printType && (
            <div style={{
              backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '18px',
              border: '1.5px solid #E2E8F0', marginBottom: '4px',
            }}>
              <div style={{ ...labelStyle, marginBottom: '14px' }}>Report Options</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {printType === 'department' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Select Department</label>
                    <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} style={selectStyle}>
                      <option value="">— Choose Department —</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                {printType === 'employee' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Select Employee</label>
                    <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} style={selectStyle}>
                      <option value="">— Choose Employee —</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.employee_id || String(emp.id)}>
                          {emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim()} ({emp.employee_id || emp.id})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {showFilters && (
                  <>
                    <div>
                      <label style={labelStyle}>Status Filter</label>
                      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending Only</option>
                        <option value="APPROVED">Approved Only</option>
                        <option value="REJECTED">Rejected Only</option>
                      </select>
                    </div>
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
          }}>
            🖨️ Generate &amp; Print
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
const AdminLeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [filters, setFilters] = useState({ status: 'ALL', employee_id: '', date: '', department: '' });
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [tableSortField, setTableSortField] = useState('');
  const [tableSortDirection, setTableSortDirection] = useState('asc');
  const [tableCurrentPage, setTableCurrentPage] = useState(1);
  const tableItemsPerPage = 10;
  const [notification, setNotification] = useState(null);
  const [showLeaveBalanceSection, setShowLeaveBalanceSection] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const [reviewComments, setReviewComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [showLeaveBalanceModal, setShowLeaveBalanceModal] = useState(false);
  const [showAddExtraLeaveModal, setShowAddExtraLeaveModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [extraLeaveData, setExtraLeaveData] = useState({ leave_type: 'SICK', days: 1, reason: 'Additional leave granted' });
  const cancelRef = useRef(null);

  const showNotice = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchAllLeaves = useCallback(async (silent = false) => {
    if (cancelRef.current) cancelRef.current.abort();
    cancelRef.current = new AbortController();
    try {
      const res = await api.get('/leaves/', {
        signal: cancelRef.current.signal,
      });
      const leaveList = extractListData(res.data);
      setLeaves(Array.isArray(leaveList) ? leaveList : []);
    } catch (err) {
      if (axios.isCancel && axios.isCancel(err)) return;
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      if (!silent) { showNotice('Failed to load leave requests. Please refresh.', 'error'); }
    }
  }, []);

  const fetchEmployees = useCallback(async (silent = false) => {
    if (!silent) setLoadingEmployees(true);
    try {
      const res = await api.get('/employees/');
      const empList = extractListData(res.data);
      setEmployees(Array.isArray(empList) ? empList : []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      if (!silent) setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAllLeaves(), fetchEmployees()]).finally(() => setLoading(false));
    const interval = setInterval(() => {
      if (!document.hidden) fetchAllLeaves(true);
    }, 30000);
    return () => {
      clearInterval(interval);
      if (cancelRef.current) cancelRef.current.abort();
    };
  }, [fetchAllLeaves, fetchEmployees]);

  const getEmployeeRecordForLeave = useCallback((leave) =>
    employees.find((emp) =>
      String(emp.user) === String(leave.employee) ||
      String(emp.id) === String(leave.employee) ||
      String(emp.employee_id) === String(leave.employee_id)
    ) || null, [employees]);

  const getLeaveEmployeeName = useCallback((leave) => {
    const emp = getEmployeeRecordForLeave(leave);
    return leave?.employee_name ||
      emp?.full_name ||
      `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim() ||
      `Employee #${leave?.employee}` || 'N/A';
  }, [getEmployeeRecordForLeave]);

  const getLeaveEmployeeId = useCallback((leave) => {
    const emp = getEmployeeRecordForLeave(leave);
    return leave?.employee_id || emp?.employee_id || 'N/A';
  }, [getEmployeeRecordForLeave]);

  // Fetch ALL existing departments from backend
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/departments-list/');
      const list = extractListData(res.data);
      const names = list
        .map(d => d?.name)
        .filter(Boolean);
      setDepartments(names.sort());
    } catch (err) {
      console.error('Error fetching departments:', err);
      // fallback to empty; dropdown will still render with "All Departments"
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    let next = Array.isArray(leaves) ? [...leaves] : [];
    if (activeFilter !== 'ALL') next = next.filter((l) => l.status === activeFilter);
    if (filters.employee_id.trim()) {
      const term = filters.employee_id.toLowerCase().trim();
      next = next.filter((l) =>
        getLeaveEmployeeName(l).toLowerCase().includes(term) ||
        getLeaveEmployeeId(l).toString().toLowerCase().includes(term)
      );
    }
    if (filters.date) next = next.filter((l) => l.start_date === filters.date || l.end_date === filters.date);
    if (filters.department) {
      next = next.filter((l) => {
        const emp = getEmployeeRecordForLeave(l);
        return emp?.department === filters.department;
      });
    }
    next = next.map((leave) => ({
      ...leave,
      employee_name: getLeaveEmployeeName(leave),
      employee_id: getLeaveEmployeeId(leave),
      leave_type_label: leaveTypeLabels[leave.leave_type] || leave.leave_type,
      department: getEmployeeRecordForLeave(leave)?.department || 'N/A',
      total_days: leave.leave_days || leave.total_days || 0,
    }));
    setFilteredLeaves(next);
  }, [filters, leaves, activeFilter, getLeaveEmployeeId, getLeaveEmployeeName, getEmployeeRecordForLeave]);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter((l) => l.status === 'PENDING').length,
    approved: leaves.filter((l) => l.status === 'APPROVED').length,
    rejected: leaves.filter((l) => l.status === 'REJECTED').length,
  }), [leaves]);

  const todayAbsentees = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leaves.filter((l) => l.status === 'APPROVED' && l.start_date <= today && l.end_date >= today);
  }, [leaves]);

  const handleCardClick = (status) => {
    setActiveFilter(status);
    setFilters((prev) => ({ ...prev, status }));
    setTableCurrentPage(1);
  };

  const openLeaveModal = async (leave) => {
    setSelectedLeave(leave);
    setReviewComments(leave.comments || '');
    try {
      const employeeRecord = getEmployeeRecordForLeave(leave);
      if (employeeRecord) {
        setSelectedEmployeeDetails(employeeRecord);
      } else if (leave.employee) {
        const res = await api.get(`/employees/${leave.employee}/`);
        setSelectedEmployeeDetails(res.data);
      }
    } catch (err) { console.error('Error fetching employee details:', err); }
    setShowLeaveModal(true);
  };

  const closeLeaveModal = () => {
    setShowLeaveModal(false);
    setSelectedLeave(null);
    setSelectedEmployeeDetails(null);
    setReviewComments('');
  };

  const handleApprove = async () => {
    if (!selectedLeave) return;
    setActionLoading(true);
    try {
      await api.patch(`/leaves/${selectedLeave.id}/approve/`, {
        status: 'APPROVED', comments: reviewComments,
      });
      setLeaves((prev) => prev.map((l) => l.id === selectedLeave.id ? { ...l, status: 'APPROVED', comments: reviewComments } : l));
      showNotice('Leave approved successfully', 'success');
      closeLeaveModal();
    } catch (err) {
      showNotice(err.response?.data?.error || 'Failed to approve leave', 'error');
    } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!selectedLeave) return;
    setActionLoading(true);
    try {
      await api.patch(`/leaves/${selectedLeave.id}/approve/`, {
        status: 'REJECTED', comments: reviewComments,
      });
      setLeaves((prev) => prev.map((l) => l.id === selectedLeave.id ? { ...l, status: 'REJECTED', comments: reviewComments } : l));
      showNotice('Leave rejected', 'success');
      closeLeaveModal();
    } catch (err) {
      showNotice(err.response?.data?.error || 'Failed to reject leave', 'error');
    } finally { setActionLoading(false); }
  };

  const handleDeleteLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await api.delete(`/leaves/${leaveId}/delete/`);
      setLeaves((prev) => prev.filter((l) => l.id !== leaveId));
      showNotice('Leave request deleted successfully', 'success');
      closeLeaveModal();
    } catch (err) {
      showNotice(err.response?.data?.error || 'Failed to delete leave request', 'error');
    }
  };

  const handleUpdateLeaveBalance = async (employeeId, updatedData) => {
    try {
      await api.patch(`/employees/${employeeId}/`, updatedData);
      fetchEmployees(true);
      setShowLeaveBalanceModal(false);
      setSelectedEmployee(null);
      showNotice('Leave balance updated successfully', 'success');
    } catch (err) {
      showNotice('Failed to update leave balance', 'error');
    }
  };

  const handleAddExtraLeaveToAll = async () => {
    try {
      for (const employee of employees) {
        const field = `${extraLeaveData.leave_type.toLowerCase()}_leave_balance`;
        await api.patch(`/employees/${employee.id}/`, {
          [field]: (employee[field] || 0) + extraLeaveData.days,
        });
      }
      fetchEmployees(true);
      setShowAddExtraLeaveModal(false);
      showNotice(`Added ${extraLeaveData.days} ${leaveTypeLabels[extraLeaveData.leave_type]} to all employees`, 'success');
    } catch (err) {
      showNotice('Failed to add extra leave', 'error');
    }
  };

  const handleExport = () => {
    const rows = filteredLeaves.map((l) => [
      l.employee_name, l.employee_id, l.department, l.leave_type_label || l.leave_type,
      l.start_date, l.end_date, l.total_days, l.reason || 'N/A', l.status || 'N/A',
      l.applied_at ? new Date(l.applied_at).toLocaleDateString() : 'N/A',
    ]);
    const html = `<html><body><table border="1">
      <tr><th>Employee</th><th>ID</th><th>Department</th><th>Leave Type</th><th>Start</th><th>End</th><th>Days</th><th>Reason</th><th>Status</th><th>Applied On</th></tr>
      ${rows.map(row => `<tr>${row.map(c => `<td>${String(c).replace(/</g, '&lt;')}</td>`).join('')}</tr>`).join('')}
    </table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leave-report.xls';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleTableSort = (key) => {
    if (tableSortField === key) setTableSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setTableSortField(key); setTableSortDirection('asc'); }
  };

  const sortArrow = (key) => tableSortField === key ? (tableSortDirection === 'asc' ? ' ↑' : ' ↓') : '';

  let tableData = [...filteredLeaves];
  if (tableSearchTerm.trim()) {
    const term = tableSearchTerm.toLowerCase();
    tableData = tableData.filter(item =>
      item.employee_name?.toLowerCase().includes(term) ||
      item.employee_id?.toString().toLowerCase().includes(term) ||
      (item.leave_type_label || item.leave_type)?.toLowerCase().includes(term)
    );
  }
  if (tableSortField) {
    tableData.sort((a, b) => {
      let aVal = a[tableSortField], bVal = b[tableSortField];
      if (tableSortField === 'status') {
        const order = { PENDING: 0, APPROVED: 1, REJECTED: 2 };
        aVal = order[a.status] ?? 3; bVal = order[b.status] ?? 3;
      }
      return tableSortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }
  const totalPages = Math.ceil(tableData.length / tableItemsPerPage);
  const startIndex = (tableCurrentPage - 1) * tableItemsPerPage;
  const paginatedData = tableData.slice(startIndex, startIndex + tableItemsPerPage);

  const hasActiveFilters = filters.employee_id || filters.date || filters.department || activeFilter !== 'ALL';

  /* ─── Shared Modal Overlay ─────────────────────────────────────── */
  const ModalOverlay = ({ children, onClose, maxWidth = '760px' }) => (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px',
      animation: 'fadeIn 0.25s ease',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        width: '90%', maxWidth, maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease',
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  const ModalHeader = ({ title, subtitle, onClose, gradient = 'linear-gradient(135deg, #F97316, #EA580C)' }) => (
    <div style={{ background: gradient, padding: '22px 28px', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 3px 0', letterSpacing: '-0.3px' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
          fontSize: '22px', cursor: 'pointer', width: '36px', height: '36px',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >×</button>
      </div>
    </div>
  );

  /* ─── Stat Card (matching Employees.jsx style) ─────────────────── */
  const StatCard = ({ label, value, sub, gradient, shadow, status }) => {
    const isActive = activeFilter === status;
    return (
      <div onClick={() => !loading && handleCardClick(status)} style={{
        background: gradient, padding: '22px 24px', borderRadius: '16px',
        color: 'white', boxShadow: isActive ? `0 8px 24px ${shadow}` : `0 6px 20px ${shadow}`,
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        transform: isActive ? 'translateY(-3px)' : 'translateY(0)',
        border: isActive ? '2px solid rgba(255,255,255,0.4)' : '2px solid transparent',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = isActive ? 'translateY(-3px)' : 'translateY(0)'; }}
      >
        <div style={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: '90px', height: '90px', borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.12)',
        }} />
        <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '38px', fontWeight: '800', lineHeight: 1, marginBottom: '6px' }}>{value}</div>
        <div style={{ fontSize: '12px', opacity: 0.75, fontWeight: '500' }}>{sub}</div>
        {isActive && (
          <div style={{
            position: 'absolute', bottom: '12px', right: '14px',
            fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '0.5px', opacity: 0.9,
            backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '10px',
          }}>● Active</div>
        )}
      </div>
    );
  };

  /* ─── Info Row for view modal ──────────────────────────────────── */
  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '10px', alignItems: 'start' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: '1px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '500' }}>{value || '—'}</span>
    </div>
  );

  /* ─── RENDER ────────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
          outline: none !important;
        }
      `}</style>

      {/* ── Toast Notification ── */}
      {notification && (
        <div style={{
          position: 'fixed', top: '22px', right: '22px', zIndex: 2500,
          padding: '13px 20px', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: '600',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          backgroundColor: notification.type === 'success' ? '#16A34A' : notification.type === 'error' ? '#DC2626' : '#2563EB',
          display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'slideUp 0.3s ease',
        }}>
          <span style={{ fontSize: '16px' }}>
            {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {notification.message}
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>📋</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Leave Management
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            Review, approve, and track employee leave requests
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={{
            backgroundColor: 'white', color: '#475569',
            border: '1.5px solid #E2E8F0', padding: '11px 20px',
            borderRadius: '10px', fontSize: '14px', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            📊 Export to Excel
          </button>
          <button onClick={() => setShowPrintModal(true)} style={{
            backgroundColor: 'white', color: '#475569',
            border: '1.5px solid #E2E8F0', padding: '11px 20px',
            borderRadius: '10px', fontSize: '14px', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            🖨️ Print Reports
          </button>
          <button onClick={() => setShowLeaveBalanceSection(true)} style={{
            background: 'linear-gradient(135deg, #16A34A, #15803D)',
            color: 'white', border: 'none', padding: '11px 22px',
            borderRadius: '10px', fontSize: '14px', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
            boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(22,163,74,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(22,163,74,0.3)'; }}
          >
            ⚖️ Manage Leave Balances
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <StatCard label="Total Requests" value={loading ? '…' : stats.total} sub="All Leave Records" gradient="linear-gradient(135deg, #F97316, #EA580C)" shadow="rgba(249,115,22,0.25)" status="ALL" />
        <StatCard label="Pending Review" value={loading ? '…' : stats.pending} sub="Awaiting Decision" gradient="linear-gradient(135deg, #F59E0B, #D97706)" shadow="rgba(245,158,11,0.25)" status="PENDING" />
        <StatCard label="Approved" value={loading ? '…' : stats.approved} sub="Leaves Granted" gradient="linear-gradient(135deg, #16A34A, #15803D)" shadow="rgba(22,163,74,0.25)" status="APPROVED" />
        <StatCard label="Rejected" value={loading ? '…' : stats.rejected} sub="Leaves Declined" gradient="linear-gradient(135deg, #DC2626, #B91C1C)" shadow="rgba(220,38,38,0.25)" status="REJECTED" />
      </div>

      {/* ── Today's Absentees Banner ── */}
      {todayAbsentees.length > 0 && (
        <div style={{
          backgroundColor: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '14px',
          padding: '14px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '18px' }}>🏖️</span>
          <strong style={{ color: '#C2410C', fontSize: '13px', fontWeight: '700' }}>
            Today's Absentees ({todayAbsentees.length})
          </strong>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: '4px' }}>
            {todayAbsentees.map((leave) => (
              <span key={leave.id} style={{
                backgroundColor: 'white', color: '#C2410C',
                border: '1px solid #FED7AA', padding: '4px 12px',
                borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              }}>
                {getLeaveEmployeeName(leave)} · {leaveTypeLabels[leave.leave_type] || leave.leave_type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{
        backgroundColor: 'white', padding: '20px 24px', borderRadius: '14px',
        marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1.5px solid #F1F5F9',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          🔍 Search &amp; Filter
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Search Employee</label>
            <input
              type="text"
              placeholder="Name or Employee ID…"
              value={filters.employee_id}
              onChange={e => { setFilters(prev => ({ ...prev, employee_id: e.target.value })); setTableCurrentPage(1); }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <select value={filters.department} onChange={e => { setFilters(prev => ({ ...prev, department: e.target.value })); setTableCurrentPage(1); }} style={selectStyle}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Filter by Date</label>
            <input
              type="date" value={filters.date}
              onChange={e => { setFilters(prev => ({ ...prev, date: e.target.value })); setTableCurrentPage(1); }}
              style={inputStyle}
            />
          </div>
          {hasActiveFilters && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => { setFilters({ status: 'ALL', employee_id: '', date: '', department: '' }); setActiveFilter('ALL'); setTableCurrentPage(1); }}
                style={{
                  width: '100%', padding: '10px 16px', backgroundColor: '#FEF2F2',
                  color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: '8px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '700',
                }}>
                ✕ Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Leave Table ── */}
      <div style={{
        backgroundColor: 'white', borderRadius: '14px',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1.5px solid #F1F5F9',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
              {activeFilter === 'ALL' ? (filters.department ? `${filters.department} — Leave Requests` : 'Leave Directory') : `${activeFilter.charAt(0)}${activeFilter.slice(1).toLowerCase()} Requests`}
            </span>
            <span style={{
              backgroundColor: '#FFF7ED', color: '#EA580C',
              padding: '2px 10px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '700', border: '1px solid #FED7AA',
            }}>{filteredLeaves.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text" placeholder="Quick search…" value={tableSearchTerm}
              onChange={e => { setTableSearchTerm(e.target.value); setTableCurrentPage(1); }}
              style={{ ...inputStyle, width: '200px' }}
            />
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', whiteSpace: 'nowrap' }}>
              {loading ? 'Loading…' : `${tableData.length} record${tableData.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {[
                  ['employee_name', 'Employee'],
                  ['employee_id', 'Emp ID'],
                  ['start_date', 'From'],
                  ['end_date', 'To'],
                  ['leave_type_label', 'Leave Type'],
                  ['status', 'Status'],
                ].map(([key, label]) => (
                  <th key={key} onClick={() => handleTableSort(key)} style={{
                    padding: '13px 16px', textAlign: 'left',
                    color: '#64748B', fontSize: '11px', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                    borderBottom: '1.5px solid #F1F5F9',
                    cursor: 'pointer', userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}{sortArrow(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
<tr><td colSpan="6" style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', border: '3px solid #FED7AA', borderTop: '3px solid #F97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Loading leave requests…
                  </div>
                </td></tr>
              ) : paginatedData.length === 0 ? (
<tr><td colSpan="6" style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '36px' }}>📭</span>
                    {leaves.length === 0 ? 'No leave requests found.' : 'No matching records found.'}
                    {leaves.length === 0 && (
                      <button onClick={() => fetchAllLeaves()} style={{
                        padding: '8px 18px', backgroundColor: '#FFF7ED', color: '#EA580C',
                        border: '1.5px solid #FED7AA', borderRadius: '8px',
                        cursor: 'pointer', fontSize: '13px', fontWeight: '700', marginTop: '8px',
                      }}>↻ Retry Loading</button>
                    )}
                  </div>
                </td></tr>
              ) : (
                paginatedData.map((leave, idx) => (
                  <tr key={leave.id} onClick={() => openLeaveModal(leave)} style={{
                    borderBottom: '1px solid #F8FAFC', cursor: 'pointer',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                    transition: 'background-color 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          backgroundColor: '#FFF7ED', border: '2px solid #FED7AA',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: '800', color: '#EA580C', flexShrink: 0,
                        }}>
                          {(leave.employee_name || 'NA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{leave.employee_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#F97316', fontFamily: 'monospace' }}>{leave.employee_id}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{leave.start_date || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{leave.end_date || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                      {leave.leave_type_label || leave.leave_type}
                    </td>
                    <td style={{ padding: '14px 16px' }}><StatusBadge status={leave.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {!loading && tableData.length > 0 && (
          <div style={{
            padding: '16px 24px', borderTop: '1.5px solid #F1F5F9',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '12px',
            backgroundColor: '#FAFAFA',
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Showing <strong>{startIndex + 1}–{Math.min(startIndex + tableItemsPerPage, tableData.length)}</strong> of <strong>{tableData.length}</strong> records
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button onClick={() => setTableCurrentPage(p => Math.max(p - 1, 1))} disabled={tableCurrentPage === 1} style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                border: '1.5px solid #E2E8F0', cursor: tableCurrentPage === 1 ? 'not-allowed' : 'pointer',
                backgroundColor: tableCurrentPage === 1 ? '#F8FAFC' : 'white',
                color: tableCurrentPage === 1 ? '#CBD5E1' : '#0F172A',
              }}>← Prev</button>
              <span style={{
                padding: '8px 16px', backgroundColor: '#F97316', color: 'white',
                borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                minWidth: '90px', textAlign: 'center',
              }}>{tableCurrentPage} / {totalPages || 1}</span>
              <button onClick={() => setTableCurrentPage(p => Math.min(p + 1, totalPages))} disabled={tableCurrentPage === totalPages || totalPages === 0} style={{
                padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                border: '1.5px solid #E2E8F0', cursor: (tableCurrentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                backgroundColor: (tableCurrentPage === totalPages || totalPages === 0) ? '#F8FAFC' : 'white',
                color: (tableCurrentPage === totalPages || totalPages === 0) ? '#CBD5E1' : '#0F172A',
              }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Print Modal ── */}
      {showPrintModal && (
        <PrintModal
          onClose={() => setShowPrintModal(false)}
          leaves={leaves} employees={employees} departments={departments}
          getLeaveEmployeeName={getLeaveEmployeeName}
          getLeaveEmployeeId={getLeaveEmployeeId}
          getEmployeeRecordForLeave={getEmployeeRecordForLeave}
        />
      )}

      {/* ── Leave Details Modal ── */}
      {showLeaveModal && selectedLeave && (
        <ModalOverlay onClose={closeLeaveModal} maxWidth="640px">
          {/* Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            padding: '28px 28px 56px', textAlign: 'center', position: 'relative',
          }}>
            <button onClick={closeLeaveModal} style={{
              position: 'absolute', top: '14px', right: '14px',
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >×</button>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Leave Request</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
              {selectedLeave.employee_name || getLeaveEmployeeName(selectedLeave)}
            </div>
          </div>

          {/* Avatar + status */}
          <div style={{ textAlign: 'center', marginTop: '-36px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            {selectedEmployeeDetails?.profile_image ? (
              <img
                src={selectedEmployeeDetails.profile_image.startsWith('http') ? selectedEmployeeDetails.profile_image : `${API_BASE_URL}${selectedEmployeeDetails.profile_image}`}
                alt="Profile"
                style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                onError={e => e.target.style.display = 'none'}
              />
            ) : (
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', fontSize: '26px', fontWeight: '800', color: 'white',
                border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}>
                {(selectedLeave.employee_name || getLeaveEmployeeName(selectedLeave) || 'NA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ marginTop: '10px' }}><StatusBadge status={selectedLeave.status} /></div>
          </div>

          <div style={{ padding: '0 28px 28px' }}>
            {/* Employee details chip */}
            {selectedEmployeeDetails && (
              <div style={{
                backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '14px 18px',
                border: '1.5px solid #F1F5F9', marginBottom: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>
                    {selectedEmployeeDetails.first_name} {selectedEmployeeDetails.last_name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    ID: <strong style={{ color: '#F97316' }}>{selectedEmployeeDetails.employee_id || 'N/A'}</strong> · {selectedEmployeeDetails.department || 'N/A'} · {selectedEmployeeDetails.designation || 'Employee'}
                  </div>
                </div>
              </div>
            )}

            {/* Meta Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                ['Department', selectedEmployeeDetails?.department || selectedLeave.department || 'N/A'],
                ['Leave Type', leaveTypeLabels[selectedLeave.leave_type] || selectedLeave.leave_type],
                ['Start Date', selectedLeave.start_date || '—'],
                ['End Date', selectedLeave.end_date || '—'],
                ['Total Days', `${selectedLeave.total_days || selectedLeave.leave_days || 0} day(s)`],
                ['Applied On', selectedLeave.applied_at ? formatDate(selectedLeave.applied_at) : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{
                  backgroundColor: '#FAFAFA', borderRadius: '10px',
                  padding: '14px', border: '1.5px solid #F1F5F9',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '5px' }}>{label}</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Reason */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ ...labelStyle, marginBottom: '8px' }}>Reason for Leave</div>
              <div style={{
                backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '10px',
                color: '#475569', lineHeight: '1.7', fontSize: '13px', border: '1.5px solid #E2E8F0',
              }}>{selectedLeave.reason || 'No reason provided.'}</div>
            </div>

            {/* Review Comments (pending) */}
            {selectedLeave.status === 'PENDING' && (
              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Review Comments</label>
                <textarea
                  value={reviewComments}
                  onChange={e => setReviewComments(e.target.value)}
                  placeholder="Add your review comments (optional)…"
                  rows={3}
                  style={textareaStyle}
                />
              </div>
            )}

            {/* Admin comments (non-pending) */}
            {selectedLeave.comments && selectedLeave.status !== 'PENDING' && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ ...labelStyle, marginBottom: '8px' }}>Admin Comments</div>
                <div style={{
                  backgroundColor: '#F8FAFC', padding: '14px 16px', borderRadius: '10px',
                  color: '#475569', lineHeight: '1.7', fontSize: '13px', border: '1.5px solid #E2E8F0',
                }}>{selectedLeave.comments}</div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{
              display: 'flex', gap: '10px', justifyContent: 'center',
              flexWrap: 'wrap', paddingTop: '8px', borderTop: '1.5px solid #F1F5F9',
            }}>
              <>
                <button onClick={closeLeaveModal} style={{
                  padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                  border: '1.5px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: '700', fontSize: '13px', marginTop: '8px',
                }}>Cancel</button>
                {selectedLeave.status === 'PENDING' && (
                  <>
                    <button onClick={handleReject} disabled={actionLoading} style={{
                      padding: '10px 22px', backgroundColor: '#FEF2F2', color: '#DC2626',
                      border: '1.5px solid #FECACA', borderRadius: '10px', cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: '700', fontSize: '13px', marginTop: '8px',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>✕ {actionLoading ? 'Processing…' : 'Reject'}</button>
                    <button onClick={handleApprove} disabled={actionLoading} style={{
                      padding: '10px 22px',
                      background: actionLoading ? '#CBD5E1' : 'linear-gradient(135deg, #16A34A, #15803D)',
                      color: 'white', border: 'none', borderRadius: '10px',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      fontWeight: '700', fontSize: '13px', marginTop: '8px',
                      boxShadow: actionLoading ? 'none' : '0 4px 12px rgba(22,163,74,0.3)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>✔ {actionLoading ? 'Processing…' : 'Approve'}</button>
                  </>
                )}
                <button onClick={() => handleDeleteLeave(selectedLeave.id)} style={{
                  padding: '10px 22px', backgroundColor: '#FEF2F2', color: '#DC2626',
                  border: '1.5px solid #FECACA', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: '700', fontSize: '13px', marginTop: '8px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>🗑️ Delete</button>
              </>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Leave Balance Section Modal ── */}
      {showLeaveBalanceSection && (
        <ModalOverlay onClose={() => setShowLeaveBalanceSection(false)} maxWidth="1100px">
          <ModalHeader
            title="⚖️ Leave Balance Management"
            subtitle="View and edit leave balances for all employees"
            onClose={() => setShowLeaveBalanceSection(false)}
          />
          <div style={{ padding: '0 0 0 0' }}>
            <div style={{ padding: '18px 28px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddExtraLeaveModal(true)} style={{
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                color: 'white', border: 'none', padding: '11px 22px',
                borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              }}>
                + Add Extra Leave for All
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {loadingEmployees ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>Loading employees…</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC' }}>
                      {['Employee', 'ID', 'Department', 'Sick', 'Casual', 'Paid', 'Total', 'Actions'].map(h => (
                        <th key={h} style={{
                          padding: '13px 16px', textAlign: 'left', color: '#64748B',
                          fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                          letterSpacing: '0.6px', borderBottom: '1.5px solid #F1F5F9',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee, idx) => {
                      const sick = employee.sick_leave_balance ?? 12;
                      const casual = employee.casual_leave_balance ?? 10;
                      const paid = employee.paid_leave_balance ?? 15;
                      return (
                        <tr key={employee.id} style={{
                          borderBottom: '1px solid #F8FAFC',
                          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                        }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                backgroundColor: '#F0FDF4', border: '2px solid #BBF7D0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: '800', color: '#15803D', flexShrink: 0,
                              }}>
                                {(employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'NA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                                {employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#F97316', fontFamily: 'monospace' }}>{employee.employee_id || 'N/A'}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              backgroundColor: '#FFF7ED', color: '#EA580C',
                              padding: '3px 10px', borderRadius: '20px',
                              fontSize: '12px', fontWeight: '600', border: '1px solid #FED7AA',
                            }}>{employee.department || 'N/A'}</span>
                          </td>
                          <td style={{ padding: '14px 16px' }}><span style={{ fontWeight: '700', color: '#D97706' }}>{sick}</span></td>
                          <td style={{ padding: '14px 16px' }}><span style={{ fontWeight: '700', color: '#2563EB' }}>{casual}</span></td>
                          <td style={{ padding: '14px 16px' }}><span style={{ fontWeight: '700', color: '#16A34A' }}>{paid}</span></td>
                          <td style={{ padding: '14px 16px' }}><span style={{ fontWeight: '800', color: '#F97316' }}>{sick + casual + paid}</span></td>
                          <td style={{ padding: '14px 16px' }}>
                            <button onClick={() => { setSelectedEmployee(employee); setShowLeaveBalanceModal(true); }} style={{
                              padding: '7px 16px', backgroundColor: '#FFF7ED', color: '#EA580C',
                              border: '1.5px solid #FED7AA', borderRadius: '8px',
                              cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                            }}>Edit</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Edit Leave Balance Modal ── */}
      {showLeaveBalanceModal && selectedEmployee && (
        <ModalOverlay onClose={() => { setShowLeaveBalanceModal(false); setSelectedEmployee(null); }} maxWidth="520px">
          <ModalHeader
            title="✏️ Edit Leave Balance"
            subtitle={selectedEmployee.full_name || `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim()}
            onClose={() => { setShowLeaveBalanceModal(false); setSelectedEmployee(null); }}
          />
          <div style={{ padding: '28px' }}>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              handleUpdateLeaveBalance(selectedEmployee.id, {
                sick_leave_balance: Number(fd.get('sick_leave_balance')),
                casual_leave_balance: Number(fd.get('casual_leave_balance')),
                paid_leave_balance: Number(fd.get('paid_leave_balance')),
                sick_leave_total: Number(fd.get('sick_leave_total')),
                casual_leave_total: Number(fd.get('casual_leave_total')),
                paid_leave_total: Number(fd.get('paid_leave_total')),
              });
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                {[
                  ['sick_leave_balance', 'Sick Leave Balance', selectedEmployee.sick_leave_balance ?? 12, '#D97706'],
                  ['casual_leave_balance', 'Casual Leave Balance', selectedEmployee.casual_leave_balance ?? 10, '#2563EB'],
                  ['paid_leave_balance', 'Paid Leave Balance', selectedEmployee.paid_leave_balance ?? 15, '#16A34A'],
                  ['sick_leave_total', 'Sick Leave Total', selectedEmployee.sick_leave_total ?? 12, '#D97706'],
                  ['casual_leave_total', 'Casual Leave Total', selectedEmployee.casual_leave_total ?? 10, '#2563EB'],
                  ['paid_leave_total', 'Paid Leave Total', selectedEmployee.paid_leave_total ?? 15, '#16A34A'],
                ].map(([name, label, value, accent]) => (
                  <div key={name} style={{
                    backgroundColor: '#FAFAFA', padding: '14px', borderRadius: '10px',
                    border: '1.5px solid #E2E8F0',
                  }}>
                    <label style={{ ...labelStyle, color: accent, marginBottom: '8px' }}>{label}</label>
                    <input type="number" name={name} defaultValue={value} min="0"
                      style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => { setShowLeaveBalanceModal(false); setSelectedEmployee(null); }} style={{
                  padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                  border: '1.5px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: '700', fontSize: '14px',
                }}>Cancel</button>
                <button type="submit" style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #16A34A, #15803D)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                }}>✔ Save Changes</button>
              </div>
            </form>
          </div>
        </ModalOverlay>
      )}

      {/* ── Add Extra Leave for All Modal ── */}
      {showAddExtraLeaveModal && (
        <ModalOverlay onClose={() => setShowAddExtraLeaveModal(false)} maxWidth="460px">
          <ModalHeader
            title="✨ Add Extra Leave"
            subtitle={`Applies to all ${employees.length} employees`}
            onClose={() => setShowAddExtraLeaveModal(false)}
          />
          <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Leave Type</label>
              <select value={extraLeaveData.leave_type} onChange={e => setExtraLeaveData(prev => ({ ...prev, leave_type: e.target.value }))} style={selectStyle}>
                {Object.entries(leaveTypeLabels).slice(0, 3).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Number of Days</label>
              <input type="number" min="1" value={extraLeaveData.days}
                onChange={e => setExtraLeaveData(prev => ({ ...prev, days: Number(e.target.value) || 1 }))}
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: '22px' }}>
              <label style={labelStyle}>Reason</label>
              <input type="text" value={extraLeaveData.reason}
                onChange={e => setExtraLeaveData(prev => ({ ...prev, reason: e.target.value }))}
                style={inputStyle} />
            </div>
            {/* Confirmation box */}
            <div style={{
              backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: '12px',
              padding: '14px 18px', marginBottom: '24px', color: '#15803D', fontSize: '13px', fontWeight: '600',
            }}>
              ✔ Adding <strong>{extraLeaveData.days}</strong> {leaveTypeLabels[extraLeaveData.leave_type]} day(s) to <strong>{employees.length}</strong> employees
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowAddExtraLeaveModal(false)} style={{
                padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                border: '1.5px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer',
                fontWeight: '700', fontSize: '14px',
              }}>Cancel</button>
              <button onClick={handleAddExtraLeaveToAll} style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              }}>Apply to All</button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default AdminLeaveManagement;
