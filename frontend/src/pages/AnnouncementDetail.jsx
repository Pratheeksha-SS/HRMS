import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { announcementService } from '../services/announcementService';
import {
  ChevronLeft, Calendar, User, Clock, Paperclip,
  Edit2, Trash2, MoreVertical, Pin, RefreshCw, AlertCircle,
} from 'lucide-react';

/* ─── All functionality preserved, UI redesigned to match HRMS design system ─ */

const AnnouncementDetail = ({ user, onEdit, onBack, id: propId }) => {
  const { id: paramId } = useParams();
  const id = propId || paramId;
  const navigate = useNavigate();

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        let data;
        try {
          const response = await announcementService.getOne(id);
          data = response.data;
        } catch (serviceError) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/announcements/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          data = response.data;
        }
        setAnnouncement(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching announcement:', err);
        const status = err.response?.status;
        if (status === 404) {
          setError('Announcement not found or no longer available.');
        } else if (status === 403) {
          setError('You do not have permission to view this announcement.');
        } else if (status === 401) {
          setError('Session expired. Please login again.');
        } else {
          setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load announcement');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnnouncement();
    } else {
      setError('No announcement ID provided');
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    if (onBack) onBack();
    else {
      const role = user?.role || localStorage.getItem('user_role');
      navigate(role === 'ADMIN' ? '/admin/announcements' : '/employee/announcements');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementService.delete(announcement.id);
        if (onBack) onBack();
        else navigate('/admin/announcements');
      } catch (err) {
        alert('Failed to delete announcement');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const handleDownloadAttachment = async () => {
    if (!announcement?.attachment) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      const attachmentUrl = announcement.attachment_url ||
        (announcement.attachment.startsWith('http')
          ? announcement.attachment
          : `http://127.0.0.1:8000${announcement.attachment}`);

      const response = await fetch(attachmentUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const fileName = attachmentUrl.split('/').pop();
      const ext = fileName.split('.').pop().toLowerCase();
      const viewable = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);

      if (viewable) {
        window.open(blobUrl, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error('Download error:', err);
      alert(`Error downloading file: ${err.message}`);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  // ── Shared style helpers ───────────────────────────────────────────────
  const InfoRow = ({ label, value, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: color || '#0F172A' }}>
        {value || '—'}
      </span>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#F8FAFC',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
        padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
        <div style={{ height: '44px', width: '180px', background: '#F1F5F9', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ background: 'white', borderRadius: '14px', padding: '32px', border: '1.5px solid #F1F5F9' }}>
          <div style={{ height: '28px', width: '60%', background: '#F1F5F9', borderRadius: '8px', marginBottom: '20px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: '50px', background: '#F8FAFC', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />)}
          </div>
          {[1,2,3,4,5].map(i => <div key={i} style={{ height: '14px', background: '#F8FAFC', borderRadius: '6px', marginBottom: '10px', width: i % 3 === 0 ? '80%' : '100%', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#F8FAFC',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px',
      }}>
        <button onClick={handleBack} style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '10px 18px', background: 'white', border: '1.5px solid #E2E8F0',
          borderRadius: '10px', color: '#475569', fontSize: '13px', fontWeight: '700',
          cursor: 'pointer', marginBottom: '20px', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{
          background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '12px',
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
          color: '#DC2626', fontSize: '14px', fontWeight: '600',
        }}>
          <AlertCircle size={18} /> {error}
        </div>
      </div>
    );
  }

  // ── Not Found ─────────────────────────────────────────────────────────
  if (!announcement) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#F8FAFC',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px',
      }}>
        <div style={{ textAlign: 'center', padding: '64px', background: 'white', borderRadius: '14px', border: '1.5px solid #F1F5F9', color: '#94A3B8' }}>
          <span style={{ fontSize: '40px' }}>📢</span>
          <p style={{ fontWeight: '700', fontSize: '15px', color: '#64748B', marginTop: '12px' }}>Announcement not found</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif", padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes dropIn  { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', animation: 'fadeIn 0.3s ease',
      }}>
        <button
          onClick={handleBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 18px', background: 'white', border: '1.5px solid #E2E8F0',
            borderRadius: '10px', color: '#475569', fontSize: '13px', fontWeight: '700',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.transform = 'translateX(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'translateX(0)'; }}
        >
          <ChevronLeft size={16} /> Back to Announcements
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {announcement.is_pinned && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: '#FFFBEB', color: '#B45309',
              padding: '5px 12px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '700', border: '1px solid #FDE68A',
            }}>
              📌 Pinned
            </span>
          )}

          {isAdmin && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  padding: '9px 12px', background: 'white', border: '1.5px solid #E2E8F0',
                  borderRadius: '10px', cursor: 'pointer', color: '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                <MoreVertical size={16} />
              </button>

              {showMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: 'white', border: '1.5px solid #F1F5F9', borderRadius: '12px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 100,
                  minWidth: '160px', overflow: 'hidden',
                  animation: 'dropIn 0.2s ease',
                }}>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onEdit) onEdit(announcement);
                      else navigate(`/admin/announcements/${announcement.id}/edit`);
                    }}
                    style={{
                      width: '100%', padding: '12px 16px', textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '600', color: '#0F172A',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      borderBottom: '1.5px solid #F8FAFC', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Edit2 size={14} color="#3B82F6" /> Edit Announcement
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); handleDelete(); }}
                    style={{
                      width: '100%', padding: '12px 16px', textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '600', color: '#DC2626',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={14} /> Delete Announcement
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Card ────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: 'white', borderRadius: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #F1F5F9',
        overflow: 'hidden', maxWidth: '860px', margin: '0 auto',
        animation: 'slideUp 0.35s ease',
      }}>
        {/* Card Gradient Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F97316, #EA580C)',
          padding: '28px 32px 56px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '120px', height: '120px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40px', left: '60px',
            width: '80px', height: '80px', borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.06)',
          }} />
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            📢 Announcement
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.4px', lineHeight: 1.3 }}>
            {announcement.title}
          </h1>
        </div>

        {/* Floating Meta Card */}
        <div style={{ padding: '0 28px', marginTop: '-22px', position: 'relative', zIndex: 1 }}>
          <div style={{
            background: 'white', borderRadius: '14px',
            border: '1.5px solid #F1F5F9', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            padding: '18px 24px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px',
          }}>
            <InfoRow
              label="Published"
              value={formatDateShort(announcement.created_at)}
            />
            {announcement.created_by?.username && (
              <InfoRow label="By" value={announcement.created_by.username} />
            )}
            {!announcement.created_by?.username && announcement.created_by_username && (
              <InfoRow label="By" value={announcement.created_by_username} />
            )}
            {announcement.event_date && (
              <InfoRow
                label="Event Date"
                value={formatDateShort(announcement.event_date)}
                color="#16A34A"
              />
            )}
            {announcement.expiry_date && (
              <InfoRow
                label="Expires"
                value={formatDateShort(announcement.expiry_date)}
                color="#DC2626"
              />
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{
            padding: '20px', backgroundColor: '#F8FAFC',
            borderRadius: '12px', border: '1.5px solid #F1F5F9',
            marginBottom: announcement.attachment ? '20px' : '8px',
          }}>
            <p style={{
              fontSize: '15px', lineHeight: '1.8', color: '#334155',
              whiteSpace: 'pre-wrap', margin: 0,
            }}>
              {announcement.description}
            </p>
          </div>

          {/* Attachment */}
          {announcement.attachment && (
            <div style={{
              padding: '18px 20px', background: '#EFF6FF',
              borderRadius: '12px', border: '1.5px solid #BFDBFE',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                📎 Attachment
              </div>
              <button
                onClick={handleDownloadAttachment}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  color: 'white', border: 'none', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)'; }}
              >
                <Paperclip size={14} />
                ⬇️ {(announcement.attachment_url || announcement.attachment).split('/').pop()}
              </button>
            </div>
          )}

          {/* Admin Footer Actions */}
          {isAdmin && (
            <div style={{
              display: 'flex', gap: '12px', justifyContent: 'flex-end',
              paddingTop: '20px', marginTop: '12px',
              borderTop: '1.5px solid #F1F5F9',
            }}>
              <button
                onClick={() => { if (onEdit) onEdit(announcement); else navigate(`/admin/announcements/${announcement.id}/edit`); }}
                style={{
                  padding: '10px 22px', background: '#EFF6FF', color: '#3B82F6',
                  border: '1.5px solid #BFDBFE', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '7px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
              >
                <Edit2 size={14} /> Edit Announcement
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '10px 22px', background: '#FEF2F2', color: '#DC2626',
                  border: '1.5px solid #FECACA', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '7px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetail;
