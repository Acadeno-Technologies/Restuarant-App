from django.contrib import admin
from .models import DiningTable

@admin.register(DiningTable)
class TableAdmin(admin.ModelAdmin):
    list_display = ['number', 'name', 'section', 'capacity', 'status', 'is_active']
    list_filter = ['section', 'status', 'is_active']
    list_editable = ['status']
    readonly_fields = ['qr_token']
