"""T Clock — Orders views"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer, OrderItemSerializer
from accounts.permissions import IsAdmin, IsStaffOrAdmin, IsAnyStaff


class OrderListCreateView(generics.ListCreateAPIView):
    """GET — list orders. POST — create new order (staff or customer QR)."""

    def get_queryset(self):
        qs = Order.objects.select_related('table', 'created_by').prefetch_related('items__menu_item')
        status_filter = self.request.query_params.get('status')
        table = self.request.query_params.get('table')
        order_type = self.request.query_params.get('order_type')
        if status_filter:
            if ',' in status_filter:
                qs = qs.filter(status__in=[s.strip() for s in status_filter.split(',')])
            else:
                qs = qs.filter(status=status_filter)
        if table:
            qs = qs.filter(table_id=table)
        if order_type:
            qs = qs.filter(order_type=order_type)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer

    def get_permissions(self):
        return [AllowAny()]



class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.select_related('table').prefetch_related('items__menu_item')
    serializer_class = OrderSerializer
    permission_classes = [IsAnyStaff]


class UpdateOrderStatusView(APIView):
    """PATCH /api/orders/<id>/status/ — move order through workflow."""
    permission_classes = [IsAnyStaff]

    VALID_TRANSITIONS = {
        'pending': ['confirmed', 'preparing', 'ready', 'served', 'cancelled'],
        'confirmed': ['preparing', 'ready', 'served', 'cancelled'],
        'preparing': ['ready', 'served', 'cancelled'],
        'ready': ['served', 'billed', 'cancelled'],
        'served': ['billed', 'cancelled'],
        'billed': [],
        'cancelled': [],
    }

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        new_status = request.data.get('status')
        if new_status not in self.VALID_TRANSITIONS.get(order.status, []):
            return Response({
                'error': f"Cannot move from '{order.status}' to '{new_status}'",
                'allowed': self.VALID_TRANSITIONS.get(order.status, [])
            }, status=400)

        order.status = new_status
        order.save()

        # Update table status based on order status
        if order.table:
            if new_status in ['served', 'ready']:
                order.table.status = 'billing'
                order.table.save()
            elif new_status in ['billed', 'cancelled']:
                other_active = order.table.orders.exclude(
                    id=order.id
                ).exclude(status__in=['billed', 'cancelled']).exists()
                if not other_active:
                    order.table.status = 'available'
                    order.table.save()

        return Response(OrderSerializer(order).data)


class AddItemsToOrderView(APIView):
    """POST /api/orders/<id>/add-items/ — add more items to existing order (staff or customer QR)."""
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.status in ['billed', 'cancelled']:
            return Response({'error': 'Cannot add items to a closed order'}, status=400)

        items_data = request.data.get('items', [])
        for item_data in items_data:
            from menu.models import MenuItem
            try:
                menu_item = MenuItem.objects.get(id=item_data['menu_item'])
                portion = item_data.get('portion', 'Full')
                unit_price = item_data.get('unit_price')
                if unit_price is None:
                    if portion == 'Half' and menu_item.half_price:
                        unit_price = menu_item.half_price
                    elif portion == 'Half':
                        unit_price = round(menu_item.price * 0.6, 2)
                    elif portion == 'Quarter' and menu_item.quarter_price:
                        unit_price = menu_item.quarter_price
                    elif portion == 'Quarter':
                        unit_price = round(menu_item.price * 0.35, 2)
                    else:
                        unit_price = menu_item.price

                existing_qs = order.items.filter(menu_item=menu_item, portion=portion)
                if existing_qs.exists():
                    existing = existing_qs.first()
                    existing_qs.exclude(id=existing.id).delete()
                    existing.quantity += item_data.get('quantity', 1)
                    existing.save()
                else:
                    OrderItem.objects.create(
                        order=order,
                        menu_item=menu_item,
                        quantity=item_data.get('quantity', 1),
                        unit_price=unit_price,
                        portion=portion,
                        notes=item_data.get('notes', ''),
                    )
            except MenuItem.DoesNotExist:
                pass

        # Update kitchen_notes and notes if passed
        kitchen_note = request.data.get('kitchen_notes') or request.data.get('notes')
        if kitchen_note is not None:
            order.kitchen_notes = kitchen_note
            order.notes = kitchen_note
            order.save()

        if order.table and order.table.status != 'occupied':
            order.table.status = 'occupied'
            order.table.save(update_fields=['status'])

        return Response(OrderSerializer(order).data)



class ActiveTableOrderView(APIView):
    """GET /api/orders/table/<table_id>/active/ — get active order for table."""
    permission_classes = [AllowAny]

    def get(self, request, table_id):
        from tables.models import DiningTable
        from django.db.models import Q
        try:
            table = DiningTable.objects.get(id=table_id)
        except DiningTable.DoesNotExist:
            return Response({'error': 'Table not found'}, status=404)

        # Retrieve active (non-billed, non-cancelled) order for table (latest first)
        order = Order.objects.filter(
            Q(table_id=table.id) | Q(table__number=table.number)
        ).exclude(status__in=['billed', 'cancelled']).order_by('-created_at').first()
        
        if not order:
            return Response({'order': None})
        return Response(OrderSerializer(order).data)


class UpdateOrderItemView(APIView):
    """PATCH /api/orders/items/<item_id>/ & DELETE — edit quantity or remove item from order."""
    permission_classes = [AllowAny]

    def patch(self, request, item_id):
        try:
            item = OrderItem.objects.get(id=item_id)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=404)

        if item.order.status in ['billed', 'cancelled']:
            return Response({'error': 'Cannot edit a closed order'}, status=400)

        quantity = request.data.get('quantity')
        notes = request.data.get('notes')

        if quantity is not None:
            new_qty = int(quantity)
            if new_qty <= 0:
                order = item.order
                item.delete()
                return Response({'message': 'Item deleted', 'order': OrderSerializer(order).data})
            item.quantity = new_qty

        if notes is not None:
            item.notes = notes

        item.save()
        return Response(OrderItemSerializer(item).data)

    def delete(self, request, item_id):
        try:
            item = OrderItem.objects.get(id=item_id)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=404)

        if item.order.status in ['billed', 'cancelled']:
            return Response({'error': 'Cannot edit a closed order'}, status=400)

        order = item.order
        item.delete()
        return Response({'message': 'Item removed', 'order': OrderSerializer(order).data})
