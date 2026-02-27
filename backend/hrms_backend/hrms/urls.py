from django.urls import path
from .views import admin_login, employee_login

urlpatterns = [
    path('admin-login/', admin_login),
    path('employee-login/', employee_login),
]

from .views import EmployeeListCreateView, EmployeeDetailView

urlpatterns = [
    path('admin-login/', admin_login),
    path('employee-login/', employee_login),

    path('employees/', EmployeeListCreateView.as_view()),
    path('employees/<int:pk>/', EmployeeDetailView.as_view()),
]

from rest_framework.routers import DefaultRouter
from .views import LeaveViewSet

router = DefaultRouter()
router.register(r'leaves', LeaveViewSet)

urlpatterns = router.urls