"""T Clock — Menu URLs"""

from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('items/', views.MenuItemListCreateView.as_view(), name='menuitem-list'),
    path('items/<int:pk>/', views.MenuItemDetailView.as_view(), name='menuitem-detail'),
    path('items/<int:pk>/toggle/', views.ToggleItemAvailabilityView.as_view(), name='menuitem-toggle'),
    path('options/', views.MenuOptionsView.as_view(), name='menu-options'),
]

