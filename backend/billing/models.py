"""T Clock — Billing models"""

from django.db import models
from django.utils import timezone
import random
import string


def generate_bill_number():
    date_str = timezone.now().strftime('%Y%m%d')
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TC-{date_str}-{suffix}"


class Bill(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('gpay', 'Google Pay (GPay)'),
        ('card', 'Credit / Debit Card'),
        ('upi', 'UPI / QR'),
        ('split', 'Split Payment'),
        ('complimentary', 'Complimentary'),
    ]

    order = models.OneToOneField(
        'orders.Order', on_delete=models.PROTECT, related_name='bill'
    )
    bill_number = models.CharField(max_length=30, unique=True, default=generate_bill_number)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    include_gst = models.BooleanField(default=True)
    tax_percent = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_reason = models.CharField(max_length=200, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.bill_number} — ₹{self.total} ({'Paid' if self.is_paid else 'Unpaid'})"

    def save(self, *args, **kwargs):
        if not self.subtotal:
            self.subtotal = self.order.subtotal
        if not self.include_gst:
            self.tax_amount = 0
            self.tax_percent = 0
        else:
            self.tax_amount = (self.subtotal * self.tax_percent) / 100
        self.total = self.subtotal + self.tax_amount - self.discount_amount
        super().save(*args, **kwargs)
