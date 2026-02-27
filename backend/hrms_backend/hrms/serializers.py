from rest_framework import serializers
from .models import Employee

class EmployeeSerializer(serializers.ModelSerializer):

    class Meta:
        model = Employee
        fields = '__all__'

from .models import Leave

class LeaveSerializer(serializers.ModelSerializer):

    class Meta:
        model = Leave
        fields = '__all__'
        read_only_fields = ['status', 'applied_at', 'employee']