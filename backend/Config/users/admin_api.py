from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from ninja.errors import HttpError
from typing import List, Optional
from datetime import datetime, timedelta
from django.utils import timezone
import uuid

from auth_app.auth import JWTAuth
from permissions.enforce import require_permission
from .models import User, TeamInvite, AuditLog

router = Router(auth=JWTAuth())

class AddUserSchema(Schema):
    username: str
    email: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    role: str
    password: str

class TeamMemberOutSchema(Schema):
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    role: str
    is_active: bool
    last_login: Optional[datetime] = None

@router.get("/team", response=List[TeamMemberOutSchema])
def list_team(request):
    if request.user.role != 'ADMIN':
        raise HttpError(403, "Forbidden")
        
    return User.objects.filter(deleted_at__isnull=True).order_by('-date_joined')

@router.post("/team/add", response={200: TeamMemberOutSchema})
def add_team_member(request, payload: AddUserSchema):
    if request.user.role != 'ADMIN':
        raise HttpError(403, "Forbidden")
        
    if payload.role not in ['ADMIN', 'STAFF', 'CUSTOMER']:
        raise HttpError(400, "Invalid role")
        
    if User.objects.filter(email=payload.email, deleted_at__isnull=True).exists():
        raise HttpError(400, "User with this email already exists")
        
    if User.objects.filter(username=payload.username, deleted_at__isnull=True).exists():
        raise HttpError(400, "User with this username already exists")

    user = User.objects.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone_number=payload.phone_number,
        role=payload.role,
        is_staff=(payload.role in ['ADMIN', 'STAFF'])
    )
    
    AuditLog.log(request.user, "team.add_member", {"email": user.email, "role": user.role})
    return user

class UpdateUserSchema(Schema):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

@router.patch("/team/{user_id}", response={200: TeamMemberOutSchema})
def update_team_member(request, user_id: int, payload: UpdateUserSchema):
    if request.user.role != 'ADMIN':
        raise HttpError(403, "Forbidden")
        
    user = get_object_or_404(User, id=user_id, deleted_at__isnull=True)
    
    if payload.username and payload.username != user.username:
        if User.objects.filter(username=payload.username, deleted_at__isnull=True).exclude(id=user_id).exists():
            raise HttpError(400, "Username already exists")
        user.username = payload.username
        
    if payload.email and payload.email != user.email:
        if User.objects.filter(email=payload.email, deleted_at__isnull=True).exclude(id=user_id).exists():
            raise HttpError(400, "Email already exists")
        user.email = payload.email
        
    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number
        
    if payload.role is not None:
        if payload.role not in ['ADMIN', 'STAFF', 'CUSTOMER']:
            raise HttpError(400, "Invalid role")
        if user.id == request.user.id and payload.role != 'ADMIN':
            raise HttpError(400, "Cannot change your own ADMIN role")
        user.role = payload.role
        user.is_staff = (payload.role in ['ADMIN', 'STAFF'])
        
    if payload.password:
        user.set_password(payload.password)
        
    user.save()
    AuditLog.log(request.user, "team.update_member", {"user_id": user.id, "email": user.email})
    return user

@router.patch("/team/{user_id}/role")
def change_role(request, user_id: int, payload: dict):
    if request.user.role != 'ADMIN':
        raise HttpError(403, "Forbidden")
        
    role = payload.get('role')
    if role not in ['ADMIN', 'STAFF', 'CUSTOMER']:
        raise HttpError(400, "Invalid role")
        
    user = get_object_or_404(User, id=user_id)
    if user.id == request.user.id:
        raise HttpError(400, "Cannot change your own role")
        
    user.role = role
    user.is_staff = (role in ['ADMIN', 'STAFF'])
    user.save()
    AuditLog.log(request.user, "team.change_role", {"user_id": user_id, "email": user.email, "role": role})
    return {"success": True}

@router.delete("/team/{user_id}")
def deactivate_team_member(request, user_id: int):
    if request.user.role != 'ADMIN':
        raise HttpError(403, "Forbidden")
        
    user = get_object_or_404(User, id=user_id)
    if user.id == request.user.id:
        raise HttpError(400, "Cannot deactivate yourself")
        
    user.deactivate()
    AuditLog.log(request.user, "team.deactivate_member", {"user_id": user_id, "email": user.email})
    return {"success": True}

# --- Audit Logs ---

class AuditLogUserSchema(Schema):
    email: str
    username: str
    role: str

class AuditLogOutSchema(Schema):
    id: int
    user: Optional[AuditLogUserSchema] = None
    action: str
    details: dict
    created_at: datetime

@router.get("/security/impersonation-log", response=List[AuditLogOutSchema])
def list_audit_logs(request):
    if request.user.role not in ['ADMIN', 'STAFF']:
        raise HttpError(403, "Forbidden")
        
    return AuditLog.objects.all().select_related('user').order_by('-created_at')
