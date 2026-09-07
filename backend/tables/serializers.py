"""T Clock — Tables serializers"""

from rest_framework import serializers
from .models import DiningTable, Reservation, title_case


class ReservationSerializer(serializers.ModelSerializer):
    table_number = serializers.ReadOnlyField(source='table.number')

    class Meta:
        model = Reservation
        fields = [
            'id', 'table', 'table_number', 'guest_name',
            'arrival_time', 'status', 'created_at', 'updated_at'
        ]

    def to_internal_value(self, data):
        if hasattr(data, '_mutable'):
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()

        if 'guest_name' in data and data['guest_name']:
            data['guest_name'] = title_case(data['guest_name'])

        return super().to_internal_value(data)


class TableSerializer(serializers.ModelSerializer):
    qr_url = serializers.ReadOnlyField()
    active_order_id = serializers.SerializerMethodField()
    active_reservation = serializers.SerializerMethodField()

    class Meta:
        model = DiningTable
        fields = [
            'id', 'number', 'name', 'capacity', 'status',
            'section', 'qr_token', 'qr_url', 'is_active',
            'active_order_id', 'active_reservation',
        ]
        read_only_fields = ['qr_token', 'qr_url']

    def to_internal_value(self, data):
        if hasattr(data, '_mutable'):
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()

        if 'name' in data and data['name']:
            data['name'] = title_case(data['name'])
        if 'section' in data and data['section']:
            data['section'] = title_case(data['section'])

        return super().to_internal_value(data)

    def get_active_order_id(self, obj):
        # Return the active (non-billed) order ID for the table
        try:
            order = obj.orders.exclude(status__in=['billed', 'cancelled']).order_by('-created_at').first()
            return order.id if order else None
        except Exception:
            return None

    def get_active_reservation(self, obj):
        try:
            res = obj.reservations.filter(status__in=['awaiting_guest', 'confirmed']).order_by('-id').first()
            return ReservationSerializer(res).data if res else None
        except Exception:
            return None
