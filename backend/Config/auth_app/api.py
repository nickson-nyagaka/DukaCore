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
    
    identifier = (data.identifier or '').strip()
    user = None

    if '@' in identifier:
        try:
            u = User.objects.get(email__iexact=identifier)
            if u.check_password(data.password):
                user = u
            else:
                raise HttpError(401, 'Invalid credentials')
        except User.DoesNotExist:
            raise HttpError(401, 'Invalid credentials')
    else:
        user = authenticate(request, username=identifier, password=data.password)
        if not user:
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


# ─────────────────────────────────────────────────────────────────────────────
# Profile & Password management
# ─────────────────────────────────────────────────────────────────────────────

class UpdateProfileSchema(Schema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None

@router.patch('/profile', auth=JWTAuth(), response=UserSchema)
def update_profile(request, data: UpdateProfileSchema):
    from ninja.errors import HttpError
    user = request.user
    if data.first_name is not None:
        user.first_name = data.first_name.strip()
    if data.last_name is not None:
        user.last_name = data.last_name.strip()
    if data.phone_number is not None:
        phone = data.phone_number.strip() or None
        if phone and User.objects.filter(phone_number=phone).exclude(pk=user.pk).exists():
            raise HttpError(400, 'Phone number already in use by another account')
        user.phone_number = phone
    user.save()
    AuditLog.log(user, 'user.profile_updated')
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


class ChangePasswordSchema(Schema):
    current_password: str
    new_password: str

@router.post('/change-password', auth=JWTAuth())
def change_password(request, data: ChangePasswordSchema):
    from ninja.errors import HttpError
    user = request.user
    if not user.check_password(data.current_password):
        raise HttpError(400, 'Current password is incorrect')
    if len(data.new_password) < 8:
        raise HttpError(400, 'New password must be at least 8 characters')
    user.set_password(data.new_password)
    user.save()
    AuditLog.log(user, 'user.password_changed')
    return {'success': True, 'message': 'Password changed successfully'}


# ─────────────────────────────────────────────────────────────────────────────
# Address Book CRUD
# ─────────────────────────────────────────────────────────────────────────────
from users.models import UserAddress

class AddressSchema(Schema):
    id: int
    label: str
    full_address: str
    city: str
    county: str
    phone: str
    is_default: bool

class CreateAddressSchema(Schema):
    label: str = 'Home'
    full_address: str
    city: str
    county: str = ''
    phone: str = ''
    is_default: bool = False

class UpdateAddressSchema(Schema):
    label: Optional[str] = None
    full_address: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    phone: Optional[str] = None
    is_default: Optional[bool] = None

@router.get('/addresses', auth=JWTAuth(), response=List[AddressSchema])
def list_addresses(request):
    user = request.user
    return list(UserAddress.objects.filter(user=user))

@router.post('/addresses', auth=JWTAuth(), response=AddressSchema)
def create_address(request, data: CreateAddressSchema):
    from ninja.errors import HttpError
    user = request.user
    if UserAddress.objects.filter(user=user).count() >= 10:
        raise HttpError(400, 'You can save up to 10 addresses only')
    # If this is the first address, make it default automatically
    if not UserAddress.objects.filter(user=user).exists():
        data_dict = data.dict()
        data_dict['is_default'] = True
    else:
        data_dict = data.dict()
    addr = UserAddress.objects.create(user=user, **data_dict)
    return addr

@router.patch('/addresses/{addr_id}', auth=JWTAuth(), response=AddressSchema)
def update_address(request, addr_id: int, data: UpdateAddressSchema):
    from ninja.errors import HttpError
    user = request.user
    try:
        addr = UserAddress.objects.get(id=addr_id, user=user)
    except UserAddress.DoesNotExist:
        raise HttpError(404, 'Address not found')
    for field, value in data.dict(exclude_unset=True).items():
        setattr(addr, field, value)
    addr.save()
    return addr

@router.delete('/addresses/{addr_id}')
def delete_address(request, addr_id: int):
    from ninja.errors import HttpError
    # Manual auth check so we can use JWTAuth
    from auth_app.auth import JWTAuth as _JWTAuth
    token = request.COOKIES.get('mve_access_token')
    if not token:
        raise HttpError(401, 'Authentication required')
    auth = _JWTAuth()
    user = auth.authenticate(request, token)
    if not user:
        raise HttpError(401, 'Authentication required')
    try:
        addr = UserAddress.objects.get(id=addr_id, user=user)
    except UserAddress.DoesNotExist:
        raise HttpError(404, 'Address not found')
    was_default = addr.is_default
    addr.delete()
    # If deleted address was default, promote next most recent
    if was_default:
        next_addr = UserAddress.objects.filter(user=user).first()
        if next_addr:
            next_addr.is_default = True
            next_addr.save()
    return {'success': True}

@router.post('/addresses/{addr_id}/set-default', auth=JWTAuth(), response=AddressSchema)
def set_default_address(request, addr_id: int):
    from ninja.errors import HttpError
    user = request.user
    try:
        addr = UserAddress.objects.get(id=addr_id, user=user)
    except UserAddress.DoesNotExist:
        raise HttpError(404, 'Address not found')
    addr.is_default = True
    addr.save()  # model.save() handles clearing other defaults
    return addr
