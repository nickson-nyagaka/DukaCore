import json
from ninja import Router, Schema
from typing import List, Optional
from django.conf import settings
from catalog.models import Product
from auth_app.auth import JWTAuth

router = Router()

CART_TTL = 60 * 60 * 24 * 7  # 7 days


def get_redis():
    import redis
    r = redis.from_url(settings.REDIS_URL)
    return r


def cart_key(user_id: int) -> str:
    return f"cart:{user_id}"


def get_cart(user_id: int) -> dict:
    r = get_redis()
    raw = r.get(cart_key(user_id))
    if raw:
        return json.loads(raw)
    return {"items": []}


def save_cart(user_id: int, cart: dict):
    r = get_redis()
    r.setex(cart_key(user_id), CART_TTL, json.dumps(cart))


class CartItemIn(Schema):
    product_id: int
    quantity: int = 1


class CartItemSchema(Schema):
    product_id: int
    quantity: int
    name: str
    price: float
    image_url: Optional[str] = None
    slug: str


class CartSchema(Schema):
    items: List[CartItemSchema]
    total: float
    item_count: int


def enrich_cart(cart: dict) -> CartSchema:
    enriched_items = []
    total = 0.0
    for item in cart['items']:
        try:
            product = Product.objects.get(id=item['product_id'])
            primary = product.images.filter(is_primary=True).first()
            unit_price = float(product.price)
            enriched_items.append(CartItemSchema(
                product_id=product.id,
                quantity=item['quantity'],
                name=product.name,
                price=unit_price,
                image_url=primary.url if primary else None,
                slug=product.slug,
            ))
            total += unit_price * item['quantity']
        except Product.DoesNotExist:
            pass
    return CartSchema(items=enriched_items, total=round(total, 2), item_count=sum(i['quantity'] for i in cart['items']))


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
    r = get_redis()
    r.delete(cart_key(request.user.id))
    return {"message": "Cart cleared"}
