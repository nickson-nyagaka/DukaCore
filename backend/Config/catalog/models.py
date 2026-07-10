import uuid
from django.db import models
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError

class ProductType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    schema = models.JSONField(default=list)  # list of field schemas
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, default='🏷️', blank=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subcategories')

    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    product_type = models.ForeignKey(ProductType, null=True, blank=True, on_delete=models.SET_NULL, related_name='products')
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            GinIndex(fields=['custom_fields'], name='idx_prod_custom_fields_gin')
        ]

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        
        if self.product_type:
            schema_fields = self.product_type.schema
            custom_vals = self.custom_fields or {}
            
            for field in schema_fields:
                name = field.get('name')
                label = field.get('label', name)
                ftype = field.get('type')
                required = field.get('required', False)
                
                val = custom_vals.get(name)
                if val is None or val == '':
                    if required:
                        raise ValidationError({
                            'custom_fields': f"Field '{label}' is required."
                        })
                    continue
                
                if ftype == 'number':
                    try:
                        float(val)
                    except (ValueError, TypeError):
                        raise ValidationError({
                            'custom_fields': f"Field '{label}' must be a number."
                        })
                elif ftype == 'boolean':
                    if not isinstance(val, bool) and str(val).lower() not in ('true', 'false', '1', '0'):
                        raise ValidationError({
                            'custom_fields': f"Field '{label}' must be a boolean."
                        })

    def save(self, *args, **kwargs):
        self.clean()
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

