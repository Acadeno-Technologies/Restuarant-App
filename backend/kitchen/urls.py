"""T Clock — Kitchen URLs"""

from django.urls import path
from . import views

urlpatterns = [
    path('queue/', views.KitchenQueueView.as_view(), name='kitchen-queue'),
    path('item/<int:item_id>/', views.KitchenUpdateItemView.as_view(), name='kitchen-item-update'),
    path('order/<int:order_id>/preparing/', views.MarkOrderPreparingView.as_view(), name='kitchen-order-preparing'),
    path('order/<int:order_id>/ready/', views.MarkOrderReadyView.as_view(), name='kitchen-order-ready'),
]
