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

class CategoryAttributeSchema(models.Model):
    category = models.OneToOneField(Category, on_delete=models.CASCADE, related_name='attribute_schema')
    schema = models.JSONField(default=dict, help_text="Mapping of attribute keys to rules: e.g. {'material': {'type': 'string', 'required': false}}")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Attribute Schema for {self.category.name}"

    def validate_attributes(self, attributes):
        """
        Validates product attributes against this category's schema.
        Accepts dict {'key': 'val'} or list of dicts [{'name': '...', 'value': '...'}]
        """
        if not self.schema:
            return True, []
        allowed_keys = set(self.schema.keys())
        errors = []
        attr_dict = {}

        if isinstance(attributes, dict):
            attr_dict = attributes
        elif isinstance(attributes, list):
            for item in attributes:
                if isinstance(item, dict):
                    k = item.get('key') or item.get('name')
                    v = item.get('value')
                    if k:
                        attr_dict[str(k).strip()] = v

        for k in attr_dict.keys():
            if k not in allowed_keys:
                errors.append(f"Attribute '{k}' is not allowed in category '{self.category.name}'. Allowed keys: {', '.join(sorted(allowed_keys))}")

        for k, spec in self.schema.items():
            if isinstance(spec, dict) and spec.get('required'):
                if k not in attr_dict or attr_dict[k] in (None, ""):
                    errors.append(f"Required attribute '{k}' is missing.")

        return (len(errors) == 0), errors

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_heavy_item = models.BooleanField(default=False, help_text="Flag for bulky/heavy goods requiring special freight/surcharge")
    attributes = models.JSONField(default=list, blank=True)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    flash_sale_end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        if self.category and hasattr(self.category, 'attribute_schema') and self.attributes:
            is_valid, errors = self.category.attribute_schema.validate_attributes(self.attributes)
            if not is_valid:
                raise ValidationError({"attributes": errors})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

class PriceTier(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='price_tiers')
    min_quantity = models.PositiveIntegerField(help_text="Minimum quantity to activate this bulk unit price")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Discounted price per unit for this volume tier")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['min_quantity']
        unique_together = [['product', 'min_quantity']]

    def __str__(self):
        return f"{self.product.name} ({self.min_quantity}+ @ KES {self.unit_price})"

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    url = models.URLField(max_length=1024)
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)

def normalize_voucher_code(raw: str) -> str:
    return raw.strip().upper()

from django.conf import settings

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

class WishlistItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['user', 'product']]

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"

class StockAlert(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_alerts')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stock_alerts')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_notified = models.BooleanField(default=False)
    notified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [['product', 'user', 'is_active']]

    def __str__(self):
        return f"{self.user.username} - {self.product.name} (Active: {self.is_active})"

