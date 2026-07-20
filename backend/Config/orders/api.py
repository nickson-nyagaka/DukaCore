from ninja import Router, Schema
from typing import List, Optional
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.conf import settings
from ninja.errors import HttpError
from auth_app.auth import JWTAuth
from catalog.models import Product, Voucher
from cart.api import get_cart
from .models import Order, OrderItem, Payment, Review
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
    id: int
    product_id: int
    product_name: str
    product_slug: str
    product_price: float
    quantity: int
    image_url: Optional[str] = None


class CheckoutResponseSchema(Schema):
    order_id: int
    total_amount: float
    status: str
    checkout_request_id: Optional[str] = None

class OrderStatusHistorySchema(Schema):
    from_status: str
    to_status: str
    changed_at: datetime.datetime
    changed_by_email: str


class OrderListOutSchema(Schema):
    id: int
    total_amount: float
    status: str
    created_at: datetime.datetime
    customer_email: str
    vendor_id: Optional[int] = None
    vendor_subtotal: float
    status_history: List[OrderStatusHistorySchema] = []
    items: List[OrderItemOutSchema] = []

class OrderStatusOutSchema(Schema):
    order_id: int
    status: str

@router.get('', auth=JWTAuth(), response=List[OrderListOutSchema])
def list_orders(request, q: Optional[str] = None):
    user = request.user
    if user.role in ['ADMIN', 'STAFF']:
        qs = Order.objects.prefetch_related('status_history__changed_by', 'items__product__images').select_related('customer').order_by('-created_at')
    else:
        qs = Order.objects.prefetch_related('status_history__changed_by', 'items__product__images').filter(customer=user).select_related('customer').order_by('-created_at')
        
    if q:
        from django.db.models import Q
        qs = qs.filter(Q(id__icontains=q) | Q(customer__email__icontains=q) | Q(status__icontains=q))
        
    result = []
    for o in qs:
        history = [
            OrderStatusHistorySchema(
                from_status=h.from_status,
                to_status=h.to_status,
                changed_at=h.changed_at,
                changed_by_email=h.changed_by.email if h.changed_by else "System"
            ) for h in o.status_history.all()
        ]
        
        items_out = []
        for item in o.items.all():
            prod = item.product
            primary_img = None
            if prod:
                imgs = list(prod.images.all())
                primary = next((i for i in imgs if i.is_primary), None) or (imgs[0] if imgs else None)
                primary_img = primary.url if primary else None
                
            items_out.append(OrderItemOutSchema(
                id=item.id,
                product_id=prod.id if prod else 0,
                product_name=prod.name if prod else "Deleted Product",
                product_slug=prod.slug if prod else "",
                product_price=float(item.unit_price),
                quantity=item.quantity,
                image_url=primary_img
            ))
            
        result.append(OrderListOutSchema(
            id=o.id,
            total_amount=float(o.total_amount),
            status=o.status,
            created_at=o.created_at,
            customer_email=o.customer.email,
            vendor_id=None,
            vendor_subtotal=float(o.total_amount),
            status_history=history,
            items=items_out
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

class PaymentStatusOutSchema(Schema):
    status: str

@router.get('/payment/{checkout_request_id}/status', auth=JWTAuth(), response=PaymentStatusOutSchema)
def get_payment_status(request, checkout_request_id: str):
    payment = get_object_or_404(Payment, checkout_request_id=checkout_request_id)
    # Ensure the user asking owns the order
    if request.user.role not in ['ADMIN', 'STAFF']:
        if payment.order.customer_id != request.user.id:
            raise HttpError(403, "Forbidden")
            
    # We map SUCCESS to PAID to match the frontend expectation if needed, or frontend can handle SUCCESS
    frontend_status = payment.status
    if frontend_status == 'SUCCESS':
        frontend_status = 'PAID'
        
    return {"status": frontend_status}

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
            voucher_code_snapshot=applied_voucher.code if applied_voucher else "",
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
            from payments.gateway import get_payment_gateway
            try:
                gateway = get_payment_gateway()
                checkout_request_id = gateway.initiate_payment(order, data.phone_number)
                payment.checkout_request_id = checkout_request_id
                payment.save()
            except Exception as e:
                print(f"Gateway error: {e}")
                raise HttpError(500, "Failed to initiate payment via gateway")

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
            checkout_request_id=payment.checkout_request_id if data.payment_method == 'MPESA' else None
        )

class DarajaCallbackBodySchema(Schema):
    MerchantRequestID: str = None
    CheckoutRequestID: str
    ResultCode: int
    ResultDesc: str
    CallbackMetadata: dict = None

class DarajaCallbackDataSchema(Schema):
    stkCallback: DarajaCallbackBodySchema

class DarajaCallbackSchema(Schema):
    Body: DarajaCallbackDataSchema

def process_mpesa_callback(stk_callback) -> dict:
    checkout_request_id = stk_callback.CheckoutRequestID
    result_code = stk_callback.ResultCode
    
    from .services import transition_order_status
    
    with transaction.atomic():
        try:
            payment = Payment.objects.select_for_update().get(checkout_request_id=checkout_request_id)
        except Payment.DoesNotExist:
            return {"ResultCode": 1, "ResultDesc": "Payment not found"}

        # Idempotency
        if payment.status != 'PENDING':
            return {"status": "already_processed"}

        order = payment.order

        if result_code == 0:
            metadata = stk_callback.CallbackMetadata.get('Item', []) if stk_callback.CallbackMetadata else []
            receipt_number = ""
            for item in metadata:
                if item.get('Name') == 'MpesaReceiptNumber':
                    receipt_number = item.get('Value')
                    break
            
            payment.status = 'SUCCESS'
            payment.mpesa_receipt_number = receipt_number
            payment.save()

            transition_order_status(order, 'PROCESSING', actor=None)
        else:
            payment.status = 'FAILED'
            payment.save()

            transition_order_status(order, 'CANCELLED', actor=None)

    return {"status": "ok"}

@router.post('/payment/callback')
def mpesa_callback(request, payload: DarajaCallbackSchema):
    return process_mpesa_callback(payload.Body.stkCallback)

@router.post('/dev/payments/{checkout_request_id}/force-outcome')
def force_mock_outcome(request, checkout_request_id: str, outcome: str):
    """Lets you manually trigger SUCCESS/INSUFFICIENT_FUNDS/CANCELLED on demand while testing."""
    if settings.PAYMENT_GATEWAY_MODE != "mock":
        from django.http import Http404
        raise Http404()
        
    from payments.tasks import build_daraja_style_payload
    payload = build_daraja_style_payload(checkout_request_id, outcome)
    
    # We call our own endpoint function directly with the schema
    # But since it expects DarajaCallbackSchema (a Ninja Schema), we construct it or pass dict if Ninja allows unpacking
    schema_instance = DarajaCallbackSchema.parse_obj(payload)
    return process_mpesa_callback(schema_instance.Body.stkCallback)

class OrderStatusUpdateSchema(Schema):
    status: str

@router.patch('/admin/orders/{order_id}/status', auth=JWTAuth(), response=OrderStatusOutSchema)
def update_order_status(request, order_id: int, data: OrderStatusUpdateSchema):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
        
    order = get_object_or_404(Order, id=order_id)
    
    from .services import transition_order_status
    transition_order_status(order, data.status, request.user)
    
    AuditLog.log(request.user, "order.update_status", {"order_id": order.id, "new_status": order.status})
    
    return OrderStatusOutSchema(
        order_id=order.id,
        status=order.status
    )

@router.post('/admin/orders/{order_id}/refund', auth=JWTAuth())
def process_order_refund(request, order_id: int):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
    # TODO: Implement actual payment gateway refund logic
    raise HttpError(501, "Not Implemented: Refunds are not yet supported via the API.")

class ReviewInputSchema(Schema):
    product_id: int
    rating: int
    comment: str

@router.post('/reviews', auth=JWTAuth())
def submit_product_review(request, data: ReviewInputSchema):
    user = request.user
    product = get_object_or_404(Product, id=data.product_id)
    
    if not (1 <= data.rating <= 5):
        raise HttpError(400, "Rating must be between 1 and 5")
        
    order_item = OrderItem.objects.filter(
        order__customer=user,
        order__status__in=['SHIPPED', 'DELIVERED'],
        product=product
    ).first()
    
    if not order_item:
        raise HttpError(400, "You can only review products from shipped or delivered orders you purchased.")
        
    review, created = Review.objects.update_or_create(
        product=product,
        customer=user,
        defaults={
            'order_item': order_item,
            'rating': data.rating,
            'comment': data.comment.strip()
        }
    )
    
    AuditLog.log(user, "product.review", {"product_id": product.id, "rating": data.rating})
    return {"status": "saved", "review_id": review.id}

