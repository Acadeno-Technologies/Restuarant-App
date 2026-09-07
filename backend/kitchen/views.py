"""T Clock — Kitchen views (KDS — Kitchen Display System)"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from orders.models import Order, OrderItem
from orders.serializers import OrderSerializer, OrderItemSerializer
from accounts.permissions import IsKitchenOrAdmin, IsAnyStaff


class KitchenQueueView(APIView):
    """GET /api/kitchen/queue/ — live orders for kitchen to cook."""
    permission_classes = [IsKitchenOrAdmin]

    def get(self, request):
        # Active orders that kitchen needs to work on
        orders = Order.objects.filter(
            status__in=['pending', 'placed', 'confirmed', 'preparing']
        ).select_related('table').prefetch_related('items__menu_item').order_by('created_at')
        return Response(OrderSerializer(orders, many=True).data)


class KitchenUpdateItemView(APIView):
    """PATCH /api/kitchen/item/<item_id>/ — mark individual item as done."""
    permission_classes = [IsKitchenOrAdmin]

    def patch(self, request, item_id):
        try:
            item = OrderItem.objects.get(id=item_id)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=404)

        new_status = request.data.get('status')
        valid = ['pending', 'preparing', 'ready', 'cancelled']
        if new_status not in valid:
            return Response({'error': f'Status must be one of {valid}'}, status=400)

        item.status = new_status
        item.save()

        # Auto-advance order status when all items are ready
        order = item.order
        all_items = order.items.exclude(status='cancelled')
        if all_items.exists() and all(i.status == 'ready' for i in all_items):
            if order.status in ['pending', 'placed', 'confirmed', 'preparing']:
                order.status = 'ready'
                order.save()

        return Response(OrderItemSerializer(item).data)


class MarkOrderReadyView(APIView):
    """PATCH /api/kitchen/order/<order_id>/ready/ — mark whole order as ready."""
    permission_classes = [IsKitchenOrAdmin]

    def patch(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.status not in ['pending', 'placed', 'confirmed', 'preparing', 'ready']:
            return Response({'error': f'Order is {order.status}, not in kitchen'}, status=400)

        order.status = 'ready'
        order.items.exclude(status='cancelled').update(status='ready')
        order.save()
        return Response(OrderSerializer(order).data)

    def post(self, request, order_id):
        return self.patch(request, order_id)


class MarkOrderPreparingView(APIView):
    """PATCH /api/kitchen/order/<order_id>/preparing/ — mark whole order as preparing."""
    permission_classes = [IsKitchenOrAdmin]

    def patch(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.status not in ['pending', 'placed', 'confirmed', 'preparing']:
            return Response({'error': f'Order is {order.status}, cannot start preparing'}, status=400)

        order.status = 'preparing'
        order.items.exclude(status='cancelled').update(status='preparing')
        order.save()

        if order.table:
            order.table.status = 'occupied'
            order.table.save()

        return Response(OrderSerializer(order).data)

    def post(self, request, order_id):
        return self.patch(request, order_id)

