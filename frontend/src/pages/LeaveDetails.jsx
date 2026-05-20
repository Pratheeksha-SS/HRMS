import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { formatDate, getStatusColor } from '../utils/reportUtils';
import { leaveTypeLabels } from './AdminLeaveManagement';

const styles = {
  page: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  backButton: { backgroundColor: '#6b7280', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  section: { backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e5e7eb', marginBottom: '24px' },
  metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' },
  metaLabel: { fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '6px' },
  metaValue: { fontSize: '16px', fontWeight: '500', color: '#1a1a1a' },
  statusBadge: { padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600' },
  box: { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', color: '#334155', lineHeight: '1.6' },
  textarea: { width: '100%', minHeight: '120px', padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', fontFamily: 'inherit', resize: 'vertical', fontSize: '14px' },
  buttonGroup: { display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' },
  primaryButton: { backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  dangerButton: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  secondaryButton: { backgroundColor: '#6b7280', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: '500', cursor: 'pointer' },
  loading: { opacity: 0.7, cursor: 'not-allowed' },
};

const getStatusStyle = (status) => {
  const color = getStatusColor(status.toUpperCase());
  return {
    backgroundColor: color.bg || '#e5e7eb',
    color: color.color || '#374151',
  };
};

const LeaveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  const currentRole = localStorage.getItem('user_role') || localStorage.getItem('role');

  const fetchLeave = useCallback(async () => {
    try {
      const res = await api.get(`/leaves/${id}/`);
      setLeave(res.data);
      setReviewComments(res.data.comments || '');
    } catch (err) {
      console.error('Error fetching leave:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchEmployeeDetails = useCallback(async (employeeId) => {
    if (!employeeId) return;
    try {
      const res = await api.get(`/employees/${employeeId}/`);
      setEmployees([res.data]);
    } catch (err) {
      console.error('Error fetching employee:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeave();
  }, [fetchLeave]);

  useEffect(() => {
    if (leave?.employee) {
      fetchEmployeeDetails(leave.employee);
    }
  }, [leave?.employee, fetchEmployeeDetails]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/leaves/${id}/approve/`, {
        status: 'APPROVED',
        comments: reviewComments,
      });
      alert('Leave approved successfully');
      navigate(-1);
    } catch (err) {
      alert('Error approving leave: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/leaves/${id}/approve/`, {
        status: 'REJECTED',
        comments: reviewComments,
      });
      alert('Leave rejected');
      navigate(-1);
    } catch (err) {
      alert('Error rejecting leave: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.page}>Loading leave details...</div>;
  }

  if (!loading && !leave) {
    return <div style={styles.page}>Leave not found</div>;
  }

  const employee = employees[0];
  const canDelete = currentRole === 'ADMIN' || leave?.status === 'PENDING';

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Leave Request #{leave?.id}</h1>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back to Leaves
        </button>
      </div>

      <div style={styles.section}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Leave Details</h2>
        <div style={styles.metaGrid}>
          <div>
            <div style={styles.metaLabel}>Employee Name</div>
            <div style={styles.metaValue}>{leave.employee_name || `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || 'N/A'}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>Employee ID</div>
            <div style={styles.metaValue}>{leave.employee_id || 'N/A'}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>Leave Type</div>
            <div style={styles.metaValue}>{leaveTypeLabels[leave.leave_type] || leave.leave_type}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>Status</div>
            <span style={{ ...styles.statusBadge, ...getStatusStyle(leave.status) }}>{leave.status}</span>
          </div>
          <div>
            <div style={styles.metaLabel}>Department</div>
            <div style={styles.metaValue}>{leave.department || 'N/A'}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>Start Date</div>
            <div style={styles.metaValue}>{leave.start_date}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>End Date</div>
            <div style={styles.metaValue}>{leave.end_date}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>Total Days</div>
            <div style={styles.metaValue}>{leave.total_days || leave.leave_days} day{(leave.total_days || leave.leave_days) !== 1 ? 's' : ''}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>Applied On</div>
            <div style={styles.metaValue}>{leave.applied_at ? formatDate(leave.applied_at) : 'N/A'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={styles.metaLabel}>Reason</div>
            <div style={styles.box}>{leave.reason || 'No reason provided'}</div>
          </div>
          {leave.comments && (
            <div>
              <div style={styles.metaLabel}>Admin Comments</div>
              <div style={styles.box}>{leave.comments}</div>
            </div>
          )}
        </div>

        {leave.status === 'PENDING' && (
          <div style={{ marginTop: '24px' }}>
            <div style={styles.metaLabel}>Review Comments</div>
            <textarea 
              value={reviewComments} 
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder="Add your review comments..."
              style={styles.textarea}
            />
          </div>
        )}
      </div>

      <div style={styles.buttonGroup}>
        {canDelete && (
          <button
            onClick={async () => {
              if (!confirm('Delete this leave request?')) return;
              try {
                await api.delete(`/leaves/${id}/delete/`);
                navigate(-1);
              } catch (err) {
                alert('Error deleting leave: ' + (err.response?.data?.error || err.message));
              }
            }}
            style={styles.dangerButton}
            disabled={actionLoading}
          >
            Delete Leave
          </button>
        )}
        {leave?.status === 'PENDING' && (
          <>
            <button onClick={handleReject} disabled={actionLoading} style={styles.dangerButton}>
              {actionLoading ? 'Processing...' : 'Reject'}
            </button>
            <button onClick={handleApprove} disabled={actionLoading} style={styles.primaryButton}>
              {actionLoading ? 'Processing...' : 'Approve'}
            </button>
          </>
        )}
        <button onClick={() => navigate(-1)} style={styles.secondaryButton} disabled={actionLoading}>
          Back to Leaves
        </button>
      </div>
    </div>
  );
};

export default LeaveDetails;

