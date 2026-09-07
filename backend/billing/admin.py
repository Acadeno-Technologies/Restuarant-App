from django.contrib import admin
from .models import Bill

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ['bill_number', 'order', 'subtotal', 'total', 'payment_method', 'is_paid', 'created_at']
    list_filter = ['is_paid', 'payment_method']
    search_fields = ['bill_number']
    readonly_fields = ['bill_number', 'tax_amount', 'total', 'paid_at', 'created_at']
