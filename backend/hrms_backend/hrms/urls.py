from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from . import views_attendance
from django.conf.urls.static import static
from .views import (
    reports_leaves,
    admin_login,
    employee_login,
    EmployeeListCreateView,
    EmployeeDetailView,
    LeaveViewSet,
    MeetingViewSet,
    HolidayViewSet,
    AddEmployeeView,
    MyTokenObtainPairView,
    send_holiday_wishes,
    test_email_direct,
    forgot_password,
    reset_password,
    LeaveCreateView,
    LeaveListView,
    LeaveApproveRejectView,
    CreateEmployeeView,
    CurrentEmployeeView,
    EmployeeProfileUpdateView,
    EmployeeSetPasswordView,
    LeaveDeleteView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ManagerLeaveListView,
    DepartmentEmployeesView,
    PromoteEmployeeView,
    AllManagersView,
    AllUsersView,
    AllDepartmentsView,
    AssignManagerToDepartmentView,
    RemoveManagerFromDepartmentView,
    UpdateManagerView,
    RevokeManagerView,
    CurrentUserView,
    DepartmentListCreateView,
    DepartmentDetailView,
    DepartmentListView,
    UserNotificationsView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
    AnnouncementListCreateView,
    AnnouncementDetailView,
    PinnedAnnouncementsView,
    AnnouncementHistoryView,
    CalendarAnnouncementsView,
    DashboardStatsView,
    # Visitor Management Views
    VisitorListCreateView,
    VisitorDetailView,
    InternDetailView,
    InternAttendanceListCreateView,
    InternTaskListCreateView,
    InternTaskDetailView,
    InternWithDetailsView,
    GuestVisitListCreateView,
    GuestVisitDetailView,
    check_in_visitor,
    check_out_visitor,
    daily_visitor_logs,
    visitor_history,
    department_wise_statistics,
    active_visitors,
    visitor_summary_report,
    intern_performance_report,
    reports_attendance,
    reports_employees,
)
# Import employee views
try:
    from .views_employee import (
        employee_holiday_calendar,
        employee_holiday_detail,
        download_holiday_calendar,
    )
except ImportError:
    from django.http import JsonResponse
    def employee_holiday_calendar(request):
        return JsonResponse({"message": "Holiday calendar endpoint not configured yet"}, status=501)
    def employee_holiday_detail(request, pk):
        return JsonResponse({"message": "Holiday detail endpoint not configured yet"}, status=501)
    def download_holiday_calendar(request):
        return JsonResponse({"message": "Download calendar endpoint not configured yet"}, status=501)

# Create router for ViewSets
router = DefaultRouter()
try:
    router.register(r'leaves', LeaveViewSet, basename='leaves')
    router.register(r'meetings', MeetingViewSet, basename='meetings')
    router.register(r'holidays', HolidayViewSet, basename='holidays')
except NameError as e:
    print(f"⚠️ Router registration error: {e}")

urlpatterns = [
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    # 🔐 Authentication
    path('admin-login/', admin_login, name='admin-login'),
    path('employee-login/', employee_login, name='employee-login'),

    # 🔐 JWT Token
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # 🔐 Password Reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('forgot-password/', forgot_password, name='forgot-password'),
    path('reset-password/', reset_password, name='reset-password'),

    # 👤 Current logged-in user info
    path('current-user/', CurrentUserView.as_view(), name='current-user'),

    # 👤 Employees
    path('employees/', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/create/', CreateEmployeeView.as_view(), name='create-employee'),
    path('employees/me/', CurrentEmployeeView.as_view(), name='current-employee'),
    path('employees/me/update/', EmployeeProfileUpdateView.as_view(), name='employee-profile-update'),
    path('employees/me/set-password/', EmployeeSetPasswordView.as_view(), name='employee-set-password'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    
    # ➕ Add Employee
    path('add-employee/', AddEmployeeView.as_view(), name='add-employee'),
    
    # 📝 Leaves
    path('leaves/apply/', LeaveCreateView.as_view(), name='leave-apply'),
    path('leaves/', LeaveListView.as_view(), name='leave-list'),
    path('leaves/<int:pk>/approve/', LeaveApproveRejectView.as_view(), name='leave-approve-reject'),
    path('leaves/<int:pk>/delete/', LeaveDeleteView.as_view(), name='leave-delete'),
    
    # 👔 Manager Views
    path('manager-leaves/', ManagerLeaveListView.as_view(), name='manager-leaves'),
    path('department-employees/', DepartmentEmployeesView.as_view(), name='department-employees'),

    # 👑 Admin Manager Management
    path('managers/', AllManagersView.as_view(), name='all-managers'),
    path('all-users/', AllUsersView.as_view(), name='all-users'),
    path('departments-list/', AllDepartmentsView.as_view(), name='departments-list'),
    path('promote-employee/', PromoteEmployeeView.as_view(), name='promote-employee'),
    path('revoke-manager/', RevokeManagerView.as_view(), name='revoke-manager'),
    path('assign-manager/', AssignManagerToDepartmentView.as_view(), name='assign-manager'),
    path('remove-manager/', RemoveManagerFromDepartmentView.as_view(), name='remove-manager'),
    path('update-manager/<int:pk>/', UpdateManagerView.as_view(), name='update-manager'),

    # 🏢 Department Management
    path('departments/', DepartmentListCreateView.as_view(), name='department-list-create'),
    path('departments/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    path('departments/list/', DepartmentListView.as_view(), name='department-list'),

    # 🔔 Notifications
    path('notifications/', UserNotificationsView.as_view(), name='user-notifications'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='mark-notification-read'),
    path('notifications/read-all/', MarkAllNotificationsReadView.as_view(), name='mark-all-read'),

    # 📢 Announcements
    path('announcements/', AnnouncementListCreateView.as_view(), name='announcement-list-create'),
    path('announcements/pinned/', PinnedAnnouncementsView.as_view(), name='announcement-pinned'),
    path('announcements/create/', AnnouncementListCreateView.as_view(), name='announcement-create'),
    path('announcements/calendar/', CalendarAnnouncementsView.as_view(), name='announcement-calendar'),
    path('announcements/history/', AnnouncementHistoryView.as_view(), name='announcement-history'),
    path('announcements/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement-detail'),
    path('announcements/update/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement-update'),
    path('announcements/delete/<int:pk>/', AnnouncementDetailView.as_view(), name='announcement-delete'),

    path('reports/leaves/', reports_leaves, name='reports-leaves'),
    path('reports/attendance/', reports_attendance, name='reports-attendance'),
    path('reports/employees/', reports_employees, name='reports-employees'),
    
    # 👥 Visitor Management
    path('visitors/', VisitorListCreateView.as_view(), name='visitor-list'),
    path('visitors/<int:pk>/', VisitorDetailView.as_view(), name='visitor-detail'),
    
    # 🎓 Intern Management
    path('interns/<int:intern_id>/details/', InternDetailView.as_view(), name='intern-details'),
    path('interns/<int:intern_id>/attendance/', InternAttendanceListCreateView.as_view(), name='intern-attendance'),
    path('interns/<int:intern_id>/tasks/', InternTaskListCreateView.as_view(), name='intern-tasks'),
    path('interns/tasks/<int:pk>/', InternTaskDetailView.as_view(), name='intern-task-detail'),
    path('interns/<int:pk>/full-details/', InternWithDetailsView.as_view(), name='intern-full-details'),
    
    # 🚪 Guest Visit Management
    path('visits/', GuestVisitListCreateView.as_view(), name='visit-list'),
    path('visits/<int:pk>/', GuestVisitDetailView.as_view(), name='visit-detail'),
    path('visits/<int:pk>/check-in/', check_in_visitor, name='check-in'),
    path('visits/<int:pk>/check-out/', check_out_visitor, name='check-out'),
    
    # 📊 Reports & Analytics
    path('reports/daily-logs/', daily_visitor_logs, name='daily-logs'),
    path('reports/history/', visitor_history, name='visitor-history'),
    path('reports/department-stats/', department_wise_statistics, name='department-stats'),
    path('reports/active-visitors/', active_visitors, name='active-visitors'),
    path('reports/summary/', visitor_summary_report, name='visitor-summary'),
    path('reports/intern-performance/', intern_performance_report, name='intern-performance'),
    
    # 🎄 Employee Holiday Views
    path('employee/holidays/', employee_holiday_calendar, name='employee-holiday-calendar'),
    path('employee/holidays/<int:pk>/', employee_holiday_detail, name='employee-holiday-detail'),
    path('employee/holidays/download/', download_holiday_calendar, name='download-holiday-calendar'),

    # 📧 Email Test
    path('test-email/', test_email_direct, name='test-email'),
    path('send-holiday-wishes/', send_holiday_wishes, name='send-holiday-wishes'),

    # 📅 Attendance Management
    path('attendance/upload/', views_attendance.AttendanceUploadView.as_view(), name='attendance-upload'),
    path('attendance/upload/<int:pk>/', views_attendance.AttendanceUploadDeleteView.as_view(), name='attendance-upload-delete'),
    path('attendance/', views_attendance.AttendanceListView.as_view(), name='attendance-list'),
    path('attendance/summary/', views_attendance.AttendanceSummaryView.as_view(), name='attendance-summary'),
    path('attendance/my/', views_attendance.MyAttendanceView.as_view(), name='my-attendance'),
    path('attendance/date-view/', views_attendance.AttendanceDateView.as_view(), name='attendance-date-view'),
    path('attendance/record/<int:pk>/', views_attendance.AttendanceRecordDetailView.as_view(), name='attendance-record-detail'),
    path('attendance/dashboard-stats/', views_attendance.AttendanceDashboardStatsView.as_view(), name='attendance-dashboard-stats'),
    path('attendance/incomplete-employees/', views_attendance.IncompleteEmployeesView.as_view(), name='attendance-incomplete-employees'),
    path('attendance/sync/', views_attendance.AttendanceSyncView.as_view(), name='attendance-sync'),
    path('attendance/date/', views_attendance.AttendanceDateView.as_view(), name='attendance-date'),
]

# ✅ ADD ROUTER URLS HERE - This is the fix!
urlpatterns += router.urls

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)