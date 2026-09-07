"""T Clock — Menu serializers"""

from rest_framework import serializers
from .models import Category, MenuItem, title_case


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_name', 'name', 'description',
            'price', 'half_price', 'quarter_price', 'image', 'is_veg',
            'diet_type', 'spice_level',
            'is_available', 'is_featured', 'prep_time', 'calories', 'sort_order',
        ]
        extra_kwargs = {
            'half_price': {'required': False, 'allow_null': True},
            'quarter_price': {'required': False, 'allow_null': True},
            'description': {'required': False, 'allow_blank': True},
            'diet_type': {'required': False, 'allow_blank': True},
            'spice_level': {'required': False, 'allow_blank': True},
            'image': {'required': False, 'allow_null': True},
        }

    def to_internal_value(self, data):
        if hasattr(data, '_mutable'):
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()

        # Numeric and file fields that should be null if empty
        for field in ['half_price', 'quarter_price', 'calories', 'image']:
            if field in data and (data[field] == '' or data[field] == 'null' or data[field] == 'undefined'):
                data[field] = None

        # Text fields should be empty string if null/undefined
        for field in ['description', 'diet_type', 'spice_level']:
            if field in data and (data[field] == 'null' or data[field] == 'undefined' or data[field] is None):
                data[field] = ''

        # Parse string booleans from FormData
        if 'is_veg' in data and isinstance(data['is_veg'], str):
            data['is_veg'] = data['is_veg'].lower() in ('true', '1', 'yes')
        if 'is_available' in data and isinstance(data['is_available'], str):
            data['is_available'] = data['is_available'].lower() in ('true', '1', 'yes')

        # Format name, diet_type, spice_level to Title Case (e.g. "biriyani" -> "Biriyani", "non-veg" -> "Non-Veg")
        if 'name' in data and data['name']:
            data['name'] = title_case(data['name'])
        if 'diet_type' in data and data['diet_type']:
            data['diet_type'] = title_case(data['diet_type'])
        if 'spice_level' in data and data['spice_level']:
            data['spice_level'] = title_case(data['spice_level'])

        return super().to_internal_value(data)


    def create(self, validated_data):
        has_image = 'image' in validated_data and validated_data['image']
        try:
            return super().create(validated_data)
        except Exception as e:
            if has_image:
                validated_data.pop('image', None)
                return super().create(validated_data)
            raise serializers.ValidationError({'detail': f'Error creating menu item: {str(e)}'})

    def update(self, instance, validated_data):
        has_image = 'image' in validated_data and validated_data['image']
        try:
            return super().update(instance, validated_data)
        except Exception as e:
            if has_image:
                validated_data.pop('image', None)
                return super().update(instance, validated_data)
            raise serializers.ValidationError({'detail': f'Error updating menu item: {str(e)}'})



class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'description', 'is_active', 'sort_order', 'items', 'item_count']

    def to_internal_value(self, data):
        if hasattr(data, '_mutable'):
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()

        if 'name' in data and data['name']:
            data['name'] = title_case(data['name'])

        return super().to_internal_value(data)

    def get_item_count(self, obj):
        return obj.items.filter(is_available=True).count()


class CategoryLightSerializer(serializers.ModelSerializer):
    """Category without nested items — for dropdown lists."""
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'is_active', 'sort_order']

    def to_internal_value(self, data):
        if hasattr(data, '_mutable'):
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()

        if 'name' in data and data['name']:
            data['name'] = title_case(data['name'])

        return super().to_internal_value(data)
