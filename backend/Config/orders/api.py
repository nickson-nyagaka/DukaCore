from ninja import Router, Schema
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.conf import settings
from ninja.errors import HttpError
from auth_app.auth import JWTAuth
from catalog.models import Product, Voucher
from cart.api import get_cart
from .models import Order, OrderItem, Payment
from users.models import AuditLog
import datetime
import base64
import requests
from django.http import JsonResponse

router = Router()

class CheckoutSchema(Schema):
    phone_number: str  # For M-Pesa push
    shipping_address: str
    payment_method: str = "MOCK"  # MOCK or MPESA
    voucher_code: str = None

class OrderItemOutSchema(Schema):
    product_id: int
    name: str
    quantity: int
    unit_price: float

class OrderOutSchema(Schema):
    id: int
    total_amount: float
    status: str
    items: list[OrderItemOutSchema]

class CheckoutResponseSchema(Schema):
    order_id: int
    total_amount: float
    status: str

from typing import List, Optional

class OrderListOutSchema(Schema):
    id: int
    total_amount: float
    status: str
    created_at: datetime.datetime
    customer_email: str
    vendor_id: Optional[int] = None
    vendor_subtotal: float

class OrderStatusOutSchema(Schema):
    order_id: int
    status: str

@router.get('', auth=JWTAuth(), response=List[OrderListOutSchema])
def list_orders(request):
    user = request.user
    if user.role in ['ADMIN', 'STAFF']:
        qs = Order.objects.all().select_related('customer').order_by('-created_at')
    else:
        qs = Order.objects.filter(customer=user).select_related('customer').order_by('-created_at')
        
    result = []
    for o in qs:
        result.append(OrderListOutSchema(
            id=o.id,
            total_amount=float(o.total_amount),
            status=o.status,
            created_at=o.created_at,
            customer_email=o.customer.email,
            vendor_id=None,
            vendor_subtotal=float(o.total_amount)
        ))
    return result

@router.get('/{order_id}/status', auth=JWTAuth(), response=OrderStatusOutSchema)
def get_order_status(request, order_id: int):
    if request.user.role in ['ADMIN', 'STAFF']:
        order = get_object_or_404(Order, id=order_id)
    else:
        order = get_object_or_404(Order, id=order_id, customer=request.user)
        
    return OrderStatusOutSchema(
        order_id=order.id,
        status=order.status
    )

def get_mpesa_access_token():
    consumer_key = getattr(settings, 'MPESA_CONSUMER_KEY', 'default_sandbox_key')
    consumer_secret = getattr(settings, 'MPESA_CONSUMER_SECRET', 'default_sandbox_secret')

    api_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    try:
        r = requests.get(api_url, auth=(consumer_key, consumer_secret), timeout=10)
        return r.json().get('access_token')
    except Exception as e:
        print(f"Error generating M-Pesa access token: {e}")
        return None

def trigger_stk_push(payment, phone_number, amount, callback_url):
    access_token = get_mpesa_access_token()
    if not access_token:
        return False
    
    shortcode = getattr(settings, 'MPESA_SHORTCODE', '174379')
    passkey = getattr(settings, 'MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919')
    
    timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    formatted_phone = phone_number.strip().replace("+", "")
    if formatted_phone.startswith("0"):
        formatted_phone = "254" + formatted_phone[1:]
    
    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": formatted_phone,
        "PartyB": shortcode,
        "PhoneNumber": formatted_phone,
        "CallBackURL": callback_url,
        "AccountReference": f"MVE{payment.order_id}",
        "TransactionDesc": f"Payment for Order #{payment.order_id}"
    }
    
    try:
        res = requests.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers=headers,
            timeout=15
        )
        res_data = res.json()
        if res_data.get('ResponseCode') == '0':
            payment.checkout_request_id = res_data.get('CheckoutRequestID')
            payment.save()
            return True
        else:
            print(f"STK Push failed response: {res_data}")
            return False
    except Exception as e:
        print(f"Error triggering STK push: {e}")
        return False

@router.post('/checkout', auth=JWTAuth(), response=CheckoutResponseSchema)
def checkout(request, data: CheckoutSchema):
    user = request.user
    
    cart = get_cart(user.id)
    if not cart or not cart.get('items'):
        raise HttpError(400, "Your cart is empty")

    total_amount = 0.0

    with transaction.atomic():
        locked_items = []
        for item in cart['items']:
            product_id = item['product_id']
            qty = item['quantity']
            
            product = Product.objects.select_for_update().filter(id=product_id, is_active=True).first()
            if not product:
                raise HttpError(404, f"Product {product_id} not found or inactive")
            
            if product.stock_quantity < qty:
                raise HttpError(400, f"Insufficient stock for {product.name}. Only {product.stock_quantity} remaining.")
            
            product.stock_quantity -= qty
            product.save()

            item_subtotal = float(product.price) * qty
            total_amount += item_subtotal
            
            locked_items.append({
                'product': product,
                'quantity': qty,
                'unit_price': float(product.price),
            })
            
        discount_amount = 0.0
        applied_voucher = None
        
        if data.voucher_code:
            from django.utils import timezone
            now = timezone.now()
            voucher = Voucher.objects.filter(code=data.voucher_code, is_active=True).first()
            if not voucher:
                raise HttpError(400, "Invalid or inactive voucher code")
                
            if now < voucher.valid_from or now > voucher.valid_until:
                raise HttpError(400, "Voucher is expired or not yet valid")
                
            if total_amount < float(voucher.min_order_value):
                raise HttpError(400, f"Order total must be at least {voucher.min_order_value} to use this voucher")
                
            if voucher.usage_limit_total is not None and voucher.usage_count >= voucher.usage_limit_total:
                raise HttpError(400, "Voucher usage limit reached")
                
            # Note: per-customer usage tracking could be added here
            
            if voucher.discount_type == 'PERCENT':
                discount_amount = total_amount * (float(voucher.value) / 100)
            elif voucher.discount_type == 'FIXED':
                discount_amount = float(voucher.value)
            elif voucher.discount_type == 'FREE_SHIPPING':
                # Assuming shipping is added elsewhere, if not, we can zero out shipping.
                # For now, it doesn't change subtotal.
                pass
                
            if discount_amount > total_amount:
                discount_amount = total_amount
                
            total_amount -= discount_amount
            applied_voucher = voucher
            voucher.usage_count += 1
            voucher.save()

        order = Order.objects.create(
            customer=user,
            total_amount=total_amount,
            discount_amount=discount_amount,
            voucher=applied_voucher,
            status='PENDING'
        )

        for it in locked_items:
            OrderItem.objects.create(
                order=order,
                product=it['product'],
                quantity=it['quantity'],
                unit_price=it['unit_price']
            )

        payment = Payment.objects.create(
            order=order,
            amount=total_amount,
            status='PENDING',
            payment_method=data.payment_method,
            phone_number_used=data.phone_number
        )

        if data.payment_method == 'MPESA':
            host = request.get_host()
            callback_url = f"https://{host}/api/orders/payment/callback"
            
            stk_success = trigger_stk_push(payment, data.phone_number, total_amount, callback_url)
            if not stk_success:
                raise HttpError(500, "Failed to initiate M-Pesa payment request")

        try:
            import redis
            r = redis.from_url(settings.REDIS_URL)
            r.delete(f"cart:{user.id}")
        except Exception as e:
            print(f"Error clearing Redis cart: {e}")

        AuditLog.log(user, "order.checkout", {"order_id": order.id, "total_amount": float(total_amount)})

        return CheckoutResponseSchema(
            order_id=order.id,
            total_amount=total_amount,
            status=order.status,
        )

@router.post('/payment/callback')
def mpesa_callback(request, data: dict):
    body = data.get('Body', {})
    stk_callback = body.get('stkCallback', {})
    checkout_request_id = stk_callback.get('CheckoutRequestID')
    result_code = stk_callback.get('ResultCode')
    
    if not checkout_request_id:
        return {"ResultCode": 1, "ResultDesc": "Invalid payload"}

    with transaction.atomic():
        try:
            payment = Payment.objects.select_for_update().get(checkout_request_id=checkout_request_id)
        except Payment.DoesNotExist:
            return {"ResultCode": 1, "ResultDesc": "Payment not found"}

        if payment.status in ['SUCCESS', 'FAILED']:
            return {"ResultCode": 0, "ResultDesc": "Already processed"}

        order = payment.order

        if result_code == 0:
            metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            receipt_number = ""
            for item in metadata:
                if item.get('Name') == 'MpesaReceiptNumber':
                    receipt_number = item.get('Value')
                    break
            
            payment.status = 'SUCCESS'
            payment.mpesa_receipt_number = receipt_number
            payment.save()

            order.status = 'PROCESSING'
            order.save()
        else:
            payment.status = 'FAILED'
            payment.save()

            order.status = 'CANCELLED'
            order.save()

            for item in order.items.all():
                if item.product:
                    product = Product.objects.select_for_update().get(id=item.product.id)
                    product.stock_quantity += item.quantity
                    product.save()

    return {"ResultCode": 0, "ResultDesc": "Success"}
