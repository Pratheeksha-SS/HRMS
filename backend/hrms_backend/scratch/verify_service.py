
import os
import django
import sys

# Setup Django
sys.path.append(os.path.join(os.getcwd()))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from hrms.chatbot_service import GeminiChatbotService
from hrms.models import Employee

def test_service():
    User = get_user_model()
    # Get or create a dummy user for testing
    user, _ = User.objects.get_or_create(username='testuser', defaults={'email': 'test@example.com'})
    if not hasattr(user, 'employee_profile'):
        Employee.objects.get_or_create(user=user, defaults={'employee_id': 'EMPTEST', 'department': 'IT'})
    
    user.role = 'EMPLOYEE' # Mock role if needed
    
    service = GeminiChatbotService(user)
    print("Sending message: 'how to apply for leave?'")
    response = service.process_message("how to apply for leave?")
    print("Response:", response)

if __name__ == "__main__":
    test_service()
