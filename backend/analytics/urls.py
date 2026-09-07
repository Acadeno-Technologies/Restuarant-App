"""T Clock — Analytics URLs"""

from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardSummaryView.as_view(), name='analytics-dashboard'),
    path('revenue-chart/', views.RevenueChartView.as_view(), name='analytics-revenue-chart'),
    path('top-items/', views.TopItemsView.as_view(), name='analytics-top-items'),
    path('order-types/', views.OrderTypeBreakdownView.as_view(), name='analytics-order-types'),
]
