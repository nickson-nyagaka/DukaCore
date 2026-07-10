from django.db import models

class Role(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    STAFF = "STAFF", "Staff"
    CUSTOMER = "CUSTOMER", "Customer"

PERMISSIONS = {
    Role.ADMIN: {
        "product.create", "product.delete", "product.edit",
        "voucher.create", "voucher.edit",
        "user.manage", "user.invite", "user.deactivate",
        "order.view_all",
    },
    Role.STAFF: {
        "product.create", "product.edit", "order.view_all",
    },
    Role.CUSTOMER: {
        "order.view_own", "cart.manage_own",
    },
}

def get_user_permissions(user):
    """Computes active permissions list for a user."""
    if not user or not user.is_authenticated:
        return []
    
    perms = set(PERMISSIONS.get(user.role, set()))
        
    return list(perms)
