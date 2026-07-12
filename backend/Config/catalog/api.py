from ninja import Router, Schema
from typing import List, Optional
import uuid
from .models import Product, Category
from django.shortcuts import get_object_or_404

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
    )
