from django.db import models
from users.models import User
from catalog.models import Product

class DeliveryZone(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    flat_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    heavy_item_surcharge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Additional surcharge applied if cart contains any bulky/heavy items")
    estimated_delivery = models.CharField(max_length=100, default="1-3 business days")
    is_pickup = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index', 'flat_fee']

    def __str__(self):
        return f"{self.name} (KES {self.flat_fee} + KES {self.heavy_item_surcharge} heavy surcharge)"

class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    voucher = models.ForeignKey('catalog.Voucher', on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    voucher_code_snapshot = models.CharField(max_length=32, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_zone = models.ForeignKey(DeliveryZone, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_heavy_order = models.BooleanField(default=False)
    delivery_quote_required = models.BooleanField(default=False)
    shipping_address = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} for {self.customer.email}"

class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    locked_at = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

class Payment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    # M-Pesa fields
    checkout_request_id = models.CharField(max_length=100, blank=True)
    mpesa_receipt_number = models.CharField(max_length=100, blank=True)
    phone_number_used = models.CharField(max_length=20, blank=True)
    payment_method = models.CharField(max_length=20, default='MOCK')
    created_at = models.DateTimeField(auto_now_add=True)

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()  # 1-5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['product', 'customer']]

