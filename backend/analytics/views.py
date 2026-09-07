"""T Clock — Analytics views (Revenue & Reports)"""

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta

from billing.models import Bill
from orders.models import Order, OrderItem
from menu.models import MenuItem, Category
from accounts.permissions import IsAdmin


class DashboardSummaryView(APIView):
    """GET /api/analytics/dashboard/ — key metrics for admin dashboard."""
    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # Today's revenue
        today_orders_qs = Order.objects.filter(created_at__date=today, status='billed')
        today_revenue = today_orders_qs.aggregate(
            total=Sum(F('items__quantity') * F('items__unit_price'))
        )['total'] or 0
        today_orders = Order.objects.filter(created_at__date=today).count()

        # This week
        week_revenue = Order.objects.filter(
            created_at__date__gte=week_ago, status='billed'
        ).aggregate(total=Sum(F('items__quantity') * F('items__unit_price')))['total'] or 0

        # This month
        month_revenue = Order.objects.filter(
            created_at__date__gte=month_ago, status='billed'
        ).aggregate(total=Sum(F('items__quantity') * F('items__unit_price')))['total'] or 0

        # Active orders
        active_orders = Order.objects.filter(
            status__in=['pending', 'confirmed', 'preparing', 'ready', 'served']
        ).count()

        # Average order value
        total_billed_orders = Order.objects.filter(status='billed').count()
        total_revenue = Order.objects.filter(status='billed').aggregate(
            total=Sum(F('items__quantity') * F('items__unit_price'))
        )['total'] or 0
        avg_order = (total_revenue / total_billed_orders) if total_billed_orders > 0 else 0

        return Response({
            'today_revenue': float(today_revenue),
            'today_orders': today_orders,
            'week_revenue': float(week_revenue),
            'month_revenue': float(month_revenue),
            'total_revenue': float(total_revenue),
            'active_orders': active_orders,
            'avg_order_value': round(float(avg_order), 2),
        })


class RevenueChartView(APIView):
    """GET /api/analytics/revenue-chart/?period=daily|monthly"""
    permission_classes = [IsAdmin]

    def get(self, request):
        period = request.query_params.get('period', 'daily')

        if period == 'monthly':
            data = Order.objects.filter(status='billed').annotate(
                date=TruncMonth('created_at')
            ).values('date').annotate(
                revenue=Sum(F('items__quantity') * F('items__unit_price')), orders=Count('id', distinct=True)
            ).order_by('date')[:12]
        else:
            # Last 14 days
            days_ago = timezone.now().date() - timedelta(days=14)
            data = Order.objects.filter(
                created_at__date__gte=days_ago, status='billed'
            ).annotate(
                date=TruncDate('created_at')
            ).values('date').annotate(
                revenue=Sum(F('items__quantity') * F('items__unit_price')), orders=Count('id', distinct=True)
            ).order_by('date')

        return Response([
            {
                'date': str(item['date']),
                'revenue': float(item['revenue'] or 0),
                'orders': item['orders'],
            }
            for item in data
        ])


class TopItemsView(APIView):
    """GET /api/analytics/top-items/ — best selling items."""
    permission_classes = [IsAdmin]

    def get(self, request):
        top = OrderItem.objects.filter(
            order__status='billed'
        ).values(
            'menu_item__id', 'menu_item__name', 'menu_item__category__name'
        ).annotate(
            total_qty=Sum('quantity'),
            total_revenue=Sum(F('quantity') * F('unit_price'))
        ).order_by('-total_qty')[:10]

        return Response([
            {
                'id': item['menu_item__id'],
                'name': item['menu_item__name'],
                'category': item['menu_item__category__name'],
                'total_qty': item['total_qty'],
                'total_revenue': float(item['total_revenue'] or 0),
            }
            for item in top
        ])


class OrderTypeBreakdownView(APIView):
    """GET /api/analytics/order-types/ — dine_in vs takeaway vs delivery split."""
    permission_classes = [IsAdmin]

    def get(self, request):
        data = Order.objects.filter(
            status='billed'
        ).values('order_type').annotate(
            count=Count('id', distinct=True),
            revenue=Sum(F('items__quantity') * F('items__unit_price'))
        ).order_by('-count')
        return Response(list(data))
