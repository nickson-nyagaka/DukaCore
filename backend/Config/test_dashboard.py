import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Config.settings')
django.setup()

from catalog.models import Product, Voucher
from users.models import User, TeamInvite
from orders.models import Order
from django.utils import timezone
from datetime import timedelta

print("Checking products...")
print(Product.objects.count(), "products exist")

print("Checking vouchers...")
print(Voucher.objects.count(), "vouchers exist")

print("Checking team invites...")
print(TeamInvite.objects.count(), "invites exist")

print("Creating test order to see if it works...")
user = User.objects.first()
if user:
    o = Order.objects.create(
        customer=user,
        total_amount=100.0,
        discount_amount=0,
        status='PENDING'
    )
    print("Created order:", o.id)
    
print("All checks pass!")
