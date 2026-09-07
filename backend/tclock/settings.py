"""
T Clock Restaurant POS — Django Settings
"""

from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except Exception:
    pass

SECRET_KEY = 'django-insecure-tclock-pos-change-this-in-production-2024'

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    'cloudinary_storage',
    'cloudinary',
    # T Clock Apps
    'accounts',
    'menu',
    'tables',
    'orders',
    'billing',
    'kitchen',
    'analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'tclock.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'tclock.wsgi.application'

import os
import dj_database_url

DATABASE_URL = os.environ.get('DATABASE_URL')
USE_SQLITE = os.environ.get('USE_SQLITE', '').lower() in ('1', 'true', 'yes')

if DATABASE_URL and not USE_SQLITE:
    # Use Supabase PostgreSQL with persistent connection pooling
    db_config = dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,
        conn_health_checks=True,
    )
    # Enable SSL required by Supabase pooler
    db_config['OPTIONS'] = {
        'sslmode': 'require',
    }
    DATABASES = {
        'default': db_config
    }
else:
    # Use SQLite for Local Development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

import os
cloudinary_url = os.environ.get('CLOUDINARY_URL', '').strip()
if cloudinary_url and '@' in cloudinary_url and ':' in cloudinary_url.split('@')[0].replace('cloudinary://', ''):
    # Use Cloudinary if a complete CLOUDINARY_URL (with api_key:api_secret@cloud_name) is provided
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    MEDIA_URL = '/media/'
else:
    # Fallback to local storage if Cloudinary is missing or incomplete
    MEDIA_URL = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'
    os.makedirs(MEDIA_ROOT, exist_ok=True)
    os.makedirs(MEDIA_ROOT / 'menu', exist_ok=True)
    os.makedirs(MEDIA_ROOT / 'avatars', exist_ok=True)


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

# ─── REST Framework ───────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'EXCEPTION_HANDLER': 'tclock.exceptions.custom_exception_handler',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,
}

# ─── JWT ──────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ─── CORS & CSRF ──────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://restaurant-application-1.onrender.com',
    'https://t-clock-application.onrender.com',
    'https://restuarant-app-vy1i.onrender.com',
]
CORS_ALLOW_ALL_ORIGINS = True   # Allow all in development

CSRF_TRUSTED_ORIGINS = [
    'https://restaurant-application-1.onrender.com',
    'https://t-clock-application.onrender.com',
    'https://restuarant-app-vy1i.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
]


