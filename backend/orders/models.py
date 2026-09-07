"""T Clock — Orders models"""

from django.db import models


class Order(models.Model):
    ORDER_TYPE_CHOICES = [
        ('dine_in', 'Dine In'),
        ('takeaway', 'Takeaway'),
        ('delivery', 'Delivery'),
        ('swiggy', 'Swiggy'),
        ('zomato', 'Zomato'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready to Serve'),
        ('served', 'Served'),
        ('billed', 'Billed'),
        ('cancelled', 'Cancelled'),
    ]

    table = models.ForeignKey(
        'tables.DiningTable', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='orders'
    )
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES, default='dine_in')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    customer_name = models.CharField(max_length=100, blank=True)
    customer_phone = models.CharField(max_length=15, blank=True)
    notes = models.TextField(blank=True)
    kitchen_notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='orders_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        table_info = f"Table {self.table.number}" if self.table else self.order_type
        return f"Order #{self.id} — {table_info} ({self.status})"

    @property
    def subtotal(self):
        return sum(item.subtotal for item in self.items.all())


class OrderItem(models.Model):
    ITEM_STATUS = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey('menu.MenuItem', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    portion = models.CharField(max_length=20, default='Full', blank=True)
    notes = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=20, choices=ITEM_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name}"

    @property
    def subtotal(self):
        return self.quantity * self.unit_price
