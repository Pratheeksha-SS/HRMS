import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Building2, RefreshCw, Users } from 'lucide-react';
import api from '../../utils/axiosConfig';

const COLORS = ['#F97316', '#16A34A', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];

const readSavedDepartments = () => {
  try {
    return JSON.parse(localStorage.getItem('departments') || '[]');
  } catch {
    return [];
  }
};

const Departments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromManagerMgmt = location.state?.from === 'manager-mgmt';

  const savedDepartments = useMemo(readSavedDepartments, []);

  const normalizeDepartments = (rows = []) => {
    const savedByName = new Map(
      savedDepartments.map((dept) => [dept.name?.trim().toLowerCase(), dept])
    );
    return rows.map((dept, index) => {
      const name = (dept.name || 'Unassigned').trim();
      const saved = savedByName.get(name.toLowerCase()) || {};
      return {
        id: dept.id,
        name,
        history: saved.history || dept.description || `${name} Department`,
        teamCount: dept.employee_count ?? 0,
        employees: [],
        color: saved.color || COLORS[index % COLORS.length],
        manager: dept.manager || null,
        manager_name: dept.manager_name || null,
        description: dept.description || '',
        source: dept.source || 'backend',
      };
    });
  };

  const {
    data: departments = savedDepartments,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['departments-summary'],
    queryFn: async () => {
      const response = await api.get('/departments/?include_employee_departments=1');
      const normalized = normalizeDepartments(Array.isArray(response.data) ? response.data : []);
      localStorage.setItem('departments', JSON.stringify(normalized));
      return normalized;
    },
    initialData: savedDepartments.length ? savedDepartments : undefined,
    placeholderData: savedDepartments,
    keepPreviousData: true,
    refetchOnMount: savedDepartments.length === 0,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  const loading = isLoading || (isFetching && departments.length === 0);

  const totalEmployees = departments.reduce((sum, dept) => sum + (dept.teamCount || 0), 0);
  const managerCount = departments.filter((dept) => dept.manager_name).length;

  const handleViewDepartment = (dept) => {
    navigate(`/departments/${dept.id}`, {
      state: { dept, fromDepartments: true },
    });
  };

  /* ── colour utility ── */
  const hex18 = (hex) => `${hex}18`;
  const hex30 = (hex) => `${hex}30`;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      padding: '28px 32px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn  { from { opacity: 0 }                         to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse   { 0%,100% { opacity: 1 }                     50% { opacity: 0.45 } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        .dept-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .dept-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 28px rgba(0,0,0,0.10) !important;
          border-color: #FED7AA !important;
        }
        .dept-card:hover .dept-arrow {
          opacity: 1 !important;
          transform: translateX(3px) !important;
        }
        .dept-card:hover .dept-member-count {
          color: #16A34A !important;
        }
        .refresh-btn:hover {
          background: #FFF7ED !important;
          border-color: #FED7AA !important;
          color: #EA580C !important;
        }
        .back-btn:hover {
          background: #FFEDD5 !important;
          transform: translateX(-2px) !important;
        }
      `}</style>

      {/* ── Back Button ── */}
      {fromManagerMgmt && (
        <button
          className="back-btn"
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            backgroundColor: '#FFF7ED',
            border: '1.5px solid #FED7AA',
            borderRadius: '10px',
            color: '#EA580C',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            marginBottom: '24px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 0.2s',
          }}
        >
          ← Back to Manager Management
        </button>
      )}

      {/* ── Page Header ── */}
      <div style={{
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '16px',
        flexWrap: 'wrap',
        animation: 'slideUp 0.35s ease',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}>
              <Building2 size={22} color="white" />
            </div>
            <h1 style={{
              fontSize: '26px',
              fontWeight: '800',
              margin: 0,
              color: '#0F172A',
              letterSpacing: '-0.5px',
            }}>
              Departments
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, paddingLeft: '52px' }}>
            Manage your organisation's department structure
          </p>
        </div>

        {/* Refresh button */}
        <button
          className="refresh-btn"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh departments"
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: '1.5px solid #E2E8F0',
            background: 'white',
            cursor: isFetching ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#64748B',
            fontSize: '13px',
            fontWeight: '700',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw
            size={15}
            style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }}
          />
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Stat Cards ── */}
      {!loading && departments.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
          animation: 'fadeIn 0.4s ease',
        }}>
          {[
            {
              label: 'Total Departments',
              value: departments.length,
              sub: 'Active Divisions',
              gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
              shadow: 'rgba(249,115,22,0.25)',
            },
            {
              label: 'Total Employees',
              value: totalEmployees,
              sub: 'Across Organisation',
              gradient: 'linear-gradient(135deg, #16A34A, #15803D)',
              shadow: 'rgba(22,163,74,0.25)',
            },
            {
              label: 'With Managers',
              value: managerCount,
              sub: 'Departments Led',
              gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
              shadow: 'rgba(59,130,246,0.25)',
            },
            {
              label: 'Avg. Team Size',
              value: departments.length > 0
                ? Math.round(totalEmployees / departments.length)
                : 0,
              sub: 'Members per Dept.',
              gradient: 'linear-gradient(135deg, #FB923C, #F97316)',
              shadow: 'rgba(249,115,22,0.2)',
            },
          ].map((card) => (
            <div key={card.label} style={{
              background: card.gradient,
              padding: '22px 24px',
              borderRadius: '16px',
              color: 'white',
              boxShadow: `0 6px 20px ${card.shadow}`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative circle */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.12)',
              }} />
              <div style={{
                fontSize: '13px', fontWeight: '600', opacity: 0.85,
                marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {card.label}
              </div>
              <div style={{ fontSize: '38px', fontWeight: '800', lineHeight: 1, marginBottom: '6px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.75, fontWeight: '500' }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Skeleton Loader ── */}
      {loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{
              background: 'white',
              borderRadius: '14px',
              padding: '24px',
              border: '1.5px solid #F1F5F9',
              overflow: 'hidden',
              animation: 'pulse 1.6s ease-in-out infinite',
            }}>
              {/* top colour strip */}
              <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '99px', marginBottom: '20px', marginLeft: '-24px', marginRight: '-24px', marginTop: '-24px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F1F5F9', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '16px', background: '#F1F5F9', borderRadius: '6px', width: '60%', marginBottom: '8px' }} />
                  <div style={{ height: '12px', background: '#F8FAFC', borderRadius: '6px', width: '35%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Section Label ── */}
      {!loading && departments.length > 0 && (
        <div style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '14px', fontWeight: '700', color: '#0F172A',
            }}>Department Directory</span>
            <span style={{
              backgroundColor: '#FFF7ED', color: '#EA580C',
              padding: '2px 10px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '700',
              border: '1px solid #FED7AA',
            }}>
              {departments.length}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
            {totalEmployees} total member{totalEmployees !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* ── Department Cards Grid ── */}
      {!loading && departments.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          animation: 'fadeIn 0.4s ease',
        }}>
          {departments.map((dept) => {
            const accent = dept.color || '#F97316';
            const secondColor = accent === '#F97316' ? '#EA580C' : '#F97316';

            return (
              <button
                key={dept.id}
                type="button"
                className="dept-card"
                onClick={() => handleViewDepartment(dept)}
                style={{
                  textAlign: 'left',
                  backgroundColor: 'white',
                  borderRadius: '14px',
                  border: '1.5px solid #F1F5F9',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  padding: 0,
                  fontFamily: 'inherit',
                  width: '100%',
                  display: 'block',
                }}
              >
                {/* Top accent strip */}
                <div style={{
                  height: '4px',
                  background: `linear-gradient(90deg, ${accent}, ${secondColor})`,
                }} />

                <div style={{ padding: '20px' }}>
                  {/* Icon + Name row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: hex18(accent),
                      border: `1.5px solid ${hex30(accent)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '22px',
                      fontWeight: '800',
                      color: accent,
                    }}>
                      {dept.name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        margin: 0,
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {dept.name}
                      </h3>
                    </div>

                    {/* Arrow */}
                    <div
                      className="dept-arrow"
                      style={{
                        opacity: 0,
                        color: accent,
                        fontSize: '18px',
                        fontWeight: '700',
                        transition: 'opacity 0.2s, transform 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      →
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', backgroundColor: '#F1F5F9', marginBottom: '14px' }} />

                  {/* Footer row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}>
                    {/* Member count pill */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: dept.teamCount > 0 ? '#F0FDF4' : '#F8FAFC',
                        border: `1.5px solid ${dept.teamCount > 0 ? '#BBF7D0' : '#E2E8F0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Users size={12} color={dept.teamCount > 0 ? '#16A34A' : '#94A3B8'} />
                      </div>
                      <span
                        className="dept-member-count"
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: dept.teamCount > 0 ? '#15803D' : '#94A3B8',
                          transition: 'color 0.2s',
                        }}
                      >
                        {dept.teamCount} {dept.teamCount === 1 ? 'Member' : 'Members'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && departments.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '14px',
          border: '1.5px dashed #E2E8F0',
          padding: '80px 40px',
          textAlign: 'center',
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
            border: '1.5px solid #FED7AA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <AlertCircle size={30} color="#F97316" />
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '800',
            color: '#0F172A',
            margin: '0 0 10px',
          }}>
            No Departments Found
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#64748B',
            margin: '0 auto',
            maxWidth: '400px',
            lineHeight: '1.6',
          }}>
            Departments appear here once employees are assigned or created via the admin panel.
          </p>
          <button
            onClick={() => refetch()}
            style={{
              marginTop: '24px',
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
            }}
          >
            ↻ Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default Departments;