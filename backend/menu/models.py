"""T Clock — Menu models"""

from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, default='🍽️')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'name']
        verbose_name_plural = 'Categories'

    def __str__(self):
        return f"{self.icon} {self.name}"


class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    half_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    quarter_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    image = models.ImageField(upload_to='menu/', blank=True, null=True)
    is_veg = models.BooleanField(default=True)
    diet_type = models.CharField(max_length=50, blank=True, default='Veg')
    spice_level = models.CharField(max_length=50, blank=True, default='Medium')
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    prep_time = models.IntegerField(default=10, help_text='Prep time in minutes')
    calories = models.IntegerField(blank=True, null=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        ordering = ['category', 'sort_order', 'name']

    def __str__(self):
        return f"{self.name} (₹{self.price})"


class MenuOption(models.Model):
    OPTION_TYPES = [
        ('diet_type', 'Diet Type'),
        ('spice_level', 'Spice Level'),
    ]
    option_type = models.CharField(max_length=50, choices=OPTION_TYPES)
    value = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('option_type', 'value')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.option_type}: {self.value}"

