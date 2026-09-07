"""T Clock — Orders serializers"""

from rest_framework import serializers
from .models import Order, OrderItem
from menu.serializers import MenuItemSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_image = serializers.SerializerMethodField()
    is_veg = serializers.BooleanField(source='menu_item.is_veg', read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'menu_item', 'menu_item_name', 'menu_item_image',
            'is_veg', 'quantity', 'unit_price', 'portion', 'subtotal', 'notes', 'status',
        ]

    def get_menu_item_image(self, obj):
        if obj.menu_item and obj.menu_item.image:
            return str(obj.menu_item.image)
        return None



class OrderItemCreateSerializer(serializers.ModelSerializer):
    unit_price = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    portion = serializers.CharField(max_length=20, required=False, default='Full')

    class Meta:
        model = OrderItem
        fields = ['menu_item', 'quantity', 'unit_price', 'portion', 'notes']

    def validate_menu_item(self, item):
        if not item.is_available:
            raise serializers.ValidationError(f"'{item.name}' is currently not available.")
        return item


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    subtotal = serializers.ReadOnlyField()
    table_number = serializers.CharField(source='table.number', read_only=True, allow_null=True)
    table_name = serializers.CharField(source='table.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = [
            'id', 'table', 'table_number', 'table_name',
            'order_type', 'status', 'customer_name', 'customer_phone',
            'notes', 'kitchen_notes', 'items', 'subtotal', 'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)

    class Meta:
        model = Order
        fields = ['table', 'order_type', 'customer_name', 'customer_phone', 'notes', 'kitchen_notes', 'items']

    def validate_table(self, table):
        if table and table.status in ['no_service', 'inactive']:
            raise serializers.ValidationError(f"Table {table.number} is currently out of service.")
        return table

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        # Sync notes and kitchen_notes if only one is passed
        kitchen_note = validated_data.get('kitchen_notes') or validated_data.get('notes') or ''
        if not validated_data.get('kitchen_notes') and kitchen_note:
            validated_data['kitchen_notes'] = kitchen_note
        if not validated_data.get('notes') and kitchen_note:
            validated_data['notes'] = kitchen_note

        order = Order.objects.create(
            **validated_data,
            status='pending',
            created_by=self.context['request'].user if self.context['request'].user.is_authenticated else None
        )
        for item_data in items_data:
            menu_item = item_data['menu_item']
            portion = item_data.get('portion', 'Full')
            unit_price = item_data.get('unit_price')
            if unit_price is None:
                if portion == 'Half' and menu_item.half_price:
                    unit_price = menu_item.half_price
                elif portion == 'Half':
                    unit_price = round(menu_item.price * 0.6, 2)
                elif portion == 'Quarter' and menu_item.quarter_price:
                    unit_price = menu_item.quarter_price
                elif portion == 'Quarter':
                    unit_price = round(menu_item.price * 0.35, 2)
                else:
                    unit_price = menu_item.price

            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=item_data['quantity'],
                unit_price=unit_price,
                portion=portion,
                notes=item_data.get('notes', ''),
            )
        # Mark table as occupied whenever an order is created on a table
        if order.table:
            order.table.status = 'occupied'
            order.table.save(update_fields=['status'])
        return order

