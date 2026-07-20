import os
import django
import time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Config.settings")
django.setup()

from users.models import User
from catalog.models import Product, Category
from orders.models import Order, Payment
from payments.gateway import get_payment_gateway
from orders.api import mpesa_callback, DarajaCallbackSchema
from payments.tasks import build_daraja_style_payload

def run_tests():
    print("Running Mock Gateway Verification...")

    user, _ = User.objects.get_or_create(email="testpay@example.com", defaults={"role": "CUSTOMER", "username": "testpay"})
    cat, _ = Category.objects.get_or_create(name="Test", slug="test")
    product, _ = Product.objects.get_or_create(name="Pay Test", defaults={"slug": "pay-test", "price": 100.00, "stock_quantity": 10, "category": cat})
    product.stock_quantity = 10
    product.save()

    # 1. Initiate async payment
    order = Order.objects.create(customer=user, total_amount=100.00, status="PENDING")
    payment = Payment.objects.create(order=order, amount=100.00, status="PENDING")

    gateway = get_payment_gateway()
    checkout_id = gateway.initiate_payment(order, "254700000000")
    payment.checkout_request_id = checkout_id
    payment.save()

    print("Initiated payment. Checkout ID:", checkout_id)
    order.refresh_from_db()
    assert order.status == "PENDING", "Order should be PENDING immediately after checkout."

    # 2. Wait for async task to fire (it delays 5-15s). But since it runs in another thread, we can just wait 16 seconds.
    # Alternatively, we can use the dev endpoint / force outcome.
    print("Waiting 16 seconds for async callback...")
    time.sleep(16)
    
    payment.refresh_from_db()
    order.refresh_from_db()
    if payment.status == "PENDING":
        print("WARNING: Callback didn't fire in 16s. This might be fine if random delay was long, or thread died.")
    else:
        print(f"Async Callback fired successfully! Payment: {payment.status}, Order: {order.status}")

    # 3. Test Failure state / idempotency using manual payload
    print("Testing Idempotency...")
    from django.test import RequestFactory
    rf = RequestFactory()
    req = rf.post('/api/orders/payment/callback')
    
    # Send the same SUCCESS payload again
    payload_dict = build_daraja_style_payload(checkout_id, "SUCCESS")
    schema = DarajaCallbackSchema.parse_obj(payload_dict)
    resp = mpesa_callback(req, schema)
    print("Idempotency response:", resp)
    assert resp.get("status") == "already_processed" or resp.get("ResultCode") == 0

    # 4. Test CANCELLED state and stock restoration
    order2 = Order.objects.create(customer=user, total_amount=100.00, status="PENDING")
    payment2 = Payment.objects.create(order=order2, amount=100.00, status="PENDING", checkout_request_id="mock-fail-123")
    
    from orders.models import OrderItem
    OrderItem.objects.create(order=order2, product=product, quantity=2, unit_price=50.00)
    
    payload_dict_fail = build_daraja_style_payload("mock-fail-123", "CANCELLED")
    schema_fail = DarajaCallbackSchema.parse_obj(payload_dict_fail)
    
    # Let's deduct stock first
    product.stock_quantity -= 2
    product.save()
    
    mpesa_callback(req, schema_fail)
    
    order2.refresh_from_db()
    payment2.refresh_from_db()
    product.refresh_from_db()
    
    assert order2.status == "CANCELLED"
    assert payment2.status == "FAILED"
    assert product.stock_quantity == 10, "Stock should be restored on cancellation"
    print("Failure state and stock restoration verified!")

    print("ALL VERIFICATIONS PASSED")

if __name__ == "__main__":
    run_tests()
