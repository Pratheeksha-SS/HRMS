from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from datetime import datetime
from django.core.validators import MinLengthValidator, RegexValidator
import uuid
# ===== USER MODEL =====
class User(AbstractUser):

    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('EMPLOYEE', 'Employee'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True)
    must_change_password = models.BooleanField(default=False)
    has_set_password = models.BooleanField(default=False)
    
    # For manager - assigned department
    managed_department = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.username} - {self.role}"

    class Meta(AbstractUser.Meta):
        indexes = [
            models.Index(fields=['role', 'managed_department'], name='hrms_user_role_dept_idx'),
        ]


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    manager = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='managed_department_obj'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def get_employee_count(self):
        return Employee.objects.filter(department=self.name).count()


# ===== EMPLOYEE MODEL =====
class Employee(models.Model):
    GENDER_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    )

    MARITAL_STATUS_CHOICES = (
        ('SINGLE', 'Single'),
        ('MARRIED', 'Married'),
        ('DIVORCED', 'Divorced'),
        ('WIDOWED', 'Widowed'),
    )

    EDUCATION_CHOICES = (
        ('HIGH_SCHOOL', 'High School'),
        ('DIPLOMA', 'Diploma'),
        ('BACHELORS', 'Bachelor\'s Degree'),
        ('MASTERS', 'Master\'s Degree'),
        ('PHD', 'PhD'),
        ('OTHER', 'Other'),
    )

    MARKS_TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('cgpa', 'CGPA'),
        ('gpa', 'GPA'),
        ('grade', 'Grade'),
    )

    ACCOUNT_TYPE_CHOICES = [
        ('SAVINGS', 'Savings'),
        ('CURRENT', 'Current'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile'
    )

    # Name fields
    first_name = models.CharField(max_length=50, default='', db_index=True)
    middle_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, default='', db_index=True)

    # Personal Info
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='MALE')
    marital_status = models.CharField(max_length=15, choices=MARITAL_STATUS_CHOICES, default='SINGLE')
    education = models.CharField(max_length=20, choices=EDUCATION_CHOICES, default='HIGH_SCHOOL')

    # Contact
    phone = models.CharField(max_length=15, default='')
    email = models.EmailField(max_length=100, default='', db_index=True)
    address = models.TextField(default='')

    # Employment
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        editable=False
    )
    employee_code = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
        help_text='Unique code used in attendance Excel (e.g. Intern 44, EMP001)'
    )

    department = models.CharField(max_length=100, default='', db_index=True)

    designation = models.CharField(max_length=100, default='', db_index=True)

    joining_date = models.DateField(null=True, blank=True, db_index=True)

    # Profile Image Field
    profile_image = models.ImageField(
        upload_to='employee_images/',
        blank=True, 
        null=True,
        default=None
    )

    # Emergency contact fields
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact_occupation = models.CharField(max_length=100, blank=True, null=True)

    # Education Details
    education_level = models.CharField(max_length=100, blank=True, null=True)
    institute_name = models.CharField(max_length=200, blank=True, null=True)
    year_of_passing = models.IntegerField(blank=True, null=True)
    marks_type = models.CharField(max_length=20, choices=MARKS_TYPE_CHOICES, blank=True, null=True)
    marks_value = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)

    # Bank Details
    account_holder_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=20, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    ifsc_code = models.CharField(max_length=11, blank=True, null=True)
    branch_name = models.CharField(max_length=100, blank=True, null=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, blank=True, null=True)

    # Leave Balance Management Fields
    sick_leave_balance = models.IntegerField(default=12)
    casual_leave_balance = models.IntegerField(default=10)
    paid_leave_balance = models.IntegerField(default=15)
    sick_leave_total = models.IntegerField(default=12)
    casual_leave_total = models.IntegerField(default=10)
    paid_leave_total = models.IntegerField(default=15)

    # Stores the designation before promotion to Manager, so it can be restored on revoke
    previous_designation = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.get_full_name()

    def get_full_name(self):
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.employee_id:
            year = datetime.now().year % 100
            last_employee = Employee.objects.filter(
                employee_id__startswith=f'EMPEX{year:02d}'
            ).order_by('employee_id').last()
            if last_employee:
                last_number = int(last_employee.employee_id[-3:]) + 1
            else:
                last_number = 1
            self.employee_id = f'EMPEX{year:02d}{last_number:03d}'
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            models.Index(fields=['department'], name='hrms_emp_dept_idx'),
            models.Index(fields=['department', 'designation'], name='hrms_emp_dept_desig_idx'),
        ]

# ===== LEAVE TYPE MODEL (NEW) =====
class LeaveType(models.Model):
    """Configurable leave types with policies"""
    LEAVE_CATEGORIES = (
        ('SICK', 'Sick Leave'),
        ('CASUAL', 'Casual Leave'),
        ('PAID', 'Paid Leave'),
        ('MATERNITY', 'Maternity Leave'),
        ('PATERNITY', 'Paternity Leave'),
        ('MARRIAGE', 'Marriage Leave'),
    )
    
    GENDER_RESTRICTION = (
        ('ALL', 'All'),
        ('MALE', 'Male Only'),
        ('FEMALE', 'Female Only'),
    )
    
    name = models.CharField(max_length=20, choices=LEAVE_CATEGORIES, unique=True)
    display_name = models.CharField(max_length=100, help_text="Display name shown to users")
    description = models.TextField(blank=True, null=True)
    
    # Policy settings
    default_days = models.DecimalField(max_digits=5, decimal_places=1, default=0, help_text="Default leave days per year/occurrence")
    max_days_per_request = models.DecimalField(max_digits=5, decimal_places=1, default=30)
    is_paid = models.BooleanField(default=True)
    is_recurring = models.BooleanField(default=True, help_text="Yearly recurring or one-time")
    is_active = models.BooleanField(default=True)
    
    # Eligibility rules
    gender_restriction = models.CharField(max_length=10, choices=GENDER_RESTRICTION, default='ALL')
    min_service_days = models.IntegerField(default=0, help_text="Minimum days of service required")
    max_children = models.IntegerField(default=0, help_text="For maternity: max children covered")
    requires_document = models.BooleanField(default=False)
    requires_approval = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.get_name_display()


# ===== LEAVE BALANCE MODEL (NEW) =====
class LeaveBalance(models.Model):
    """Track leave balances per employee per leave type"""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.CharField(max_length=20, choices=LeaveType.LEAVE_CATEGORIES)
    total_allocated = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    total_used = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    remaining = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    year = models.IntegerField(db_index=True)
    is_carry_forward = models.BooleanField(default=False)
    carry_forward_days = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    
    class Meta:
        unique_together = ('employee', 'leave_type', 'year')
    
    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.leave_type} - {self.year}"


# ===== LEAVE MODEL (UPDATED) =====
class Leave(models.Model):

    LEAVE_TYPES = (
        ('SICK', 'Sick Leave'),
        ('CASUAL', 'Casual Leave'),
        ('PAID', 'Paid Leave'),
        ('MATERNITY', 'Maternity Leave'),
        ('PATERNITY', 'Paternity Leave'),
        ('MARRIAGE', 'Marriage Leave'),
    )

    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )


    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='leaves',
        db_index=True
    )

    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES, db_index=True)
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    reason = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        db_index=True
    )


    applied_at = models.DateTimeField(auto_now_add=True, db_index=True)

    
    # Who approved/rejected this leave
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_leaves'
    )
    comments = models.TextField(blank=True, null=True)  # Manager comments
    
    # Additional fields for special leave types
    child_number = models.IntegerField(null=True, blank=True, help_text="1st, 2nd, 3rd child")
    is_adoption = models.BooleanField(default=False, help_text="For adoption cases")
    is_surrogacy = models.BooleanField(default=False, help_text="For surrogacy cases")
    marriage_date = models.DateField(null=True, blank=True)
    marriage_certificate = models.FileField(upload_to='marriage_proofs/', null=True, blank=True)
    is_first_marriage = models.BooleanField(default=True)
    child_birth_date = models.DateField(null=True, blank=True)
    supporting_document = models.FileField(upload_to='leave_documents/', null=True, blank=True)

    def __str__(self):
        return f"{self.employee.username} - {self.leave_type} ({self.status})"

    class Meta:
        indexes = [
            models.Index(fields=['employee', 'status'], name='hrms_leave_emp_status_idx'),
            models.Index(fields=['status', 'applied_at'], name='hrms_leave_status_applied_idx'),
        ]

    @staticmethod
    def calculate_working_days(start_date, end_date):
        from datetime import timedelta

        if not start_date or not end_date or end_date < start_date:
            return 0

        holiday_dates = set(
            Holiday.objects.filter(
                date__range=(start_date, end_date),
                is_active=True
            ).values_list('date', flat=True)
        )

        working_days = 0
        current = start_date
        while current <= end_date:
            if current.weekday() < 5 and current not in holiday_dates:
                working_days += 1
            current += timedelta(days=1)

        return working_days

    @property
    def leave_days(self):
        return self.calculate_working_days(self.start_date, self.end_date)

class ChatSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"Chat session for {self.user.username} ({self.started_at.strftime('%Y-%m-%d %H:%M')})"


class ChatMessage(models.Model):
    SENDER_CHOICES = (
        ('USER', 'User'),
        ('ASSISTANT', 'Assistant'),
    )

    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES, db_index=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender} message at {self.created_at.strftime('%Y-%m-%d %H:%M')}"

# ===== HOLIDAY MODEL =====
class Holiday(models.Model):
    HOLIDAY_TYPES = (
        ('GOVT', 'Government Holiday'),
        ('FESTIVAL', 'Festival Holiday'),
        ('OPTIONAL', 'Optional Holiday'),
        ('COMPANY', 'Company Event'),
    )

    name = models.CharField(max_length=200, help_text='Name of the holiday (e.g., Republic Day)')
    date = models.DateField(help_text='Date of the holiday')
    holiday_type = models.CharField(max_length=20, choices=HOLIDAY_TYPES, default='GOVT', help_text='Type of holiday')
    year = models.IntegerField(help_text='Year for easy filtering', db_index=True)
    description = models.TextField(blank=True, null=True, help_text='Additional details about the holiday')
    is_active = models.BooleanField(default=True, help_text='Whether this holiday is active', db_index=True)
    is_auto_generated = models.BooleanField(default=False, help_text='True if created by system automatically')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_holidays',
        help_text='Admin who created/modified this holiday'
    )

    class Meta:
        verbose_name = 'Holiday'
        verbose_name_plural = 'Holidays'
        ordering = ['date']
        unique_together = ('name', 'date')

    def __str__(self):
        return self.name


class HolidayNotification(models.Model):
    holiday = models.ForeignKey(
        Holiday,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sent_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    recipient_count = models.IntegerField(default=0, help_text='Number of employees notified')

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"HolidayNotification for {self.holiday.name} at {self.sent_at}"


class Meeting(models.Model):
    STATUS_CHOICES = (
        ('SCHEDULED', 'Scheduled'),
        ('ONGOING', 'Ongoing'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    title = models.CharField(max_length=200, help_text='Title of the meeting/event')
    date = models.DateField(help_text='Date of the meeting')
    time = models.TimeField(blank=True, null=True, help_text='Time of the meeting (optional)')
    duration = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True, help_text='Duration in hours (e.g., 1.5)')
    location = models.CharField(max_length=200, blank=True, help_text='Location/Venue of the meeting')
    description = models.TextField(blank=True, help_text='Meeting agenda or description')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED', help_text='Current status of the meeting')
    is_holiday = models.BooleanField(default=False, help_text='Auto-set if date is a holiday')
    holiday_warning = models.CharField(max_length=200, blank=True, help_text='Warning if scheduled on holiday')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    attendees = models.ManyToManyField(
        'Employee',
        blank=True,
        related_name='meetings',
        help_text='Employees attending this meeting'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_meetings',
        help_text='User who created this meeting'
    )

    class Meta:
        verbose_name = 'Meeting'
        verbose_name_plural = 'Meetings'
        ordering = ['-date', '-time']

    def __str__(self):
        return self.title


class Announcement(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    event_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    is_pinned = models.BooleanField(default=False, db_index=True)
    send_email = models.BooleanField(default=False)
    attachment = models.FileField(blank=True, null=True, upload_to='announcement_files/')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='announcements'
    )

    def __str__(self):
        return self.title


class Notification(models.Model):
    TYPE_CHOICES = (
        ('LEAVE_REQUEST', 'Leave Request'),
        ('LEAVE_APPROVED', 'Leave Approved'),
        ('LEAVE_REJECTED', 'Leave Rejected'),
        ('ANNOUNCEMENT', 'Announcement'),
    )

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    def __str__(self):
        return f"{self.title} ({self.user.username})"
    
# ==================== VISITOR (Base Model) ====================
class Visitor(models.Model):
    VISITOR_TYPES = (
        ('GUEST', 'Guest'),
        ('VENDOR', 'Vendor'),
        ('INTERN', 'Intern'),
        ('CANDIDATE', 'Interview Candidate'),
    )
    
    ID_PROOF_TYPES = (
        ('AADHAR', 'Aadhar Card'),
        ('PAN', 'PAN Card'),
        ('DRIVING', 'Driving License'),
        ('PASSPORT', 'Passport'),
        ('VOTER', 'Voter ID'),
        ('OTHER', 'Other'),
    )
    
    # Basic Information
    visitor_id = models.CharField(max_length=20, unique=True, blank=True, editable=False)
    visitor_type = models.CharField(max_length=20, choices=VISITOR_TYPES, default='GUEST', db_index=True)
    
    # Personal Details
    full_name = models.CharField(max_length=200, db_index=True)
    phone_number = models.CharField(
        max_length=15,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in format: '+999999999'. Up to 15 digits allowed."
            )
        ]
    )
    email = models.EmailField(max_length=200, blank=True, null=True)
    
    # Guest/Vendor Specific Fields
    purpose = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    date_of_visiting = models.DateField(blank=True, null=True)
    
    # Intern Specific Fields
    organization = models.CharField(max_length=200, blank=True, null=True)
    id_proof_type = models.CharField(max_length=20, choices=ID_PROOF_TYPES, blank=True, null=True)
    id_proof_number = models.CharField(max_length=100, blank=True, null=True)
    duration_months = models.IntegerField(blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    ending_date = models.DateField(blank=True, null=True)
    
    # College Details for Interns
    college_name = models.CharField(max_length=200, blank=True, null=True)
    course_name = models.CharField(max_length=200, blank=True, null=True)
    current_semester = models.IntegerField(blank=True, null=True)
    mentor_name = models.CharField(max_length=200, blank=True, null=True)
    
    # Candidate Specific Fields
    position = models.CharField(max_length=100, blank=True, null=True)
    
    # Common fields
    photo = models.ImageField(upload_to='visitor_photos/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_visitors')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.visitor_id} - {self.full_name} ({self.get_visitor_type_display()})"
    
    def save(self, *args, **kwargs):
        if not self.visitor_id:
            prefix = 'VIS'
            if self.visitor_type == 'INTERN':
                prefix = 'INEX'
            elif self.visitor_type == 'CANDIDATE':
                prefix = 'CAN'
            elif self.visitor_type == 'VENDOR':
                prefix = 'VEN'
            else:
                prefix = 'GST'
            
            year = datetime.now().year % 100
            last_visitor = Visitor.objects.filter(visitor_id__startswith=f'{prefix}{year:02d}').order_by('visitor_id').last()
            
            if last_visitor:
                last_number = int(last_visitor.visitor_id[-3:]) + 1
            else:
                last_number = 1
            
            self.visitor_id = f'{prefix}{year:02d}{last_number:03d}'
        
        super().save(*args, **kwargs)
# ==================== INTERN SPECIFIC DATA ====================
class InternDetail(models.Model):
    intern = models.OneToOneField(Visitor, on_delete=models.CASCADE, related_name='intern_details', limit_choices_to={'visitor_type': 'INTERN'})
    
    course_name = models.CharField(max_length=200, blank=True, null=True)
    college_name = models.CharField(max_length=200, blank=True, null=True)
    current_semester = models.IntegerField(blank=True, null=True)
    cgpa = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    
    internship_duration_months = models.IntegerField(default=3)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    
    marks_details = models.JSONField(default=dict, blank=True)
    mentor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='interns')
    stipend = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    offer_letter = models.FileField(upload_to='intern_offers/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Intern Details: {self.intern.full_name}"


# ==================== INTERN ATTENDANCE ====================
class InternAttendance(models.Model):
    ATTENDANCE_STATUS = (
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('HALF_DAY', 'Half Day'),
        ('LEAVE', 'On Leave'),
    )
    
    intern = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='attendance_records', limit_choices_to={'visitor_type': 'INTERN'})
    date = models.DateField()
    check_in_time = models.DateTimeField(blank=True, null=True)
    check_out_time = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS, default='PRESENT')
    remarks = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ['intern', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.intern.full_name} - {self.date} - {self.status}"


# ==================== INTERN TASKS ====================
class InternTask(models.Model):
    TASK_STATUS = (
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('SUBMITTED', 'Submitted'),
        ('REVIEWED', 'Reviewed'),
        ('COMPLETED', 'Completed'),
    )
    
    intern = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='tasks', limit_choices_to={'visitor_type': 'INTERN'})
    
    task_name = models.CharField(max_length=200)
    task_description = models.TextField(blank=True, null=True)
    assigned_date = models.DateField(auto_now_add=True)
    due_date = models.DateField(blank=True, null=True)
    completion_date = models.DateField(blank=True, null=True)
    
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    total_marks = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    
    feedback = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_tasks')
    status = models.CharField(max_length=20, choices=TASK_STATUS, default='PENDING')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if self.marks_obtained and self.total_marks:
            self.percentage = (self.marks_obtained / self.total_marks) * 100
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.intern.full_name} - {self.task_name}"


# ==================== GUEST VISIT ====================
class GuestVisit(models.Model):
    VISIT_PURPOSES = (
        ('MEETING', 'Business Meeting'),
        ('INTERVIEW', 'Interview'),
        ('DELIVERY', 'Delivery'),
        ('SERVICE', 'Service/Maintenance'),
        ('TRAINING', 'Training'),
        ('EVENT', 'Event'),
        ('OTHER', 'Other'),
    )
    
    VISIT_STATUS = (
        ('EXPECTED', 'Expected'),
        ('CHECKED_IN', 'Checked-in'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No Show'),
    )
    
    ENTRY_GATES = (
        ('MAIN', 'Main Gate'),
        ('EAST', 'East Gate'),
        ('WEST', 'West Gate'),
        ('NORTH', 'North Gate'),
        ('SOUTH', 'South Gate'),
        ('SERVICE', 'Service Gate'),
    )
    
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='visits')
    
    purpose = models.CharField(max_length=50, choices=VISIT_PURPOSES, default='MEETING')
    purpose_other = models.CharField(max_length=200, blank=True, null=True)
    
    host = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='hosted_visits')
    host_name = models.CharField(max_length=200, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    
    meeting_subject = models.CharField(max_length=500, blank=True, null=True)
    meeting_room = models.CharField(max_length=100, blank=True, null=True)
    
    expected_check_in = models.DateTimeField(db_index=True)
    check_in_time = models.DateTimeField(blank=True, null=True)
    check_out_time = models.DateTimeField(blank=True, null=True)
    
    entry_gate = models.CharField(max_length=20, choices=ENTRY_GATES, default='MAIN')
    status = models.CharField(max_length=20, choices=VISIT_STATUS, default='EXPECTED', db_index=True)
    
    badge_number = models.CharField(max_length=50, blank=True, null=True)
    vehicle_number = models.CharField(max_length=20, blank=True, null=True)
    
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_visits')
    
    class Meta:
        ordering = ['-expected_check_in']
    
    def __str__(self):
        return f"Visit: {self.visitor.full_name} - {self.expected_check_in.date()}"
    
    @property
    def duration_hours(self):
        if self.check_in_time and self.check_out_time:
            delta = self.check_out_time - self.check_in_time
            return round(delta.total_seconds() / 3600, 2)
        return None
    
    @property
    def is_active(self):
        return self.status == 'CHECKED_IN'
    
    def check_in(self, time=None):
        self.check_in_time = time or datetime.now()
        self.status = 'CHECKED_IN'
        self.save()
    
    def check_out(self, time=None):
        self.check_out_time = time or datetime.now()
        self.status = 'COMPLETED'
        self.save()


# ==================== VISITOR LOGS ====================
class VisitorLog(models.Model):
    ACTION_TYPES = (
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('CHECK_IN', 'Checked In'),
        ('CHECK_OUT', 'Checked Out'),
        ('CANCEL', 'Cancelled'),
        ('DELETE', 'Deleted'),
    )
    
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE, related_name='logs', null=True)
    guest_visit = models.ForeignKey(GuestVisit, on_delete=models.CASCADE, related_name='logs', null=True)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    performed_at = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.action} - {self.performed_at}"


# ==================== DEPARTMENT VISIT STATISTICS ====================
class DepartmentVisitStats(models.Model):
    department = models.CharField(max_length=100, unique=True)
    total_visits = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)
    avg_duration_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.department}: {self.total_visits} visits"

# ==================== EMPLOYEE ATTENDANCE (Excel Upload) ====================

class AttendanceUpload(models.Model):
    """Tracks uploaded attendance Excel files."""
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='attendance_uploads'
    )
    file = models.FileField(upload_to='attendance_uploads/')
    original_filename = models.CharField(max_length=255)
    month = models.IntegerField()   # 1-12
    year = models.IntegerField()
    records_processed = models.IntegerField(default=0)
    records_failed = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=[('PENDING', 'Pending'), ('PROCESSING', 'Processing'),
                 ('DONE', 'Done'), ('FAILED', 'Failed')],
        default='PENDING'
    )
    error_log = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Attendance {self.month}/{self.year} — {self.original_filename}"


class EmployeeAttendance(models.Model):
    """One record per employee per day, parsed from the Excel report."""

    STATUS_CHOICES = [
        ('P',        'Present'),
        ('A',        'Absent'),
        ('WO',       'Weekly Off'),
        ('P_MO',     'Present (Missed Out)'),
        ('LEAVE',    'On Leave'),
        ('HALF',     'Half Day'),
    ]

    upload = models.ForeignKey(
        AttendanceUpload, on_delete=models.CASCADE, related_name='records', null=True, blank=True
    )
    # Link to employee — by employee_code from Excel (e.g. "Intern 44") or matched name
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='attendance_records', null=True, blank=True
    )
    # Raw fields from Excel (kept even if employee not matched)
    employee_code = models.CharField(max_length=50, db_index=True)
    employee_name = models.CharField(max_length=200)
    designation   = models.CharField(max_length=100, blank=True)

    date          = models.DateField(db_index=True)
    month         = models.IntegerField(db_index=True)
    year          = models.IntegerField(db_index=True)

    shift         = models.CharField(max_length=10, blank=True)   # GS / WO / NA
    in_time       = models.TimeField(null=True, blank=True)
    out_time      = models.TimeField(null=True, blank=True)
    late_by       = models.DurationField(null=True, blank=True)    # timedelta
    early_by      = models.DurationField(null=True, blank=True)
    overtime      = models.DurationField(null=True, blank=True)
    duration      = models.DurationField(null=True, blank=True)    # total working hours

    status        = models.CharField(max_length=10, choices=STATUS_CHOICES, default='A', db_index=True)
    is_weekly_off = models.BooleanField(default=False)
    is_present    = models.BooleanField(default=False)
    is_absent     = models.BooleanField(default=False)
    is_late       = models.BooleanField(default=False)
    is_early_exit = models.BooleanField(default=False)
    is_missed_out = models.BooleanField(default=False)   # P(Missedout)
    # Holiday integration
    is_holiday    = models.BooleanField(default=False, db_index=True)
    holiday_name  = models.CharField(max_length=200, blank=True, null=True)

    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee_code', 'date')
        ordering = ['-date']
        indexes = [
            models.Index(fields=['employee_code', 'month', 'year']),
            models.Index(fields=['employee', 'month', 'year']),
            models.Index(fields=['month', 'year', 'date']),
            models.Index(fields=['date', 'employee_name']),
        ]

    def __str__(self):
        return f"{self.employee_name} — {self.date} — {self.status}"

    @property
    def working_hours(self):
        if self.duration:
            total_seconds = int(self.duration.total_seconds())
            h, rem = divmod(total_seconds, 3600)
            m = rem // 60
            return f"{h:02d}:{m:02d}"
        return "00:00"

    @property
    def late_by_display(self):
        if self.late_by:
            total_seconds = int(self.late_by.total_seconds())
            h, rem = divmod(total_seconds, 3600)
            m = rem // 60
            return f"{h:02d}:{m:02d}"
        return "00:00"

    @property
    def early_by_display(self):
        if self.early_by:
            total_seconds = int(self.early_by.total_seconds())
            h, rem = divmod(total_seconds, 3600)
            m = rem // 60
            return f"{h:02d}:{m:02d}"
        return "00:00"


class AttendanceSummary(models.Model):
    """Monthly summary per employee — computed from EmployeeAttendance records."""
    employee_code  = models.CharField(max_length=50, db_index=True)
    employee_name  = models.CharField(max_length=200)
    employee       = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='attendance_summaries', null=True, blank=True
    )
    month          = models.IntegerField(db_index=True)
    year           = models.IntegerField(db_index=True)
    upload         = models.ForeignKey(
        AttendanceUpload, on_delete=models.CASCADE, related_name='summaries', null=True, blank=True
    )

    total_present       = models.IntegerField(default=0)
    total_absent        = models.IntegerField(default=0)
    total_leave         = models.IntegerField(default=0)
    total_weekly_off    = models.IntegerField(default=0)
    total_holidays      = models.IntegerField(default=0)   # govt/company holidays in the month
    total_working_days  = models.IntegerField(default=0)   # scheduled working days (excl. weekends + holidays)
    total_duration_mins = models.IntegerField(default=0)   # total minutes worked
    total_late_mins     = models.IntegerField(default=0)
    total_early_mins    = models.IntegerField(default=0)
    total_overtime_mins = models.IntegerField(default=0)
    missed_out_count    = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee_code', 'month', 'year')
        ordering = ['-year', '-month']
        indexes = [
            models.Index(fields=['month', 'year', 'employee_name']),
            models.Index(fields=['employee', 'month', 'year']),
        ]

    def __str__(self):
        return f"{self.employee_name} — {self.month}/{self.year}"

    @property
    def attendance_percentage(self):
        if self.total_working_days > 0:
            return round((self.total_present / self.total_working_days) * 100, 1)
        return 0.0

    @property
    def avg_working_hours(self):
        if self.total_present > 0:
            avg_mins = self.total_duration_mins // self.total_present
            h, m = divmod(avg_mins, 60)
            return f"{h:02d}:{m:02d}"
        return "00:00"
