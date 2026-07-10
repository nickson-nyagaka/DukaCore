from ninja import Router
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from auth_app.auth import JWTAuth
from permissions.enforce import require_permission
from orders.models import Order, OrderItem
from catalog.models import Product
from .models import PageView

router = Router()

@router.get("/admin/metrics/dashboard", auth=JWTAuth())
def dashboard_metrics(request):
    # Enforce permission check
    if request.user.role not in ['ADMIN', 'STAFF']:
        from ninja.errors import HttpError
        raise HttpError(403, "Forbidden")
        
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    
    # 1. Revenue & Orders
    orders_today = Order.objects.filter(created_at__gte=today_start, status__in=['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'])
    revenue_today = orders_today.aggregate(total=Sum('total_amount'))['total'] or 0
    orders_today_count = orders_today.count()
    
    orders_yesterday = Order.objects.filter(created_at__gte=yesterday_start, created_at__lt=today_start, status__in=['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'])
    revenue_yesterday = orders_yesterday.aggregate(total=Sum('total_amount'))['total'] or 0
    orders_yesterday_count = orders_yesterday.count()
    
    revenue_trend_pct = 0
    if revenue_yesterday > 0:
        revenue_trend_pct = ((float(revenue_today) - float(revenue_yesterday)) / float(revenue_yesterday)) * 100
    elif revenue_today > 0:
        revenue_trend_pct = 100
        
    orders_trend_pct = 0
    if orders_yesterday_count > 0:
        orders_trend_pct = ((orders_today_count - orders_yesterday_count) / orders_yesterday_count) * 100
    elif orders_today_count > 0:
        orders_trend_pct = 100
        
    # 2. Average Order Value (rolling 30d)
    thirty_days_ago = now - timedelta(days=30)
    orders_30d = Order.objects.filter(created_at__gte=thirty_days_ago, status__in=['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'])
    orders_30d_count = orders_30d.count()
    revenue_30d = orders_30d.aggregate(total=Sum('total_amount'))['total'] or 0
    average_order_value = float(revenue_30d) / orders_30d_count if orders_30d_count > 0 else 0
    
    # 3. Conversion Rate (rolling 30d)
    sessions_30d = PageView.objects.filter(created_at__gte=thirty_days_ago).values('session_key').distinct().count()
    conversion_rate = (orders_30d_count / sessions_30d * 100) if sessions_30d > 0 else 0
    
    # 4. Repeat Purchase Rate (rolling 90d)
    ninety_days_ago = now - timedelta(days=90)
    customers_90d = Order.objects.filter(created_at__gte=ninety_days_ago).values('customer').annotate(order_count=Count('id'))
    total_customers_90d = customers_90d.count()
    repeat_customers = customers_90d.filter(order_count__gt=1).count()
    repeat_purchase_rate = (repeat_customers / total_customers_90d * 100) if total_customers_90d > 0 else 0
    
    # 5. Top Products (last 7 days by units sold)
    seven_days_ago = now - timedelta(days=7)
    top_products_qs = OrderItem.objects.filter(order__created_at__gte=seven_days_ago, order__status__in=['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']).values('product__name', 'product__id').annotate(units_sold=Sum('quantity')).order_by('-units_sold')[:5]
    top_products = list(top_products_qs)
    
    # 6. Low Stock Alerts
    low_stock_alerts = list(Product.objects.filter(stock_quantity__lt=5, is_active=True).values('id', 'name', 'stock_quantity'))
    
    # 7. Active Products
    active_products = Product.objects.filter(is_active=True).count()
    
    return {
        "revenue_today": float(revenue_today),
        "revenue_trend_pct": round(revenue_trend_pct, 1),
        "orders_today": orders_today_count,
        "orders_trend_pct": round(orders_trend_pct, 1),
        "average_order_value": round(average_order_value, 2),
        "conversion_rate": round(conversion_rate, 2),
        "repeat_purchase_rate": round(repeat_purchase_rate, 2),
        "top_products": top_products,
        "low_stock_alerts": low_stock_alerts,
        "active_products": active_products,
    }
