from rest_framework import serializers
from .models import (
    Employee,
    Leave,
    Holiday,
    HolidayNotification,
    Meeting,
    Announcement,
    Visitor,
    InternDetail,
    InternAttendance,
    InternTask,
    GuestVisit,
    VisitorLog,
    DepartmentVisitStats,
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

User = get_user_model()


def resolve_user_for_login(login_input):
    if not login_input:
        return None

    if '@' in login_input:
        user = User.objects.filter(email__iexact=login_input).first()
        if user:
            return user

        employee = (
            Employee.objects
            .select_related('user')
            .filter(email__iexact=login_input)
            .first()
        )
        if employee:
            return employee.user

    return User.objects.filter(username__iexact=login_input).first()


# ===== DASHBOARD STATS SERIALIZER =====
class DashboardStatsSerializer(serializers.Serializer):
    total_employees = serializers.IntegerField()
    unique_departments = serializers.IntegerField()
    pending_leaves = serializers.IntegerField()
    total_leaves = serializers.IntegerField()
    attendance_rate = serializers.FloatField()
    recent_activity = serializers.IntegerField()
    pinned_announcements = serializers.ListField(
        child=serializers.DictField(child=serializers.JSONField()),
        required=False,
    )
    next_holiday = serializers.DictField(allow_null=True, required=False)


# ===== EMPLOYEE SERIALIZER =====
class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['employee_id', 'user', 'previous_designation']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_username(self, obj):
        return obj.user.username if obj.user else None

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_profile_image_url(self, obj):
        if obj.profile_image and hasattr(obj.profile_image, 'url'):
            return obj.profile_image.url
        return None

    def get_role(self, obj):
        return obj.user.role if obj.user else None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['profile_image_url'] = (
            instance.profile_image.url if instance.profile_image else None
        )
        # If user is a manager, ensure designation is "Manager"
        if instance.user and instance.user.role == 'MANAGER':
            representation['designation'] = 'Manager'
        return representation

    def validate_designation(self, value):
        return value

    def create(self, validated_data):
        user = validated_data.pop('user', None)
        if user:
            return Employee.objects.create(user=user, **validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('user', None)
        return super().update(instance, validated_data)


class EmployeeListItemSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'middle_name', 'last_name',
            'full_name', 'username', 'role', 'email', 'phone', 'department',
            'designation', 'joining_date', 'profile_image_url',
            'emergency_contact_name', 'emergency_contact_relationship',
            'emergency_contact_phone', 'emergency_contact_occupation',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_username(self, obj):
        return obj.user.username if obj.user else None

    def get_role(self, obj):
        return obj.user.role if obj.user else None

    def get_profile_image_url(self, obj):
        if obj.profile_image and hasattr(obj.profile_image, 'url'):
            return obj.profile_image.url
        return None


# ===== EMPLOYEE CREATE SERIALIZER =====
class EmployeeCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new employees"""
    username = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['employee_id']


# ===== LEAVE SERIALIZER =====
class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id   = serializers.SerializerMethodField()
    department    = serializers.SerializerMethodField()
    approved_by_username = serializers.SerializerMethodField()
    leave_days    = serializers.SerializerMethodField()

    class Meta:
        model = Leave
        fields = [
            'id', 'employee', 'employee_name', 'employee_id', 'department',
            'leave_type', 'start_date', 'end_date', 'reason', 'status',
            'applied_at', 'approved_by', 'approved_by_username', 'comments',
            'leave_days',
        ]
        read_only_fields = ['status', 'applied_at', 'employee', 'approved_by', 'leave_days']

    def get_employee_name(self, obj):
        try:
            return obj.employee.employee_profile.get_full_name()
        except Exception:
            return str(obj.employee)

    def get_employee_id(self, obj):
        try:
            return obj.employee.employee_profile.employee_id
        except Exception:
            return None

    def get_department(self, obj):
        try:
            return obj.employee.employee_profile.department
        except Exception:
            return None

    def get_approved_by_username(self, obj):
        return obj.approved_by.username if obj.approved_by else None

    def get_leave_days(self, obj):
        return obj.leave_days

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be the same as or later than start date.'
            })

        return data


# ===== JWT TOKEN SERIALIZER (SINGLE DEFINITION) =====
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
    
        token['role'] = user.role
        token['username'] = user.username
    
        if user.role == 'MANAGER' and user.managed_department:
            token['managed_department'] = user.managed_department
    
        try:
            employee = Employee.objects.select_related('user').filter(user=user).first()
            if employee:
                token['employee_id'] = employee.employee_id
                token['full_name'] = f"{employee.first_name} {employee.last_name}".strip()
        except Exception:
            pass
    
        return token    
    
    def validate(self, attrs):
        login_input = attrs.get('username', '')
        user = resolve_user_for_login(login_input)
        if user:
            attrs['username'] = user.username
                
        data = super().validate(attrs)
        
        data['role'] = self.user.role
        data['username'] = self.user.username
        
        try:
            employee = Employee.objects.select_related('user').filter(user=self.user).first()
            if employee:
                data['employee_id'] = employee.employee_id
                data['full_name'] = f"{employee.first_name} {employee.last_name}".strip()
        except Exception:
            pass
        
        return data


# ===== HOLIDAY SERIALIZERS =====
class HolidaySerializer(serializers.ModelSerializer):
    """
    Serializer for Holiday model with additional read-only fields
    """
    holiday_type_display = serializers.CharField(
        source='get_holiday_type_display',
        read_only=True
    )
    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True,
        default=None
    )
    formatted_date = serializers.DateField(
        source='date',
        read_only=True,
        format='%d %B %Y'
    )

    class Meta:
        model = Holiday
        fields = [
            'id',
            'name',
            'date',
            'formatted_date',
            'holiday_type',
            'holiday_type_display',
            'year',
            'description',
            'is_active',
            'is_auto_generated',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'year',
            'is_auto_generated',
            'created_at',
            'updated_at',
            'created_by'
        ]

    def validate_date(self, value):
        return value

    def validate(self, data):
        if len(data.get('name', '')) < 3:
            raise serializers.ValidationError({
                'name': 'Holiday name must be at least 3 characters long'
            })
        return data


class HolidayNotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for tracking email notifications sent for holidays
    """
    holiday_name = serializers.CharField(
        source='holiday.name',
        read_only=True
    )
    holiday_date = serializers.DateField(
        source='holiday.date',
        read_only=True
    )
    sent_by_username = serializers.CharField(
        source='sent_by.username',
        read_only=True,
        default=None
    )

    class Meta:
        model = HolidayNotification
        fields = [
            'id',
            'holiday',
            'holiday_name',
            'holiday_date',
            'sent_at',
            'sent_by',
            'sent_by_username',
            'recipient_count'
        ]
        read_only_fields = ['sent_at', 'sent_by', 'recipient_count']


class HolidayBulkCreateSerializer(serializers.Serializer):
    """
    Serializer for bulk holiday creation
    """
    year = serializers.IntegerField(min_value=2000, max_value=2100)
    holiday_type = serializers.ChoiceField(
        choices=Holiday.HOLIDAY_TYPES,
        default='GOVT'
    )

    def validate_year(self, value):
        from datetime import date
        current_year = date.today().year
        if value < current_year - 1 or value > current_year + 10:
            raise serializers.ValidationError(
                f"Year must be between {current_year - 1} and {current_year + 10}"
            )
        return value


# ===== USER SERIALIZER =====
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'managed_department', 'full_name']
    
    def get_full_name(self, obj):
        return f"{obj.first_name or ''} {obj.last_name or ''}".strip() or obj.username


# ===== MEETING SERIALIZER =====
class MeetingSerializer(serializers.ModelSerializer):
    """Serializer for Meeting model"""

    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )
    attendees_names = serializers.StringRelatedField(
        source='attendees',
        many=True,
        read_only=True
    )
    is_holiday_display = serializers.BooleanField(
        source='is_holiday',
        read_only=True
    )

    class Meta:
        model = Meeting
        fields = [
            'id',
            'title',
            'date',
            'time',
            'duration',
            'location',
            'description',
            'created_by',
            'created_by_username',
            'attendees',
            'attendees_names',
            'status',
            'is_holiday',
            'is_holiday_display',
            'holiday_warning',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'created_at',
            'updated_at',
            'is_holiday',
            'holiday_warning'
        ]


# ===== ANNOUNCEMENT SERIALIZER =====
class AnnouncementSerializer(serializers.ModelSerializer):
    attachment_url = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = '__all__'
        extra_kwargs = {
            'created_by': {'required': False},
        }

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return f"http://127.0.0.1:8000{obj.attachment.url}"
        return None

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None


# ===== USER + EMPLOYEE CREATE SERIALIZER =====
class UserEmployeeSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    department = serializers.CharField(max_length=100)
    designation = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=15)
    address = serializers.CharField()
    joining_date = serializers.DateField()

    def create(self, validated_data):
        import random
        import string

        base_username = validated_data['full_name'].lower().replace(' ', '_')
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        email = f"{username}@company.com"

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role='EMPLOYEE'
        )

        employee = Employee.objects.create(user=user, **validated_data)

        self.generated_username = username
        self.generated_password = password
        self.generated_email = email
        
        return employee


from .models import Department, Notification


class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'manager', 'manager_name', 
                  'employee_count', 'created_at', 'updated_at']
    
    def get_manager_name(self, obj):
        return obj.manager.username if obj.manager else None
    
    def get_employee_count(self, obj):
        return obj.get_employee_count()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


# ===== VISITOR SERIALIZERS =====
class VisitorSerializer(serializers.ModelSerializer):
    visitor_type_display = serializers.SerializerMethodField()
    id_proof_type_display = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Visitor
        fields = '__all__'
        read_only_fields = ['visitor_id', 'created_at', 'updated_at', 'created_by']
    
    def get_visitor_type_display(self, obj):
        return obj.get_visitor_type_display()
    
    def get_id_proof_type_display(self, obj):
        return obj.get_id_proof_type_display() if obj.id_proof_type else None
    
    def get_photo_url(self, obj):
        if obj.photo:
            return obj.photo.url
        return None


class InternDetailSerializer(serializers.ModelSerializer):
    intern_name = serializers.SerializerMethodField()
    intern_id = serializers.SerializerMethodField()
    attendance_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = InternDetail
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_intern_name(self, obj):
        return obj.intern.full_name
    
    def get_intern_id(self, obj):
        return obj.intern.visitor_id
    
    def get_attendance_percentage(self, obj):
        return obj.get_attendance_percentage()


class InternAttendanceSerializer(serializers.ModelSerializer):
    intern_name = serializers.SerializerMethodField()
    
    class Meta:
        model = InternAttendance
        fields = '__all__'
    
    def get_intern_name(self, obj):
        return obj.intern.full_name


class InternTaskSerializer(serializers.ModelSerializer):
    intern_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = InternTask
        fields = '__all__'
        read_only_fields = ['created_at', 'percentage']
    
    def get_intern_name(self, obj):
        return obj.intern.full_name
    
    def get_reviewed_by_name(self, obj):
        return obj.reviewed_by.username if obj.reviewed_by else None


class GuestVisitSerializer(serializers.ModelSerializer):
    visitor_name = serializers.SerializerMethodField()
    visitor_type = serializers.SerializerMethodField()
    visitor_phone = serializers.SerializerMethodField()
    host_name_display = serializers.SerializerMethodField()
    purpose_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    entry_gate_display = serializers.SerializerMethodField()
    duration_hours = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = GuestVisit
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_visitor_name(self, obj):
        return obj.visitor.full_name
    
    def get_visitor_type(self, obj):
        return obj.visitor.get_visitor_type_display()
    
    def get_visitor_phone(self, obj):
        return obj.visitor.phone_number
    
    def get_host_name_display(self, obj):
        if obj.host:
            return obj.host.get_full_name() or obj.host.username
        return obj.host_name
    
    def get_purpose_display(self, obj):
        if obj.purpose == 'OTHER' and obj.purpose_other:
            return obj.purpose_other
        return obj.get_purpose_display()
    
    def get_status_display(self, obj):
        return obj.get_status_display()
    
    def get_entry_gate_display(self, obj):
        return obj.get_entry_gate_display()
    
    def get_duration_hours(self, obj):
        return obj.duration_hours
    
    def get_is_active(self, obj):
        return obj.is_active


class VisitorLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = VisitorLog
        fields = '__all__'
    
    def get_performed_by_name(self, obj):
        return obj.performed_by.username if obj.performed_by else None


class DepartmentVisitStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentVisitStats
        fields = '__all__'


class InternWithDetailsSerializer(serializers.Serializer):
    visitor = VisitorSerializer()
    intern_details = InternDetailSerializer()
    recent_attendance = InternAttendanceSerializer(many=True)
    recent_tasks = InternTaskSerializer(many=True)
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
