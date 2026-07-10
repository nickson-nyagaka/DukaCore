import jwt
import datetime
from django.conf import settings


def generate_tokens(user):
    now = datetime.datetime.utcnow()
    access_payload = {
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'exp': now + datetime.timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        'iat': now,
        'type': 'access',
    }
    refresh_payload = {
        'user_id': user.id,
        'exp': now + datetime.timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        'iat': now,
        'type': 'refresh',
    }
    access_token = jwt.encode(access_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return access_token, refresh_token


def decode_token(token: str):
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
