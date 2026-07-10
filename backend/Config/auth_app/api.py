from ninja import Router, Schema
from django.contrib.auth import get_user_model
from pydantic import EmailStr
from typing import Optional, List
from .tokens import generate_tokens, decode_token
from .auth import JWTAuth
import jwt
import uuid

User = get_user_model()
router = Router()
from users.models import AuditLog

class RegisterSchema(Schema):
    email: str
    username: str
    password: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    role: str = 'CUSTOMER'

class LoginSchema(Schema):
    identifier: str
    password: str

class TokenSchema(Schema):
    access: str
    refresh: str

class UserSchema(Schema):
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    role: str
    phone_number: Optional[str] = None
    permissions: List[str] = []

class RefreshSchema(Schema):
    refresh: str

from django.http import JsonResponse
from django.conf import settings
from permissions.models import get_user_permissions

@router.post('/register')
def register(request, data: RegisterSchema):
    if User.objects.filter(email=data.email).exists():
        from ninja.errors import HttpError
        raise HttpError(400, 'Email already registered')
    if User.objects.filter(username=data.username).exists():
        from ninja.errors import HttpError
        raise HttpError(400, 'Username already taken')
    user = User.objects.create_user(
        username=data.username,
        email=data.email,
        password=data.password,
        first_name=data.first_name,
        last_name=data.last_name,
        phone_number=data.phone_number,
        role=data.role.upper(),
    )
    access, refresh = generate_tokens(user)
    
    response = JsonResponse({
        'user': {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'phone_number': user.phone_number,
            'permissions': get_user_permissions(user),
        }
    })
    response.set_cookie(
        'mve_access_token',
        access,
        httponly=True,
        secure=not settings.DEBUG,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        'mve_refresh_token',
        refresh,
        httponly=True,
        secure=not settings.DEBUG,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    return response

@router.post('/login')
def login(request, data: LoginSchema):
    from django.contrib.auth import authenticate
    from ninja.errors import HttpError
    user = authenticate(request, username=data.identifier, password=data.password)
    if not user:
        try:
            # Try by email if username auth failed
            u = User.objects.get(email=data.identifier)
            if not u.check_password(data.password):
                raise HttpError(401, 'Invalid credentials')
            user = u
        except User.DoesNotExist:
            raise HttpError(401, 'Invalid credentials')

    if not user.is_active:
        raise HttpError(401, 'Invalid credentials')

    access, refresh = generate_tokens(user)
    
    response = JsonResponse({
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'phone_number': user.phone_number,
            'permissions': get_user_permissions(user),
        }
    })
    response.set_cookie(
        'mve_access_token',
        access,
        httponly=True,
        secure=not settings.DEBUG,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        'mve_refresh_token',
        refresh,
        httponly=True,
        secure=not settings.DEBUG,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    AuditLog.log(user, "user.login", {"role": user.role})
    return response

@router.get('/me', auth=JWTAuth(), response=UserSchema)
def me(request):
    user = request.user
    permissions = get_user_permissions(user)
    
    return {
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'phone_number': user.phone_number,
        'permissions': permissions,
    }

@router.post('/token/refresh')
def refresh_token(request):
    from ninja.errors import HttpError
    refresh = request.COOKIES.get('mve_refresh_token')
    if not refresh:
        raise HttpError(401, 'Invalid or expired refresh token')
    try:
        payload = decode_token(refresh)
        if payload.get('type') != 'refresh':
            raise HttpError(401, 'Invalid token type')
        user = User.objects.get(id=payload['user_id'])
        if not user.is_active:
            raise HttpError(401, 'User deactivated')
        access, new_refresh = generate_tokens(user)
        
        response = JsonResponse({'success': True})
        response.set_cookie(
            'mve_access_token',
            access,
            httponly=True,
            secure=not settings.DEBUG,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        response.set_cookie(
            'mve_refresh_token',
            new_refresh,
            httponly=True,
            secure=not settings.DEBUG,
            samesite=settings.SESSION_COOKIE_SAMESITE,
            max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
        return response
    except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
        raise HttpError(401, 'Invalid or expired refresh token')

@router.post('/logout')
def logout(request):
    # Log user logout
    token = request.COOKIES.get('mve_access_token')
    if token:
        try:
            from auth_app.auth import JWTAuth
            auth = JWTAuth()
            user = auth.authenticate(request, token)
            if user:
                AuditLog.log(user, "user.logout")
        except Exception:
            pass
            
    response = JsonResponse({'success': True})
    response.delete_cookie('mve_access_token')
    response.delete_cookie('mve_refresh_token')
    return response

class AcceptInviteSchema(Schema):
    token: str
    password: str
    username: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None

@router.post('/accept-invite')
def accept_invite(request, data: AcceptInviteSchema):
    from ninja.errors import HttpError
    from django.utils import timezone
    from users.models import TeamInvite
    
    invite = TeamInvite.objects.filter(token=data.token, accepted_at__isnull=True).first()
    if not invite:
        raise HttpError(400, "Invalid or expired invite token")
        
    if timezone.now() > invite.expires_at:
        raise HttpError(400, "Invite has expired")
        
    if User.objects.filter(username=data.username).exists():
        raise HttpError(400, "Username already taken")
        
    user = User.objects.create_user(
        username=data.username,
        email=invite.email,
        password=data.password,
        first_name=data.first_name,
        last_name=data.last_name,
        phone_number=data.phone_number,
        role=invite.role,
        is_staff=(invite.role in ['ADMIN', 'STAFF'])
    )
    
    invite.accepted_at = timezone.now()
    invite.save()
    
    return {"success": True, "message": "Account created successfully. You can now login."}

