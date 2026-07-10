"""
MVE Seed Script - Creates dummy vendors, categories, and products.
Run: python Config/manage.py shell < Config/seed.py
OR:  python Config/seed.py (from backend/ directory)
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Config.settings')
django.setup()

from users.models import User, Vendor
from catalog.models import Category, Product, ProductImage

print("Seeding MVE database...")

# ─── Vendors / Users ───────────────────────────────────────────────
def get_or_create_vendor(email, first_name, business_name, slug):
    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,
            'first_name': first_name,
            'last_name': 'Store',
            'role': 'VENDOR',
            'phone_number': '+2547' + email[:8].replace('@','').replace('.','')[:8],
        }
    )
    user.set_password('vendor123')
    user.save()
    vendor, _ = Vendor.objects.get_or_create(
        user=user,
        defaults={
            'business_name': business_name,
            'slug': slug,
            'description': f'Your trusted {business_name} store on MVE.',
            'is_approved': True,
        }
    )
    return vendor

vendor_tech = get_or_create_vendor('techworld@mve.co.ke', 'Tech', 'TechWorld Kenya', 'techworld-kenya')
vendor_fashion = get_or_create_vendor('fashionhub@mve.co.ke', 'Fashion', 'Fashion Hub', 'fashion-hub')
vendor_home = get_or_create_vendor('homepro@mve.co.ke', 'Home', 'HomePro', 'homepro')
vendor_beauty = get_or_create_vendor('glowup@mve.co.ke', 'Glow', 'GlowUp Beauty', 'glowup-beauty')
print("Vendors created")

# ─── Categories ────────────────────────────────────────────────────
categories = {
    'phones': Category.objects.get_or_create(name='Phones & Tablets', slug='phones-tablets', defaults={'description': 'Smartphones, tablets and accessories'})[0],
    'computing': Category.objects.get_or_create(name='Computing', slug='computing', defaults={'description': 'Laptops, desktops and peripherals'})[0],
    'electronics': Category.objects.get_or_create(name='Electronics', slug='electronics', defaults={'description': 'TVs, audio and smart home devices'})[0],
    'fashion': Category.objects.get_or_create(name='Fashion', slug='fashion', defaults={'description': 'Clothing, shoes and accessories'})[0],
    'home': Category.objects.get_or_create(name='Home & Living', slug='home-living', defaults={'description': 'Furniture, decor and appliances'})[0],
    'beauty': Category.objects.get_or_create(name='Beauty & Health', slug='beauty-health', defaults={'description': 'Skincare, makeup and personal care'})[0],
}
print("Categories created")

# ─── Products ──────────────────────────────────────────────────────
# Using high-quality Unsplash/Picsum image URLs as placeholders
PRODUCTS = [
    # Phones & Tablets
    {
        'name': 'Samsung Galaxy A54 5G',
        'slug': 'samsung-galaxy-a54-5g',
        'description': 'Triple camera, 6.4" Super AMOLED, 5000mAh battery. Perfect for everyday use with blazing 5G speeds.',
        'price': 42999,
        'stock': 25,
        'vendor': vendor_tech,
        'category': categories['phones'],
        'images': [
            'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
        ]
    },
    {
        'name': 'Tecno Spark 20 Pro',
        'slug': 'tecno-spark-20-pro',
        'description': '6.78" FHD+ display, 108MP AI camera, 5000mAh battery. Budget flagship for the everyday Kenyan.',
        'price': 18999,
        'stock': 40,
        'vendor': vendor_tech,
        'category': categories['phones'],
        'images': [
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
        ]
    },
    {
        'name': 'iPhone 14 Pro Max 256GB',
        'slug': 'iphone-14-pro-max-256gb',
        'description': 'Dynamic Island, 48MP Main camera, A16 Bionic chip.',
        'price': 149999,
        'stock': 15,
        'vendor': vendor_tech,
        'category': categories['phones'],
        'images': [
            'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800&q=80',
        ]
    },
    {
        'name': 'Infinix Note 30 Pro',
        'slug': 'infinix-note-30-pro',
        'description': '6.78" AMOLED, 45W fast charge, 108MP camera. Smart, fast, and feature-packed.',
        'price': 24999,
        'stock': 30,
        'vendor': vendor_tech,
        'category': categories['phones'],
        'images': [
            'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
        ]
    },
    # Computing
    {
        'name': 'HP Pavilion 15 Laptop',
        'slug': 'hp-pavilion-15-laptop',
        'description': 'Intel Core i5-12th Gen, 8GB RAM, 512GB SSD, 15.6" FHD. Built for productivity and entertainment.',
        'price': 74999,
        'stock': 12,
        'vendor': vendor_tech,
        'category': categories['computing'],
        'images': [
            'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
        ]
    },
    {
        'name': 'Lenovo IdeaPad Slim 3',
        'slug': 'lenovo-ideapad-slim-3',
        'description': 'AMD Ryzen 5, 8GB RAM, 256GB SSD. Ultra-thin design with all-day battery life.',
        'price': 59999,
        'stock': 8,
        'vendor': vendor_tech,
        'category': categories['computing'],
        'images': [
            'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80',
        ]
    },
    {
        'name': 'MacBook Air M2',
        'slug': 'macbook-air-m2',
        'description': 'Supercharged by M2, 13.6-inch Liquid Retina display, 8GB RAM, 256GB SSD.',
        'price': 139999,
        'stock': 5,
        'vendor': vendor_tech,
        'category': categories['computing'],
        'images': [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
        ]
    },
    # Electronics
    {
        'name': 'LG 43" Smart TV 4K UHD',
        'slug': 'lg-43-smart-tv-4k',
        'description': 'WebOS, ThinQ AI, Dolby Vision HDR. Crystal-clear 4K picture with smart features built in.',
        'price': 49999,
        'stock': 15,
        'vendor': vendor_home,
        'category': categories['electronics'],
        'images': [
            'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=800&q=80',
        ]
    },
    {
        'name': 'Sony WH-1000XM5 Headphones',
        'slug': 'sony-wh-1000xm5',
        'description': 'Industry-leading noise cancellation, 30hr battery, crystal-clear hands-free calling.',
        'price': 29999,
        'stock': 20,
        'vendor': vendor_tech,
        'category': categories['electronics'],
        'images': [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        ]
    },
    {
        'name': 'JBL Flip 6 Bluetooth Speaker',
        'slug': 'jbl-flip-6',
        'description': 'Waterproof, dustproof, and up to 12 hours of playtime. Powerful JBL Original Pro Sound.',
        'price': 12500,
        'stock': 25,
        'vendor': vendor_tech,
        'category': categories['electronics'],
        'images': [
            'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80',
        ]
    },
    # Fashion
    {
        'name': 'Ankara Print Maxi Dress',
        'slug': 'ankara-print-maxi-dress',
        'description': 'Vibrant African print maxi dress, perfect for formal events or casual outings. Available in sizes S-XL.',
        'price': 3500,
        'stock': 50,
        'vendor': vendor_fashion,
        'category': categories['fashion'],
        'images': [
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
        ]
    },
    {
        'name': 'Nike Air Max 270',
        'slug': 'nike-air-max-270',
        'description': 'Breathable mesh upper, Max Air 270 unit for supreme cushioning. The lifestyle sneaker you need.',
        'price': 12999,
        'stock': 35,
        'vendor': vendor_fashion,
        'category': categories['fashion'],
        'images': [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
        ]
    },
    {
        'name': "Men's Classic Polo Shirt",
        'slug': 'mens-classic-polo-shirt',
        'description': 'Premium 100% cotton polo shirt, breathable and comfortable. Perfect for work or casual wear.',
        'price': 1800,
        'stock': 80,
        'vendor': vendor_fashion,
        'category': categories['fashion'],
        'images': [
            'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80',
        ]
    },
    {
        'name': "Women's Leather Crossbody Bag",
        'slug': 'womens-leather-crossbody-bag',
        'description': 'Genuine leather crossbody bag with adjustable strap. Elegant and practical.',
        'price': 4500,
        'stock': 20,
        'vendor': vendor_fashion,
        'category': categories['fashion'],
        'images': [
            'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80',
        ]
    },
    # Home & Living
    {
        'name': 'Ramtons Blender 1.5L',
        'slug': 'ramtons-blender-1-5l',
        'description': '600W motor, 6 stainless steel blades, pulse function. Built for the Kenyan kitchen.',
        'price': 4500,
        'stock': 45,
        'vendor': vendor_home,
        'category': categories['home'],
        'images': [
            'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80',
        ]
    },
    {
        'name': 'Modern Sectional Sofa',
        'slug': 'modern-sectional-sofa',
        'description': 'L-shaped sectional sofa with premium fabric. Seats 5 comfortably. Available in grey and beige.',
        'price': 48999,
        'stock': 5,
        'vendor': vendor_home,
        'category': categories['home'],
        'images': [
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
        ]
    },
    {
        'name': 'Philips Air Fryer XL',
        'slug': 'philips-air-fryer-xl',
        'description': 'Rapid Air Technology, 1.2Kg capacity. Fry, bake, grill, roast and even reheat.',
        'price': 15000,
        'stock': 15,
        'vendor': vendor_home,
        'category': categories['home'],
        'images': [
            'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80',
        ]
    },
    # Beauty & Health
    {
        'name': "Neutrogena Vitamin C Serum",
        'slug': 'neutrogena-vitamin-c-serum',
        'description': 'Brightening serum with 20% Vitamin C. Reduces dark spots and evens skin tone in 4 weeks.',
        'price': 2200,
        'stock': 100,
        'vendor': vendor_beauty,
        'category': categories['beauty'],
        'images': [
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80',
        ]
    },
    {
        'name': 'Hair Growth Oil 100ml',
        'slug': 'hair-growth-oil-100ml',
        'description': 'Natural castor & coconut oil blend. Promotes hair growth and reduces breakage.',
        'price': 850,
        'stock': 200,
        'vendor': vendor_beauty,
        'category': categories['beauty'],
        'images': [
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
        ]
    },
    {
        'name': 'Cerave Hydrating Cleanser',
        'slug': 'cerave-hydrating-cleanser',
        'description': 'For normal to dry skin. Cleanses and hydrates without disrupting the protective skin barrier.',
        'price': 2500,
        'stock': 50,
        'vendor': vendor_beauty,
        'category': categories['beauty'],
        'images': [
            'https://images.unsplash.com/photo-1615397323112-9c95972eb281?w=800&q=80',
        ]
    },
]

created = 0
for p_data in PRODUCTS:
    product, was_created = Product.objects.get_or_create(
        slug=p_data['slug'],
        defaults={
            'name': p_data['name'],
            'description': p_data['description'],
            'price': p_data['price'],
            'stock_quantity': p_data['stock'],
            'vendor': p_data['vendor'],
            'category': p_data['category'],
            'is_active': True,
        }
    )
    if was_created:
        # Add images
        for i, img_url in enumerate(p_data['images']):
            ProductImage.objects.create(
                product=product,
                url=img_url,
                alt_text=p_data['name'],
                is_primary=(i == 0),
            )
        created += 1
        print(f"  [OK] {p_data['name']}")
    else:
        print(f"  [SKIP] {p_data['name']} (already exists)")

# Create a customer user for testing
customer, _ = User.objects.get_or_create(
    email='customer@mve.co.ke',
    defaults={
        'username': 'customer@mve.co.ke',
        'first_name': 'Test',
        'last_name': 'Customer',
        'role': 'CUSTOMER',
        'phone_number': '+254712345678',
    }
)
customer.set_password('customer123')
customer.save()

# Create admin user
admin, _ = User.objects.get_or_create(
    email='admin@mve.co.ke',
    defaults={
        'username': 'admin@mve.co.ke',
        'first_name': 'Admin',
        'last_name': 'MVE',
        'role': 'ADMIN',
        'is_staff': True,
        'is_superuser': True,
    }
)
admin.set_password('admin123')
admin.save()

print(f"\nSeeding complete! Created {created} new products.")
print("\nTest Accounts:")
print("  Customer: customer@mve.co.ke / customer123")
print("  Vendor:   techworld@mve.co.ke / vendor123")
print("  Admin:    admin@mve.co.ke / admin123")
