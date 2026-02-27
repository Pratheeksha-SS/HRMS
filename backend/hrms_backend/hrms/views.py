from django.contrib.auth import authenticate
from flask import request
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework import status

@api_view(['POST'])
def admin_login(request):

    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None and user.role == 'ADMIN':
        return Response({
            "message": "Admin login successful",
            "username": user.username,
            "role": user.role
        })
    else:
        return Response({
            "error": "Invalid Admin credentials"
        }, status=400)


@api_view(['POST'])
def employee_login(request):

    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None and user.role == 'EMPLOYEE':
        return Response({
            "message": "Employee login successful",
            "username": user.username,
            "role": user.role
        })
    else:
        return Response({
            "error": "Invalid Employee credentials"
        }, status=400)
    
from rest_framework import generics
from .models import Employee
from .serializers import EmployeeSerializer
from rest_framework.permissions import IsAuthenticated

class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Employee.objects.all()
        else:
            return Employee.objects.filter(user=user)

    def perform_create(self, serializer):
        if self.request.user.role != 'ADMIN':
            raise PermissionDenied("Only Admin can create employees")
        serializer.save()


class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Employee.objects.all()
        else:
            return Employee.objects.filter(user=user)
        
from rest_framework import viewsets, permissions
from .models import Leave
from .serializers import LeaveSerializer
from datetime import date

from rest_framework import viewsets, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Leave
from .serializers import LeaveSerializer


class LeaveViewSet(viewsets.ModelViewSet):

    serializer_class = LeaveSerializer
    queryset = Leave.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # Admin can see all leaves
        if user.is_staff:
            return Leave.objects.all()

        # Employee can see only their leaves
        return Leave.objects.filter(employee__user=user)

    def perform_create(self, serializer):
        user = self.request.user

        # Get employee object
        employee = user.employee

        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']

        # Validation 1: End date cannot be before start date
        if end_date < start_date:
            raise serializers.ValidationError(
                "End date cannot be before start date."
            )

        # Validation 2: Overlapping leave check
        overlapping = Leave.objects.filter(
            employee=employee,
            start_date__lte=end_date,
            end_date__gte=start_date,
            status__in=['PENDING', 'APPROVED']
        )

        if overlapping.exists():
            raise serializers.ValidationError(
                "You already have leave applied for these dates."
            )

        serializer.save(employee=employee)

    # ----------------------------
    # Approve Leave (Admin only)
    # ----------------------------
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave = self.get_object()

        if not request.user.is_staff:
            return Response(
                {"error": "Only admin can approve leave."},
                status=status.HTTP_403_FORBIDDEN
            )

        if leave.status != 'PENDING':
            return Response(
                {"error": "Leave already processed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        leave.status = 'APPROVED'
        leave.save()

        return Response(
            {"message": "Leave approved successfully."},
            status=status.HTTP_200_OK
        )

    # ----------------------------
    # Reject Leave (Admin only)
    # ----------------------------
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave = self.get_object()

        if not request.user.is_staff:
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