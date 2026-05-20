import sys, os
sys.path.insert(0, 'backend/hrms_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_backend.settings')
import django; django.setup()

from django.contrib.auth import get_user_model
from hrms.chatbot_service import GeminiChatbotService, _load_api_key, _working_model

User = get_user_model()
user = User.objects.get(username='admin')

print(f"API Key: {_load_api_key()[:25]}...")
print(f"Testing with: {user.username} ({user.role})\n")

service = GeminiChatbotService(user=user)

tests = [
    "hello",
    "what is my leave balance",
    "show upcoming holidays",
    "my leabes",          # typo test
    "attndnce",           # typo test
]

for msg in tests:
    print(f"Q: {msg}")
    resp = service.process_message(msg)
    print(f"A: {resp[:200]}")
    print(f"   [model used: {_working_model}]")
    print()
