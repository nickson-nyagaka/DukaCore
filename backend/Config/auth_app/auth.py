from ninja.security import APIKeyCookie
from django.contrib.auth import get_user_model
from .tokens import decode_token
import jwt

User = get_user_model()


class JWTAuth(APIKeyCookie):
    param_name = "mve_access_token"

    def authenticate(self, request, key: str):
        if not key:
            return None
        try:
            payload = decode_token(key)
            if payload.get('type') != 'access':
                return None
            user = User.objects.get(id=payload['user_id'])
            request.user = user
            return user
        except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
            return None


class AdminAuth(JWTAuth):
    def authenticate(self, request, key: str):
        user = super().authenticate(request, key)
        if user and user.role == 'ADMIN':
            return user
        return None

