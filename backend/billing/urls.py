"""T Clock — Billing URLs"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.BillListView.as_view(), name='bill-list'),
    path('<int:pk>/', views.BillDetailView.as_view(), name='bill-detail'),
    path('generate/', views.GenerateBillView.as_view(), name='bill-generate'),
    path('order/<int:order_id>/', views.OrderBillView.as_view(), name='order-bill'),
    path('<int:pk>/whatsapp/', views.BillWhatsAppTextView.as_view(), name='bill-whatsapp'),
]
