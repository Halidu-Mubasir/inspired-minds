import sys
import warnings
from pathlib import Path
from datetime import timedelta
from decouple import config

from setup.env import database_from_url

BASE_DIR = Path(__file__).resolve().parent.parent
RUNNING_TESTS = len(sys.argv) > 1 and sys.argv[1] == "test"
if RUNNING_TESTS:
    # Tests don't run collectstatic; whitenoise would warn about the missing STATIC_ROOT on every request.
    warnings.filterwarnings("ignore", message="No directory at: ")

SECRET_KEY = config("SECRET_KEY")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",")
# Render (render.yaml) tells each service its public hostname.
RENDER_EXTERNAL_HOSTNAME = config("RENDER_EXTERNAL_HOSTNAME", default="")
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_yasg",
    "channels",
    # Local apps
    "subjects",
    "chat",
    "users",
    "pairings",
    "lessons",
    "resources",
    "enquiries",
    "ai_services",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # serves collected static files (admin, API docs)
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "setup.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "setup.wsgi.application"
ASGI_APPLICATION = "setup.asgi.application"

# Database — PostgreSQL in production, SQLite for local dev. Hosted Postgres (Neon, Render)
# hands out one DATABASE_URL; the DB_* settings serve docker compose and local Postgres.
DATABASE_URL = config("DATABASE_URL", default="")
_USE_POSTGRES = config("USE_POSTGRES", default=False, cast=bool)
if DATABASE_URL:
    DATABASES = {"default": database_from_url(DATABASE_URL)}
elif _USE_POSTGRES:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="inspired_minds"),
            "USER": config("DB_USER", default="postgres"),
            "PASSWORD": config("DB_PASSWORD", default="postgres"),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Redis / Channels. Without REDIS_URL, chat messages pass between sockets in process memory:
# fine for one server process (local dev, a single free instance), wrong for several.
REDIS_URL = config("REDIS_URL", default="")
if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [REDIS_URL]},
        }
    }
else:
    CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}

# Rate limits (DRF throttles) are counted in the cache. The default per-process memory cache
# is fine for one server; with several workers set USE_REDIS_CACHE so they share counts.
if REDIS_URL and config("USE_REDIS_CACHE", default=False, cast=bool):
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": REDIS_URL}}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Accra"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}

# Uploads in an S3-compatible bucket (Cloudflare R2, AWS S3, Backblaze B2) instead of local disk,
# for hosts without persistent storage. The bucket stays private: avatars get signed URLs,
# resources ("private") are only ever streamed through the access-checked download endpoint.
S3_BUCKET = config("S3_BUCKET", default="")
if S3_BUCKET:
    _s3 = {
        "bucket_name": S3_BUCKET,
        "endpoint_url": config("S3_ENDPOINT_URL", default="") or None,
        "access_key": config("S3_ACCESS_KEY_ID"),
        "secret_key": config("S3_SECRET_ACCESS_KEY"),
        "region_name": config("S3_REGION", default="auto"),
        "signature_version": "s3v4",
        "default_acl": None,
        "file_overwrite": False,
        "querystring_auth": True,
        "querystring_expire": 60 * 60 * 24 * 7,  # SigV4 maximum; avatar URLs refresh on each API read
    }
    STORAGES["default"] = {"BACKEND": "storages.backends.s3.S3Storage", "OPTIONS": {**_s3, "location": "media"}}
    STORAGES["private"] = {"BACKEND": "storages.backends.s3.S3Storage", "OPTIONS": {**_s3, "location": "private"}}

MEDIA_URL = "/media/"
MEDIA_ROOT = config("MEDIA_ROOT", default=str(BASE_DIR / "media"))
# Django serves /media/ (avatars only) when DEBUG is off and no web server sits in front.
SERVE_MEDIA = config("SERVE_MEDIA", default=False, cast=bool)
# Access-controlled uploads (resources). Must never be served by the web server.
PRIVATE_MEDIA_ROOT = config("PRIVATE_MEDIA_ROOT", default=str(BASE_DIR / "private_media"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "users.CustomUser"

# REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "setup.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Public website forms, per client IP.
        "enquiries": config("ENQUIRY_THROTTLE_RATE", default="10/hour"),
        "login": config("LOGIN_THROTTLE_RATE", default="10/minute"),
        "password_reset": config("PASSWORD_RESET_THROTTLE_RATE", default="5/hour"),
    },
    # Behind a reverse proxy, the number of proxies in front of Django, so throttles use the
    # real client IP from X-Forwarded-For instead of the proxy's address.
    "NUM_PROXIES": config("NUM_PROXIES", default=None, cast=lambda v: int(v) if v not in (None, "") else None),
}

# JWT — short-lived access tokens; the client refreshes them silently.
# Refresh tokens rotate on use and are blacklisted on rotation, logout and password change.
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=60),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# Email — console backend prints messages in dev; set EMAIL_BACKEND to
# django.core.mail.backends.smtp.EmailBackend (with the EMAIL_* settings) in production.
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = config("EMAIL_HOST", default="localhost")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="Inspired Minds <no-reply@inspiredminds.local>")

# Password reset links point at the LMS frontend and expire after two hours.
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")
PASSWORD_RESET_TIMEOUT = 2 * 60 * 60

# CORS
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS", default="http://localhost:3000"
).split(",")
CORS_ALLOW_CREDENTIALS = True
# Origins allowed to POST to the Django admin over HTTPS (e.g. https://api.example.com).
CSRF_TRUSTED_ORIGINS = [o for o in config("CSRF_TRUSTED_ORIGINS", default="").split(",") if o]
if RENDER_EXTERNAL_HOSTNAME:
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")

# Interactive API docs are for development; set EXPOSE_API_DOCS to publish them elsewhere.
EXPOSE_API_DOCS = config("EXPOSE_API_DOCS", default=DEBUG, cast=bool)

# Production hardening, on whenever DEBUG is off. Deploy behind a TLS-terminating proxy that
# sets X-Forwarded-Proto; set SECURE_SSL_REDIRECT=False only for local plain-HTTP runs.
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    # The test client speaks plain HTTP, so `manage.py test` must not redirect to HTTPS.
    SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=not RUNNING_TESTS, cast=bool)
    SECURE_REDIRECT_EXEMPT = [r"^healthz/$"]  # container health checks speak plain HTTP
    SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", default=True, cast=bool)
    CSRF_COOKIE_SECURE = config("CSRF_COOKIE_SECURE", default=True, cast=bool)
    # Start modestly; raise to a year (31536000) once HTTPS is known to work everywhere.
    SECURE_HSTS_SECONDS = config("SECURE_HSTS_SECONDS", default=60 * 60 * 24 * 30, cast=int)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = config("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True, cast=bool)
    SECURE_HSTS_PRELOAD = config("SECURE_HSTS_PRELOAD", default=False, cast=bool)
    X_FRAME_OPTIONS = "DENY"

# Joining the browser HSTS preload list is a hard-to-undo opt-in, not a default; don't let
# `check --deploy` (which CI runs with --fail-level WARNING) fail for leaving it off.
SILENCED_SYSTEM_CHECKS = ["security.W021"]

# AI (ai_services). AI features stay switched off (HTTP 503) until ANTHROPIC_API_KEY is set.
AI_PROVIDER = config("AI_PROVIDER", default="anthropic")
AI_MODEL = config("AI_MODEL", default="claude-sonnet-5-5")
ANTHROPIC_API_KEY = config("ANTHROPIC_API_KEY", default="")
# Daily caps per user, reset at local midnight (TIME_ZONE).
AI_DAILY_TUTOR_MESSAGES = config("AI_DAILY_TUTOR_MESSAGES", default=50, cast=int)
AI_DAILY_TEACHER_TOOL_RUNS = config("AI_DAILY_TEACHER_TOOL_RUNS", default=30, cast=int)
# Largest resource file the tutor or teacher tools will send to the model.
AI_MAX_ATTACHMENT_MB = config("AI_MAX_ATTACHMENT_MB", default=20, cast=int)

# Swagger
SWAGGER_SETTINGS = {
    "SECURITY_DEFINITIONS": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
        }
    },
    "USE_SESSION_AUTH": False,
}


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {"handlers": ["console"], "level": "WARNING"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}
