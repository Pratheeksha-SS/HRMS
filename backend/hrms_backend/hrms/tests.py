from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class SimpleTestView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Simple test to see if role is available
        return Response({
            'message': 'Success!',
            'username': request.user.username,
            'role': request.user.role,
            'is_authenticated': True
        })