import sys, os
sys.path.insert(0, 'backend/hrms_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_backend.settings')
import django; django.setup()

import hrms.views as v
to_check = [
    'PromoteEmployeeView', 'AllDepartmentsView', 'DepartmentDetailView',
    'AddEmployeeView', 'reports_salary', 'reports_attendance', 'reports_employees',
]
for name in to_check:
    status = "OK" if hasattr(v, name) else "MISSING"
    print(f"{name}: {status}")

# Now try importing urls
try:
    from hrms.urls import urlpatterns
    print(f"\nurls.py: OK ({len(urlpatterns)} patterns)")
except Exception as e:
    print(f"\nurls.py ERROR: {e}")
