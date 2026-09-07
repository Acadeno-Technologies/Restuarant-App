"""T Clock — Tables serializers"""

from rest_framework import serializers
from .models import DiningTable, Reservation


class ReservationSerializer(serializers.ModelSerializer):
    table_number = serializers.ReadOnlyField(source='table.number')

    class Meta:
        model = Reservation
        fields = [
            'id', 'table', 'table_number', 'guest_name',
            'arrival_time', 'status', 'created_at', 'updated_at'
        ]


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

    def get_active_order_id(self, obj):
        # Return the active (non-billed) order ID for the table
        try:
            order = obj.orders.exclude(status__in=['billed', 'cancelled']).last()
            return order.id if order else None
        except Exception:
            return None

    def get_active_reservation(self, obj):
        try:
            res = obj.reservations.filter(status__in=['awaiting_guest', 'confirmed']).last()
            return ReservationSerializer(res).data if res else None
        except Exception:
            return None
