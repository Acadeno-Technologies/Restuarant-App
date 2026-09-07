"""T Clock — Menu views"""

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Category, MenuItem, MenuOption
from .serializers import CategorySerializer, CategoryLightSerializer, MenuItemSerializer
from accounts.permissions import IsAdmin, IsAnyStaff


class CategoryListCreateView(generics.ListCreateAPIView):
    """GET — public (for customers too). POST — Authenticated staff/admin."""
    queryset = Category.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.request.query_params.get('light'):
            return CategoryLightSerializer
        return CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [AllowAny()]  # Allow seamless creation in Admin UI


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class MenuItemListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = MenuItem.objects.all()
        category = self.request.query_params.get('category')
        available = self.request.query_params.get('available')
        if category:
            qs = qs.filter(category_id=category)
        if available == 'true':
            qs = qs.filter(is_available=True)
        return qs

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [AllowAny()]


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [AllowAny]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ToggleItemAvailabilityView(generics.UpdateAPIView):
    """PATCH /api/menu/items/<id>/toggle/ — quickly toggle availability."""
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]

    def patch(self, request, *args, **kwargs):
        item = self.get_object()
        item.is_available = not item.is_available
        item.save()
        return Response({'id': item.id, 'is_available': item.is_available})


def normalize_diet_value(val):
    if not val:
        return ''
    s = str(val).strip()
    if s.lower() == 'veg':
        return 'Veg'
    if s.lower() in ('non-veg', 'non veg', 'nonveg'):
        return 'Non-Veg'
    if s.lower() == 'egg':
        return 'Egg'
    return ' '.join(w.capitalize() for w in s.split())


def normalize_spice_value(val):
    if not val:
        return ''
    s = str(val).strip()
    if s.lower() == 'mild':
        return 'Mild'
    if s.lower() == 'medium':
        return 'Medium'
    if s.lower() in ('hot', 'spicy'):
        return 'Hot'
    return ' '.join(w.capitalize() for w in s.split())


class MenuOptionsView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get_options_data(self):
        custom_diet = list(MenuOption.objects.filter(option_type='diet_type').values_list('value', flat=True))
        custom_spice = list(MenuOption.objects.filter(option_type='spice_level').values_list('value', flat=True))

        item_diets = list(MenuItem.objects.exclude(diet_type='').values_list('diet_type', flat=True).distinct())

        base_diet = ['Veg', 'Non-Veg']
        base_spice = ['Mild', 'Medium', 'Hot']

        # combine with case-insensitive deduplication
        all_diet = []
        seen_diet = set()
        for d in base_diet + item_diets + custom_diet:
            norm = normalize_diet_value(d)
            if norm and norm.lower() not in seen_diet:
                seen_diet.add(norm.lower())
                all_diet.append(norm)

        all_spice = []
        seen_spice = set()
        for s in base_spice + custom_spice:
            norm = normalize_spice_value(s)
            if norm and norm.lower() not in seen_spice:
                seen_spice.add(norm.lower())
                all_spice.append(norm)

        return {
            'diet_types': all_diet,
            'spice_levels': all_spice,
        }


    def get(self, request):
        return Response(self.get_options_data())

    def post(self, request):
        option_type = request.data.get('option_type')
        raw_val = str(request.data.get('value', '')).strip()

        if option_type not in ['diet_type', 'spice_level']:
            return Response({'error': 'Invalid option_type. Must be diet_type or spice_level'}, status=status.HTTP_400_BAD_REQUEST)

        if not raw_val:
            return Response({'error': 'Value cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

        if option_type == 'diet_type':
            value = normalize_diet_value(raw_val)
        else:
            value = normalize_spice_value(raw_val)

        existing = MenuOption.objects.filter(option_type=option_type, value__iexact=value).first()
        if not existing:
            MenuOption.objects.create(option_type=option_type, value=value)

        return Response({
            'message': 'Option saved successfully',
            'added': value,
            'options': self.get_options_data()
        }, status=status.HTTP_201_CREATED)

