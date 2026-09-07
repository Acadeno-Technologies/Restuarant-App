"""T Clock — accounts views"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User, CustomRole
from .serializers import UserSerializer, RegisterSerializer, CustomTokenSerializer, CustomRoleSerializer
from .permissions import IsAdmin


class RoleListView(generics.ListCreateAPIView):
    """GET/POST /api/auth/roles/ (Admin only)."""
    queryset = CustomRole.objects.all()
    serializer_class = CustomRoleSerializer
    permission_classes = [IsAdmin]


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/auth/roles/<id>/ (Admin only)."""
    queryset = CustomRole.objects.all()
    serializer_class = CustomRoleSerializer
    permission_classes = [IsAdmin]


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — returns JWT tokens + user info."""
    serializer_class = CustomTokenSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create new staff user (Admin only)."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsAdmin]


class AdminRegisterView(generics.CreateAPIView):
    """POST /api/auth/admin/register/ — register new Admin user in shared database."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        serializer.save(role='admin', is_staff=True)


class ProfileView(APIView):
    """GET/PATCH /api/auth/profile/ — current user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        username = request.data.get('username')
        password = request.data.get('password')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')

        if username:
            username = username.strip()
            if User.objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
                return Response({'error': 'Username already taken. Please choose another.'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username

        if first_name is not None:
            user.first_name = first_name.strip()

        if last_name is not None:
            user.last_name = last_name.strip()

        if password and str(password).strip():
            pwd_clean = str(password).strip()
            if len(pwd_clean) < 4:
                return Response({'error': 'Password must be at least 4 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(pwd_clean)

        user.save()
        serializer = UserSerializer(user)
        return Response({
            'message': 'Profile updated successfully',
            'user': serializer.data
        }, status=status.HTTP_200_OK)


class StaffListView(generics.ListAPIView):
    """GET /api/auth/staff/ — list all staff (Admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/auth/staff/<id>/ (Admin only)."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


class RestaurantSettingsView(APIView):
    """GET/PUT /api/auth/settings/ — get/update restaurant settings."""
    permission_classes = [AllowAny] # GET is public (for staff POS)
    
    def get(self, request):
        from .models import RestaurantSettings
        from .serializers import RestaurantSettingsSerializer
        settings = RestaurantSettings.load()
        serializer = RestaurantSettingsSerializer(settings)
        return Response(serializer.data)
        
    def put(self, request):
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'error': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
            
        from .models import RestaurantSettings
        from .serializers import RestaurantSettingsSerializer
        settings = RestaurantSettings.load()
        serializer = RestaurantSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        return self.put(request)
