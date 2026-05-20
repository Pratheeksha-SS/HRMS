import { useState, useEffect } from 'react';
import axios from 'axios';
import { extractListData } from '../../utils/extractListData';

const VisitorManagement = ({ user, isEmployeeView = false }) => {
  const [visitors, setVisitors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    visitor_type: 'GUEST',
    full_name: '',
    phone_number: '',
    email: '',
    id_proof_type: '',
    id_proof_number: '',
    organization: '',
    notes: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchVisitors();
  }, [filterType]);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const url = filterType !== 'all' 
        ? `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/?visitor_type=${filterType}`
        : `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisitors(extractListData(response.data));
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

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
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key]) formDataToSend.append(key, formData[key]);
      });
      
      if (selectedImage) {
        formDataToSend.append('photo', selectedImage);
      }
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/visitors/`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Visitor created successfully!');
      setShowForm(false);
      resetForm();
      fetchVisitors();
    } catch (error) {
      console.error('Error creating visitor:', error);
      alert(error.response?.data?.message || 'Failed to create visitor');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      visitor_type: 'GUEST',
      full_name: '',
      phone_number: '',
      email: '',
      id_proof_type: '',
      id_proof_number: '',
      organization: '',
      notes: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const getVisitorTypeColor = (type) => {
    const colors = {
      'GUEST': '#10b981',
      'INTERN': '#4361ee',
      'CANDIDATE': '#8b5cf6'
    };
    return colors[type] || '#6b7280';
  };

  const getVisitorTypeIcon = (type) => {
    const icons = {
      'GUEST': '👤',
      'INTERN': '🎓',
      'CANDIDATE': '💼'
    };
    return icons[type] || '👥';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1a1a1a' }}>Visitor Management</h1>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>Manage guests, interns, and interview candidates</p>
        </div>
        {!isEmployeeView && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>+</span> New Visitor
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All Visitors', icon: '👥' },
          { id: 'GUEST', label: 'Guests', icon: '👤' },
          { id: 'INTERN', label: 'Interns', icon: '🎓' },
          { id: 'CANDIDATE', label: 'Candidates', icon: '💼' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterType(filter.id)}
            style={{
              padding: '8px 16px',
              backgroundColor: filterType === filter.id ? '#4361ee' : '#f3f4f6',
              color: filterType === filter.id ? 'white' : '#666',
              border: 'none',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {/* Visitors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #4361ee', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          Loading visitors...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {visitors.map(visitor => (
            <div
              key={visitor.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: `1px solid ${getVisitorTypeColor(visitor.visitor_type)}20`,
                borderTop: `4px solid ${getVisitorTypeColor(visitor.visitor_type)}`,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {visitor.photo ? (
                  <img
                    src={visitor.photo}
                    alt={visitor.full_name}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '30px'
                  }}>
                    {getVisitorTypeIcon(visitor.visitor_type)}
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0', color: '#1a1a1a' }}>
                    {visitor.full_name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                    ID: {visitor.visitor_id}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '600',
                    backgroundColor: `${getVisitorTypeColor(visitor.visitor_type)}20`,
                    color: getVisitorTypeColor(visitor.visitor_type),
                    marginTop: '4px'
                  }}>
                    {visitor.visitor_type_display}
                  </span>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
                  <span>📞 {visitor.phone_number}</span>
                  {visitor.email && <span>✉️ {visitor.email}</span>}
                </div>
                {visitor.organization && (
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    🏢 {visitor.organization}
                  </div>
                )}
                {visitor.id_proof_type && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                    ID: {visitor.id_proof_type_display} - {visitor.id_proof_number}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Visitor Modal */}
      {showForm && !isEmployeeView && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            width: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Add New Visitor</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Visitor Type *</label>
                <select
                  name="visitor_type"
                  value={formData.visitor_type}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="GUEST">Guest</option>                  <option value="INTERN">Intern</option>
                  <option value="CANDIDATE">Interview Candidate</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>ID Proof Type</label>
                  <select
                    name="id_proof_type"
                    value={formData.id_proof_type}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                  >
                    <option value="">Select</option>
                    <option value="AADHAR">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="DRIVING">Driving License</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="VOTER">Voter ID</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>ID Proof Number</label>
                  <input
                    type="text"
                    name="id_proof_number"
                    value={formData.id_proof_number}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Organization</label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                  placeholder="Company/Organization name (for interns)"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Photo</label>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', marginBottom: '8px' }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ padding: '12px 24px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{ padding: '12px 24px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Creating...' : 'Create Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorManagement;
