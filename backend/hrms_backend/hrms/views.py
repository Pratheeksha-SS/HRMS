from django.contrib.auth import authenticate
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.core.cache import cache
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth import get_user_model

from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework import status, viewsets, generics, permissions
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import DashboardStatsSerializer
from django_filters.rest_framework import DjangoFilterBackend

from .models import Visitor
from .serializers import VisitorSerializer

from datetime import date
import random
import string
import time

from .models import Employee, Leave, Department, Notification, Meeting, Holiday, Announcement, User, Visitor, InternDetail, InternAttendance, InternTask, GuestVisit, VisitorLog, DepartmentVisitStats
from django.db.models import Q, Count
from django.core.cache import cache
from collections import defaultdict
from django.utils.dateparse import parse_date
import datetime
from .serializers import (
    EmployeeSerializer,
    EmployeeListItemSerializer,
    LeaveSerializer,
    MeetingSerializer,
    HolidaySerializer,
    MyTokenObtainPairSerializer,
    EmployeeCreateSerializer,
    UserEmployeeSerializer,
    UserSerializer,
    DepartmentSerializer,
    NotificationSerializer,
    AnnouncementSerializer,
    VisitorSerializer,
    InternDetailSerializer, 
    InternAttendanceSerializer,
    InternTaskSerializer, 
    GuestVisitSerializer, 
    VisitorLogSerializer,
    DepartmentVisitStatsSerializer,
)

User = get_user_model()


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 100


def resolve_user_from_login_identifier(identifier):
    """Resolve a user from username, user email, or employee profile email."""
    if not identifier:
        return None

    if '@' in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
        if user:
            return user

        employee = (
            Employee.objects
            .select_related('user')
            .filter(email__iexact=identifier)
            .first()
        )
        if employee:
            return employee.user

    return User.objects.filter(username__iexact=identifier).first()


# ================= LOGIN ================= #

@api_view(['POST'])
def admin_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    resolved_user = resolve_user_from_login_identifier(username)
    auth_username = resolved_user.username if resolved_user else username
    user = authenticate(username=auth_username, password=password)
    if user is not None and user.role == 'ADMIN':
        return Response({
            "message": "Admin login successful",
            "username": user.username,
            "role": user.role
        })
    return Response({"error": "Invalid Admin credentials"}, status=400)


@api_view(['POST'])
def employee_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    resolved_user = resolve_user_from_login_identifier(username)
    auth_username = resolved_user.username if resolved_user else username
    user = authenticate(username=auth_username, password=password)
    if user is not None and user.role == 'EMPLOYEE':
        return Response({
            "message": "Employee login successful",
            "username": user.username,
            "role": user.role
        })
    return Response({"error": "Invalid Employee credentials"}, status=400)


# ================= JWT TOKEN ================= #

class MyTokenObtainPairView(TokenObtainPairView):
    """Custom token view that returns user role along with tokens"""
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        username_or_email = request.data.get('username', '')
        user = resolve_user_from_login_identifier(username_or_email)
        if user:
            data = request.data.copy()
            data['username'] = user.username
            request._full_data = data
        return super().post(request, *args, **kwargs)


# ✅ Current logged-in user info
class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ================= EMPLOYEE ================= #

class EmployeeListCreateView(generics.ListCreateAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.request.method == 'GET' and self.request.query_params.get('compact') == '1':
            return EmployeeListItemSerializer
        return EmployeeSerializer

    def get_queryset(self):
        user = self.request.user
        department = self.request.query_params.get('department')
        queryset = Employee.objects.select_related('user').order_by('first_name', 'last_name', 'id')

        if user.role == 'MANAGER':
            if not user.managed_department:
                return Employee.objects.none()
            queryset = queryset.filter(department__iexact=user.managed_department)
        elif user.role != 'ADMIN':
            queryset = queryset.filter(user=user)

        if department:
            queryset = queryset.filter(department__iexact=department)

        if self.request.query_params.get('compact') == '1':
            queryset = queryset.only(
                'id', 'user_id', 'employee_id', 'first_name', 'middle_name', 'last_name',
                'email', 'phone', 'department', 'designation', 'joining_date',
                'profile_image', 'emergency_contact_name',
                'emergency_contact_relationship', 'emergency_contact_phone',
                'emergency_contact_occupation', 'user__username', 'user__role',
            )

        return queryset

    def create(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin allowed"}, status=403)

        data = request.data.copy()
        email = data.get('email', '')

        username = email.split('@')[0] if email else "employee"
        while User.objects.filter(username=username).exists():
            username += str(random.randint(1, 99))

        password = ''.join(random.choices(string.ascii_letters, k=8))

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role='EMPLOYEE'
        )

        Employee.objects.create(user=user, **data)

        return Response({
            "message": "Employee created",
            "username": username,
            "password": password
        })


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.select_related('user')
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def update(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can update employees"}, status=status.HTTP_403_FORBIDDEN)

        instance = self.get_object()

        new_designation = request.data.get('designation')
        if new_designation == 'Manager' and instance.user.role != 'MANAGER':
            return Response({
                "error": "Manager designation cannot be manually assigned. Use Manager Management module to promote employees."
            }, status=status.HTTP_403_FORBIDDEN)

        if instance.user.role == 'MANAGER' and new_designation and new_designation != 'Manager':
            prev = getattr(instance, 'previous_designation', None) or 'Team Lead'
            return Response({
                "error": f"Cannot change a Manager's designation directly. Use Manager Management to revoke manager status first (previous designation: {prev})."
            }, status=status.HTTP_403_FORBIDDEN)

        # Handle profile image separately if provided
        if 'profile_image' in request.FILES:
            instance.profile_image = request.FILES['profile_image']
            instance.save(update_fields=['profile_image'])

        # Use partial=True so missing fields don't cause validation errors
        kwargs['partial'] = True
        response = super().update(request, *args, **kwargs)
        # Refresh and return full data
        instance.refresh_from_db()
        from .serializers import EmployeeSerializer as EmpSer
        serializer = EmpSer(instance, context={'request': request})
        response.data = {"message": "Employee updated successfully", "employee": serializer.data}
        return response

    def destroy(self, request, *args, **kwargs):
        """
        Safely delete an employee and their associated User account.
        Handles all dependent records: meetings, leaves, attendance, departments, manager roles.
        """
        if request.user.role != 'ADMIN':
            return Response(
                {"error": "Only admin can delete employees"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            employee = self.get_object()
        except Exception:
            return Response(
                {"error": "Employee not found. They may have already been deleted."},
                status=status.HTTP_404_NOT_FOUND
            )
        user = employee.user
        emp_name = employee.get_full_name() or user.username

        # Prevent deleting yourself
        if user == request.user:
            return Response(
                {"error": "You cannot delete your own account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # 1. If this user is a manager, revoke the role and unlink from department
                from .models import Department
                if user.role == 'MANAGER':
                    Department.objects.filter(manager=user).update(manager=None)
                    user.role = 'EMPLOYEE'
                    user.managed_department = None
                    user.save(update_fields=['role', 'managed_department'])

                # 2. Nullify any department that still references this user as manager
                Department.objects.filter(manager=user).update(manager=None)

                # 3. Nullify leave approvals referencing this user
                from .models import Leave
                Leave.objects.filter(approved_by=user).update(approved_by=None)

                # 4. Remove employee from all meeting attendee lists
                from .models import Meeting
                Meeting.objects.filter(attendees=employee).all()
                for meeting in Meeting.objects.filter(attendees=employee):
                    meeting.attendees.remove(employee)

                # 5. Soft-unlink attendance records (keep history, just remove FK)
                from .models import EmployeeAttendance, AttendanceSummary
                EmployeeAttendance.objects.filter(employee=employee).update(employee=None)
                AttendanceSummary.objects.filter(employee=employee).update(employee=None)

                # 6. Delete leave balance records
                from .models import LeaveBalance
                LeaveBalance.objects.filter(employee=employee).delete()

                # 7. Delete the Employee profile first (breaks OneToOne with User)
                employee.delete()

                # 8. Delete the User — cascades to: Leave, Notification,
                #    Announcement (created_by SET_NULL), HolidayNotification, etc.
                user.delete()

            return Response(
                {"message": f"Employee '{emp_name}' has been deleted successfully."},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to delete employee: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ✅ Create Employee (dedicated endpoint)
class CreateEmployeeView(generics.GenericAPIView):
    serializer_class = EmployeeCreateSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can create employees"}, status=status.HTTP_403_FORBIDDEN)

        employee_data = request.data.copy()
        email = employee_data.get('email', '')
        
        if email and User.objects.filter(email=email).exists():
            return Response(
                {"error": f"A user with email {email} already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        base_username = email.split('@')[0].lower().replace('.', '_') if email else employee_data.get('first_name', 'employee').lower().replace(' ', '_')

        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        email = employee_data.get('email', f"{username}@company.com")

        user = User.objects.create_user(username=username, password=temp_password, email=email, role='EMPLOYEE')

        employee = Employee.objects.create(
            user=user,
            first_name=employee_data.get('first_name', ''),
            middle_name=employee_data.get('middle_name', ''),
            last_name=employee_data.get('last_name', ''),
            gender=employee_data.get('gender', 'MALE'),
            marital_status=employee_data.get('marital_status', 'SINGLE'),
            education=employee_data.get('education', 'HIGH_SCHOOL'),
            email=employee_data.get('email', ''),
            phone=employee_data.get('phone', ''),
            address=employee_data.get('address', ''),
            department=employee_data.get('department', ''),
            designation=employee_data.get('designation', ''),
            joining_date=employee_data.get('joining_date', None),
            casual_leave_balance=employee_data.get('casual_leave_balance', 10),
            sick_leave_balance=employee_data.get('sick_leave_balance', 12),
            paid_leave_balance=employee_data.get('paid_leave_balance', 15)
        )

        return Response({
            "message": "Employee created successfully",
            "employee_id": employee.id,
            "username": username,
            "temporary_password": temp_password,
            "email": email,
        }, status=status.HTTP_201_CREATED)


# ✅ Current Employee Profile
class CurrentEmployeeView(generics.RetrieveAPIView):
    """Get current logged-in employee's profile"""
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        employee = Employee.objects.select_related('user').filter(user=self.request.user).first()
        if employee is None:
            employee = Employee.objects.create(
                user=self.request.user,
                first_name=self.request.user.first_name or '',
                last_name=self.request.user.last_name or '',
                email=self.request.user.email or '',
                department='',
                designation='',
                phone='',
                address='',
                joining_date=date.today(),
            )
        return employee

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance is None:
            return Response(
                {"error": "Employee profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(instance)
        data = serializer.data
        if instance.profile_image:
            data['profile_image_url'] = instance.profile_image.url
        return Response(data)


# ✅ Employee Profile Update
class EmployeeProfileUpdateView(generics.UpdateAPIView):
    """Update employee profile"""
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            return Employee.objects.get(user=self.request.user)
        except Employee.DoesNotExist:
            return None

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance is None:
            return Response(
                {"error": "Employee profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if 'profile_image' in request.FILES:
            instance.profile_image = request.FILES['profile_image']

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        image_url = instance.profile_image.url if instance.profile_image else None

        return Response({
            "message": "Profile updated successfully",
            "data": serializer.data,
            "profile_image_url": image_url
        })


# ✅ Set Password
class EmployeeSetPasswordView(generics.UpdateAPIView):
    """Set/Change employee password"""
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        if not new_password or not confirm_password:
            return Response(
                {"error": "Both fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Password set successfully"})


# ================= ADD EMPLOYEE ================= #

class AddEmployeeView(generics.CreateAPIView):
    """View for adding a new employee (admin only)"""
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response(
                {"error": "Only admin can add employees"},
                status=status.HTTP_403_FORBIDDEN
            )

        employee_data = request.data.copy()
        email = employee_data.get('email', '')
        
        # Check if trying to assign Manager designation
        if employee_data.get('designation') == 'Manager':
            return Response({
                "error": "Manager designation cannot be manually assigned. Use Manager Management module to promote employees."
            }, status=status.HTTP_403_FORBIDDEN)

        if email and User.objects.filter(email=email).exists():
            return Response(
                {"error": f"A user with email {email} already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        base_username = email.split('@')[0].lower().replace('.', '_') if email else employee_data.get('first_name', 'employee').lower().replace(' ', '_')
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        email = employee_data.get('email', f"{username}@company.com")

        user = User.objects.create_user(
            username=username,
            password=temp_password,
            email=email,
            role='EMPLOYEE'
        )

        employee = Employee.objects.create(
            user=user,
            first_name=employee_data.get('first_name', ''),
            middle_name=employee_data.get('middle_name', ''),
            last_name=employee_data.get('last_name', ''),
            gender=employee_data.get('gender', 'MALE'),
            marital_status=employee_data.get('marital_status', 'SINGLE'),
            education=employee_data.get('education', 'HIGH_SCHOOL'),
            email=employee_data.get('email', ''),
            phone=employee_data.get('phone', ''),
            address=employee_data.get('address', ''),
            department=employee_data.get('department', ''),
            designation=employee_data.get('designation', ''),
            joining_date=employee_data.get('joining_date', None),
            casual_leave_balance=employee_data.get('casual_leave_balance', 10),
            sick_leave_balance=employee_data.get('sick_leave_balance', 12),
            paid_leave_balance=employee_data.get('paid_leave_balance', 15),
        )

        serializer = self.get_serializer(employee)
        return Response({
            "message": "Employee created successfully",
            "employee": serializer.data,
            "credentials": {
                "username": username,
                "password": temp_password
            }
        }, status=status.HTTP_201_CREATED)


# ================= LEAVE ================= #

class LeaveViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base = Leave.objects.select_related(
            'employee', 'employee__employee_profile', 'approved_by'
        )
        if user.role == 'ADMIN':
            return base.all().order_by('-applied_at')
        elif user.role == 'MANAGER':
            if hasattr(user, 'managed_department') and user.managed_department:
                dept_employees = Employee.objects.filter(
                    department__iexact=user.managed_department
                ).values_list('user_id', flat=True)
                return base.filter(
                    employee_id__in=dept_employees
                ).order_by('-applied_at')
            return Leave.objects.none()
        return base.filter(employee=user).order_by('-applied_at')

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if request.user.role != 'ADMIN':
            return Response(
                {"error": "Only admin can reject leave."},
                status=status.HTTP_403_FORBIDDEN
            )
        if leave.status != 'PENDING':
            return Response(
                {"error": "Leave already processed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        leave.status = 'REJECTED'
        leave.save()
        return Response(
            {"message": "Leave rejected successfully."},
            status=status.HTTP_200_OK
        )


class LeaveCreateView(generics.CreateAPIView):
    """Create a new leave request"""
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        leave = serializer.save(employee=self.request.user)

        try:
            employee = Employee.objects.get(user=self.request.user)
            dept_name = employee.department
            if dept_name:
                manager_user = User.objects.filter(
                    role='MANAGER',
                    managed_department=dept_name
                ).first()
                if manager_user:
                    Notification.objects.create(
                        user=manager_user,
                        type='LEAVE_REQUEST',
                        title='New Leave Request',
                        message=(
                            f"{employee.first_name} {employee.last_name} has applied for "
                            f"{leave.leave_type} leave from {leave.start_date} to {leave.end_date}."
                        )
                    )
        except Employee.DoesNotExist:
            pass


class LeaveListView(generics.ListAPIView):
    """List all leaves for current user"""
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        user = self.request.user
        base = Leave.objects.select_related(
            'employee', 'employee__employee_profile', 'approved_by'
        )
        if user.role == 'ADMIN':
            return base.all().order_by('-applied_at')
        return base.filter(employee=user).order_by('-applied_at')


# ✅ Approve / Reject Leave
class LeaveApproveRejectView(generics.UpdateAPIView):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        leave = self.get_object()
        user = request.user

        status_value = request.data.get("status")
        comments = request.data.get("comments", "")

        if user.role not in ['ADMIN', 'MANAGER']:
            return Response(
                {"error": "Only admin or manager can approve/reject leaves"},
                status=status.HTTP_403_FORBIDDEN
            )

        if user.role == 'MANAGER':
            try:
                employee_profile = Employee.objects.get(user=leave.employee)
                employee_department = employee_profile.department
            except Employee.DoesNotExist:
                return Response({"error": "Employee profile not found"}, status=status.HTTP_404_NOT_FOUND)
            
            if not user.managed_department:
                return Response({"error": "No department assigned"}, status=status.HTTP_403_FORBIDDEN)
            if employee_department.lower() != user.managed_department.lower():
                return Response(
                    {"error": f"You can only manage leaves for {user.managed_department} department"},
                    status=status.HTTP_403_FORBIDDEN
                )

        if status_value not in ["APPROVED", "REJECTED"]:
            return Response(
                {"error": "Invalid status. Must be APPROVED or REJECTED"},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = status_value
        leave.approved_by = user
        leave.comments = comments
        leave.save()

        Notification.objects.create(
            user=leave.employee,
            type=f'LEAVE_{status_value}',
            title=f'Leave Request {status_value.capitalize()}',
            message=(
                f'Your {leave.leave_type} leave request from {leave.start_date} to {leave.end_date} '
                f'has been {status_value.lower()}.'
                + (f' Comment: {comments}' if comments else '')
            )
        )

        return Response({
            "message": f"Leave {status_value} successfully",
            "status": status_value,
            "approved_by": user.username,
            "comments": comments
        })


# ✅ Delete Leave
class LeaveDeleteView(generics.DestroyAPIView):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        leave = self.get_object()

        if request.user.role == "ADMIN":
            leave.delete()
            return Response({"message": "Leave request deleted successfully"}, status=status.HTTP_200_OK)

        elif request.user.role in ["EMPLOYEE", "MANAGER"]:
            if leave.employee != request.user:
                return Response(
                    {"error": "You can only delete your own leave requests"},
                    status=status.HTTP_403_FORBIDDEN
                )
            if leave.status != "PENDING":
                return Response(
                    {"error": "You can only delete pending leave requests"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            leave.delete()
            return Response({"message": "Leave request deleted successfully"}, status=status.HTTP_200_OK)

        else:
            return Response(
                {"error": "You don't have permission to delete leaves"},
                status=status.HTTP_403_FORBIDDEN
            )


# ✅ Manager Views
class ManagerLeaveListView(generics.ListAPIView):
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        base = Leave.objects.select_related(
            'employee', 'employee__employee_profile', 'approved_by'
        )
        if user.role == 'ADMIN':
            return base.order_by('-applied_at')
        elif user.role == 'MANAGER' and user.managed_department:
            department_employees = Employee.objects.filter(
                department__iexact=user.managed_department,
                user__role='EMPLOYEE'
            ).values_list('user_id', flat=True)
            return base.filter(
                employee_id__in=department_employees
            ).order_by('-applied_at')
        return base.filter(employee=user).order_by('-applied_at')


class DepartmentEmployeesView(generics.ListAPIView):
    serializer_class = EmployeeListItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        department = self.request.query_params.get('department')

        base_qs = Employee.objects.select_related('user').only(
            'id', 'user_id', 'employee_id', 'first_name', 'middle_name', 'last_name',
            'email', 'phone', 'department', 'designation', 'joining_date',
            'profile_image', 'emergency_contact_name',
            'emergency_contact_relationship', 'emergency_contact_phone',
            'emergency_contact_occupation', 'user__username', 'user__role',
        ).order_by('first_name', 'last_name', 'id')
        if user.role == 'ADMIN':
            if department:
                return base_qs.filter(department__iexact=department)
            return base_qs.all()
        elif user.role == 'MANAGER' and user.managed_department:
            return base_qs.filter(department__iexact=user.managed_department)
        return Employee.objects.none()


# ✅ Admin: Promote Employee to Manager (with designation update)
class PromoteEmployeeView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can promote employees"}, status=status.HTTP_403_FORBIDDEN)

        employee_id = request.data.get('employee_id')
        if not employee_id:
            return Response({"error": "employee_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            employee = Employee.objects.get(id=employee_id)
            if employee.user.role == 'MANAGER':
                return Response({"error": "Employee is already a manager"}, status=status.HTTP_400_BAD_REQUEST)

            employee_dept = employee.department.strip()
            if not employee_dept:
                return Response({"error": "Employee must belong to a department to be promoted"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if department already has a manager
            existing_manager = User.objects.filter(
                role='MANAGER', 
                managed_department__iexact=employee_dept
            ).first()
            if existing_manager:
                return Response({
                    "error": f"A manager is already assigned to this department ({existing_manager.username})"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get or create department
            dept, created = Department.objects.get_or_create(name=employee_dept)
            
            # Store previous designation
            employee.previous_designation = employee.designation
            
            # Update role to MANAGER
            employee.user.role = 'MANAGER'
            employee.user.managed_department = employee_dept
            employee.user.save()
            
            # Auto-update designation to "Manager"
            employee.designation = 'Manager'
            employee.save()

            # Assign to department
            dept.manager = employee.user
            dept.save()

            Notification.objects.create(
                user=employee.user,
                type='ANNOUNCEMENT',
                title='You have been promoted to Manager',
                message=f'Congratulations! You have been promoted to Manager of {employee_dept} department. Your designation has been updated to Manager.'
            )

            return Response({
                "message": f"{employee.user.username} promoted to manager of {employee_dept} successfully",
                "department": employee_dept,
                "designation": "Manager",
                "manager_id": employee.user.id
            })
        except Employee.DoesNotExist:
            return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)
        except Department.DoesNotExist:
            return Response({"error": f"Department {employee_dept} not found"}, status=status.HTTP_404_NOT_FOUND)


# ✅ Admin: Revoke Manager Role (with designation restore)
class RevokeManagerView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can revoke manager role"}, status=status.HTTP_403_FORBIDDEN)

        manager_id = request.data.get('manager_id')
        if not manager_id:
            return Response({"error": "manager_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Try to find the user — accept both MANAGER role and already-demoted users
        try:
            manager = User.objects.get(id=manager_id)
        except User.DoesNotExist:
            return Response({"error": "Manager not found"}, status=status.HTTP_404_NOT_FOUND)

        # If already an employee, nothing to do — return success so frontend stays consistent
        if manager.role != 'MANAGER':
            return Response({
                "message": f"{manager.username} is already an employee.",
                "manager_id": manager.id
            })

        old_dept_name = manager.managed_department

        # Get employee profile
        try:
            employee = Employee.objects.get(user=manager)
            restored_designation = getattr(employee, 'previous_designation', None) or 'Team Lead'
        except Employee.DoesNotExist:
            restored_designation = 'Team Lead'

        # Clear from Department model
        if old_dept_name:
            try:
                dept = Department.objects.get(name=old_dept_name)
                dept.manager = None
                dept.save()
            except Department.DoesNotExist:
                pass

        manager.role = 'EMPLOYEE'
        manager.managed_department = None
        manager.save()

        # Update employee designation if profile exists
        try:
            employee = Employee.objects.get(user=manager)
            employee.designation = restored_designation
            employee.previous_designation = None
            employee.save()
        except Employee.DoesNotExist:
            pass

        Notification.objects.create(
            user=manager,
            type='ANNOUNCEMENT',
            title='Manager Role Revoked',
            message=f'Your manager role has been revoked. You are now an employee with designation: {restored_designation}.'
        )

        return Response({
            "message": f"{manager.username} has been demoted to Employee.",
            "designation": restored_designation,
            "manager_id": manager.id
        })


class AllManagersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        return User.objects.filter(role='MANAGER').select_related('employee_profile').select_related('employee_profile')


class AllUsersView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'ADMIN':
            return User.objects.none()
        return User.objects.all().select_related('employee_profile').select_related('employee_profile')


class AllDepartmentsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can view departments"}, status=status.HTTP_403_FORBIDDEN)

        dept_names = Employee.objects.exclude(department='').values_list('department', flat=True).distinct()
        departments_list = []
        for i, name in enumerate(dept_names, 1):
            departments_list.append({'id': i, 'name': name})
        return Response(departments_list)


class AssignManagerToDepartmentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can assign managers"}, status=status.HTTP_403_FORBIDDEN)

        department_id = request.data.get('department_id')
        manager_id = request.data.get('manager_id')

        if not department_id or not manager_id:
            return Response(
                {"error": "Department ID and Manager ID are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            manager = User.objects.get(id=manager_id, role='MANAGER')

            try:
                department = Department.objects.get(id=int(department_id))
            except Department.DoesNotExist:
                dept_names = list(
                    Employee.objects.exclude(department='')
                    .values_list('department', flat=True)
                    .distinct()
                )
                idx = int(department_id) - 1
                if 0 <= idx < len(dept_names):
                    dept_name = dept_names[idx]
                    department, _ = Department.objects.get_or_create(name=dept_name)
                else:
                    return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)

            # Get manager's employee department
            try:
                manager_employee = Employee.objects.get(user=manager)
                manager_dept = manager_employee.department.strip()
            except Employee.DoesNotExist:
                return Response({"error": "Manager has no employee profile with department"}, status=status.HTTP_400_BAD_REQUEST)

            # Strict department match check
            if manager_dept.lower() != department.name.lower():
                return Response({
                    "error": f"Manager can only be assigned to own department: {manager_dept}"
                }, status=status.HTTP_400_BAD_REQUEST)

            # One manager per department - block if different manager assigned
            if department.manager and str(department.manager.id) != str(manager.id):
                return Response({
                    "error": f"A manager is already assigned to this department ({department.manager.username}). Remove existing manager first."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Clear manager's previous assignment if different dept
            if manager.managed_department and manager.managed_department.lower() != department.name.lower():
                try:
                    old_dept = Department.objects.get(name__iexact=manager.managed_department)
                    if old_dept.manager == manager:
                        old_dept.manager = None
                        old_dept.save()
                except Department.DoesNotExist:
                    pass

            department.manager = manager
            department.save()

            manager.managed_department = department.name
            manager.save()

            Notification.objects.create(
                user=manager,
                type='ANNOUNCEMENT',
                title=f'Assigned as Manager of {department.name}',
                message=f'You have been assigned as the Manager of {department.name} department.'
            )

            return Response({
                "message": f"Manager {manager.username} assigned to {department.name} department successfully",
                "department_id": department.id,
                "manager_id": manager.id,
                "department_name": department.name,
                "manager_department": manager_dept
            })

        except User.DoesNotExist:
            return Response({"error": "Manager not found"}, status=status.HTTP_404_NOT_FOUND)
        except Employee.DoesNotExist:
            return Response({"error": "Manager employee profile not found"}, status=status.HTTP_404_NOT_FOUND)


class RemoveManagerFromDepartmentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can remove managers"}, status=status.HTTP_403_FORBIDDEN)

        manager_id = request.data.get('manager_id')
        if not manager_id:
            return Response({"error": "Manager ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            manager = User.objects.get(id=manager_id, role='MANAGER')
            old_dept = manager.managed_department

            if old_dept:
                try:
                    dept = Department.objects.get(name=old_dept)
                    dept.manager = None
                    dept.save()
                except Department.DoesNotExist:
                    pass

            manager.managed_department = None
            manager.save()

            return Response({
                "message": f"Manager {manager.username} removed from {old_dept} department",
                "manager_id": manager.id,
                "manager_name": manager.username
            })
        except User.DoesNotExist:
            return Response({"error": "Manager not found"}, status=status.HTTP_404_NOT_FOUND)


class UpdateManagerView(generics.UpdateAPIView):
    queryset = User.objects.filter(role='MANAGER')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can update manager details"}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)


# ✅ Department Views
class DepartmentListCreateView(generics.ListCreateAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can view departments"}, status=status.HTTP_403_FORBIDDEN)

        include_employee_departments = request.query_params.get('include_employee_departments') == '1'
        cache_key = f'departments_summary_v2_include_{int(include_employee_departments)}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        employee_counts = {
            row['department']: row['count']
            for row in (
                Employee.objects
                .exclude(department='')
                .values('department')
                .annotate(count=Count('id'))
            )
        }

        departments = list(Department.objects.select_related('manager').order_by('name'))
        seen = set()
        data = []
        for dept in departments:
            key = dept.name.strip().lower()
            seen.add(key)
            data.append({
                'id': dept.id,
                'name': dept.name,
                'description': dept.description,
                'manager': dept.manager_id,
                'manager_name': dept.manager.username if dept.manager else None,
                'employee_count': employee_counts.get(dept.name, 0),
                'source': 'backend',
            })

        if include_employee_departments:
            next_id = 1
            for name, count in employee_counts.items():
                if name.strip().lower() in seen:
                    continue
                data.append({
                    'id': f'empdept-{next_id}',
                    'name': name,
                    'description': '',
                    'manager': None,
                    'manager_name': None,
                    'employee_count': count,
                    'source': 'employee',
                })
                next_id += 1

        cache.set(cache_key, data, timeout=300)
        return Response(data)

    def create(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can create departments"}, status=status.HTTP_403_FORBIDDEN)
        cache.delete('departments_summary_v2_include_0')
        cache.delete('departments_summary_v2_include_1')
        return super().create(request, *args, **kwargs)


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can update departments"}, status=status.HTTP_403_FORBIDDEN)
        cache.delete('departments_summary_v2_include_0')
        cache.delete('departments_summary_v2_include_1')
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only admin can delete departments"}, status=status.HTTP_403_FORBIDDEN)
        cache.delete('departments_summary_v2_include_0')
        cache.delete('departments_summary_v2_include_1')
        return super().destroy(request, *args, **kwargs)


class DepartmentListView(generics.ListAPIView):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Department.objects.select_related('manager').order_by('name')


# ✅ Notification Views
class UserNotificationsView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')


class MarkNotificationReadView(generics.UpdateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        if notification.user != request.user:
            return Response({"error": "You don't have permission"}, status=status.HTTP_403_FORBIDDEN)
        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marked as read"})


class MarkAllNotificationsReadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read"})


# ================= MEETING ================= #

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]


# ================= HOLIDAY ================= #

class HolidayViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['year', 'is_active', 'holiday_type']
    queryset = Holiday.objects.all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated]


# ================= PASSWORD RESET ================= #

class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = resolve_user_from_login_identifier(email)
            if not user:
                raise User.DoesNotExist
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"http://localhost:5173/reset-password/{uid}/{token}"
            subject = 'HRMS Password Reset Request'
            message = f"""Hello {user.username},

You requested a password reset for your HRMS account.

Click the link below to reset your password:
{reset_link}

This link expires in 24 hours. If you didn't request this, please ignore this email.

Best regards,
HRMS Team — ELOGIXA"""
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
                return Response(
                    {"message": "Password reset email sent successfully"})
            except Exception as e:
                return Response({
                    "message": "Email sending failed (dev mode — use the link below)",
                    "reset_link": reset_link,
                    "error": str(e)
                })

        except User.DoesNotExist:
            return Response(
                {
                    "message": "If an account exists with this email, a reset link has been sent"
                }
            )


class PasswordResetConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not all([uid, token, new_password, confirm_password]):
            return Response(
                {"error": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(new_password) < 8:
            return Response(
                {"error": "Password must be at least 8 characters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid_decoded)
            if not default_token_generator.check_token(user, token):
                return Response(
                    {"error": "Invalid or expired reset link"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(new_password)
            user.save()
            return Response(
                {
                    "message": "Password reset successfully. You can now log in."
                }
            )
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid reset link"},
                status=status.HTTP_400_BAD_REQUEST
            )


# ✅ Legacy Password Reset
@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=400)

    try:
        user = resolve_user_from_login_identifier(email)
        if not user:
            raise User.DoesNotExist
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}"
        subject = 'Password Reset Request - ELOGIXA HRMS'
        message = f"""Hello {user.username},

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.
If you did not request this, please ignore this email."""
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email], fail_silently=False)
        except Exception as mail_error:
            return Response({'error': f'Failed to send email: {str(mail_error)}'}, status=500)

        return Response({'message': 'Password reset link sent to your email!'})
    except User.DoesNotExist:
        return Response(
            {
                'message': 'If an account exists with this email, you will receive a reset link.'
            }
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    if not uid or not token or not new_password:
        return Response({'error': 'Missing required fields'}, status=400)

    try:
        uid_decoded = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=uid_decoded)
        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password reset successful'})
        return Response({'error': 'Invalid or expired token'}, status=400)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Invalid reset link'}, status=400)


# ================= HOLIDAY EMAIL FUNCTIONS ================= #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_holiday_email(request):
    """Send holiday wishes email for a specific holiday"""
    try:
        if request.user.role != 'ADMIN':
            return Response(
                {"error": "Only admin can send holiday emails"},
                status=status.HTTP_403_FORBIDDEN
            )
        holiday_id = request.data.get('holiday_id')
        if not holiday_id:
            return Response(
                {"error": "holiday_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            holiday = Holiday.objects.get(id=holiday_id, is_active=True)
        except Holiday.DoesNotExist:
            return Response(
                {"error": "Holiday not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        employees = Employee.objects.filter(email__isnull=False).exclude(email='')
        if employees.count() == 0:
            return Response(
                {"error": "No employees found with email addresses"},
                status=status.HTTP_404_NOT_FOUND
            )
        success_count = 0
        for employee in employees:
            try:
                send_mail(
                    subject=f"Happy {holiday.name}!",
                    message=f"Wishing you a happy {holiday.name}!",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[employee.email],
                    fail_silently=True,
                )
                success_count += 1
            except Exception as e:
                print(f"Failed to send to {employee.email}: {e}")
        return Response({
            "success": True,
            "message": f"Holiday emails sent to {success_count} employees"
        })
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def send_holiday_wishes(request):
    """Send holiday wishes to all employees"""
    try:
        employees = Employee.objects.filter(email__isnull=False).exclude(email='')
        for employee in employees:
            send_mail(
                "Holiday Wishes from HRMS",
                "Wishing you a wonderful holiday season!",
                settings.DEFAULT_FROM_EMAIL,
                [employee.email],
                fail_silently=True
            )
        return Response({"message": f"Holiday wishes sent to {employees.count()} employees"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
def test_email_direct(request):
    """Simple test email endpoint"""
    try:
        send_mail(
            'Test Email from HRMS',
            'This is a test email to verify SMTP configuration.',
            settings.DEFAULT_FROM_EMAIL,
            ['test@example.com'],
            fail_silently=False,
        )
        return Response({"message": "Test email sent successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# ================= ANNOUNCEMENT MODULE ================= #

@api_view(['POST'])
def create_announcement(request):
    if not request.user.is_authenticated:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    serializer = AnnouncementSerializer(
        data=request.data, context={'request': request})
    if serializer.is_valid():
        announcement = serializer.save(created_by=request.user)
        if announcement.send_email:
            employee_emails = Employee.objects.exclude(email='').values_list('email', flat=True)
            email_list = list(employee_emails)
            if email_list:
                send_mail(
                    subject=f"📢 {announcement.title}",
                    message=announcement.description,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=email_list,
                    fail_silently=False,
                )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_announcements(request):
    announcements = Announcement.objects.all().order_by('-created_at')
    serializer = AnnouncementSerializer(announcements, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
def delete_announcement(request, pk):
    try:
        announcement = Announcement.objects.get(pk=pk)
    except Announcement.DoesNotExist:
        return Response({"error": "Announcement not found"}, status=404)
    announcement.delete()
    return Response({"message": "Announcement deleted successfully"})


@api_view(['PUT'])
def update_announcement(request, pk):
    try:
        announcement = Announcement.objects.get(pk=pk)
    except Announcement.DoesNotExist:
        return Response({"error": "Announcement not found"}, status=404)
    serializer = AnnouncementSerializer(
        announcement, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Announcement.objects.all().order_by('-created_at')
        
        # For employees, only show active announcements (not expired)
        if user.role == 'EMPLOYEE':
            today = timezone.now().date()
            queryset = queryset.filter(
                Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
            )
        
        return queryset

    def perform_create(self, serializer):
        # Only allow admins to create announcements
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied("Only admins can create announcements")
        
        announcement = serializer.save(created_by=self.request.user)
        if announcement.send_email:
            employees = User.objects.filter(role='EMPLOYEE')
            email_list = [emp.email for emp in employees if emp.email]
            if email_list:
                send_mail(
                    subject=announcement.title,
                    message=announcement.description,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=email_list,
                    fail_silently=True,
                )


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Announcement.objects.all()
        
        # For employees, only allow access to active announcements
        if user.role == 'EMPLOYEE':
            today = timezone.now().date()
            queryset = queryset.filter(
                Q(expiry_date__isnull=True) | Q(expiry_date__gte=today)
            )
        
        return queryset

    def perform_update(self, serializer):
        # Only allow admins to update
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied("Only admins can update announcements")
        serializer.save()

    def perform_destroy(self, instance):
        # Only allow admins to delete
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied("Only admins can delete announcements")
        instance.delete()


class PinnedAnnouncementsView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Announcement.objects.filter(is_pinned=True).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=timezone.now().date())
        ).order_by('-created_at')


class AnnouncementHistoryView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Announcement.objects.filter(expiry_date__lt=timezone.now().date()).order_by('-created_at')


class CalendarAnnouncementsView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Announcement.objects.filter(event_date__isnull=False).order_by('event_date')


# ===== DASHBOARD STATS VIEW =====

class DashboardStatsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DashboardStatsSerializer

    def get(self, request):
        user = request.user
        cache_key = f'dashboard_stats_{user.id}_{user.role}_{user.managed_department or "none"}'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        # Fail-safe: if stats computation breaks, return a valid (zeroed) payload instead of 500.
        try:
            attendance_rate = 95.2
            recent_activity = Notification.objects.filter(user=user).count()

            # Counts
            from django.db.models import Count, Q

            if user.role == 'ADMIN':
                stats = Employee.objects.aggregate(
                    total_employees=Count('id'),
                    unique_depts=Count('department', distinct=True),
                )
                total_employees = stats.get('total_employees') or 0
                unique_depts = stats.get('unique_depts') or 0

                leave_stats = Leave.objects.aggregate(
                    pending_leaves=Count('id', filter=Q(status='PENDING')),
                    total_leaves=Count('id'),
                )
                pending_leaves = leave_stats.get('pending_leaves') or 0
                total_leaves = leave_stats.get('total_leaves') or 0

            elif user.role == 'MANAGER' and user.managed_department:
                emp_qs = Employee.objects.filter(department__iexact=user.managed_department)
                total_employees = emp_qs.count()
                unique_depts = 1

                dept_users = emp_qs.values_list('user_id', flat=True)
                leave_stats = Leave.objects.filter(employee_id__in=dept_users).aggregate(
                    pending_leaves=Count('id', filter=Q(status='PENDING')),
                    total_leaves=Count('id'),
                )
                pending_leaves = leave_stats.get('pending_leaves') or 0
                total_leaves = leave_stats.get('total_leaves') or 0

            else:
                # EMPLOYEE fallback
                total_employees = 1
                unique_depts = 1
                leave_stats = Leave.objects.filter(employee=user).aggregate(
                    pending_leaves=Count('id', filter=Q(status='PENDING')),
                    total_leaves=Count('id'),
                )
                pending_leaves = leave_stats.get('pending_leaves') or 0
                total_leaves = leave_stats.get('total_leaves') or 0

            # Pinned announcements
            pinned_announcements_qs = Announcement.objects.filter(is_pinned=True).filter(
                Q(expiry_date__isnull=True) | Q(expiry_date__gte=timezone.now().date())
            ).order_by('-created_at')[:6]

            pinned_announcements = [
                {
                    'id': ann.id,
                    'title': ann.title,
                    'description': ann.description,
                    'created_at': ann.created_at.isoformat() if ann.created_at else None,
                    'is_pinned': ann.is_pinned,
                    'expiry_date': ann.expiry_date.isoformat() if ann.expiry_date else None,
                    'attachment': getattr(ann.attachment, 'url', None),
                }
                for ann in pinned_announcements_qs
            ]

            # Next holiday
            today = timezone.now().date()
            next_holiday_obj = Holiday.objects.filter(is_active=True, date__gte=today).order_by('date').first()
            next_holiday = None
            if next_holiday_obj is not None:
                next_holiday = {
                    'id': next_holiday_obj.id,
                    'name': next_holiday_obj.name,
                    'date': next_holiday_obj.date.isoformat() if next_holiday_obj.date else None,
                    'holiday_type': next_holiday_obj.holiday_type,
                }

            data = {
                'total_employees': int(total_employees),
                'unique_departments': int(unique_depts),
                'pending_leaves': int(pending_leaves),
                'total_leaves': int(total_leaves),
                'attendance_rate': float(attendance_rate),
                'recent_activity': int(recent_activity),
                'pinned_announcements': pinned_announcements,
                'next_holiday': next_holiday,
            }

        except Exception:
            # Optional: log the exception server-side with traceback if desired.
            data = {
                'total_employees': 0,
                'unique_departments': 0,
                'pending_leaves': 0,
                'total_leaves': 0,
                'attendance_rate': 95.2,
                'recent_activity': 0,
                'pinned_announcements': [],
                'next_holiday': None,
            }

        # Return computed data directly.
        # DashboardStatsSerializer is not required for output validation and using it with
        # is_valid(raise_exception=True) can incorrectly trigger HTTP 400.
        cache.set(cache_key, data, timeout=120)
        return Response(data)




@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def reports_leaves(request):
    """HR Leave Report"""
    if request.user.role not in ['ADMIN', 'MANAGER']:
        return Response({"error": "Admin or Manager only"}, status=403)

    scope = request.query_params.get('scope', 'all')
    employee_id = request.query_params.get('employee_id')
    department = request.query_params.get('department', 'all')
    date_mode = request.query_params.get('date_mode', 'single')
    frequency = request.query_params.get('frequency', 'daily')

    if date_mode == 'single':
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({"error": "Date required"}, status=400)
        start_date = end_date = date_str
    else:
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if not start_date or not end_date:
            return Response({"error": "Start/End dates required"}, status=400)

    # Optimized: select_related employee profile to avoid N+1
    # Leave.employee is a FK to User; Employee profile is accessed via employee__employee_profile
    queryset = Leave.objects.select_related(
        'employee', 'employee__employee_profile', 'approved_by'
    ).all().order_by('-applied_at')

    # For managers, filter to their department only
    if request.user.role == 'MANAGER':
        manager_dept = request.user.managed_department
        if manager_dept:
            queryset = queryset.filter(employee__employee_profile__department__iexact=manager_dept)
        else:
            return Response({"error": "Manager not assigned to a department"}, status=403)

    if scope == 'individual' and employee_id:
        queryset = queryset.filter(employee__employee_profile__employee_id=employee_id)
    if department != 'all' and request.user.role == 'ADMIN':
        queryset = queryset.filter(employee__employee_profile__department__icontains=department)

    try:
        start_dt = parse_date(start_date)
        end_dt = parse_date(end_date)
        if not start_dt or not end_dt:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
        queryset = queryset.filter(
            start_date__lte=end_dt,
            end_date__gte=start_dt
        )
    except (ValueError, TypeError):
        return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

    leaves = queryset.distinct()

    # Aggregate counts in single query instead of multiple .count() calls
    summary_counts = leaves.aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status='PENDING')),
        approved=Count('id', filter=Q(status='APPROVED')),
        rejected=Count('id', filter=Q(status='REJECTED')),
    )

    data = []
    for leave in leaves:
        user = leave.employee  # User object
        try:
            emp = user.employee_profile  # Employee object
            emp_name = f"{emp.first_name or ''} {emp.last_name or ''}".strip()
            emp_id = emp.employee_id or 'N/A'
            emp_dept = emp.department or 'N/A'
        except Exception:
            emp_name = user.get_full_name() or user.username
            emp_id = 'N/A'
            emp_dept = 'N/A'
        days_count = (leave.end_date - leave.start_date).days + 1
        data.append({
            'id': leave.id,
            'date': leave.start_date,
            'employee_name': emp_name,
            'employee_id': emp_id,
            'department': emp_dept,
            'leave_type': leave.leave_type,
            'from_date': leave.start_date,
            'to_date': leave.end_date,
            'start_date': leave.start_date,
            'end_date': leave.end_date,
            'days': days_count,
            'total_days': days_count,
            'leave_days': days_count,
            'status': leave.status,
            'reason': leave.reason or '',
            'applied_at': leave.applied_at.isoformat() if leave.applied_at else None,
            'approved_by': leave.approved_by.username if leave.approved_by else None,
            'comments': leave.comments or ''
        })

    summary = {
        'total_leaves': summary_counts['total'],
        'pending': summary_counts['pending'],
        'approved': summary_counts['approved'],
        'rejected': summary_counts['rejected'],
        'total_employees': Employee.objects.count()
    }

    return Response({
        'data': data,
        'summary': summary
    }, status=200)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def reports_attendance(request):
    """HR Attendance Report"""
    if request.user.role not in ['ADMIN', 'MANAGER']:
        return Response({"error": "Admin or Manager only"}, status=403)

    scope = request.query_params.get('scope', 'all')
    employee_id = request.query_params.get('employee_id')
    department = request.query_params.get('department', 'all')
    date_mode = request.query_params.get('date_mode', 'single')
    frequency = request.query_params.get('frequency', 'daily')

    if date_mode == 'single':
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({"error": "Date required"}, status=400)
        start_date = end_date = date_str
    else:
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if not start_date or not end_date:
            return Response({"error": "Start/End dates required"}, status=400)

    # For now, we'll simulate attendance data since there's no attendance model
    # In a real system, you'd have an Attendance model with login/logout times
    
    queryset = Employee.objects.select_related('user').all()

    # For managers, filter to their department only
    if request.user.role == 'MANAGER':
        manager_dept = request.user.managed_department
        if manager_dept:
            queryset = queryset.filter(department__iexact=manager_dept)
        else:
            return Response({"error": "Manager not assigned to a department"}, status=403)

    if scope == 'individual' and employee_id:
        queryset = queryset.filter(id=employee_id)
    if department != 'all' and request.user.role == 'ADMIN':
        queryset = queryset.filter(department__icontains=department)

    employees = queryset.distinct()

    try:
        start_dt = parse_date(start_date)
        end_dt = parse_date(end_date)
        if not start_dt or not end_dt:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
    except (ValueError, TypeError):
        return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

    data = []
    total_working_days = (end_dt - start_dt).days + 1
    
    # Calculate business days (excluding weekends)
    business_days = 0
    current_date = start_dt
    while current_date <= end_dt:
        if current_date.weekday() < 5:  # Monday to Friday
            business_days += 1
        current_date += timedelta(days=1)
    
    total_present = 0
    total_absent = 0
    total_late = 0
    total_early_leave = 0
    
    # Pre-fetch all approved leaves for the period in ONE query
    employee_user_ids = list(employees.values_list('user_id', flat=True))
    all_leaves = Leave.objects.filter(
        employee_id__in=employee_user_ids,
        start_date__lte=end_dt,
        end_date__gte=start_dt,
        status='APPROVED'
    )
    # Build lookup dict: user_id -> list of leaves
    leaves_by_employee = {}
    for leave in all_leaves:
        leaves_by_employee.setdefault(leave.employee_id, []).append(leave)
    
    for employee in employees:
        # Use prefetched leave data
        leaves_in_period = leaves_by_employee.get(employee.user_id, [])
        
        leave_days = 0
        for leave in leaves_in_period:
            leave_start = max(start_dt, leave.start_date)
            leave_end = min(end_dt, leave.end_date)
            leave_days += (leave_end - leave_start).days + 1
        
        # Calculate attendance (simulated with some randomness)
        available_days = business_days - leave_days
        present_days = max(0, available_days - random.randint(0, max(1, available_days // 10)))  # Some absences
        absent_days = available_days - present_days
        late_days = random.randint(0, min(3, present_days))  # Some late arrivals
        early_leave_days = random.randint(0, min(2, present_days))  # Some early leaves
        
        # Calculate working hours (assuming 8 hours per day)
        total_hours = present_days * 8
        overtime_hours = random.randint(0, present_days * 2)  # Some overtime
        actual_hours = total_hours + overtime_hours - (late_days * 0.5) - (early_leave_days * 0.5)
        
        attendance_percentage = round((present_days / business_days) * 100, 2) if business_days > 0 else 0
        
        data.append({
            'id': employee.id,
            'date': start_date if date_mode == 'single' else f"{start_date} to {end_date}",
            'employee_name': f"{employee.first_name or ''} {employee.last_name or ''}".strip(),
            'employee_id': getattr(employee, 'employee_id', 'N/A'),
            'department': getattr(employee, 'department', 'N/A'),
            'designation': getattr(employee, 'designation', 'N/A'),
            'business_days': business_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'leave_days': leave_days,
            'late_days': late_days,
            'early_leave_days': early_leave_days,
            'total_hours': total_hours,
            'overtime_hours': overtime_hours,
            'actual_hours': round(actual_hours, 1),
            'attendance_percentage': attendance_percentage,
            'status': 'Regular' if attendance_percentage >= 85 else 'Irregular',
            'login_time': '09:00 AM' if present_days > 0 else None,
            'logout_time': '05:00 PM' if present_days > 0 else None,
        })
        
        total_present += present_days
        total_absent += absent_days
        total_late += late_days
        total_early_leave += early_leave_days

    summary = {
        'total_employees': employees.count(),
        'total_business_days': business_days,
        'total_present_days': total_present,
        'total_absent_days': total_absent,
        'total_leave_days': sum(d['leave_days'] for d in data),
        'total_late_days': total_late,
        'total_early_leave_days': total_early_leave,
        'average_attendance': round(sum(d['attendance_percentage'] for d in data) / len(data), 2) if data else 0,
        'regular_employees': len([d for d in data if d['status'] == 'Regular']),
        'irregular_employees': len([d for d in data if d['status'] == 'Irregular']),
        'total_overtime_hours': sum(d['overtime_hours'] for d in data),
        'average_working_hours': round(sum(d['actual_hours'] for d in data) / len(data), 1) if data else 0
    }

    return Response({
        'data': data,
        'summary': summary
    }, status=200)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def reports_employees(request):
    """HR Employee Activity Report"""
    if request.user.role not in ['ADMIN', 'MANAGER']:
        return Response({"error": "Admin or Manager only"}, status=403)

    scope = request.query_params.get('scope', 'all')
    employee_id = request.query_params.get('employee_id')
    department = request.query_params.get('department', 'all')
    date_mode = request.query_params.get('date_mode', 'single')
    frequency = request.query_params.get('frequency', 'daily')

    if date_mode == 'single':
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({"error": "Date required"}, status=400)
        start_date = end_date = date_str
    else:
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if not start_date or not end_date:
            return Response({"error": "Start/End dates required"}, status=400)

    queryset = Employee.objects.select_related('user').all()

    # For managers, filter to their department only
    if request.user.role == 'MANAGER':
        manager_dept = request.user.managed_department
        if manager_dept:
            queryset = queryset.filter(department__iexact=manager_dept)
        else:
            return Response({"error": "Manager not assigned to a department"}, status=403)

    if scope == 'individual' and employee_id:
        queryset = queryset.filter(id=employee_id)
    if department != 'all' and request.user.role == 'ADMIN':
        queryset = queryset.filter(department__icontains=department)

    employees = queryset.distinct()

    try:
        start_dt = parse_date(start_date)
        end_dt = parse_date(end_date)
        if not start_dt or not end_dt:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
    except (ValueError, TypeError):
        return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)

    # Pre-fetch all leaves to avoid N+1 queries
    employee_user_ids = list(employees.values_list('user_id', flat=True))
    
    # Pre-fetch leaves for all employees in one query
    all_leaves = Leave.objects.filter(
        employee_id__in=employee_user_ids,
        start_date__lte=end_dt,
        end_date__gte=start_dt
    )
    leaves_by_employee = {}
    for leave in all_leaves:
        leaves_by_employee.setdefault(leave.employee_id, []).append(leave)
    
    data = []
    
    for employee in employees:
        # Use prefetched leave data
        leaves_in_period = leaves_by_employee.get(employee.user_id, [])
        
        total_leave_days = sum(
            min(end_dt, leave.end_date) - max(start_dt, leave.start_date) + timedelta(days=1)
            for leave in leaves_in_period
        ).days if leaves_in_period else 0
        
        # Count approved/pending from prefetched data
        approved_leaves = sum(1 for l in leaves_in_period if l.status == 'APPROVED')
        pending_leaves = sum(1 for l in leaves_in_period if l.status == 'PENDING')
        
        # Calculate tenure
        tenure_days = None
        if employee.joining_date:
            tenure_days = (date.today() - employee.joining_date).days
        
        # Simulate performance metrics
        performance_score = random.randint(70, 100)
        tasks_completed = random.randint(10, 50)
        projects_assigned = random.randint(1, 5)
        
        data.append({
            'id': employee.id,
            'date': start_date if date_mode == 'single' else f"{start_date} to {end_date}",
            'employee_name': f"{employee.first_name or ''} {employee.last_name or ''}".strip(),
            'employee_id': getattr(employee, 'employee_id', 'N/A'),
            'department': getattr(employee, 'department', 'N/A'),
            'designation': getattr(employee, 'designation', 'N/A'),
            'joining_date': employee.joining_date,
            'tenure_days': tenure_days,
            'tenure_years': round(tenure_days / 365, 1) if tenure_days else None,
            'status': 'Active',  # Assume all are active
            'email': getattr(employee, 'email', 'N/A'),
            'phone': getattr(employee, 'phone', 'N/A'),
            'leaves_taken': total_leave_days,
            'approved_leaves': approved_leaves,
            'pending_leaves': pending_leaves,
            'leave_balance': getattr(employee, 'sick_leave_balance', 0) + getattr(employee, 'casual_leave_balance', 0) + getattr(employee, 'paid_leave_balance', 0),
            'performance_score': performance_score,
            'performance_rating': 'Excellent' if performance_score >= 90 else 'Good' if performance_score >= 80 else 'Average' if performance_score >= 70 else 'Needs Improvement',
            'tasks_completed': tasks_completed,
            'projects_assigned': projects_assigned,
            'last_promotion': None,  # Could be calculated from employee history
            'training_completed': random.randint(0, 10),
            'warnings_issued': random.randint(0, 2),
        })

    summary = {
        'total_employees': employees.count(),
        'active_employees': employees.count(),
        'new_joins': len([d for d in data if d['joining_date'] and d['joining_date'] >= start_dt]),
        'total_leaves': sum(d['leaves_taken'] for d in data),
        'pending_leaves': sum(d['pending_leaves'] for d in data),
        'approved_leaves': sum(d['approved_leaves'] for d in data),
        'departments_covered': len(set(d['department'] for d in data if d['department'] != 'N/A')),
        'excellent_performers': len([d for d in data if d['performance_rating'] == 'Excellent']),
        'high_performers': len([d for d in data if d['performance_rating'] in ['Excellent', 'Good']]),
        'total_tasks_completed': sum(d['tasks_completed'] for d in data),
        'average_tenure_years': round(sum(d['tenure_years'] for d in data if d['tenure_years']) / len([d for d in data if d['tenure_years']]), 1) if data else 0
    }

    return Response({
        'data': data,
        'summary': summary
    }, status=200)


# ================= VISITOR MANAGEMENT ================= #

class VisitorListCreateView(generics.ListCreateAPIView):
    """
    List all visitors or create a new visitor record
    """
    queryset = Visitor.objects.all()
    serializer_class = VisitorSerializer
    permission_classes = [IsAuthenticated]


class VisitorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a visitor
    """
    queryset = Visitor.objects.all()
    serializer_class = VisitorSerializer
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, *args, **kwargs):
        """Get a single visitor by ID"""
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {"error": f"Error retrieving visitor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Update a visitor"""
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {"error": f"Error updating visitor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Delete a visitor"""
        try:
            instance = self.get_object()
            visitor_name = instance.full_name
            instance.delete()
            return Response(
                {"message": f"Visitor {visitor_name} deleted successfully"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Error deleting visitor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ================= INTERN MANAGEMENT ================= #

class InternDetailView(generics.RetrieveUpdateAPIView):
    queryset = InternDetail.objects.all()
    serializer_class = InternDetailSerializer
    permission_classes = [IsAuthenticated]


class InternAttendanceListCreateView(generics.ListCreateAPIView):
    serializer_class = InternAttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        intern_id = self.kwargs.get('intern_id')
        return InternAttendance.objects.filter(intern_id=intern_id)
    
    def perform_create(self, serializer):
        serializer.save()


class InternTaskListCreateView(generics.ListCreateAPIView):
    serializer_class = InternTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        intern_id = self.kwargs.get('intern_id')
        return InternTask.objects.filter(intern_id=intern_id)
    
    def perform_create(self, serializer):
        serializer.save()


class InternTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InternTask.objects.all()
    serializer_class = InternTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_update(self, serializer):
        serializer.save(reviewed_by=self.request.user)


class InternWithDetailsView(generics.RetrieveAPIView):
    queryset = Visitor.objects.filter(visitor_type='INTERN')
    serializer_class = VisitorSerializer
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, *args, **kwargs):
        intern = self.get_object()
        intern_details = InternDetail.objects.filter(intern=intern).first()
        attendance = InternAttendance.objects.filter(intern=intern)[:30]
        tasks = InternTask.objects.filter(intern=intern)
        
        data = {
            'visitor': VisitorSerializer(intern).data,
            'intern_details': InternDetailSerializer(intern_details).data if intern_details else None,
            'recent_attendance': InternAttendanceSerializer(attendance, many=True).data,
            'recent_tasks': InternTaskSerializer(tasks[:10], many=True).data,
            'total_tasks': tasks.count(),
            'completed_tasks': tasks.filter(status='COMPLETED').count(),
        }
        return Response(data)


# ================= GUEST VISIT MANAGEMENT ================= #

class GuestVisitListCreateView(generics.ListCreateAPIView):
    queryset = GuestVisit.objects.all()
    serializer_class = GuestVisitSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(expected_check_in__date=date)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department=department)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class GuestVisitDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = GuestVisit.objects.all()
    serializer_class = GuestVisitSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
def check_in_visitor(request, pk):
    try:
        visit = GuestVisit.objects.get(pk=pk)
    except GuestVisit.DoesNotExist:
        return Response({'error': 'Visit not found'}, status=404)
    
    if visit.status == 'EXPECTED':
        visit.check_in()
        return Response({'message': 'Visitor checked in successfully', 'data': GuestVisitSerializer(visit).data})
    else:
        return Response({'error': f'Cannot check in visitor with status {visit.status}'}, status=400)


@api_view(['POST'])
def check_out_visitor(request, pk):
    try:
        visit = GuestVisit.objects.get(pk=pk)
    except GuestVisit.DoesNotExist:
        return Response({'error': 'Visit not found'}, status=404)
    
    if visit.status == 'CHECKED_IN':
        visit.check_out()
        return Response({'message': 'Visitor checked out successfully', 'data': GuestVisitSerializer(visit).data})
    else:
        return Response({'error': f'Cannot check out visitor with status {visit.status}'}, status=400)


# ================= REPORTS & ANALYTICS ================= #

@api_view(['GET'])
def daily_visitor_logs(request):
    date_str = request.query_params.get('date', datetime.now().date())
    visits = GuestVisit.objects.filter(expected_check_in__date=date_str)
    serializer = GuestVisitSerializer(visits, many=True)
    return Response({'date': date_str, 'total_visits': visits.count(), 'visits': serializer.data})


@api_view(['GET'])
def visitor_history(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    queryset = GuestVisit.objects.all()
    if start_date:
        queryset = queryset.filter(expected_check_in__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(expected_check_in__date__lte=end_date)
    serializer = GuestVisitSerializer(queryset, many=True)
    return Response({'total_visits': queryset.count(), 'unique_visitors': queryset.values('visitor').distinct().count(), 'visits': serializer.data})


@api_view(['GET'])
def department_wise_statistics(request):
    stats = GuestVisit.objects.values('department').annotate(
        total_visits=Count('id'),
        unique_visitors=Count('visitor', distinct=True),
        completed_visits=Count('id', filter=Q(status='COMPLETED')),
        cancelled_visits=Count('id', filter=Q(status='CANCELLED')),
    ).order_by('-total_visits')
    return Response(stats)


@api_view(['GET'])
def active_visitors(request):
    active_visits = GuestVisit.objects.filter(status='CHECKED_IN')
    serializer = GuestVisitSerializer(active_visits, many=True)
    return Response({'total_active': active_visits.count(), 'active_visitors': serializer.data})


@api_view(['GET'])
def visitor_summary_report(request):
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    today_visits = GuestVisit.objects.filter(expected_check_in__date=today)
    weekly_visits = GuestVisit.objects.filter(expected_check_in__date__gte=week_ago)
    visitor_types = Visitor.objects.values('visitor_type').annotate(total=Count('id'))
    return Response({
        'summary': {
            'today_visits': today_visits.count(),
            'today_active': today_visits.filter(status='CHECKED_IN').count(),
            'weekly_visits': weekly_visits.count(),
            'total_visitors': Visitor.objects.count(),
        },
        'visitor_types': visitor_types,
    })


@api_view(['GET'])
def intern_performance_report(request):
    interns = Visitor.objects.filter(visitor_type='INTERN')
    report_data = []
    for intern in interns:
        intern_detail = InternDetail.objects.filter(intern=intern).first()
        tasks = InternTask.objects.filter(intern=intern)
        attendance = InternAttendance.objects.filter(intern=intern)
        present_days = attendance.filter(status='PRESENT').count()
        total_days = attendance.count()
        attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 0
        completed_tasks = tasks.filter(status='COMPLETED').count()
        report_data.append({
            'intern_id': intern.visitor_id,
            'intern_name': intern.full_name,
            'attendance_percentage': round(attendance_percentage, 2),
            'total_tasks': tasks.count(),
            'completed_tasks': completed_tasks,
        })
    return Response(report_data)
