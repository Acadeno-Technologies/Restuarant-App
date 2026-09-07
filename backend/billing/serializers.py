"""T Clock — Billing serializers"""

from rest_framework import serializers
from .models import Bill
from orders.serializers import OrderSerializer


class BillSerializer(serializers.ModelSerializer):
    order_details = OrderSerializer(source='order', read_only=True)

    class Meta:
        model = Bill
        fields = [
            'id', 'bill_number', 'order', 'order_details',
            'subtotal', 'include_gst', 'tax_percent', 'tax_amount',
            'discount_amount', 'discount_reason', 'total',
            'payment_method', 'is_paid', 'paid_at',
            'created_by', 'created_at', 'notes',
        ]
        read_only_fields = ['bill_number', 'tax_amount', 'total', 'created_by', 'paid_at']


class GenerateBillSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    include_gst = serializers.BooleanField(default=True)
    tax_percent = serializers.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_reason = serializers.CharField(max_length=200, allow_blank=True, default='')
    payment_method = serializers.ChoiceField(choices=Bill.PAYMENT_METHOD_CHOICES, default='cash')
    notes = serializers.CharField(allow_blank=True, default='')
