import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import ErrorBoundary from './components/ErrorBoundary';
import ChatbotWidget from "./components/ChatbotWidget";
import { API_URL } from './utils/axiosConfig';

// Setup axios default base URL from environment variable
axios.defaults.baseURL = API_URL;

// Lazy load components
const Login = lazy(() => import('./components/Login'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeAnnouncements = lazy(() => import('./pages/EmployeeAnnouncements'));
const AnnouncementDetail = lazy(() => import('./pages/AnnouncementDetail'));
const ManagerAdminDashboard = lazy(() => import('./pages/ManagerAdminDashboard'));
const AdminAnnouncements = lazy(() => import('./pages/AdminAnnouncements'));
const NewAnnouncement = lazy(() => import('./pages/NewAnnouncement'));
const EditAnnouncement = lazy(() => import('./pages/EditAnnouncement'));
const ManagersList = lazy(() => import('./pages/admin/ManagersList'));
const Departments = lazy(() => import('./pages/departments/Departments'));
const DepartmentDetails = lazy(() => import('./pages/departments/DepartmentDetails'));
const CreateDepartment = lazy(() => import('./pages/departments/CreateDepartment'));
const AdminVisitor = lazy(() => import('./pages/admin/AdminVisitor'));
const VisitManagement = lazy(() => import('./pages/visitor/VisitManagement'));
const VisitorReports = lazy(() => import('./pages/visitor/VisitorReports'));
const InternManagement = lazy(() => import('./pages/visitor/InternManagement'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const LeaveDetails = lazy(() => import('./pages/LeaveDetails'));

const DashboardGateway = () => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  if (!token) return <Navigate to="/login" replace />;
  if (userRole === 'ADMIN') return <Navigate to="/admin" replace />;
  if (userRole === 'MANAGER') return <Navigate to="/manager" replace />;
  if (userRole === 'EMPLOYEE') return <Navigate to="/employee" replace />;

  return <Navigate to="/login" replace />;
};

const ChatbotMount = () => {
  const { pathname } = useLocation();
  const adminPaths = ['/admin', '/employees', '/departments', '/leave-details'];
  const isAdminPage = adminPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isEmployeePage = pathname === '/employee' || pathname.startsWith('/employee/');

  if (!isAdminPage && !isEmployeePage) return null;

  return <ChatbotWidget />;
};

// ✅ Protected Route — supports multiple allowed roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token    = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  // Attach auth header using interceptor
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to the correct dashboard
    if (userRole === 'ADMIN')    return <Navigate to="/admin"    replace />;
    if (userRole === 'MANAGER')  return <Navigate to="/manager" replace />;
    if (userRole === 'EMPLOYEE') return <Navigate to="/employee" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);

  // Create QueryClient instance
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<div style={{padding: '50px', textAlign: 'center', color: '#666'}}>Loading application...</div>}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login setUser={setUser} />} />
              <Route path="/dashboard" element={<DashboardGateway />} />
              <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

              {/* ─── Admin Routes ─── */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} />
                </ProtectedRoute>
              } />
              <Route path="/admin/announcements" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage='announcement' />
                </ProtectedRoute>
              } />
              <Route path="/admin/announcements/new" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage='new-announcement' />
                </ProtectedRoute>
              } />
              <Route path="/admin/announcements/:id" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage='announcement-detail' />
                </ProtectedRoute>
              } />
              <Route path="/admin/announcements/:id/edit" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage='edit-announcement' />
                </ProtectedRoute>
              } />
              <Route path="/departments" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage="departments" />
                </ProtectedRoute>
              } />
              <Route path="/departments/new" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage="new-department" />
                </ProtectedRoute>
              } />
              <Route path="/departments/:id" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage="department-details" />
                </ProtectedRoute>
              } />
              <Route path="/admin/salary" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage="salary" />
                </ProtectedRoute>
              } />
              <Route path="/admin/manager-management" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage="manager-management" />
                </ProtectedRoute>
              } />
              <Route path="/admin/hr-reports" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage="hr-reports" />
                </ProtectedRoute>
              } />
<Route path="/admin/managers" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage="managers-list" />
                </ProtectedRoute>
              } />
              <Route path="/employees" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard user={user} setUser={setUser} activePage="employees" />
                </ProtectedRoute>
              } />
              <Route path="/leave-details/:id" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <LeaveDetails />
                </ProtectedRoute>
              } />

              {/* Visitor Management */}
              <Route path="/admin/visitors" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminVisitor user={user} />
                </ProtectedRoute>
              } />
              <Route path="/admin/visits" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <VisitManagement user={user} />
                </ProtectedRoute>
              } />
              <Route path="/admin/visitor-reports" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <VisitorReports user={user} />
                </ProtectedRoute>
              } />
              <Route path="/admin/interns" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <InternManagement user={user} />
                </ProtectedRoute>
              } />

              {/* ─── Employee Routes ─── */}
              <Route path="/employee" element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER']}>
                  <EmployeeDashboard user={user} setUser={setUser} />
                </ProtectedRoute>
              } />
              <Route path="/employee/announcements" element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER']}>
                  <EmployeeAnnouncements user={user} setUser={setUser} />
                </ProtectedRoute>
              } />
              <Route path="/employee/announcements/:id" element={
                <ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER']}>
                  <AnnouncementDetail user={user} />
                </ProtectedRoute>
              } />

              {/* ─── Manager Routes ─── */}
              <Route path="/manager" element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                  <ManagerAdminDashboard user={user} setUser={setUser} />
                </ProtectedRoute>
              } />

              {/* ─── Fallback Route ─── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <ChatbotMount />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
