from django.urls import path
from .views import (
    MyTokenObtainPairView,
    EmployeeListCreateView,
    EmployeeDetailView,
    LeaveCreateView,
    LeaveListView,
    LeaveApproveRejectView
)
from .tests import SimpleTestView  # Add this line

urlpatterns = [
    # 🔐 CUSTOM JWT LOGIN
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # 👥 TEST VIEW (add this)
    path('test/', SimpleTestView.as_view(), name='test'),
    
    # 👤 Employees
    path('employees/', EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    
    # 📝 Leaves
    path('leaves/apply/', LeaveCreateView.as_view(), name='leave-apply'),
    path('leaves/', LeaveListView.as_view(), name='leave-list'),
    path('leaves/<int:pk>/approve/', LeaveApproveRejectView.as_view(), name='leave-approve-reject'),
]