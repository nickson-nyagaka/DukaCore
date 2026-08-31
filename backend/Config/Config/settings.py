"""
Django settings for Config project.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-!kd3ce9ev=cv)_fm$(oyp4w5*05g(z5#=+9j4#@o!4t_)%-$vg'

DEBUG = True

ALLOWED_HOSTS = ['*']

# -------------------------------------------------------------------
# Payments Gateway & M-Pesa Daraja Config
# -------------------------------------------------------------------
PAYMENT_GATEWAY_MODE = os.environ.get("PAYMENT_GATEWAY_MODE", "daraja")  # "mock" | "daraja"

# M-Pesa Sandbox / Live Credentials
MPESA_ENVIRONMENT = os.environ.get("MPESA_ENVIRONMENT", "sandbox")
MPESA_CONSUMER_KEY = os.environ.get("MPESA_CONSUMER_KEY", "CXZzBGjeVQhUyVgmTO2eShwjCPXd7eSG6XWCeJwT0f1QJOtQ")
MPESA_CONSUMER_SECRET = os.environ.get("MPESA_CONSUMER_SECRET", "s6HURyEzwNjvLTSD6wvAAj4AYA9JmGYp7q4fdrVPHJ65fWV3JqJ3Y9aDPPGYbOT0")
MPESA_SHORTCODE = os.environ.get("MPESA_SHORTCODE", "174379")
MPESA_PASSKEY = os.environ.get("MPESA_PASSKEY", "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919")
MPESA_INITIATOR_NAME = os.environ.get("MPESA_INITIATOR_NAME", "testapi")
MPESA_INITIATOR_PASSWORD = os.environ.get("MPESA_INITIATOR_PASSWORD", "Safaricom123!!")
MPESA_PARTY_A = os.environ.get("MPESA_PARTY_A", "600979")
MPESA_PARTY_B = os.environ.get("MPESA_PARTY_B", "600000")
MPESA_TEST_PHONE = os.environ.get("MPESA_TEST_PHONE", "254708374149")
MPESA_CALLBACK_URL = os.environ.get("MPESA_CALLBACK_URL", "https://api.mavinehouseholds.com/api/orders/payment/callback")

# Fail loudly at startup rather than silently letting mock mode reach production
if not DEBUG and PAYMENT_GATEWAY_MODE == "mock":
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured("Mock payment gateway cannot be active outside DEBUG mode.")

# Domain config
COOKIE_DOMAIN = os.environ.get('COOKIE_DOMAIN') # e.g. .client-domain.com

if COOKIE_DOMAIN:
    SESSION_COOKIE_DOMAIN = COOKIE_DOMAIN
    CSRF_COOKIE_DOMAIN = COOKIE_DOMAIN

SESSION_COOKIE_SAMESITE = "Strict"

CORS_ALLOWED_ORIGINS = [
    os.environ.get("STOREFRONT_URL", "http://localhost:3000"),
    os.environ.get("ADMIN_URL", "http://localhost:3002"),
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    os.environ.get("STOREFRONT_URL", "http://localhost:3000"),
    os.environ.get("ADMIN_URL", "http://localhost:3002"),
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002",
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'corsheaders',
    'users',
    'catalog',
    'auth_app',
    'cart',
    'orders',
    'metrics',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'metrics.middleware.PageViewMiddleware',
]

ROOT_URLCONF = 'Config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Config.wsgi.application'

# -------------------------------------------------------------------
# Database (PostgreSQL)
# -------------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'MVE'),
        'USER': os.environ.get('DB_USER', 'nickson_nyagaka'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'JoanJuma@254'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': os.environ.get('DB_SSLMODE', 'disable'),
        },
    }
}

# -------------------------------------------------------------------
# Cache (LocMem for local dev by default, Redis if REDIS_URL provided)
# -------------------------------------------------------------------
REDIS_URL = os.environ.get('REDIS_URL')

if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'mavine-households-cache',
        }
    }

# -------------------------------------------------------------------
# JWT Settings
# -------------------------------------------------------------------
JWT_SECRET_KEY = SECRET_KEY
JWT_ALGORITHM = 'HS256'
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

# -------------------------------------------------------------------
# Media Files (local product images)
# -------------------------------------------------------------------
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# -------------------------------------------------------------------
# Static Files
# -------------------------------------------------------------------
STATIC_URL = 'static/'

# -------------------------------------------------------------------
# Meilisearch
# -------------------------------------------------------------------
MEILI_HOST = os.environ.get('MEILI_HOST', 'http://localhost:7700')
MEILI_MASTER_KEY = os.environ.get('MEILI_MASTER_KEY', 'mve_master_key_123')

# -------------------------------------------------------------------
# Auth
# -------------------------------------------------------------------
AUTH_USER_MODEL = 'users.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True
