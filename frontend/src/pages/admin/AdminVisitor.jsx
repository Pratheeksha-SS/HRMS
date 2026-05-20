import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { extractListData } from '../../utils/extractListData';
import {
  Search, X, Plus, Eye, Trash2, Edit2, RefreshCw,
  Users, UserCheck, Briefcase, GraduationCap, Building2,
  Phone, Mail, Calendar, AlertCircle, Download, Printer,
  ChevronRight, Filter
} from 'lucide-react';

/* ─── Design Tokens (mirrors ManagerManagement.jsx palette) ───────────────────
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

const AdminVisitor = ({ user }) => {
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  const [formData, setFormData] = useState({
    visitor_type: 'GUEST',
    full_name: '',
    email: '',
    phone_number: '',
    purpose: '',
    department: '',
    date_of_visiting: '',
    organization: '',
    id_proof_type: '',
    id_proof_number: '',
    duration_months: '',
    joining_date: '',
    ending_date: '',
    college_name: '',
    course_name: '',
    current_semester: '',
    mentor_name: '',
    notes: ''
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchVisitors(); }, []);
  useEffect(() => { filterVisitors(); }, [searchTerm, filterType, visitors]);

  // ─── Data Fetching ────────────────────────────────────────────────────────
  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const visitorList = extractListData(response.data);
      setVisitors(visitorList);
      setFilteredVisitors(visitorList);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      showToast('Failed to load visitors. Check backend server.', 'error');
      setVisitors([]);
      setFilteredVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterVisitors = () => {
    let filtered = Array.isArray(visitors) ? visitors : [];
    if (filterType !== 'all') {
      filtered = filtered.filter(v => v.visitor_type === filterType);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(v =>
        v.full_name?.toLowerCase().includes(term) ||
        v.phone_number?.includes(term) ||
        v.visitor_id?.toLowerCase().includes(term) ||
        v.email?.toLowerCase().includes(term)
      );
    }
    setFilteredVisitors(filtered);
  };

  // ─── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Export / Print ───────────────────────────────────────────────────────
  const exportToExcel = () => {
    const data = filteredVisitors.map(v => ({
      'Visitor ID': v.visitor_id,
      'Full Name': v.full_name,
      'Email': v.email,
      'Phone': v.phone_number,
      'Type': v.visitor_type,
      'Organization': v.organization,
      'Department': v.department,
      'Visit Date': v.date_of_visiting,
      'Purpose': v.purpose,
      'Notes': v.notes
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visitors');
    XLSX.writeFile(wb, 'visitors.xlsx');
  };

  const printVisitors = () => {
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>Visitors</title><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body>');
    w.document.write('<h1>Visitor List</h1><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Type</th><th>Org</th><th>Dept</th><th>Date</th></tr></thead><tbody>');
    filteredVisitors.forEach(v => {
      w.document.write(`<tr><td>${v.visitor_id}</td><td>${v.full_name}</td><td>${v.email}</td><td>${v.phone_number}</td><td>${v.visitor_type}</td><td>${v.organization}</td><td>${v.department}</td><td>${v.date_of_visiting}</td></tr>`);
    });
    w.document.write('</tbody></table></body></html>');
    w.document.close(); w.print();
  };

  const printIndividual = () => {
    const v = selectedVisitor;
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>Visitor Details</title><style>body{font-family:Arial,sans-serif}p{margin:6px 0}</style></head><body>');
    w.document.write('<h1>Visitor Details</h1>');
    w.document.write(`<p><strong>ID:</strong> ${v.visitor_id}</p><p><strong>Name:</strong> ${v.full_name}</p><p><strong>Email:</strong> ${v.email}</p><p><strong>Phone:</strong> ${v.phone_number}</p><p><strong>Type:</strong> ${v.visitor_type}</p><p><strong>Organization:</strong> ${v.organization}</p><p><strong>Department:</strong> ${v.department}</p><p><strong>Visit Date:</strong> ${v.date_of_visiting}</p><p><strong>Purpose:</strong> ${v.purpose}</p>`);
    if (v.notes) w.document.write(`<p><strong>Notes:</strong> ${v.notes}</p>`);
    w.document.write('</body></html>');
    w.document.close(); w.print();
  };

  // ─── Form Handlers ────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const fd = new FormData();
      Object.keys(formData).forEach(k => { if (formData[k]) fd.append(k, formData[k]); });
      if (selectedImage) fd.append('photo', selectedImage);
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      showToast('Visitor created successfully! 🎉', 'success');
      setShowForm(false);
      resetForm();
      fetchVisitors();
    } catch (error) {
      console.error('Error creating visitor:', error);
      showToast(error.response?.data?.message || 'Failed to create visitor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (visitor) => {
    setEditingVisitor(visitor);
    setFormData({
      visitor_type: visitor.visitor_type,
      full_name: visitor.full_name || '',
      email: visitor.email || '',
      phone_number: visitor.phone_number || '',
      purpose: visitor.purpose || '',
      department: visitor.department || '',
      date_of_visiting: visitor.date_of_visiting || '',
      organization: visitor.organization || '',
      id_proof_type: visitor.id_proof_type || '',
      id_proof_number: visitor.id_proof_number || '',
      duration_months: visitor.duration_months || '',
      joining_date: visitor.joining_date || '',
      ending_date: visitor.ending_date || '',
      college_name: visitor.college_name || '',
      course_name: visitor.course_name || '',
      current_semester: visitor.current_semester || '',
      mentor_name: visitor.mentor_name || '',
      notes: visitor.notes || ''
    });
    setCurrentImageUrl(visitor.photo || null);
    setImagePreview(visitor.photo || null);
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const fd = new FormData();
      Object.keys(formData).forEach(k => { if (formData[k]) fd.append(k, formData[k]); });
      if (selectedImage) fd.append('photo', selectedImage);
      await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/${editingVisitor.id}/`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      showToast('Visitor updated successfully!', 'success');
      setShowEditForm(false);
      resetForm();
      fetchVisitors();
    } catch (error) {
      console.error('Error updating visitor:', error);
      showToast(error.response?.data?.message || 'Failed to update visitor', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this visitor?')) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Visitor deleted successfully.', 'success');
      setSelectedVisitor(null);
      fetchVisitors();
    } catch (error) {
      console.error('Error deleting visitor:', error);
      showToast('Failed to delete visitor', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      visitor_type: 'GUEST', full_name: '', email: '', phone_number: '',
      purpose: '', department: '', date_of_visiting: '', organization: '',
      id_proof_type: '', id_proof_number: '', duration_months: '',
      joining_date: '', ending_date: '', college_name: '', course_name: '',
      current_semester: '', mentor_name: '', notes: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
    setCurrentImageUrl(null);
    setEditingVisitor(null);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const VISITOR_CONFIG = {
    GUEST:     { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA', icon: '👤', label: 'Guest',     gradient: 'linear-gradient(135deg,#F97316,#EA580C)', shadow: 'rgba(249,115,22,0.25)' },
    INTERN:    { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', icon: '🎓', label: 'Intern',    gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', shadow: 'rgba(59,130,246,0.25)' },
    CANDIDATE: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', icon: '💼', label: 'Candidate', gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', shadow: 'rgba(139,92,246,0.25)' },
  };

  const cfg = (type) => VISITOR_CONFIG[type] || { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0', icon: '👥', label: type, gradient: 'linear-gradient(135deg,#64748B,#475569)', shadow: 'rgba(100,116,139,0.25)' };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const stats = {
    total:     visitors.length,
    guests:    visitors.filter(v => v.visitor_type === 'GUEST').length,
    interns:   visitors.filter(v => v.visitor_type === 'INTERN').length,
    candidates:visitors.filter(v => v.visitor_type === 'CANDIDATE').length,
  };

  // ─── Shared Style Helpers ─────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #E2E8F0',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
    outline: 'none', color: '#0F172A', backgroundColor: '#fff',
    fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const selectStyle = {
    ...inputStyle, cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px',
  };

  const labelStyle = {
    display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600',
    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  const spinnerStyle = {
    display: 'inline-block', width: '14px', height: '14px',
    border: '2px solid rgba(255,255,255,0.35)', borderTopColor: 'white',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0,
  };

  const AvatarCircle = ({ name, photo, type, size = 38, fontSize = 14 }) => {
    const c = cfg(type);
    if (photo) return <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: c.gradient, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', fontSize, flexShrink: 0,
      }}>
        {name?.charAt(0).toUpperCase()}
      </div>
    );
  };

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px', marginBottom: '10px', alignItems: 'start' }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', paddingTop: '1px' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '500' }}>{value || '—'}</span>
    </div>
  );

  // ─── Form Fields ──────────────────────────────────────────────────────────
  const renderFormFields = () => {
    const { visitor_type } = formData;
    return (
      <>
        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Visitor Type</label>
          <select name="visitor_type" value={formData.visitor_type} onChange={handleInputChange} required style={selectStyle}>
            <option value="GUEST">Guest</option>
            <option value="INTERN">Intern</option>
            <option value="CANDIDATE">Interview Candidate</option>
          </select>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Photo</label>
          {imagePreview && (
            <div style={{ marginBottom: '10px' }}>
              <img src={imagePreview} alt="Preview" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FED7AA', boxShadow: '0 2px 8px rgba(249,115,22,0.2)' }} />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange}
            required={!imagePreview && !currentImageUrl}
            style={{ ...inputStyle, padding: '8px', cursor: 'pointer' }} />
          <small style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>JPG, PNG, GIF accepted</small>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Full Name *</label>
          <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required style={inputStyle} placeholder="Enter full name" />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} style={inputStyle} placeholder="email@example.com" />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Phone Number *</label>
          <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required style={inputStyle} placeholder="10-digit number" />
        </div>

        {(visitor_type === 'GUEST') && (
          <>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Date of Visit *</label>
              <input type="date" name="date_of_visiting" value={formData.date_of_visiting} onChange={handleInputChange} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Purpose of Visit</label>
              <select name="purpose" value={formData.purpose} onChange={handleInputChange} style={selectStyle}>
                <option value="">Select Purpose</option>
                <option value="MEETING">Meeting</option>
                <option value="DELIVERY">Delivery</option>
                <option value="SERVICE">Service</option>
                <option value="INTERVIEW">Interview</option>
                <option value="TRAINING">Training</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Department to Visit</label>
              <input type="text" name="department" value={formData.department} onChange={handleInputChange} style={inputStyle} placeholder="e.g., IT, HR, Sales" />
            </div>
          </>
        )}

        {visitor_type === 'INTERN' && (
          <>
            <div style={{ margin: '20px 0 14px', fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #FED7AA', paddingBottom: '8px' }}>
              🎓 Internship Details
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Organization/Company *</label>
              <input type="text" name="organization" value={formData.organization} onChange={handleInputChange} required style={inputStyle} placeholder="Company name" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Joining Date *</label>
                <input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ending Date *</label>
                <input type="date" name="ending_date" value={formData.ending_date} onChange={handleInputChange} required style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>ID Proof Type *</label>
                <select name="id_proof_type" value={formData.id_proof_type} onChange={handleInputChange} required style={selectStyle}>
                  <option value="">Select ID Proof</option>
                  <option value="AADHAR">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="DRIVING">Driving License</option>
                  <option value="PASSPORT">Passport</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>ID Proof Number *</label>
                <input type="text" name="id_proof_number" value={formData.id_proof_number} onChange={handleInputChange} required style={inputStyle} placeholder="ID number" />
              </div>
            </div>
            <div style={{ margin: '20px 0 14px', fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #FED7AA', paddingBottom: '8px' }}>
              🏫 College Details
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>College Name *</label>
              <input type="text" name="college_name" value={formData.college_name} onChange={handleInputChange} required style={inputStyle} placeholder="College/University name" />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Course Name *</label>
              <input type="text" name="course_name" value={formData.course_name} onChange={handleInputChange} required style={inputStyle} placeholder="e.g., B.Tech CSE" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={labelStyle}>Current Semester</label>
                <input type="text" name="current_semester" value={formData.current_semester} onChange={handleInputChange} style={inputStyle} placeholder="e.g., 6th" />
              </div>
              <div>
                <label style={labelStyle}>Mentor Name</label>
                <input type="text" name="mentor_name" value={formData.mentor_name} onChange={handleInputChange} style={inputStyle} placeholder="Mentor name" />
              </div>
            </div>
          </>
        )}

        {visitor_type === 'CANDIDATE' && (
          <>
            <div style={{ margin: '20px 0 14px', fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #FED7AA', paddingBottom: '8px' }}>
              💼 Interview Details
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Position Applied For</label>
              <input type="text" name="position" value={formData.position || ''} onChange={handleInputChange} style={inputStyle} placeholder="e.g., Software Engineer" />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Interview Date *</label>
              <input type="date" name="date_of_visiting" value={formData.date_of_visiting} onChange={handleInputChange} required style={inputStyle} />
            </div>
          </>
        )}

        <div style={{ marginBottom: '18px' }}>
          <label style={labelStyle}>Additional Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3"
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
            placeholder="Any additional information..." />
        </div>
      </>
    );
  };

  // ─── View Visitor Modal ───────────────────────────────────────────────────
  const renderVisitorDetails = () => {
    if (!selectedVisitor) return null;
    const v = selectedVisitor;
    const c = cfg(v.visitor_type);

    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.25s ease' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }}>

          {/* Header */}
          <div style={{ background: c.gradient, padding: '32px 28px 60px', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setSelectedVisitor(null)}
              style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >×</button>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Visitor Profile</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white', letterSpacing: '-0.3px' }}>{v.full_name}</div>
          </div>

          {/* Avatar */}
          <div style={{ textAlign: 'center', marginTop: '-44px', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            {v.photo
              ? <img src={v.photo} alt={v.full_name} style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} />
              : <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: c.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '38px', border: '4px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', color: 'white', fontWeight: '800' }}>
                  {v.full_name?.charAt(0).toUpperCase()}
                </div>
            }
            <div style={{ marginTop: '10px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                {c.icon} {c.label}
              </span>
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#94A3B8', fontWeight: '600', fontFamily: 'monospace' }}>ID: {v.visitor_id}</div>
          </div>

          <div style={{ padding: '0 28px 28px' }}>
            {/* Contact */}
            <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>📋 Contact Information</div>
              <InfoRow label="Email" value={v.email} />
              <InfoRow label="Phone" value={v.phone_number} />
            </div>

            {/* Visit Details */}
            {(v.visitor_type === 'GUEST') && (
              <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>📅 Visit Details</div>
                <InfoRow label="Visit Date" value={formatDate(v.date_of_visiting)} />
                <InfoRow label="Purpose" value={v.purpose} />
                <InfoRow label="Department" value={v.department} />
              </div>
            )}

            {/* Intern Details */}
            {v.visitor_type === 'INTERN' && (
              <>
                <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>🏢 Internship Details</div>
                  <InfoRow label="Organization" value={v.organization} />
                  <InfoRow label="Joining Date" value={formatDate(v.joining_date)} />
                  <InfoRow label="Ending Date" value={formatDate(v.ending_date)} />
                  <InfoRow label="ID Proof Type" value={v.id_proof_type} />
                  <InfoRow label="ID Proof No." value={v.id_proof_number} />
                </div>
                <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>🏫 Education Details</div>
                  <InfoRow label="College" value={v.college_name} />
                  <InfoRow label="Course" value={v.course_name} />
                  <InfoRow label="Semester" value={v.current_semester} />
                  <InfoRow label="Mentor" value={v.mentor_name} />
                </div>
              </>
            )}

            {/* Candidate Details */}
            {v.visitor_type === 'CANDIDATE' && (
              <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>💼 Interview Details</div>
                <InfoRow label="Position" value={v.position} />
                <InfoRow label="Interview Date" value={formatDate(v.date_of_visiting)} />
              </div>
            )}

            {v.notes && (
              <div style={{ marginBottom: '16px', padding: '18px', backgroundColor: '#FAFAFA', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>📝 Notes</div>
                <p style={{ fontSize: '14px', color: '#334155', margin: 0, lineHeight: '1.6' }}>{v.notes}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '8px' }}>
              <button onClick={printIndividual}
                style={{ padding: '10px 18px', backgroundColor: '#F8FAFC', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
              >
                🖨️ Print
              </button>
              <button onClick={() => { setSelectedVisitor(null); handleEdit(v); }}
                style={{ padding: '10px 18px', backgroundColor: '#FFF7ED', color: '#EA580C', border: '1.5px solid #FED7AA', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFEDD5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
              >
                <Edit2 size={13} /> Edit
              </button>
              <button onClick={() => handleDelete(v.id)}
                style={{ padding: '10px 18px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
              >
                <Trash2 size={13} /> Delete
              </button>
              <button onClick={() => setSelectedVisitor(null)}
                style={{ padding: '10px 18px', backgroundColor: '#F8FAFC', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Add / Edit Modal ─────────────────────────────────────────────────────
  const renderFormModal = (isEdit) => {
    const isOpen = isEdit ? showEditForm : showForm;
    if (!isOpen) return null;
    const title = isEdit ? '✏️ Edit Visitor' : '✨ Add New Visitor';
    const onClose = () => { isEdit ? setShowEditForm(false) : setShowForm(false); resetForm(); };
    const onSubmit = isEdit ? handleUpdate : handleSubmit;

    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.25s ease' }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '90%', maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease', overflow: 'hidden' }}>
          {/* Modal Header */}
          <div style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', padding: '22px 28px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 2px 0' }}>{title}</h2>
              <p style={{ fontSize: '13px', opacity: 0.85, margin: 0 }}>Fill in the visitor information below</p>
            </div>
            <button onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >×</button>
          </div>

          <div style={{ padding: '28px', overflowY: 'auto', maxHeight: 'calc(92vh - 80px)' }}>
            <form onSubmit={onSubmit}>
              {renderFormFields()}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={onClose}
                  style={{ padding: '10px 22px', backgroundColor: '#F8FAFC', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ padding: '10px 24px', background: loading ? '#CBD5E1' : 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: loading ? 'none' : '0 4px 12px rgba(249,115,22,0.3)' }}>
                  {loading ? <><span style={spinnerStyle} />{isEdit ? 'Updating...' : 'Creating...'}</> : isEdit ? '✓ Update Visitor' : '+ Add Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px' }}>

      {/* Toast */}
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

      {/* Modals */}
      {renderVisitorDetails()}
      {renderFormModal(false)}
      {renderFormModal(true)}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#F97316,#EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
              <Users size={22} color="white" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>
              Visitor Management
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            Manage guests, interns, and interview candidates
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={exportToExcel}
            style={{ padding: '11px 18px', backgroundColor: 'white', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <Download size={15} /> Export
          </button>
          <button onClick={printVisitors}
            style={{ padding: '11px 18px', backgroundColor: 'white', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <Printer size={15} /> Print
          </button>
          <button onClick={() => { setShowForm(true); resetForm(); }}
            style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 4px 12px rgba(249,115,22,0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(249,115,22,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.3)'; }}
          >
            <Plus size={16} /> New Visitor
          </button>
          <button onClick={fetchVisitors} title="Refresh"
            style={{ padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {[
          { label: 'Total Visitors', value: stats.total,      sub: 'All Types',  gradient: 'linear-gradient(135deg,#F97316,#EA580C)', shadow: 'rgba(249,115,22,0.25)' },
          { label: 'Guests',         value: stats.guests,     sub: 'Walk-in Guests',  gradient: 'linear-gradient(135deg,#FB923C,#F97316)', shadow: 'rgba(249,115,22,0.2)' },
          { label: 'Interns',        value: stats.interns,    sub: 'College Interns', gradient: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', shadow: 'rgba(59,130,246,0.25)' },
          { label: 'Candidates',     value: stats.candidates, sub: 'Interview Visits', gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', shadow: 'rgba(139,92,246,0.25)' },
        ].map(card => (
          <div key={card.label} style={{ background: card.gradient, padding: '22px 24px', borderRadius: '16px', color: 'white', boxShadow: `0 6px 20px ${card.shadow}`, position: 'relative', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' }} />
            <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
            <div style={{ fontSize: '38px', fontWeight: '800', lineHeight: 1, marginBottom: '6px' }}>{loading ? '...' : card.value}</div>
            <div style={{ fontSize: '12px', opacity: 0.75, fontWeight: '500' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Bar ───────────────────────────────────────────── */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by name, email, phone or visitor ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '42px', paddingRight: searchTerm ? '42px' : '14px' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all',       label: 'All',        count: stats.total },
            { key: 'GUEST',     label: '👤 Guests',  count: stats.guests },
            { key: 'INTERN',    label: '🎓 Interns', count: stats.interns },
            { key: 'CANDIDATE', label: '💼 Candidates', count: stats.candidates },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterType(f.key)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: filterType === f.key ? 'none' : '1.5px solid #E2E8F0',
                background: filterType === f.key ? 'linear-gradient(135deg,#F97316,#EA580C)' : 'white',
                color: filterType === f.key ? 'white' : '#475569',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
                boxShadow: filterType === f.key ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
              {f.label}
              <span style={{ background: filterType === f.key ? 'rgba(255,255,255,0.25)' : '#F1F5F9', color: filterType === f.key ? 'white' : '#64748B', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Visitors Table ─────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} color="#F97316" />
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A' }}>Visitor Directory</span>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
            {loading ? 'Loading...' : `${filteredVisitors.length} visitor${filteredVisitors.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                {['Visitor', 'Contact', 'Type', 'Organization / Department', 'Visit Date'].map(h => (
                  <th key={h} style={{ padding: '13px 16px', textAlign: 'left', color: '#64748B', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '1.5px solid #F1F5F9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '32px' }}>⏳</span>
                      Loading visitors...
                    </div>
                  </td>
                </tr>
              ) : filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '64px', color: '#94A3B8', fontSize: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '36px' }}>👥</span>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: '#64748B' }}>No visitors found</span>
                      <span style={{ fontSize: '13px' }}>Add a new visitor to get started</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVisitors.map((v, idx) => {
                const c = cfg(v.visitor_type);
                return (
                  <tr key={v.id}
                    onClick={() => setSelectedVisitor(v)}
                    style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background-color 0.15s', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FFF7ED'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AvatarCircle name={v.full_name} photo={v.photo} type={v.visitor_type} size={38} fontSize={14} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>{v.full_name}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', marginTop: '1px' }}>ID: {v.visitor_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', color: '#475569' }}>{v.email || '—'}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{v.phone_number}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: c.bg, color: c.text, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: `1px solid ${c.border}` }}>
                        {c.icon} {c.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {v.organization || v.department
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#FFF7ED', color: '#EA580C', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', border: '1px solid #FED7AA' }}>
                            <Building2 size={11} /> {v.organization || v.department}
                          </span>
                        : <span style={{ color: '#94A3B8', fontSize: '12px', fontStyle: 'italic' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                      {v.date_of_visiting ? formatDate(v.date_of_visiting) : v.joining_date ? formatDate(v.joining_date) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to   { transform: rotate(360deg) } }
        input:focus, select:focus, textarea:focus {
          border-color: #F97316 !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
        }
      `}</style>
    </div>
  );
};

export default AdminVisitor;