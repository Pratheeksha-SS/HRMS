from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # 🔥 Include only app URLs
    path('api/', include('hrms.urls')),
]