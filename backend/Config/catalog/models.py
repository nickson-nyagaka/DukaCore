import uuid
from django.db import models
from django.core.exceptions import ValidationError

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    icon = models.CharField(max_length=50, default='🏷️', blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subcategories')

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    url = models.URLField(max_length=1024)
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)

class Voucher(models.Model):
    code = models.CharField(max_length=32, unique=True)
    discount_type = models.CharField(choices=[("PERCENT","Percent"),("FIXED","Fixed"),("FREE_SHIPPING","Free Shipping")], max_length=20)
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # null for FREE_SHIPPING
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    usage_limit_total = models.PositiveIntegerField(null=True, blank=True)      # None must be an explicit choice, not a default
    usage_limit_per_customer = models.PositiveIntegerField(default=1)
    usage_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)  # manual kill switch, independent of date range

    def __str__(self):
        return f"{self.code} ({self.discount_type}: {self.value})"

