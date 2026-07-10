from ninja import NinjaAPI
from catalog.api import router as catalog_router
from auth_app.api import router as auth_router
from cart.api import router as cart_router
from orders.api import router as orders_router
from catalog.admin_api import router as admin_catalog_router
from users.admin_api import router as admin_users_router
from metrics.api import router as admin_metrics_router

api = NinjaAPI(title="MVE API", version="2.0.0", description="Multi-Vendor E-Commerce Platform API")

api.add_router("/catalog", catalog_router, tags=["Catalog"])
api.add_router("/auth", auth_router, tags=["Auth"])
api.add_router("/cart", cart_router, tags=["Cart"])
api.add_router("/orders", orders_router, tags=["Orders"])

# Admin routes
api.add_router("/admin", admin_catalog_router, tags=["Admin Catalog"])
api.add_router("/admin", admin_users_router, tags=["Admin Team"])
api.add_router("/", admin_metrics_router, tags=["Admin Metrics"])
