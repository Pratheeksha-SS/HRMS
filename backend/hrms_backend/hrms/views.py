from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Employee, Leave
from .serializers import (
    EmployeeSerializer,
    LeaveSerializer,
    MyTokenObtainPairSerializer
)


# ✅ Custom JWT Login View
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        print("🔥🔥🔥 CUSTOM LOGIN VIEW WORKING 🔥🔥🔥")
        return super().post(request, *args, **kwargs)

# ✅ Employee List & Create
class EmployeeListCreateView(generics.ListCreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]


# ✅ Employee Detail
class EmployeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]


# ✅ Leave Apply
class LeaveCreateView(generics.CreateAPIView):
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)


# ✅ Leave List
class LeaveListView(generics.ListAPIView):
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        user = self.request.user

        if user.role == "ADMIN":
            return Leave.objects.all()
        else:
            return Leave.objects.filter(employee=user)


# ✅ Approve / Reject Leave
class LeaveApproveRejectView(generics.UpdateAPIView):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        leave = self.get_object()

        if request.user.role != "ADMIN":
            return Response(
                {"error": "Only admin can approve/reject"},
                status=status.HTTP_403_FORBIDDEN
            )

        status_value = request.data.get("status")

        if status_value in ["APPROVED", "REJECTED"]:
            leave.status = status_value
            leave.save()
            return Response({"message": f"Leave {status_value}"})

        return Response(
            {"error": "Invalid status"},
            status=status.HTTP_400_BAD_REQUEST
        )