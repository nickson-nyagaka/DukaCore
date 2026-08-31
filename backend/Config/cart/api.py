import json
from ninja import Router, Schema
from typing import List, Optional
from django.conf import settings
from catalog.models import Product
from auth_app.auth import JWTAuth

from django.core.cache import cache

router = Router()

CART_TTL = 60 * 60 * 24 * 7  # 7 days


def cart_key(user_id: int) -> str:
    return f"cart:{user_id}"


def get_cart(user_id: int) -> dict:
    raw = cache.get(cart_key(user_id))
    if raw:
        if isinstance(raw, dict):
            return raw
        try:
            return json.loads(raw)
        except Exception:
            return {"items": []}
    return {"items": []}


def save_cart(user_id: int, cart: dict):
    cache.set(cart_key(user_id), cart, CART_TTL)


class CartItemIn(Schema):
    product_id: int
    quantity: int = 1


class CartItemSchema(Schema):
    product_id: int
    quantity: int
    name: str
    price: float
    original_price: float
    image_url: Optional[str] = None
    slug: str
    is_heavy_item: bool = False
    tier_discount_applied: bool = False


class CartSchema(Schema):
    items: List[CartItemSchema]
    total: float
    item_count: int
    has_heavy_items: bool = False


def calculate_unit_price(product: Product, quantity: int):
    from django.utils import timezone
    now = timezone.now()
    is_flash_sale = product.discount_price and product.flash_sale_end_date and product.flash_sale_end_date > now
    if is_flash_sale:
        return float(product.discount_price), False
    
    tier = product.price_tiers.filter(min_quantity__lte=quantity).order_by('-min_quantity').first()
    if tier:
        return float(tier.unit_price), True
    return float(product.price), False


def enrich_cart(cart: dict) -> CartSchema:
    enriched_items = []
    total = 0.0
    has_heavy = False
    for item in cart['items']:
        try:
            product = Product.objects.prefetch_related('images', 'price_tiers').get(id=item['product_id'])
            primary = product.images.filter(is_primary=True).first() or product.images.first()
            
            unit_price, tier_applied = calculate_unit_price(product, item['quantity'])
            if product.is_heavy_item:
                has_heavy = True
            
            enriched_items.append(CartItemSchema(
                product_id=product.id,
                quantity=item['quantity'],
                name=product.name,
                price=unit_price,
                original_price=float(product.price),
                image_url=primary.url if primary else None,
                slug=product.slug,
                is_heavy_item=product.is_heavy_item,
                tier_discount_applied=tier_applied,
            ))
            total += unit_price * item['quantity']
        except Product.DoesNotExist:
            pass
    return CartSchema(
        items=enriched_items, 
        total=round(total, 2), 
        item_count=sum(i['quantity'] for i in cart['items']),
        has_heavy_items=has_heavy,
    )


@router.get('', auth=JWTAuth(), response=CartSchema)
def get_cart_view(request):
    cart = get_cart(request.user.id)
    return enrich_cart(cart)


@router.post('/items', auth=JWTAuth(), response=CartSchema)
def add_item(request, data: CartItemIn):
    from ninja.errors import HttpError
    try:
        product = Product.objects.get(id=data.product_id, is_active=True)
    except Product.DoesNotExist:
        raise HttpError(404, 'Product not found')
    if product.stock_quantity < data.quantity:
        raise HttpError(400, f'Only {product.stock_quantity} in stock')

    cart = get_cart(request.user.id)
    for item in cart['items']:
        if item['product_id'] == data.product_id:
            item['quantity'] = min(item['quantity'] + data.quantity, product.stock_quantity)
            save_cart(request.user.id, cart)
            return enrich_cart(cart)
    cart['items'].append({'product_id': data.product_id, 'quantity': data.quantity})
    save_cart(request.user.id, cart)
    return enrich_cart(cart)


@router.patch('/items/{product_id}', auth=JWTAuth(), response=CartSchema)
def update_item(request, product_id: int, data: CartItemIn):
    cart = get_cart(request.user.id)
    for item in cart['items']:
        if item['product_id'] == product_id:
            if data.quantity <= 0:
                cart['items'].remove(item)
            else:
                item['quantity'] = data.quantity
            break
    save_cart(request.user.id, cart)
    return enrich_cart(cart)


@router.delete('/items/{product_id}', auth=JWTAuth(), response=CartSchema)
def remove_item(request, product_id: int):
    cart = get_cart(request.user.id)
    cart['items'] = [i for i in cart['items'] if i['product_id'] != product_id]
    save_cart(request.user.id, cart)
    return enrich_cart(cart)


@router.delete('', auth=JWTAuth())
def clear_cart(request):
    cache.delete(cart_key(request.user.id))
    return {"message": "Cart cleared"}
