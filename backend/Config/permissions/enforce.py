from ninja.errors import HttpError
from auth_app.auth import JWTAuth
from permissions.models import Role, PERMISSIONS

def has_permission(user, perm: str) -> bool:
    if not user or not user.is_authenticated:
        return False

    role_perms = PERMISSIONS.get(user.role, set())
    
    if perm in role_perms:
        return True
        
    if perm.endswith('.own'):
        base_perm = perm[:-4]
        if base_perm in role_perms:
            return True

    return False

class require_permission(JWTAuth):
    def __init__(self, perm: str):
        super().__init__()
        self.perm = perm

    def authenticate(self, request, key: str):
        user = super().authenticate(request, key)
        if not user:
            raise HttpError(401, "Unauthorized")
            
        if not has_permission(user, self.perm):
            raise HttpError(403, "Not permitted")
            
        return user
