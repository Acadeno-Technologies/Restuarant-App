"""T Clock — Billing views"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

from .models import Bill
from .serializers import BillSerializer, GenerateBillSerializer
from rest_framework.permissions import AllowAny
from orders.models import Order
from accounts.permissions import IsStaffOrAdmin, IsAdmin


class BillListView(generics.ListAPIView):
    serializer_class = BillSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Bill.objects.select_related('order__table', 'created_by').prefetch_related('order__items__menu_item')
        is_paid = self.request.query_params.get('is_paid')
        if is_paid is not None:
            qs = qs.filter(is_paid=is_paid == 'true')
        return qs



class BillDetailView(generics.RetrieveAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [AllowAny]



class GenerateBillView(APIView):
    """POST /api/billing/generate/ — generate a bill for an order."""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request):
        serializer = GenerateBillSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        try:
            order = Order.objects.prefetch_related('items__menu_item').get(id=data['order_id'])
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.status == 'cancelled':
            return Response({'error': 'Cannot bill a cancelled order'}, status=400)

        if hasattr(order, 'bill'):
            return Response({'error': 'Bill already generated', 'bill_id': order.bill.id}, status=400)

        # Compute totals
        subtotal = order.subtotal
        include_gst = data.get('include_gst', True)
        tax_percent = data['tax_percent'] if include_gst else 0
        tax_amount = (subtotal * tax_percent) / 100 if include_gst else 0
        discount = data['discount_amount']
        total = subtotal + tax_amount - discount

        bill = Bill.objects.create(
            order=order,
            subtotal=subtotal,
            include_gst=include_gst,
            tax_percent=tax_percent,
            tax_amount=tax_amount,
            discount_amount=discount,
            discount_reason=data['discount_reason'],
            total=total,
            payment_method=data['payment_method'],
            is_paid=True,
            paid_at=timezone.now(),
            created_by=request.user,
            notes=data['notes'],
        )

        # Mark order as billed
        order.status = 'billed'
        order.save()

        # Free up the table
        if order.table:
            other_active = order.table.orders.exclude(
                id=order.id
            ).exclude(status__in=['billed', 'cancelled']).exists()
            if not other_active:
                order.table.status = 'available'
                order.table.save()

        # Build WhatsApp receipt text
        whatsapp_text = _build_whatsapp_receipt(bill, order)

        response_data = BillSerializer(bill).data
        response_data['whatsapp_text'] = whatsapp_text
        return Response(response_data, status=201)


def _build_whatsapp_receipt(bill, order):
    """Build a customer-friendly receipt message for WhatsApp & SMS."""
    date_str = bill.created_at.strftime('%d/%m/%Y %H:%M')
    cust_name = order.customer_name or "Customer"
    rest_name = "T Clock Resto Cafe"
    qr_token = order.table.qr_token if (order.table and hasattr(order.table, 'qr_token')) else ''
    invoice_url = f"http://localhost:5173/order/{qr_token}" if qr_token else "http://localhost:5173"

    lines = []
    lines.append(f"Dear {cust_name},")
    lines.append("")
    lines.append(f"Thank you for your recent order at *{rest_name}*! 🌴")
    lines.append("Your invoice is now available. 🪄")
    lines.append("")
    lines.append(f"💰 Amount : *Rs.{int(bill.total)}*")
    lines.append(f"📅 Date : {date_str}")
    lines.append(f"🧾 Invoice No : *{bill.bill_number}*")
    lines.append(f"💳 Payment : {bill.get_payment_method_display()}")
    lines.append(f"🔗 View Invoice & Menu : {invoice_url}")
    lines.append("")
    lines.append("*Order Details:*")
    lines.append("─────────────────────")

    for item in order.items.all():
        item_total = int(item.quantity * item.unit_price)
        portion_str = f" ({item.portion})" if item.portion else ""
        lines.append(f"  {item.quantity}× {item.menu_item.name}{portion_str} — ₹{item_total}")
        if item.notes:
            lines.append(f"     📝 _{item.notes}_")

    lines.append("─────────────────────")
    lines.append(f"Subtotal: ₹{int(bill.subtotal)}")
    if bill.include_gst and bill.tax_amount > 0:
        lines.append(f"GST ({bill.tax_percent}%): ₹{int(bill.tax_amount)}")
    if bill.discount_amount > 0:
        lines.append(f"Discount: -₹{int(bill.discount_amount)}")
    lines.append(f"*TOTAL PAID: ₹{int(bill.total)}*")
    lines.append("━━━━━━━━━━━━━━━━━━━━")
    lines.append("")
    lines.append(f"How was your experience with your order at *{rest_name}* today? 😊")
    lines.append("We look forward to welcoming you back!")

    return "\n".join(lines)


class OrderBillView(APIView):
    """GET /api/billing/order/<order_id>/ — get bill for a specific order."""
    permission_classes = [IsStaffOrAdmin]

    def get(self, request, order_id):
        try:
            bill = Bill.objects.get(order_id=order_id)
            return Response(BillSerializer(bill).data)
        except Bill.DoesNotExist:
            return Response({'bill': None})


class BillWhatsAppTextView(APIView):
    """GET /api/billing/<bill_id>/whatsapp/ — get WhatsApp receipt text for a generated bill."""
    permission_classes = [IsStaffOrAdmin]

    def get(self, request, pk):
        try:
            bill = Bill.objects.prefetch_related('order__items__menu_item').get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'error': 'Bill not found'}, status=404)

        text = _build_whatsapp_receipt(bill, bill.order)
        return Response({
            'bill_number': bill.bill_number,
            'whatsapp_text': text,
            'customer_phone': bill.order.customer_phone or '',
            'total': str(bill.total),
        })
