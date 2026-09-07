"""T Clock — Tables models"""

import uuid
from django.db import models


class DiningTable(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('reserved', 'Reserved'),
        ('billing', 'Billing'),
        ('cleaning', 'Cleaning'),
        ('no_service', 'No Service'),
        ('inactive', 'No Service'),
    ]
    SECTION_CHOICES = [
        ('indoor', 'Indoor'),
        ('outdoor', 'Outdoor'),
        ('terrace', 'Terrace'),
        ('private', 'Private Room'),
    ]

    number = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=50)
    capacity = models.IntegerField(default=4)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    section = models.CharField(max_length=50, default='indoor')
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"Table {self.number} — {self.name} ({self.status})"

    @property
    def qr_url(self):
        return f"/order/{self.qr_token}/"


class Reservation(models.Model):
    STATUS_CHOICES = [
        ('awaiting_guest', 'Awaiting Guest'),
        ('confirmed', 'Confirmed'),
        ('arrived', 'Arrived'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    table = models.ForeignKey(
        DiningTable,
        on_delete=models.CASCADE,
        related_name="reservations"
    )
    guest_name = models.CharField(max_length=150)
    arrival_time = models.CharField(max_length=50)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='awaiting_guest')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Reservation for {self.guest_name} at Table {self.table.number} ({self.status})"


class TableOption(models.Model):
    OPTION_TYPES = [
        ('capacity', 'Seat Capacity'),
        ('section', 'Dining Area'),
    ]
    option_type = models.CharField(max_length=20, choices=OPTION_TYPES)
    value = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('option_type', 'value')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.option_type}: {self.value}"
