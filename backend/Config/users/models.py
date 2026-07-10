import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

from django.contrib.auth.models import UserManager

class CustomUserManager(UserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    objects = CustomUserManager()
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('STAFF', 'Staff'),
        ('CUSTOMER', 'Customer'),
    )
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CUSTOMER')
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["email"],
                condition=models.Q(deleted_at__isnull=True),
                name="unique_active_email",
            )
        ]

    def deactivate(self):
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["deleted_at", "is_active"])

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def log(cls, user, action, details=None):
        if details is None:
            details = {}
        # Ensure user is authenticated, otherwise set to None (system actions)
        log_user = user if (user and user.is_authenticated) else None
        return cls.objects.create(user=log_user, action=action, details=details)

    def __str__(self):
        return f"AuditLog: {self.action} by {self.user.email if self.user else 'System'}"

class TeamInvite(models.Model):
    email = models.EmailField()
    role = models.CharField(choices=[("ADMIN","Admin"),("STAFF","Staff")], max_length=20)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invites_sent")
    token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)

