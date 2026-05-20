import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { extractListData } from '../../utils/extractListData';
import {
  Search, X, Check, Briefcase, Users, Building2,
  Crown, Mail, Phone, UserPlus, UserCheck,
  AlertCircle, ChevronRight, RefreshCw, Trash2, Eye
} from 'lucide-react';

/* ─── Design Tokens (mirrors Employees.jsx palette) ───────────────────────────
   Primary       : #F97316  (orange-500)
   Primary Dark  : #EA580C  (orange-600)
   Primary Light : #FFF7ED  (orange-50)
   Accent        : #16A34A  (green-600)
   Accent Light  : #F0FDF4  (green-50)
   Neutral BG    : #F8FAFC
   Surface       : #FFFFFF
   Border        : #E2E8F0 / #F1F5F9
   Text Main     : #0F172A
   Text Muted    : #64748B
   ──────────────────────────────────────────────────────────────────────────── */

const ManagerManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Search states for Create Manager
  const [search, setSearch] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Assign Manager states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedManagerForAssign, setSelectedManagerForAssign] = useState("");
  const [selectedDepartmentForAssign, setSelectedDepartmentForAssign] = useState("");
  const [managerDepartment, setManagerDepartment] = useState("");
  const [filteredDepartmentOptions, setFilteredDepartmentOptions] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // View Manager Modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingManager, setViewingManager] = useState(null);
  const [viewingManagerFullDetails, setViewingManagerFullDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState(null);

  // Success/Error messages
  const [toast, setToast] = useState(null);

  // Promote panel
  const [showPromotePanel, setShowPromotePanel] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllData = async () => {
    setError(null);
    setLoading(true);
    try {
      // Fetch all employees across all pages
      const fetchAllEmployees = async () => {
        const all = [];
        let url = '/employees/?limit=100';
        while (url) {
          const res = await api.get(url);
          const page = res.data;
          const items = Array.isArray(page) ? page : (page?.results || []);
          all.push(...items);
          // Follow the next page URL — strip the base so api instance handles it
          if (page?.next) {
            try {
              const nextUrl = new URL(page.next);
              url = nextUrl.pathname.replace('/api', '') + nextUrl.search;
            } catch {
              url = null;
            }
          } else {
            url = null;
          }
        }
        return all;
      };

      const [rawEmployees, departmentsRes, departmentOptionsRes, managersRes] = await Promise.all([
        fetchAllEmployees(),
        api.get('/departments/'),
        api.get('/departments-list/'),
        api.get('/managers/'),
      ]);

      const employeesData = rawEmployees.map(emp => {
        const fullName = emp.full_name ||
          [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean).join(' ').trim() ||
          emp.username || '';
        return {
          id: emp.id,
          employee_id: emp.employee_id || '',
          name: fullName,
          email: emp.email || emp.user_email || '',
          department: emp.department || '',
          phone: emp.phone || '',
          user_id: emp.user,
          first_name: emp.first_name || '',
          last_name: emp.last_name || '',
          middle_name: emp.middle_name || '',
          designation: emp.designation || '',
          role: emp.user_role || emp.role || '',
          profile_image: emp.profile_image || emp.profile_image_url || null,
          gender: emp.gender,
          marital_status: emp.marital_status,
          education: emp.education,
          address: emp.address,
          joining_date: emp.joining_date,
          emergency_contact_name: emp.emergency_contact_name,
          emergency_contact_relationship: emp.emergency_contact_relationship,
          emergency_contact_phone: emp.emergency_contact_phone,
          emergency_contact_occupation: emp.emergency_contact_occupation,
          education_level: emp.education_level,
          institute_name: emp.institute_name,
          year_of_passing: emp.year_of_passing,
          marks_type: emp.marks_type,
          marks_value: emp.marks_value,
          account_holder_name: emp.account_holder_name,
          account_number: emp.account_number,
          bank_name: emp.bank_name,
          ifsc_code: emp.ifsc_code,
          branch_name: emp.branch_name,
          account_type: emp.account_type,
        };
      });

      const departmentsData = extractListData(departmentsRes?.data || []).map(dept => ({
        id: dept.id,
        name: dept.name,
        manager: dept.manager,
        manager_name: dept.manager_name,
        description: dept.description,
        employee_count: dept.employee_count
      }));

      const departmentOptionsData = extractListData(departmentOptionsRes?.data || []).map(dept => ({
        id: dept.id,
        name: dept.name
      }));

      const managersData = extractListData(managersRes?.data || []).map(mgr => {
        const assignedDeptName = mgr.managed_department?.trim();
        const assignedDept = departmentsData.find(dept =>
          String(dept.manager) === String(mgr.id) ||
          (assignedDeptName && String(dept.name).trim().toLowerCase() === assignedDeptName.toLowerCase())
        );
        const fullEmployee = employeesData.find(emp => emp.user_id === mgr.id);
        return {
          // Spread fullEmployee first so its `id` (Employee PK) doesn't overwrite the User ID
          ...fullEmployee,
          // These always win — user_id and id both point to the User PK
          id: mgr.id,
          user_id: mgr.id,
          name: fullEmployee?.name || mgr.username || `${mgr.first_name || ''} ${mgr.last_name || ''}`.trim(),
          email: mgr.email || fullEmployee?.email,
          employee_id: mgr.employee_id || fullEmployee?.employee_id,
          department_name: assignedDept?.name || assignedDeptName || "Not assigned",
          department_id: assignedDept?.id,
          status: "Active",
          managed_department: mgr.managed_department,
        };
      });

      setEmployees(employeesData);
      setDepartments(departmentsData);
      setDepartmentOptions(departmentOptionsData);
      setManagers(managersData);

      if (employeesData.length === 0) {
        showToast("No employees found. Please add employees first via Employees page.", "info");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to load manager management data";
      setError(errorMsg);
      showToast(`${errorMsg}. Check backend server.`, "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSearch = (value) => {
    setSearch(value);
    if (value.trim().length === 0) {
      setFilteredEmployees([]);
      setShowSuggestions(false);
      return;
    }
    const searchLower = value.toLowerCase().trim();
    const managerIds = new Set(managers.map(m => m.user_id || m.id));

    const filtered = employees.filter((emp) => {
      // Exclude employees who are already managers
      if (managerIds.has(emp.user_id) || managerIds.has(emp.id)) return false;

      const fields = [
        emp.name,
        emp.first_name,
        emp.last_name,
        emp.middle_name,
        // first + last combined in case full_name is missing
        `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        `${emp.last_name || ''} ${emp.first_name || ''}`.trim(),
        emp.email,
        emp.employee_id,
        emp.department,
        emp.designation,
      ];

      return fields.some(f => f && String(f).toLowerCase().includes(searchLower));
    });

    setFilteredEmployees(filtered);
    setShowSuggestions(true);
  };

  const selectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setSearch(emp.name);
    setFilteredEmployees([]);
    setShowSuggestions(false);
  };

  const clearSelection = () => {
    setSelectedEmployee(null);
    setSearch("");
  };

  const createManager = async () => {
    if (!selectedEmployee) {
      showToast("Please select an employee first", "error");
      return;
    }
    const userRole = localStorage.getItem('user_role') || '';
    if (userRole !== 'ADMIN') {
      showToast("Only ADMIN can promote employees", "error");
      return;
    }
    setPromoteLoading(true);
    try {
      await api.post("/promote-employee/", { employee_id: parseInt(selectedEmployee.id) });
      showToast(`${selectedEmployee.name} has been promoted to Manager! 🎉`, "success");
      await fetchAllData();
      clearSelection();
      setShowPromotePanel(false);
    } catch (err) {
      let errorMsg = "Failed to promote employee";
      if (err.response?.data?.error) errorMsg = err.response.data.error;
      else if (err.response?.data?.message) errorMsg = err.response.data.message;
      else if (err.message) errorMsg = err.message;
      showToast(errorMsg, "error");
    } finally {
      setPromoteLoading(false);
    }
  };

  const handleDeleteManager = async () => {
    if (!managerToDelete) return;
    setDeleteLoading(true);
    try {
      // Always send the User ID (user_id), never the Employee PK
      const userId = managerToDelete.user_id || managerToDelete.id;
      await api.post("/revoke-manager/", { manager_id: userId });
      showToast(`${managerToDelete.name} has been removed from managers.`, "success");
      // Optimistically remove from list immediately
      setManagers(prev => prev.filter(m => (m.user_id || m.id) !== userId));
      setShowDeleteModal(false);
      setManagerToDelete(null);
      // Refresh in background to sync full state
      fetchAllData();
    } catch (err) {
      const errData = err.response?.data;
      const errorMsg = errData?.error || errData?.message || err.message || "Failed to remove manager";

      // If backend says "not found" the user's role was already changed —
      // remove them from the list anyway so the UI stays consistent
      if (err.response?.status === 404) {
        const userId = managerToDelete.user_id || managerToDelete.id;
        setManagers(prev => prev.filter(m => (m.user_id || m.id) !== userId));
        showToast(`${managerToDelete.name} removed from manager list.`, "success");
        setShowDeleteModal(false);
        setManagerToDelete(null);
        fetchAllData();
      } else {
        showToast(errorMsg, "error");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleManagerChange = (managerId) => {
    setSelectedManagerForAssign(managerId);
    const manager = managers.find(m => m.id === parseInt(managerId));
    if (manager) {
      const mgrDept = manager.department_name || manager.managed_department || '';
      setManagerDepartment(mgrDept);
      const matchingDepts = departmentOptions.filter(dept =>
        dept.name.toLowerCase().trim() === mgrDept.toLowerCase().trim()
      );
      setFilteredDepartmentOptions(matchingDepts);
      if (matchingDepts.length === 0) {
        showToast(`No departments match manager's department: ${mgrDept}`, "warning");
      }
    }
  };

  const canAssignManager = () => {
    if (!selectedManagerForAssign || !selectedDepartmentForAssign) return false;
    const manager = managers.find(m => m.id === parseInt(selectedManagerForAssign));
    if (!manager) return false;
    const dept = departmentOptions.find(d => d.id === parseInt(selectedDepartmentForAssign));
    if (!dept) return false;
    if (dept.name.toLowerCase() !== managerDepartment.toLowerCase()) return false;
    const existingManager = getDepartmentManager(parseInt(selectedDepartmentForAssign));
    if (existingManager && existingManager.id !== parseInt(selectedManagerForAssign)) return false;
    return true;
  };

  const handleAssignManager = async () => {
    if (!canAssignManager()) {
      showToast("Cannot assign: Department must match manager's own department and must be vacant.", "error");
      return;
    }
    setAssignLoading(true);
    try {
      await api.post("/assign-manager/", {
        manager_id: parseInt(selectedManagerForAssign),
        department_id: parseInt(selectedDepartmentForAssign)
      });
      const manager = managers.find(m => m.id === parseInt(selectedManagerForAssign));
      const department = departments.find(d => d.id === parseInt(selectedDepartmentForAssign));
      showToast(`${manager?.name} assigned to ${department?.name} successfully!`, "success");
      setSelectedManagerForAssign("");
      setSelectedDepartmentForAssign("");
      setManagerDepartment("");
      setFilteredDepartmentOptions([]);
      setShowAssignModal(false);
      await fetchAllData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to assign manager";
      showToast(errorMsg, "error");
    } finally {
      setAssignLoading(false);
    }
  };

  const getDepartmentManager = (deptId) => {
    const dept = departments.find(d => String(d.id) === String(deptId));
    const optionDept = departmentOptions.find(d => String(d.id) === String(deptId));
    const deptName = dept?.name || optionDept?.name;
    if (dept && dept.manager) {
      return managers.find(m => String(m.id) === String(dept.manager) || String(m.user_id) === String(dept.manager));
    }
    if (deptName) {
      const normalizedName = deptName.trim().toLowerCase();
      return managers.find(m =>
        String(m.department_name || '').trim().toLowerCase() === normalizedName ||
        String(m.managed_department || '').trim().toLowerCase() === normalizedName
      ) || null;
    }
    return null;
  };

  const handleViewManager = async (manager) => {
    setModalLoading(true);
    setViewingManager(manager);
    setShowViewModal(true);
    try {
      const employeeId = manager.id || manager.employee_pk;
      const response = employeeId ? await api.get(`/employees/${employeeId}/`) : null;
      setViewingManagerFullDetails(response?.data || manager);
    } catch (err) {
      setViewingManagerFullDetails(manager);
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Shared Style Helpers ─────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
    color: '#0F172A',
    backgroundColor: '#fff',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
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

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '10px', alignItems: 'start' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: '1px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '500' }}>{value || '—'}</span>
    </div>
  );

  const AvatarCircle = ({ name, size = 38, fontSize = 14 }) => (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #F97316, #EA580C)',
      color: 'white', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: '700', fontSize,
      flexShrink: 0,
    }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );

  const spinnerStyle = {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px' }}>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '12px',
          padding: '12px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '12px', color: '#DC2626', fontSize: '14px',
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchAllData} style={{
            marginLeft: 'auto', background: 'white', border: '1.5px solid #FECACA',
            borderRadius: '8px', padding: '6px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
            color: '#DC2626', fontWeight: '700',
          }}>
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          padding: '14px 20px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
          zIndex: 2000, animation: 'slideUp 0.3s ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          background: '#0F172A', color: 'white',
          borderLeft: `4px solid ${toast.type === 'error' ? '#EF4444' : toast.type === 'info' ? '#3B82F6' : '#10B981'}`,
          fontSize: '14px', fontWeight: '600', maxWidth: '360px',
        }}>
          <span style={{ fontSize: '16px' }}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ'}
          </span>
          {toast.message}
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>
              <Crown size={22} color="white" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Manager Management
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            Promote employees to managers and assign them to departments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setShowPromotePanel(true); clearSelection(); }}
            style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              color: 'white', border: 'none', padding: '11px 22px',
              borderRadius: '10px', fontSize: '14px', fontWeight: '700',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(249,115,22,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.3)'; }}
          >
            <UserPlus size={16} /> Promote Employee
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            disabled={managers.filter(m => m.status === 'Active').length === 0}
            style={{
              backgroundColor: '#16A34A', color: 'white', border: 'none',
              padding: '11px 22px', borderRadius: '10px', fontSize: '14px',
              fontWeight: '700',
              cursor: managers.filter(m => m.status === 'Active').length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
              opacity: managers.filter(m => m.status === 'Active').length === 0 ? 0.6 : 1,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { if (managers.filter(m => m.status === 'Active').length > 0) { e.currentTarget.style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <UserCheck size={16} /> Assign to Department
          </button>
          <button
            onClick={fetchAllData}
            title="Refresh data"
            style={{
              padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0',
              background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#64748B', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {[
          {
            label: 'Total Employees', value: loading ? '...' : employees.length,
            sub: 'Active Workforce',
            gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
            shadow: 'rgba(249,115,22,0.25)',
            onClick: () => navigate('/employees', { state: { from: 'manager-mgmt' } }),
          },
          {
            label: 'Departments', value: departments.length,
            sub: 'Across Organisation',
            gradient: 'linear-gradient(135deg, #16A34A, #15803D)',
            shadow: 'rgba(22,163,74,0.25)',
            onClick: () => navigate('/departments', { state: { from: 'manager-mgmt' } }),
          },
          {
            label: 'Active Managers', value: loading ? '...' : managers.length,
            sub: 'Assigned Leaders',
            gradient: 'linear-gradient(135deg, #FB923C, #F97316)',
            shadow: 'rgba(249,115,22,0.2)',
            onClick: () => navigate('/admin/managers', { state: { from: 'manager-mgmt' } }),
          },
        ].map(card => (
          <div key={card.label} onClick={card.onClick} style={{
            background: card.gradient, padding: '22px 24px', borderRadius: '16px',
            color: 'white', boxShadow: `0 6px 20px ${card.shadow}`,
            position: 'relative', overflow: 'hidden', cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '90px', height: '90px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.12)',
            }} />
            <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
            <div style={{ fontSize: '38px', fontWeight: '800', lineHeight: 1, marginBottom: '6px' }}>{card.value}</div>
            <div style={{ fontSize: '12px', opacity: 0.75, fontWeight: '500' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Promote Panel (inline, collapsible) ──────────────────────────────── */}
      {showPromotePanel && (
        <div style={{
          backgroundColor: 'white', borderRadius: '14px', marginBottom: '24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #FED7AA',
          overflow: 'hidden', animation: 'slideUp 0.3s ease',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            padding: '18px 24px', color: 'white',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 2px 0' }}>✨ Promote Employee to Manager</h2>
              <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>Search and select an employee to promote</p>
            </div>
            <button onClick={() => { setShowPromotePanel(false); clearSelection(); }}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >×</button>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', marginBottom: '20px' }} ref={searchRef}>
              <label style={labelStyle}>Search Employee</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  style={{ ...inputStyle, paddingLeft: '42px', paddingRight: search ? '42px' : '14px' }}
                  type="text"
                  placeholder="Search by name, email or Employee ID..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  onFocus={() => search.length > 0 && setShowSuggestions(true)}
                />
                {search && (
                  <button onClick={clearSelection} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: '#F1F5F9', border: 'none', borderRadius: '50%',
                    width: '24px', height: '24px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#64748B',
                  }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {showSuggestions && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                  background: 'white', border: '1.5px solid #E2E8F0', borderRadius: '12px',
                  maxHeight: '280px', overflowY: 'auto', zIndex: 100,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                }}>
                  {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                    <div key={emp.id}
                      onClick={() => selectEmployee(emp)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', cursor: 'pointer',
                        borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <AvatarCircle name={emp.name} size={40} fontSize={15} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{emp.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>{emp.email}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                          ID: {emp.employee_id || 'N/A'} · {emp.department || 'No Dept'}
                        </div>
                      </div>
                      <ChevronRight size={15} color="#CBD5E1" />
                    </div>
                  )) : (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94A3B8' }}>
                      <AlertCircle size={28} color="#CBD5E1" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '14px' }}>No eligible employees found</p>
                      <small>Only non-manager employees can be promoted</small>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Employee Card */}
            {selectedEmployee && (
              <div style={{
                background: '#FAFAFA', borderRadius: '12px', padding: '16px 20px',
                border: '1.5px solid #FED7AA', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '16px',
              }}>
                <AvatarCircle name={selectedEmployee.name} size={52} fontSize={20} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '16px', color: '#0F172A' }}>{selectedEmployee.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{selectedEmployee.email}</div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[['ID', selectedEmployee.employee_id || 'N/A'], ['Dept', selectedEmployee.department || 'N/A'], ['Role', selectedEmployee.designation || 'N/A']].map(([k, v]) => (
                      <span key={k} style={{ fontSize: '12px', color: '#475569' }}>
                        <strong>{k}:</strong> {v}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={clearSelection} style={{
                  background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626',
                  borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px',
                }}>
                  <X size={13} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPromotePanel(false); clearSelection(); }}
                style={{
                  padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                  border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px',
                  fontWeight: '700', cursor: 'pointer',
                }}>
                Cancel
              </button>
              <button
                onClick={createManager}
                disabled={!selectedEmployee || promoteLoading}
                style={{
                  padding: '10px 24px',
                  background: (!selectedEmployee || promoteLoading) ? '#CBD5E1' : 'linear-gradient(135deg, #F97316, #EA580C)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700',
                  cursor: (!selectedEmployee || promoteLoading) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: (!selectedEmployee || promoteLoading) ? 'none' : '0 4px 12px rgba(249,115,22,0.3)',
                  transition: 'transform 0.2s',
                }}
              >
                {promoteLoading ? (
                  <><span style={spinnerStyle} /> Promoting...</>
                ) : (
                  <><Crown size={15} /> Promote to Manager</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Managers Table ─────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'white', borderRadius: '14px',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1.5px solid #F1F5F9',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Crown size={18} color="#F97316" />
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Manager Directory</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
            {loading ? 'Loading...' : `${managers.length} manager${managers.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {['Manager', 'Employee ID', 'Email', 'Department', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '13px 16px', textAlign: 'left',
                    color: '#64748B', fontSize: '11px', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                    borderBottom: '1.5px solid #F1F5F9',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '32px' }}>⏳</span>
                      Loading managers...
                    </div>
                  </td>
                </tr>
              ) : managers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '36px' }}>👑</span>
                      No managers yet. Promote an employee to get started.
                    </div>
                  </td>
                </tr>
              ) : managers.map((m, idx) => (
                <tr key={m.id}
                  onClick={() => handleViewManager(m)}
                  style={{
                    borderBottom: '1px solid #F8FAFC', cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AvatarCircle name={m.name} size={38} fontSize={14} />
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{m.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#F97316', fontFamily: 'monospace' }}>
                      {m.employee_id || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>{m.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {m.department_name && m.department_name !== 'Not assigned' ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        backgroundColor: '#FFF7ED', color: '#EA580C',
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: '600', border: '1px solid #FED7AA',
                      }}>
                        <Building2 size={11} /> {m.department_name}
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>Not assigned</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      background: '#F0FDF4', color: '#15803D',
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px',
                      border: '1px solid #BBF7D0',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                      Active
                    </span>
                  </td>
                  {/* Actions removed from row — use modal for view/remove */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Manager Modal ────────────────────────────────────────────────── */}
      {showViewModal && viewingManager && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '620px',
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              padding: '32px 28px 60px', textAlign: 'center', position: 'relative',
            }}>
              <button onClick={() => setShowViewModal(false)}
                style={{
                  position: 'absolute', top: '14px', right: '14px',
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                  fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >×</button>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                Manager Profile
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
                {viewingManager.name}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '-44px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
              {modalLoading ? (
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: '#E2E8F0', margin: '0 auto', border: '4px solid white' }} />
              ) : viewingManagerFullDetails?.profile_image ? (
                <img src={viewingManagerFullDetails.profile_image} alt="Profile"
                  style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                />
              ) : (
                <div style={{
                  width: '88px', height: '88px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#F97316,#EA580C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', fontSize: '38px',
                  border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  color: 'white', fontWeight: '800',
                }}>
                  {viewingManager.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ marginTop: '10px' }}>
                <span style={{
                  padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  backgroundColor: '#DBEAFE', color: '#1D4ED8',
                }}>
                  Manager
                </span>
              </div>
            </div>

            <div style={{ padding: '0 28px 28px' }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Loading details...</div>
              ) : (
                <>
                  <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📋 Personal Information
                    </div>
                    <InfoRow label="Employee ID" value={viewingManager.employee_id} />
                    <InfoRow label="Email" value={viewingManager.email} />
                    <InfoRow label="Phone" value={viewingManager.phone} />
                    <InfoRow label="Gender" value={viewingManager.gender} />
                    <InfoRow label="Marital Status" value={viewingManager.marital_status} />
                    <InfoRow label="Education" value={viewingManager.education} />
                    <InfoRow label="Address" value={viewingManager.address} />
                    <InfoRow label="Joining Date" value={viewingManager.joining_date} />
                    <InfoRow label="Department" value={viewingManager.department_name || viewingManager.department || 'Not assigned'} />
                  </div>

                  {(viewingManager.emergency_contact_name || viewingManager.emergency_contact_phone) && (
                    <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
                        🚨 Emergency Contact
                      </div>
                      <InfoRow label="Name" value={viewingManager.emergency_contact_name} />
                      <InfoRow label="Relationship" value={viewingManager.emergency_contact_relationship} />
                      <InfoRow label="Phone" value={viewingManager.emergency_contact_phone} />
                      <InfoRow label="Occupation" value={viewingManager.emergency_contact_occupation} />
                    </div>
                  )}

                  {(viewingManager.education_level || viewingManager.institute_name) && (
                    <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
                        🎓 Education Details
                      </div>
                      <InfoRow label="Level" value={viewingManager.education_level} />
                      <InfoRow label="Institute" value={viewingManager.institute_name} />
                      <InfoRow label="Year of Passing" value={viewingManager.year_of_passing} />
                      {viewingManager.marks_value && (
                        <InfoRow label="Marks" value={`${viewingManager.marks_value} ${viewingManager.marks_type || ''}`} />
                      )}
                    </div>
                  )}

                  {(viewingManager.account_holder_name || viewingManager.bank_name) && (
                    <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>
                        🏦 Bank Details
                      </div>
                      <InfoRow label="Account Holder" value={viewingManager.account_holder_name} />
                      {viewingManager.account_number && (
                        <InfoRow label="Account Number" value={`****${viewingManager.account_number.slice(-4)}`} />
                      )}
                      <InfoRow label="Bank Name" value={viewingManager.bank_name} />
                      <InfoRow label="IFSC Code" value={viewingManager.ifsc_code} />
                      <InfoRow label="Branch" value={viewingManager.branch_name} />
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '8px' }}>
                <button
                  onClick={() => { setManagerToDelete(viewingManager); setShowDeleteModal(true); setShowViewModal(false); }}
                  style={{
                    padding: '10px 22px', backgroundColor: '#FEF2F2', color: '#DC2626',
                    border: '1.5px solid #FECACA', borderRadius: '10px', cursor: 'pointer',
                    fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                >
                  🗑️ Remove Manager
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  style={{
                    padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                    border: '1.5px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer',
                    fontWeight: '700', fontSize: '13px', transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ─────────────────────────────────────────── */}
      {showDeleteModal && managerToDelete && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '440px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '24px 28px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px', height: '48px', background: '#FEF2F2', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Trash2 size={22} color="#EF4444" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0F172A', margin: '0 0 2px 0' }}>Remove Manager</h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>This action will revoke manager privileges</p>
              </div>
              <button onClick={() => setShowDeleteModal(false)} style={{
                background: '#F1F5F9', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B',
              }}>×</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 12px 0' }}>
                Are you sure you want to remove <strong>{managerToDelete.name}</strong> from managers?
              </p>
              <div style={{
                background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '10px',
                padding: '12px 16px', fontSize: '13px', color: '#DC2626',
              }}>
                This will convert them back to a regular employee.
                {managerToDelete.department_name !== "Not assigned" && (
                  <span> They will be unassigned from <strong>{managerToDelete.department_name}</strong>.</span>
                )}
              </div>
            </div>
            <div style={{ padding: '0 28px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                style={{
                  padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                  border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px',
                  fontWeight: '700', cursor: 'pointer',
                }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteManager}
                disabled={deleteLoading}
                style={{
                  padding: '10px 22px', backgroundColor: '#EF4444', color: 'white',
                  border: 'none', borderRadius: '10px', fontSize: '14px',
                  fontWeight: '700', cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: deleteLoading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
                }}>
                {deleteLoading ? (
                  <><span style={spinnerStyle} /> Removing...</>
                ) : (
                  <><Trash2 size={14} /> Yes, Remove</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Manager Modal ──────────────────────────────────────────────── */}
      {showAssignModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}
          onClick={e => e.target === e.currentTarget && setShowAssignModal(false)}
        >
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '540px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease',
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #16A34A, #15803D)',
              padding: '22px 28px', color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 2px 0' }}>Assign Manager to Department</h2>
                <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>Select a manager and matching department</p>
              </div>
              <button onClick={() => setShowAssignModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                  fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >×</button>
            </div>

            <div style={{ padding: '28px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Select Manager</label>
                <select style={selectStyle} value={selectedManagerForAssign} onChange={e => handleManagerChange(e.target.value)}>
                  <option value="">Choose a manager...</option>
                  {managers.filter(m => m.status === 'Active').map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                      {manager.department_name !== 'Not assigned' ? ` (${manager.department_name})` : ' (Unassigned)'}
                    </option>
                  ))}
                </select>
                {managerDepartment && (
                  <div style={{ fontSize: '12px', color: '#16A34A', marginTop: '6px', fontWeight: '600' }}>
                    Manager's dept: <strong>{managerDepartment}</strong> ({filteredDepartmentOptions.length} matching)
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Select Department</label>
                <select
                  style={selectStyle}
                  value={selectedDepartmentForAssign}
                  onChange={e => setSelectedDepartmentForAssign(e.target.value)}
                  disabled={filteredDepartmentOptions.length === 0 && !!managerDepartment}
                >
                  <option value="">Choose a department...</option>
                  {filteredDepartmentOptions.map(dept => {
                    const current = getDepartmentManager(dept.id);
                    return (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {current ? `⚠️ Has Manager: ${current.name}` : '✅ Available'}
                      </option>
                    );
                  })}
                </select>
                {!managerDepartment && (
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>Select a manager first to filter departments</div>
                )}
              </div>

              {selectedManagerForAssign && selectedDepartmentForAssign && (() => {
                const manager = managers.find(m => m.id === parseInt(selectedManagerForAssign));
                const department = departmentOptions.find(d => d.id === parseInt(selectedDepartmentForAssign)) || departments.find(d => d.id === parseInt(selectedDepartmentForAssign));
                const existingManager = getDepartmentManager(parseInt(selectedDepartmentForAssign));
                return (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    padding: '16px', background: '#F0FDF4', borderRadius: '12px',
                    fontSize: '13px', color: '#065F46', lineHeight: '1.6',
                    border: '1.5px solid #BBF7D0',
                  }}>
                    <Check size={17} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>{manager?.name}</strong> will be assigned as manager of <strong>{department?.name}</strong>.
                      {existingManager && existingManager.id !== manager?.id && (
                        <span style={{ color: '#DC2626' }}> This will replace <strong>{existingManager.name}</strong>.</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '0 28px 28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowAssignModal(false)} style={{
                padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button
                onClick={handleAssignManager}
                disabled={!selectedManagerForAssign || !selectedDepartmentForAssign || assignLoading}
                style={{
                  padding: '10px 24px',
                  background: (!selectedManagerForAssign || !selectedDepartmentForAssign || assignLoading) ? '#CBD5E1' : 'linear-gradient(135deg, #16A34A, #15803D)',
                  color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
                  cursor: (!selectedManagerForAssign || !selectedDepartmentForAssign || assignLoading) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: (!selectedManagerForAssign || !selectedDepartmentForAssign) ? 'none' : '0 4px 12px rgba(22,163,74,0.3)',
                }}>
                {assignLoading ? (
                  <><span style={spinnerStyle} /> Assigning...</>
                ) : (
                  <><UserCheck size={15} /> Confirm Assignment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
        }
      `}</style>
    </div>
  );
};

export default ManagerManagement;