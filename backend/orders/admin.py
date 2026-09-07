from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'table', 'order_type', 'status', 'customer_name', 'created_at']
    list_filter = ['status', 'order_type']
    search_fields = ['customer_name', 'customer_phone']
    inlines = [OrderItemInline]
    readonly_fields = ['created_at', 'updated_at']
