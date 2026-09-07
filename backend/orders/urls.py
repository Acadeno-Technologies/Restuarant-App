"""T Clock — Orders URLs"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListCreateView.as_view(), name='order-list'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('<int:pk>/status/', views.UpdateOrderStatusView.as_view(), name='order-status'),
    path('<int:pk>/add-items/', views.AddItemsToOrderView.as_view(), name='order-add-items'),
    path('table/<int:table_id>/active/', views.ActiveTableOrderView.as_view(), name='table-active-order'),
    path('items/<int:item_id>/', views.UpdateOrderItemView.as_view(), name='order-item-detail'),
]
