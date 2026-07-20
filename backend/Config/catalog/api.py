from ninja import Router, Schema
from typing import List, Optional
import uuid
import datetime
from .models import Product, Category, WishlistItem, StockAlert
from django.shortcuts import get_object_or_404
from auth_app.auth import JWTAuth
from ninja.errors import HttpError

router = Router()

class CategorySchema(Schema):
    id: int
    name: str
    slug: str
    icon: str
    description: str

class ProductImageSchema(Schema):
    url: str
    alt_text: str
    is_primary: bool

class ProductSchema(Schema):
    id: int
    name: str
    slug: str
    price: float
    description: str
    stock_quantity: int
    is_active: bool
    image_url: Optional[str] = None
    images: List[str] = []
    category_id: Optional[int] = None
    rating: Optional[float] = None
    reviews_count: int = 0
    is_wishlisted: bool = False

class WishlistToggleInputSchema(Schema):
    product_id: int

class StockAlertOutSchema(Schema):
    id: int
    product_id: int
    product_name: str
    is_notified: bool
    notified_at: Optional[datetime.datetime] = None

class ReviewOutSchema(Schema):
    id: int
    customer_name: str
    rating: int
    comment: str
    created_at: datetime.datetime

class ProductListSchema(Schema):
    id: int
    name: str
    slug: str
    price: float
    image_url: Optional[str] = None
    is_active: bool
    stock_quantity: int

@router.get("/categories", response=List[CategorySchema])
async def list_categories(request):
    categories = [c async for c in Category.objects.all()]
    return categories

@router.get("/products", response=List[ProductListSchema])
async def list_products(request, category: Optional[str] = None, search: Optional[str] = None, limit: int = 24, offset: int = 0):
    from django.db.models import Prefetch
    from .models import ProductImage
    
    primary_images = ProductImage.objects.filter(is_primary=True)
    qs = Product.objects.filter(is_active=True).prefetch_related(
        Prefetch('images', queryset=primary_images, to_attr='primary_images')
    )
    if category:
        qs = qs.filter(category__slug=category)
    if search:
        qs = qs.filter(name__icontains=search)
    qs = qs[offset:offset + limit]

    result = []
    async for p in qs:
        primary = p.primary_images[0] if p.primary_images else None
        result.append(ProductListSchema(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=float(p.price),
            image_url=primary.url if primary else None,
            is_active=p.is_active,
            stock_quantity=p.stock_quantity,
        ))
    return result

@router.get("/products/{slug}", response=ProductSchema)
async def get_product(request, slug: str):
    product = await Product.objects.filter(slug=slug).prefetch_related('images').afirst()
    
    if not product:
        raise HttpError(404, "Product not found")
        
    all_images = [img async for img in product.images.all()]
    image_urls = [img.url for img in all_images]
    primary = next((img for img in all_images if img.is_primary), None) or (all_images[0] if all_images else None)
    
    # Optional authentication check
    cookie_token = request.COOKIES.get('mve_access_token')
    user = None
    if cookie_token:
        try:
            from auth_app.tokens import decode_token
            payload = decode_token(cookie_token)
            if payload.get('type') == 'access':
                from django.contrib.auth import get_user_model
                user = await get_user_model().objects.filter(id=payload['user_id']).afirst()
        except Exception:
            pass

    is_wishlisted = False
    if user:
        is_wishlisted = await WishlistItem.objects.filter(user=user, product=product).aexists()

    reviews_count = 0
    rating_sum = 0
    async for r in product.reviews.all():
        reviews_count += 1
        rating_sum += r.rating
    avg_rating = rating_sum / reviews_count if reviews_count > 0 else None
    
    return ProductSchema(
        id=product.id,
        name=product.name,
        slug=product.slug,
        price=float(product.price),
        description=product.description,
        stock_quantity=product.stock_quantity,
        is_active=product.is_active,
        image_url=primary.url if primary else None,
        images=image_urls,
        category_id=product.category_id,
        rating=avg_rating,
        reviews_count=reviews_count,
        is_wishlisted=is_wishlisted
    )

@router.post("/wishlist/toggle", auth=JWTAuth())
def toggle_wishlist(request, data: WishlistToggleInputSchema):
    user = request.user
    product = get_object_or_404(Product, id=data.product_id)
    item, created = WishlistItem.objects.get_or_create(user=user, product=product)
    if not created:
        item.delete()
        return {"status": "removed"}
    return {"status": "added"}

@router.get("/wishlist", auth=JWTAuth(), response=List[ProductListSchema])
def get_wishlist(request):
    from django.db.models import Prefetch
    from .models import ProductImage
    user = request.user
    items = WishlistItem.objects.filter(user=user).select_related('product').prefetch_related(
        Prefetch('product__images', queryset=ProductImage.objects.filter(is_primary=True), to_attr='primary_images')
    )
    result = []
    for item in items:
        p = item.product
        primary = p.primary_images[0] if p.primary_images else None
        result.append(ProductListSchema(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=float(p.price),
            image_url=primary.url if primary else None,
            is_active=p.is_active,
            stock_quantity=p.stock_quantity,
        ))
    return result

@router.post("/products/{product_id}/stock-alert", auth=JWTAuth())
def create_stock_alert(request, product_id: int):
    user = request.user
    product = get_object_or_404(Product, id=product_id)
    if product.stock_quantity > 0:
        raise HttpError(400, "Product is currently in stock")
    alert, created = StockAlert.objects.get_or_create(user=user, product=product, is_active=True)
    return {"status": "created" if created else "exists"}

@router.get("/stock-alerts", auth=JWTAuth(), response=List[StockAlertOutSchema])
def get_stock_alerts(request):
    user = request.user
    alerts = StockAlert.objects.filter(user=user).select_related('product')
    return [
        StockAlertOutSchema(
            id=alert.id,
            product_id=alert.product.id,
            product_name=alert.product.name,
            is_notified=alert.is_notified,
            notified_at=alert.notified_at
        ) for alert in alerts
    ]

@router.post("/stock-alerts/{alert_id}/dismiss", auth=JWTAuth())
def dismiss_stock_alert(request, alert_id: int):
    alert = get_object_or_404(StockAlert, id=alert_id, user=request.user)
    alert.delete()
    return {"status": "deleted"}

@router.get("/products/{slug}/reviews", response=List[ReviewOutSchema])
def get_product_reviews(request, slug: str):
    product = get_object_or_404(Product, slug=slug)
    reviews = product.reviews.all().select_related('customer')
    return [
        ReviewOutSchema(
            id=r.id,
            customer_name=f"{r.customer.first_name} {r.customer.last_name}",
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at
        ) for r in reviews
    ]
