from rest_framework import serializers
from .models import Employee, Leave
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'

class LeaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leave
        fields = '__all__'
        read_only_fields = ['status', 'applied_at', 'employee']

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Make sure role is added to token
        token['role'] = user.role
        token['username'] = user.username
        
        return token
    
    def validate(self, attrs):
        # This makes the role available in the login response too
        data = super().validate(attrs)
        
        # Add role and username to the response
        data['role'] = self.user.role
        data['username'] = self.user.username
        
        return data