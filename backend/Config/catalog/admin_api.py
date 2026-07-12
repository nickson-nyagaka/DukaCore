from ninja import Router, Schema, File
from ninja.files import UploadedFile
from django.shortcuts import get_object_or_404
from ninja.errors import HttpError
from typing import List, Optional
from datetime import datetime
from pydantic import Field
import os
from django.conf import settings
import uuid
from django.core.exceptions import ValidationError

from auth_app.auth import JWTAuth
from permissions.enforce import require_permission
from .models import Product, Category, Voucher
from users.models import AuditLog

router = Router(auth=JWTAuth())

@router.post("/products/upload")
def upload_product_image(request, file: UploadedFile = File(...)):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
    
    # Save the file to MEDIA_ROOT
    ext = file.name.split('.')[-1]
    filename = f"product_{uuid.uuid4().hex}.{ext}"
    
    # Ensure media root exists
    os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
    
    filepath = os.path.join(settings.MEDIA_ROOT, filename)
    with open(filepath, 'wb+') as dest:
        for chunk in file.chunks():
            dest.write(chunk)
            
    return {"url": f"{settings.MEDIA_URL}{filename}"}

# --- Products ---

class ProductCreateSchema(Schema):
    name: str
    description: str = ""
    price: float
    stock_quantity: int = 0
    is_active: bool = True
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    image_urls: List[str] = []

class ProductUpdateSchema(Schema):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None

class ProductOutSchema(Schema):
    id: int
    name: str
    description: str
    price: float
    stock_quantity: int
    is_active: bool
    category_id: Optional[int] = None
    image_urls: List[str] = []

    @staticmethod
    def resolve_image_urls(obj):
        return [img.url for img in obj.images.all()]

@router.post("/products", response={200: ProductOutSchema})
def create_product(request, data: ProductCreateSchema):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
        
    from django.utils.text import slugify
    import uuid
    from .models import ProductImage
    
    slug = slugify(data.name) + "-" + str(uuid.uuid4())[:8]
    
    product = Product.objects.create(
        name=data.name,
        slug=slug,
        description=data.description,
        price=data.price,
        stock_quantity=data.stock_quantity,
        is_active=data.is_active,
        category_id=data.category_id
    )
    
    urls = list(data.image_urls) if data.image_urls else []
    if data.image_url and data.image_url not in urls:
        urls.insert(0, data.image_url)
        
    for idx, url in enumerate(urls):
        ProductImage.objects.create(
            product=product,
            url=url,
            is_primary=(idx == 0)
        )
        
    AuditLog.log(request.user, "product.create", {"product_id": product.id, "name": product.name, "price": float(product.price)})
    return product

@router.get("/products", response=List[ProductOutSchema])
def list_products(request):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
    # Soft deleted items are kept in DB. Should we show them to admin? 
    # Yes, or filter by is_active. Let's return all, the UI can filter.
    return Product.objects.all().order_by('-created_at')

@router.patch("/products/{product_id}", response={200: ProductOutSchema})
def update_product(request, product_id: int, data: ProductUpdateSchema):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
        
    product = get_object_or_404(Product, id=product_id)
    
    # Extract image fields from update
    update_data = data.dict(exclude_unset=True)
    image_url = update_data.pop('image_url', None)
    image_urls = update_data.pop('image_urls', None)
    
    for attr, value in update_data.items():
        setattr(product, attr, value)
        
    product.save()
    
    # Handle image updates if explicitly sent
    if image_urls is not None or image_url is not None:
        from .models import ProductImage
        urls = list(image_urls) if image_urls is not None else []
        if image_url and image_url not in urls:
            urls.insert(0, image_url)
            
        if urls:
            product.images.all().delete()
            for idx, url in enumerate(urls):
                ProductImage.objects.create(
                    product=product,
                    url=url,
                    is_primary=(idx == 0)
                )
                
    AuditLog.log(request.user, "product.update", {"product_id": product.id, "name": product.name})
    return product

@router.delete("/products/{product_id}")
def delete_product(request, product_id: int):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
        
    # Soft delete
    product = get_object_or_404(Product, id=product_id)
    product.is_active = False
    product.save()
    AuditLog.log(request.user, "product.delete", {"product_id": product_id, "name": product.name})
    return {"success": True}

# --- Vouchers ---

class VoucherCreateSchema(Schema):
    code: str
    discount_type: str
    value: Optional[float] = None
    min_order_value: float = 0.0
    usage_limit_total: Optional[int] = None
    usage_limit_per_customer: int = 1
    valid_from: datetime
    valid_until: datetime
    is_active: bool = True

class VoucherUpdateSchema(Schema):
    is_active: Optional[bool] = None
    usage_limit_total: Optional[int] = None

class VoucherOutSchema(Schema):
    id: int
    code: str
    discount_type: str
    value: Optional[float] = None
    min_order_value: float
    usage_limit_total: Optional[int] = None
    usage_limit_per_customer: int
    usage_count: int
    valid_from: datetime
    valid_until: datetime
    is_active: bool

@router.post("/vouchers", response={200: VoucherOutSchema})
def create_voucher(request, data: VoucherCreateSchema):
    if request.user.role != 'ADMIN':
        raise HttpError(403, "Only ADMIN can create vouchers")
        
    voucher = Voucher.objects.create(**data.dict())
    return voucher

@router.get("/vouchers", response=List[VoucherOutSchema])
def list_vouchers(request):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
    return Voucher.objects.all().order_by('-valid_from')

@router.patch("/vouchers/{voucher_id}", response={200: VoucherOutSchema})
def update_voucher(request, voucher_id: int, data: VoucherUpdateSchema):
    if request.user.role != 'ADMIN':
        raise HttpError(403, "Only ADMIN can edit vouchers")
        
    voucher = get_object_or_404(Voucher, id=voucher_id)
    
    for attr, value in data.dict(exclude_unset=True).items():
        setattr(voucher, attr, value)
        
    voucher.save()
    return voucher

# --- Categories ---

class CategoryCreateSchema(Schema):
    name: str
    slug: Optional[str] = None
    icon: str = "🏷️"
    description: str = ""

class CategoryUpdateSchema(Schema):
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None

class CategoryOutSchema(Schema):
    id: int
    name: str
    slug: str
    icon: str
    description: str

@router.post("/categories", response={200: CategoryOutSchema})
def create_category(request, data: CategoryCreateSchema):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
        
    from django.utils.text import slugify
    slug = data.slug or slugify(data.name)
    
    if Category.objects.filter(slug=slug).exists():
        import uuid
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"
        
    category = Category.objects.create(
        name=data.name,
        slug=slug,
        icon=data.icon,
        description=data.description
    )
    AuditLog.log(request.user, "category.create", {"category_id": category.id, "name": category.name})
    return category

@router.get("/categories", response=List[CategoryOutSchema])
def list_categories(request):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
    return Category.objects.all().order_by('name')

@router.patch("/categories/{category_id}", response={200: CategoryOutSchema})
def update_category(request, category_id: int, data: CategoryUpdateSchema):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
        
    category = get_object_or_404(Category, id=category_id)
    
    for attr, value in data.dict(exclude_unset=True).items():
        if value is not None:
            setattr(category, attr, value)
            
    category.save()
    AuditLog.log(request.user, "category.update", {"category_id": category.id, "name": category.name})
    return category

@router.delete("/categories/{category_id}")
def delete_category(request, category_id: int):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
        
    category = get_object_or_404(Category, id=category_id)
    name = category.name
    category.delete()
    AuditLog.log(request.user, "category.delete", {"category_id": category_id, "name": name})
    return {"success": True}

# --- Product Types (Dynamic Schemas) ---

