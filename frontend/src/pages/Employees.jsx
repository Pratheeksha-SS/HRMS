import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { extractListData } from '../utils/extractListData';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';

const FormSection = ({ title, icon, children }) => (
  <div style={{
    marginBottom: '24px',
    backgroundColor: '#FAFAFA',
    borderRadius: '12px',
    padding: '20px',
    border: '1.5px solid #E2E8F0',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '18px', paddingBottom: '12px',
      borderBottom: '2px solid #FED7AA',
    }}>
      <span style={{
        width: '30px', height: '30px', borderRadius: '8px',
        backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '16px',
      }}>{icon}</span>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
    </div>
    {children}
  </div>
);

/* ─── Design Token Variables (injected via <style>) ──────────────────────────
   Primary  : #F97316  (orange-500)
   Primary Dark : #EA580C (orange-600)
   Primary Light: #FFF7ED (orange-50)
   Accent   : #16A34A  (green-600)
   Accent Light: #F0FDF4 (green-50)
   Neutral BG : #F8FAFC
   Surface  : #FFFFFF
   Border   : #E2E8F0
   Text Main: #0F172A
   Text Muted: #64748B
   ──────────────────────────────────────────────────────────────────────────── */

const Employees = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const fromManagerMgmt = location.state?.from === 'manager-mgmt';

  const handleBackToManagerMgmt = () => {
    if (fromManagerMgmt && location.state?.from === 'manager-mgmt') {
      navigate(-1);
    } else {
      navigate('/admin/manager-management');
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const refreshRef = useRef();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedDesignation, setSelectedDesignation] = useState('all');

  const designationOptions = [
    'Software Engineer',
    'Senior Software Engineer',
    'Team Lead',
    'HR Executive',
    'HR Associate',
    'Accountant',
    'Sales Executive',
    'Marketing Executive',
    'UI/UX Designer',
    'QA Tester',
    'DevOps Engineer',
    'Support Engineer',
    'Intern',
  ];

  const emptyForm = {
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    marital_status: '',
    education: '',
    email: '',
    employee_code: '',
    phone: '',
    address: '',
    department: '',
    designation: '',
    joining_date: '',
    emergency_contact_name: '',
    emergency_contact_relationship: '',
    emergency_contact_phone: '',
    emergency_contact_occupation: '',
    education_level: '',
    institute_name: '',
    year_of_passing: '',
    marks_type: '',
    marks_value: '',
    account_holder_name: '',
    account_number: '',
    confirm_account_number: '',
    bank_name: '',
    ifsc_code: '',
    branch_name: '',
    account_type: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  // ─── React Query ─────────────────────────────────────────────────────────────
  const {
    data: employeesData,
    isLoading: queryLoading,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const allEmployees = [];
      let nextUrl = '/employees/?limit=100';

      while (nextUrl) {
        const response = await api.get(nextUrl);
        const pageEmployees = extractListData(response.data);
        allEmployees.push(...pageEmployees);
        nextUrl = response.data?.next || null;
      }

      return allEmployees;
    },
    onError: (error) => {
      console.error('❌ Error fetching employees:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/';
      }
    },
  });

  const employees = Array.isArray(employeesData) ? employeesData : [];
  const loading = queryLoading;

  useEffect(() => {
    refreshRef.current = refetchEmployees;
  }, [refetchEmployees]);

  const getImageUrl = (employee) => {
    if (employee?.profile_image) {
      if (employee.profile_image.startsWith('http')) return employee.profile_image;
      return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${employee.profile_image}`;
    }
    if (employee?.profile_image_url) {
      if (employee.profile_image_url.startsWith('http')) return employee.profile_image_url;
      return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${employee.profile_image_url}`;
    }
    return null;
  };

  const departments = ['all', ...new Set(employees.map((e) => e.department).filter(Boolean))];
  const designations = ['all', ...new Set(employees.map((e) => e.designation).filter(Boolean))];

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase().trim();
    let matchesSearch = true;
    if (term) {
      const fullName = `${emp.first_name || ''} ${emp.middle_name || ''} ${emp.last_name || ''}`.toLowerCase();
      const employeeId = (emp.employee_id || '').toLowerCase();
      switch (searchBy) {
        case 'id':
          matchesSearch = employeeId.includes(term);
          break;
        case 'name':
          matchesSearch = fullName.includes(term);
          break;
        case 'all':
        default:
          matchesSearch =
            fullName.includes(term) ||
            employeeId.includes(term) ||
            (emp.email || '').toLowerCase().includes(term) ||
            (emp.department || '').toLowerCase().includes(term) ||
            (emp.phone || '').toLowerCase().includes(term);
      }
    }
    const matchesDepartment = selectedDepartment === 'all' || emp.department === selectedDepartment;
    const matchesDesignation = selectedDesignation === 'all' || emp.designation === selectedDesignation;
    return matchesSearch && matchesDepartment && matchesDesignation;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedDesignation, searchBy]);

  // ─── Export ───────────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const exportData = filteredEmployees.map((emp) => ({
      'Employee ID': emp.employee_id,
      Name: `${emp.first_name} ${emp.middle_name || ''} ${emp.last_name}`.trim(),
      Email: emp.email,
      Phone: emp.phone,
      Department: emp.department,
      Designation: emp.designation,
      'Joining Date': emp.joining_date,
      Gender: emp.gender,
      'Marital Status': emp.marital_status,
      Education: emp.education,
      Address: emp.address,
      'Education Level': emp.education_level,
      Institute: emp.institute_name,
      'Year of Passing': emp.year_of_passing,
      Marks: `${emp.marks_value || ''} ${emp.marks_type || ''}`.trim(),
      'Account Holder': emp.account_holder_name,
      'Account Number': emp.account_number,
      'Bank Name': emp.bank_name,
      'IFSC Code': emp.ifsc_code,
      'Branch Name': emp.branch_name,
      'Account Type': emp.account_type,
      'Emergency Contact': emp.emergency_contact_name,
      'Emergency Relationship': emp.emergency_contact_relationship,
      'Emergency Phone': emp.emergency_contact_phone,
      'Emergency Occupation': emp.emergency_contact_occupation,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  const exportEmployeeCodes = () => {
    const data = employees.map((emp, idx) => ({
      'Sr No': idx + 1,
      'Employee Code': emp.employee_id || '',
      'Employee Name': `${emp.first_name || ''} ${emp.middle_name || ''} ${emp.last_name || ''}`.replace(/\s+/g, ' ').trim(),
      'Department': emp.department || '',
      'Designation': emp.designation || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Style the header row width
    ws['!cols'] = [
      { wch: 6 },   // Sr No
      { wch: 18 },  // Employee Code
      { wch: 28 },  // Employee Name
      { wch: 20 },  // Department
      { wch: 20 },  // Designation
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Codes');
    XLSX.writeFile(wb, `employee_codes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ─── Form helpers ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedImage(null);
    setImagePreview(null);
    setCurrentStep(1);
    setEditingEmployee(null);
  };

  // ─── Validation ───────────────────────────────────────────────────────────────
  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.first_name || !formData.last_name || !formData.email || !formData.phone || !formData.department || !formData.designation) {
        alert('Please fill all required fields (First Name, Last Name, Email, Phone, Department, Designation)');
        return false;
      }
      if (!formData.employee_code || !formData.employee_code.trim()) {
        alert('Employee Code is required. It must match the code used in the attendance Excel file.');
        return false;
      }
      if (formData.designation === 'Manager') {
        alert('Manager designation cannot be manually assigned. Use Manager Management module to promote employees.');
        return false;
      }
      if (formData.phone.length < 10) {
        alert('Please enter a valid 10-digit phone number');
        return false;
      }
      if (!formData.email.includes('@')) {
        alert('Please enter a valid email address');
        return false;
      }
      return true;
    }
    if (currentStep === 2) {
      if (!formData.education_level || !formData.institute_name || !formData.year_of_passing || !formData.marks_type || !formData.marks_value) {
        alert('Please fill all education details');
        return false;
      }
      if (formData.marks_type === 'percentage' && (formData.marks_value < 0 || formData.marks_value > 100)) {
        alert('Percentage must be between 0 and 100');
        return false;
      }
      if (formData.marks_type === 'cgpa' && (formData.marks_value < 0 || formData.marks_value > 10)) {
        alert('CGPA must be between 0 and 10');
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      if (!formData.account_holder_name || !formData.account_number || !formData.bank_name || !formData.ifsc_code) {
        alert('Please fill all bank details');
        return false;
      }
      if (formData.account_number !== formData.confirm_account_number) {
        alert('Account numbers do not match');
        return false;
      }
      if (formData.account_number.length < 9 || formData.account_number.length > 18) {
        alert('Account number should be between 9 and 18 digits');
        return false;
      }
      if (formData.ifsc_code.length !== 11) {
        alert('IFSC code should be 11 characters');
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setCurrentStep((s) => s + 1); };
  const prevStep = () => setCurrentStep((s) => s - 1);

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setSubmitLoading(true);
    try {
      const formDataToSend = new FormData();
      const fields = [
        'first_name','middle_name','last_name','gender','marital_status','education',
        'email','employee_code','phone','address','department','designation','joining_date',
        'emergency_contact_name','emergency_contact_relationship','emergency_contact_phone','emergency_contact_occupation',
        'education_level','institute_name','year_of_passing','marks_type','marks_value',
        'account_holder_name','account_number','bank_name','ifsc_code','branch_name','account_type',
      ];
      fields.forEach((key) => formDataToSend.append(key, formData[key] || ''));
      if (selectedImage) formDataToSend.append('profile_image', selectedImage);
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}/`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Employee updated successfully!');
      } else {
        await api.post('/employees/create/', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Employee created successfully! Temporary credentials have been sent to their email.');
      }
      resetForm();
      setShowForm(false);
      setViewingEmployee(null);
      refetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error.response?.data);
      if (error.response?.data?.designation) {
        alert(error.response.data.designation[0]);
      } else {
        alert(error.response?.data?.error || 'Error saving employee. Please try again.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────────
  const handleEdit = (employee) => {
    setViewingEmployee(null);
    setEditingEmployee(employee);
    const formattedDate = employee.joining_date ? employee.joining_date.split('T')[0] : '';
    setFormData({
      first_name: employee.first_name || '',
      middle_name: employee.middle_name || '',
      last_name: employee.last_name || '',
      gender: employee.gender || '',
      marital_status: employee.marital_status || '',
      education: employee.education || '',
      email: employee.email || '',
      employee_code: employee.employee_code || '',
      phone: employee.phone || '',
      address: employee.address || '',
      department: employee.department || '',
      designation: employee.designation || '',
      joining_date: formattedDate,
      emergency_contact_name: employee.emergency_contact_name || '',
      emergency_contact_relationship: employee.emergency_contact_relationship || '',
      emergency_contact_phone: employee.emergency_contact_phone || '',
      emergency_contact_occupation: employee.emergency_contact_occupation || '',
      education_level: employee.education_level || '',
      institute_name: employee.institute_name || '',
      year_of_passing: employee.year_of_passing || '',
      marks_type: employee.marks_type || '',
      marks_value: employee.marks_value || '',
      account_holder_name: employee.account_holder_name || '',
      account_number: employee.account_number || '',
      confirm_account_number: employee.account_number || '',
      bank_name: employee.bank_name || '',
      ifsc_code: employee.ifsc_code || '',
      branch_name: employee.branch_name || '',
      account_type: employee.account_type || '',
    });
    setImagePreview(getImageUrl(employee));
    setShowForm(true);
    setCurrentStep(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}/`);
      setViewingEmployee((current) => (current?.id === id ? null : current));
      refetchEmployees();
      alert('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error deleting employee. Only admin can delete employees.');
    }
  };

  const handleView = (employee) => setViewingEmployee(employee);
  const closeViewModal = () => setViewingEmployee(null);

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      resetForm();
      setShowForm(false);
    }
  };

  // ─── Print ────────────────────────────────────────────────────────────────────
  const printEmployee = (employee) => {
    const printWindow = window.open('', '_blank');
    const imageUrl = getImageUrl(employee);
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>ELOGIXA – Employee Details</title>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Montserrat',Arial,sans-serif; padding:40px; background:white; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #F97316; padding-bottom:20px; margin-bottom:30px; }
          .logo { display:flex; align-items:center; }
          .logo-text { font-size:32px; font-weight:700; color:#0F172A; letter-spacing:-1px; }
          .logo-o { position:relative; display:inline-block; }
          .logo-dot { position:absolute; top:54%; left:50%; transform:translate(-50%,-50%); width:6px; height:6px; background:#F97316; border-radius:50%; z-index:2; }
          .logo-ixa { font-size:32px; font-weight:700; color:#F97316; letter-spacing:-1px; }
          .portal-text { font-size:10px; color:#64748B; letter-spacing:2px; margin-top:4px; text-transform:uppercase; }
          .print-date { text-align:right; font-size:12px; color:#64748B; }
          .profile-image { text-align:center; margin-bottom:24px; }
          .profile-image img { width:120px; height:120px; border-radius:50%; object-fit:cover; border:3px solid #F97316; }
          h1 { color:#0F172A; border-bottom:2px solid #F97316; padding-bottom:10px; margin-bottom:20px; font-size:22px; font-weight:700; }
          .details { margin-top:20px; }
          .row { display:flex; margin-bottom:10px; line-height:1.6; }
          .label { font-weight:600; width:180px; color:#64748B; flex-shrink:0; font-size:13px; }
          .value { color:#0F172A; flex:1; font-size:13px; }
          .section-title { margin-top:28px; margin-bottom:14px; color:#F97316; border-left:4px solid #F97316; padding-left:12px; font-size:16px; font-weight:700; }
          .footer { margin-top:40px; font-size:11px; color:#94A3B8; text-align:center; border-top:1px solid #E2E8F0; padding-top:20px; }
          @media print { body { padding:20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <div>
              <span class="logo-text">EL</span>
              <span class="logo-o"><span class="logo-text">O</span><span class="logo-dot"></span></span>
              <span class="logo-text">G</span>
              <span class="logo-ixa">IXA</span>
              <div class="portal-text">Employee Management System</div>
            </div>
          </div>
          <div class="print-date">Printed: ${new Date().toLocaleDateString()}<br>${new Date().toLocaleTimeString()}</div>
        </div>
        ${imageUrl ? `<div class="profile-image"><img src="${imageUrl}" alt="Profile" onerror="this.style.display='none'" /></div>` : ''}
        <h1>Employee Information</h1>
        <div class="details">
          <div class="row"><span class="label">Employee ID</span><span class="value">${employee.employee_id || '-'}</span></div>
          <div class="row"><span class="label">Full Name</span><span class="value">${employee.first_name || ''} ${employee.middle_name || ''} ${employee.last_name || ''}</span></div>
          <div class="row"><span class="label">Gender</span><span class="value">${employee.gender || '-'}</span></div>
          <div class="row"><span class="label">Marital Status</span><span class="value">${employee.marital_status || '-'}</span></div>
          <div class="row"><span class="label">Email</span><span class="value">${employee.email || '-'}</span></div>
          <div class="row"><span class="label">Phone</span><span class="value">${employee.phone || '-'}</span></div>
          <div class="row"><span class="label">Address</span><span class="value">${employee.address || '-'}</span></div>
          <div class="row"><span class="label">Department</span><span class="value">${employee.department || '-'}</span></div>
          <div class="row"><span class="label">Designation</span><span class="value">${employee.designation || '-'}</span></div>
          <div class="row"><span class="label">Joining Date</span><span class="value">${employee.joining_date || '-'}</span></div>
        </div>
        ${employee.education_level ? `
        <div class="section-title">Education Details</div>
        <div class="details">
          <div class="row"><span class="label">Education Level</span><span class="value">${employee.education_level || '-'}</span></div>
          <div class="row"><span class="label">Institute Name</span><span class="value">${employee.institute_name || '-'}</span></div>
          <div class="row"><span class="label">Year of Passing</span><span class="value">${employee.year_of_passing || '-'}</span></div>
          <div class="row"><span class="label">Marks</span><span class="value">${employee.marks_value || '-'} ${employee.marks_type || ''}</span></div>
        </div>` : ''}
        ${employee.account_holder_name ? `
        <div class="section-title">Bank Details</div>
        <div class="details">
          <div class="row"><span class="label">Account Holder</span><span class="value">${employee.account_holder_name || '-'}</span></div>
          <div class="row"><span class="label">Account Number</span><span class="value">${employee.account_number || '-'}</span></div>
          <div class="row"><span class="label">Bank Name</span><span class="value">${employee.bank_name || '-'}</span></div>
          <div class="row"><span class="label">IFSC Code</span><span class="value">${employee.ifsc_code || '-'}</span></div>
          <div class="row"><span class="label">Branch Name</span><span class="value">${employee.branch_name || '-'}</span></div>
          <div class="row"><span class="label">Account Type</span><span class="value">${employee.account_type || '-'}</span></div>
        </div>` : ''}
        ${employee.emergency_contact_name ? `
        <div class="section-title">Emergency Contact</div>
        <div class="details">
          <div class="row"><span class="label">Contact Name</span><span class="value">${employee.emergency_contact_name || '-'}</span></div>
          <div class="row"><span class="label">Relationship</span><span class="value">${employee.emergency_contact_relationship || '-'}</span></div>
          <div class="row"><span class="label">Phone Number</span><span class="value">${employee.emergency_contact_phone || '-'}</span></div>
          <div class="row"><span class="label">Occupation</span><span class="value">${employee.emergency_contact_occupation || '-'}</span></div>
        </div>` : ''}
        <div class="footer">This is a system-generated document from ELOGIXA Employee Management System</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  // ─── Shared Styles ────────────────────────────────────────────────────────────
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

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
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

  // ─── Step Indicator ───────────────────────────────────────────────────────────
  const ModernStepIndicator = () => {
    const steps = [
      { num: 1, icon: '👤', label: 'Personal' },
      { num: 2, icon: '🎓', label: 'Education' },
      { num: 3, icon: '🏦', label: 'Banking' },
    ];
    return (
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Connector line */}
          <div style={{ position: 'absolute', top: '22px', left: '15%', right: '15%', height: '2px', backgroundColor: '#E2E8F0', zIndex: 0 }} />
          <div style={{
            position: 'absolute', top: '22px', left: '15%',
            width: `${((currentStep - 1) / 2) * 70}%`,
            height: '2px', backgroundColor: '#F97316', zIndex: 0,
            transition: 'width 0.4s ease',
          }} />

          {steps.map((step) => {
            const active = currentStep >= step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div key={step.num} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  backgroundColor: active ? '#F97316' : '#F8FAFC',
                  border: `2px solid ${active ? '#F97316' : '#E2E8F0'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', fontSize: '18px',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(249,115,22,0.15)' : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {step.icon}
                </div>
                <div style={{
                  marginTop: '10px', fontSize: '12px', fontWeight: '600',
                  color: active ? '#F97316' : '#94A3B8',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  transition: 'color 0.3s',
                }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Form Section Wrapper ─────────────────────────────────────────────────────
  // ─── Step 1: Personal Info ────────────────────────────────────────────────────
  const renderPersonalInfo = () => (
    <>
      {/* Profile photo */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" style={{
                width: '110px', height: '110px', borderRadius: '50%',
                objectFit: 'cover', border: '3px solid #F97316',
                boxShadow: '0 4px 14px rgba(249,115,22,0.25)',
              }} />
              <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                style={{
                  position: 'absolute', bottom: '2px', right: '2px',
                  backgroundColor: '#EF4444', color: 'white', border: '2px solid white',
                  borderRadius: '50%', width: '28px', height: '28px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '16px', lineHeight: 1,
                }}>×</button>
            </>
          ) : (
            <div onClick={() => document.getElementById('profileImageInput').click()}
              style={{
                width: '110px', height: '110px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #FED7AA 0%, #F97316 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', cursor: 'pointer',
                border: '3px dashed #FB923C',
                boxShadow: '0 4px 14px rgba(249,115,22,0.15)',
                transition: 'opacity 0.2s',
              }}>
              <span style={{ fontSize: '40px' }}>📷</span>
            </div>
          )}
          <input id="profileImageInput" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
        </div>
        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '10px', fontWeight: '500' }}>Click to upload profile photo</p>
      </div>

      <FormSection title="Basic Information" icon="👤">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>First Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="First name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Middle Name</label>
            <input type="text" name="middle_name" value={formData.middle_name} onChange={handleInputChange} placeholder="Middle name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="Last name" style={inputStyle} />
          </div>
        </div>
        {/* Employee Code — must match attendance Excel */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Employee Code <span style={{ color: '#EF4444' }}>*</span>
            <span style={{ marginLeft: 6, fontSize: 10, color: '#94A3B8', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
              (Must match the code in attendance Excel file)
            </span>
          </label>
          <input
            type="text"
            name="employee_code"
            value={formData.employee_code}
            onChange={handleInputChange}
            required
            placeholder="e.g. Intern 44, EMP001, EXEC01"
            style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.5px' }}
          />
        </div>

        {/* Name fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>First Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="First name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Middle Name</label>
            <input type="text" name="middle_name" value={formData.middle_name} onChange={handleInputChange} placeholder="Middle name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="Last name" style={inputStyle} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Personal Details" icon="📋">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Gender <span style={{ color: '#EF4444' }}>*</span></label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} required style={selectStyle}>
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Marital Status <span style={{ color: '#EF4444' }}>*</span></label>
            <select name="marital_status" value={formData.marital_status} onChange={handleInputChange} required style={selectStyle}>
              <option value="">Select Status</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="DIVORCED">Divorced</option>
              <option value="WIDOWED">Widowed</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Highest Qualification <span style={{ color: '#EF4444' }}>*</span></label>
            <select name="education" value={formData.education} onChange={handleInputChange} required style={selectStyle}>
              <option value="">Select</option>
              <option value="HIGH_SCHOOL">High School</option>
              <option value="DIPLOMA">Diploma</option>
              <option value="BACHELORS">Bachelor's Degree</option>
              <option value="MASTERS">Master's Degree</option>
              <option value="PHD">PhD</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Contact Information" icon="📞">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Email Address <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="employee@company.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone Number <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="10-digit number" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Full Address <span style={{ color: '#EF4444' }}>*</span></label>
          <textarea name="address" value={formData.address} onChange={handleInputChange} required rows={3} style={textareaStyle} placeholder="Street, City, State, ZIP" />
        </div>
      </FormSection>

      <FormSection title="Employment Information" icon="💼">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>Department <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="text" name="department" value={formData.department} onChange={handleInputChange} required placeholder="e.g., Engineering, HR" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Designation <span style={{ color: '#EF4444' }}>*</span></label>
            <select name="designation" value={formData.designation} onChange={handleInputChange} required style={selectStyle} disabled={editingEmployee?.role === 'MANAGER'}>
              <option value="">Select Designation</option>
              {designationOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {editingEmployee?.role === 'MANAGER' && (
              <div style={{ fontSize: '12px', color: '#F97316', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ℹ️ Manager designation cannot be changed here.
              </div>
            )}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Joining Date <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} required style={{ ...inputStyle, maxWidth: '240px' }} />
        </div>
      </FormSection>

      <FormSection title="Emergency Contact" icon="🚨">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Contact Name</label>
            <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Relationship</label>
            <input type="text" name="emergency_contact_relationship" value={formData.emergency_contact_relationship} onChange={handleInputChange} placeholder="e.g., Spouse, Parent" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleInputChange} placeholder="10-digit number" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Occupation</label>
            <input type="text" name="emergency_contact_occupation" value={formData.emergency_contact_occupation} onChange={handleInputChange} placeholder="Occupation" style={inputStyle} />
          </div>
        </div>
      </FormSection>
    </>
  );

  // ─── Step 2: Education ────────────────────────────────────────────────────────
  const renderEducationDetails = () => (
    <FormSection title="Education Details" icon="🎓">
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Education Level <span style={{ color: '#EF4444' }}>*</span></label>
        <select name="education_level" value={formData.education_level} onChange={handleInputChange} required style={selectStyle}>
          <option value="">Select Education Level</option>
          <option value="HIGH_SCHOOL">High School (10th)</option>
          <option value="HIGHER_SECONDARY">Higher Secondary (12th)</option>
          <option value="DIPLOMA">Diploma</option>
          <option value="BACHELORS">Bachelor's Degree</option>
          <option value="MASTERS">Master's Degree</option>
          <option value="PHD">PhD</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Institute / University Name <span style={{ color: '#EF4444' }}>*</span></label>
        <input type="text" name="institute_name" value={formData.institute_name} onChange={handleInputChange} required placeholder="e.g., Mumbai University, IIT Bombay" style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Year of Passing <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="number" name="year_of_passing" value={formData.year_of_passing} onChange={handleInputChange} required min="1950" max={new Date().getFullYear()} placeholder="YYYY" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Marks Type <span style={{ color: '#EF4444' }}>*</span></label>
          <select name="marks_type" value={formData.marks_type} onChange={handleInputChange} required style={selectStyle}>
            <option value="">Select Type</option>
            <option value="percentage">Percentage (%)</option>
            <option value="cgpa">CGPA (out of 10)</option>
            <option value="gpa">GPA (out of 4)</option>
            <option value="grade">Grade (A, B, C…)</option>
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>
          {formData.marks_type === 'percentage' ? 'Percentage' :
           formData.marks_type === 'cgpa' ? 'CGPA' :
           formData.marks_type === 'gpa' ? 'GPA' : 'Grade'} <span style={{ color: '#EF4444' }}>*</span>
        </label>
        <input
          type={formData.marks_type === 'grade' ? 'text' : 'number'}
          name="marks_value"
          value={formData.marks_value}
          onChange={handleInputChange}
          required
          step={formData.marks_type !== 'grade' ? '0.01' : undefined}
          min={['percentage', 'cgpa', 'gpa'].includes(formData.marks_type) ? '0' : undefined}
          max={formData.marks_type === 'percentage' ? '100' : formData.marks_type === 'cgpa' ? '10' : formData.marks_type === 'gpa' ? '4' : undefined}
          placeholder={
            formData.marks_type === 'percentage' ? 'e.g., 85' :
            formData.marks_type === 'cgpa' ? 'e.g., 8.5' :
            formData.marks_type === 'gpa' ? 'e.g., 3.5' : 'e.g., A+'
          }
          style={{ ...inputStyle, maxWidth: '240px' }}
        />
      </div>
    </FormSection>
  );

  // ─── Step 3: Bank Details ─────────────────────────────────────────────────────
  const renderBankDetails = () => (
    <FormSection title="Bank Account Details" icon="🏦">
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Account Holder Name <span style={{ color: '#EF4444' }}>*</span></label>
        <input type="text" name="account_holder_name" value={formData.account_holder_name} onChange={handleInputChange} required placeholder="As per bank records" style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Account Number <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="text" name="account_number" value={formData.account_number} onChange={handleInputChange} required placeholder="Enter account number" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Confirm Account Number <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="text" name="confirm_account_number" value={formData.confirm_account_number} onChange={handleInputChange} required placeholder="Re-enter account number" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>Bank Name <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="text" name="bank_name" value={formData.bank_name} onChange={handleInputChange} required placeholder="e.g., State Bank of India" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>IFSC Code <span style={{ color: '#EF4444' }}>*</span></label>
          <input type="text" name="ifsc_code" value={formData.ifsc_code} onChange={handleInputChange} required placeholder="e.g., SBIN0001234" maxLength="11" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Branch Name</label>
          <input type="text" name="branch_name" value={formData.branch_name} onChange={handleInputChange} placeholder="Branch location" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Account Type <span style={{ color: '#EF4444' }}>*</span></label>
          <select name="account_type" value={formData.account_type} onChange={handleInputChange} required style={selectStyle}>
            <option value="">Select Account Type</option>
            <option value="SAVINGS">Savings Account</option>
            <option value="CURRENT">Current Account</option>
          </select>
        </div>
      </div>
    </FormSection>
  );

  // ─── Info Row for View Modal ──────────────────────────────────────────────────
  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '10px', alignItems: 'start' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: '1px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '500' }}>{value || '—'}</span>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px' }}>

      {/* Back button */}
      {fromManagerMgmt && (
        <button onClick={handleBackToManagerMgmt}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '9px 18px', backgroundColor: '#FFF7ED',
            border: '1.5px solid #FED7AA', borderRadius: '10px',
            color: '#EA580C', fontSize: '13px', fontWeight: '700',
            cursor: 'pointer', marginBottom: '24px',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFEDD5'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF7ED'; e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          ← Back to Manager Management
        </button>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>👥</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Employee Management
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            Manage your organisation's workforce efficiently
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => setShowForm(true)}
            style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              color: 'white', border: 'none', padding: '11px 22px',
              borderRadius: '10px', fontSize: '14px', fontWeight: '700',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(249,115,22,0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.3)'; }}
          >
            <span style={{ fontSize: '17px', fontWeight: '400' }}>+</span> Add Employee
          </button>
          <button onClick={exportToExcel}
            style={{
              backgroundColor: '#16A34A', color: 'white', border: 'none',
              padding: '11px 22px', borderRadius: '10px', fontSize: '14px',
              fontWeight: '700', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '7px',
              boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(22,163,74,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(22,163,74,0.25)'; }}
          >
            📊 Export to Excel
          </button>
          <button onClick={exportEmployeeCodes}
            style={{
              backgroundColor: '#2563EB', color: 'white', border: 'none',
              padding: '11px 22px', borderRadius: '10px', fontSize: '14px',
              fontWeight: '700', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '7px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.25)'; }}
          >
            🧾 Export Codes
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {[
          { label: 'Total Employees', value: loading ? '…' : employees.length, sub: 'Active Workforce', gradient: 'linear-gradient(135deg, #F97316, #EA580C)', shadow: 'rgba(249,115,22,0.25)' },
          { label: 'Departments', value: departments.length - 1, sub: 'Across Organisation', gradient: 'linear-gradient(135deg, #16A34A, #15803D)', shadow: 'rgba(22,163,74,0.25)' },
          { label: 'Filtered Results', value: filteredEmployees.length, sub: 'Matching Criteria', gradient: 'linear-gradient(135deg, #FB923C, #F97316)', shadow: 'rgba(249,115,22,0.2)' },
        ].map((card) => (
          <div key={card.label} style={{
            background: card.gradient, padding: '22px 24px', borderRadius: '16px',
            color: 'white', boxShadow: `0 6px 20px ${card.shadow}`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circle */}
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

      {/* Filters */}
      <div style={{
        backgroundColor: 'white', padding: '20px 24px', borderRadius: '14px',
        marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1.5px solid #F1F5F9',
      }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          🔍 Search &amp; Filter
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Search By</label>
            <select value={searchBy} onChange={(e) => setSearchBy(e.target.value)} style={selectStyle}>
              <option value="all">All Fields</option>
              <option value="id">Employee ID</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Keyword</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search employees…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(''); setSearchBy('all'); }}
                  style={{
                    padding: '10px 14px', backgroundColor: '#F1F5F9', color: '#475569',
                    border: '1.5px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
                  }}>
                  ✕
                </button>
              )}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Department</label>
            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={selectStyle}>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Designation</label>
            <select value={selectedDesignation} onChange={(e) => setSelectedDesignation(e.target.value)} style={selectStyle}>
              {designations.map((desig) => (
                <option key={desig} value={desig}>{desig === 'all' ? 'All Designations' : desig}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div style={{
        backgroundColor: 'white', borderRadius: '14px',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1.5px solid #F1F5F9',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Employee Directory</span>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
            {loading ? 'Loading…' : `${filteredEmployees.length} record${filteredEmployees.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {['Photo', 'Employee ID', 'Full Name', 'Role', 'Department', 'Designation', 'Phone', 'Joining Date'].map((h) => (
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
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '32px' }}>⏳</span>
                    Loading employees…
                  </div>
                </td></tr>
              ) : currentEmployees.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '36px' }}>🔍</span>
                    {employees.length === 0 ? 'No employees found.' : 'No matching employees found.'}
                  </div>
                </td></tr>
              ) : (
                currentEmployees.map((employee, idx) => {
                  const imageUrl = getImageUrl(employee);
                  return (
                    <tr key={employee.id} onClick={() => handleView(employee)}
                      style={{
                        borderBottom: '1px solid #F8FAFC', cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={employee.first_name}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FED7AA' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div style="width:38px;height:38px;border-radius:50%;background:#FFF7ED;border:2px solid #FED7AA;display:flex;align-items:center;justify-content:center;font-size:18px">👤</div>';
                            }}
                          />
                        ) : (
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#FFF7ED', border: '2px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#F97316', fontFamily: 'monospace' }}>{employee.employee_id}</span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                        {employee.first_name} {employee.middle_name} {employee.last_name}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                          textTransform: 'uppercase', letterSpacing: '0.4px',
                          backgroundColor: employee.role === 'MANAGER' ? '#DBEAFE' : employee.role === 'ADMIN' ? '#FCE7F3' : '#F0FDF4',
                          color: employee.role === 'MANAGER' ? '#1D4ED8' : employee.role === 'ADMIN' ? '#BE185D' : '#15803D',
                        }}>
                          {employee.role || 'Employee'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          backgroundColor: '#FFF7ED', color: '#EA580C',
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '12px', fontWeight: '600',
                          border: '1px solid #FED7AA',
                        }}>
                          {employee.department}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                        {employee.role === 'MANAGER' ? (
                          <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: '#F0FDF4', color: '#15803D', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', border: '1px solid #BBF7D0' }}>Manager</span>
                        ) : employee.designation}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{employee.phone}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#64748B' }}>{employee.joining_date}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Result count */}
        {!loading && filteredEmployees.length > 0 && (
          <div style={{
            padding: '16px 24px', borderTop: '1.5px solid #F1F5F9',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            backgroundColor: '#FAFAFA',
          }}>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
              Showing <strong>{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredEmployees.length)}</strong> of <strong>{filteredEmployees.length}</strong> employees
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0',
                    backgroundColor: currentPage === 1 ? '#F8FAFC' : '#FFFFFF',
                    color: currentPage === 1 ? '#94A3B8' : '#475569',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 700,
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 700 }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #E2E8F0',
                    backgroundColor: currentPage === totalPages ? '#F8FAFC' : '#FFFFFF',
                    color: currentPage === totalPages ? '#94A3B8' : '#475569',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700,
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            width: '90%', maxWidth: '760px', maxHeight: '92vh',
            overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s ease',
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              padding: '22px 28px', color: 'white',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 3px 0', letterSpacing: '-0.3px' }}>
                    {editingEmployee ? '✏️ Edit Employee' : '✨ Add New Employee'}
                  </h2>
                  <p style={{ fontSize: '13px', opacity: 0.85, margin: 0, fontWeight: '500' }}>
                    {editingEmployee ? 'Update employee information below' : 'Fill in the details to add a new team member'}
                  </p>
                </div>
                <button onClick={handleCancel}
                  style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                    fontSize: '22px', cursor: 'pointer', width: '36px', height: '36px',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                >×</button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px', maxHeight: 'calc(92vh - 170px)', overflowY: 'auto' }}>
              <ModernStepIndicator />
              <form onSubmit={handleSubmit}>
                {currentStep === 1 && renderPersonalInfo()}
                {currentStep === 2 && renderEducationDetails()}
                {currentStep === 3 && renderBankDetails()}

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '28px', paddingTop: '20px', borderTop: '1.5px solid #F1F5F9' }}>
                  <div>
                    {currentStep > 1 && (
                      <button type="button" onClick={prevStep}
                        style={{
                          padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                          border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px',
                          fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                      >
                        ← Previous
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={handleCancel}
                      style={{
                        padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569',
                        border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px',
                        fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    >
                      Cancel
                    </button>
                    {currentStep < 3 ? (
                      <button type="button" onClick={nextStep}
                        style={{
                          padding: '10px 24px',
                          background: 'linear-gradient(135deg, #F97316, #EA580C)',
                          color: 'white', border: 'none', borderRadius: '10px',
                          fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(249,115,22,0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.3)'; }}
                      >
                        Continue →
                      </button>
                    ) : (
                      <button type="submit" disabled={submitLoading}
                        style={{
                          padding: '10px 28px',
                          background: submitLoading ? '#CBD5E1' : 'linear-gradient(135deg, #16A34A, #15803D)',
                          color: 'white', border: 'none', borderRadius: '10px',
                          fontSize: '14px', fontWeight: '700',
                          cursor: submitLoading ? 'not-allowed' : 'pointer',
                          boxShadow: submitLoading ? 'none' : '0 4px 12px rgba(22,163,74,0.3)',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => !submitLoading && (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => !submitLoading && (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {submitLoading ? '⏳ Saving…' : editingEmployee ? '✓ Update Employee' : '✓ Create Employee'}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── View Employee Modal ───────────────────────────────────────────────── */}
      {viewingEmployee && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', padding: '0',
            width: '90%', maxWidth: '620px', maxHeight: '92vh',
            overflowY: 'auto', animation: 'slideUp 0.3s ease',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          }}>
            {/* Profile Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              padding: '32px 28px 60px',
              textAlign: 'center', position: 'relative',
            }}>
              <button onClick={closeViewModal}
                style={{
                  position: 'absolute', top: '14px', right: '14px',
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                  fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >×</button>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Employee Profile</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>
                {viewingEmployee.first_name} {viewingEmployee.middle_name || ''} {viewingEmployee.last_name}
              </div>
            </div>

            {/* Avatar */}
            <div style={{ textAlign: 'center', marginTop: '-44px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
              {getImageUrl(viewingEmployee) ? (
                <img src={getImageUrl(viewingEmployee)} alt="Profile"
                  style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,#F97316,#EA580C);display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:38px;border:4px solid white;box-shadow:0 4px 16px rgba(0,0,0,0.15)">👤</div>';
                  }}
                />
              ) : (
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '38px', border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>👤</div>
              )}
              <div style={{ marginTop: '10px' }}>
                <span style={{
                  padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  backgroundColor: viewingEmployee.role === 'MANAGER' ? '#DBEAFE' : viewingEmployee.role === 'ADMIN' ? '#FCE7F3' : '#F0FDF4',
                  color: viewingEmployee.role === 'MANAGER' ? '#1D4ED8' : viewingEmployee.role === 'ADMIN' ? '#BE185D' : '#15803D',
                }}>
                  {viewingEmployee.role || 'Employee'}
                </span>
              </div>
            </div>

            <div style={{ padding: '0 28px 28px' }}>
              {/* Personal Info */}
              <div style={{ marginBottom: '20px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋</span> Personal Information
                </div>
                {[
                  ['Employee ID', viewingEmployee.employee_id],
                  ['Gender', viewingEmployee.gender],
                  ['Marital Status', viewingEmployee.marital_status],
                  ['Qualification', viewingEmployee.education],
                  ['Email', viewingEmployee.email],
                  ['Phone', viewingEmployee.phone],
                  ['Address', viewingEmployee.address],
                  ['Department', viewingEmployee.department],
                  ['Designation', viewingEmployee.designation],
                  ['Joining Date', viewingEmployee.joining_date],
                ].map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
              </div>

              {/* Education */}
              {viewingEmployee.education_level && (
                <div style={{ marginBottom: '20px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎓</span> Education Details
                  </div>
                  {[
                    ['Education Level', viewingEmployee.education_level],
                    ['Institute Name', viewingEmployee.institute_name],
                    ['Year of Passing', viewingEmployee.year_of_passing],
                    ['Marks', `${viewingEmployee.marks_value || '—'} ${viewingEmployee.marks_type || ''}`],
                  ].map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
                </div>
              )}

              {/* Bank */}
              {viewingEmployee.account_holder_name && (
                <div style={{ marginBottom: '20px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🏦</span> Bank Details
                  </div>
                  {[
                    ['Account Holder', viewingEmployee.account_holder_name],
                    ['Account Number', viewingEmployee.account_number],
                    ['Bank Name', viewingEmployee.bank_name],
                    ['IFSC Code', viewingEmployee.ifsc_code],
                    ['Branch Name', viewingEmployee.branch_name],
                    ['Account Type', viewingEmployee.account_type],
                  ].map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
                </div>
              )}

              {/* Emergency Contact */}
              {(viewingEmployee.emergency_contact_name || viewingEmployee.emergency_contact_phone) && (
                <div style={{ marginBottom: '20px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🚨</span> Emergency Contact
                  </div>
                  {[
                    ['Contact Name', viewingEmployee.emergency_contact_name],
                    ['Relationship', viewingEmployee.emergency_contact_relationship],
                    ['Phone Number', viewingEmployee.emergency_contact_phone],
                    ['Occupation', viewingEmployee.emergency_contact_occupation],
                  ].map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '8px' }}>
                <button onClick={() => handleEdit(viewingEmployee)}
                  style={{
                    padding: '10px 22px', background: 'linear-gradient(135deg,#F97316,#EA580C)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 4px 12px rgba(249,115,22,0.25)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >✏️ Edit</button>

                <button onClick={() => handleDelete(viewingEmployee.id)}
                  style={{
                    padding: '10px 22px', backgroundColor: '#FEF2F2',
                    color: '#DC2626', border: '1.5px solid #FECACA',
                    borderRadius: '10px', cursor: 'pointer', fontWeight: '700',
                    fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                >🗑️ Delete</button>

                <button onClick={() => printEmployee(viewingEmployee)}
                  style={{
                    padding: '10px 22px', backgroundColor: '#F0FDF4',
                    color: '#16A34A', border: '1.5px solid #BBF7D0',
                    borderRadius: '10px', cursor: 'pointer', fontWeight: '700',
                    fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DCFCE7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F0FDF4'}
                >🖨️ Print</button>

                <button onClick={closeViewModal}
                  style={{
                    padding: '10px 22px', backgroundColor: '#F8FAFC',
                    color: '#475569', border: '1.5px solid #E2E8F0',
                    borderRadius: '10px', cursor: 'pointer', fontWeight: '700',
                    fontSize: '13px', transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                >Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
          outline: none !important;
        }
      `}</style>
    </div>
  );
};

export default Employees;
