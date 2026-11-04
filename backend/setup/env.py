"""Helpers for settings read from the environment."""
from urllib.parse import parse_qsl, unquote, urlparse


def database_from_url(url: str) -> dict:
    """Django DATABASES entry for a postgres:// URL, as hosted Postgres (e.g. Neon) provides.
    Query parameters such as sslmode=require pass straight through to libpq."""
    parsed = urlparse(url)
    if parsed.scheme not in ("postgres", "postgresql"):
        raise ValueError("DATABASE_URL must be a postgres:// URL")
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": unquote(parsed.path.lstrip("/")),
        "USER": unquote(parsed.username or ""),
        "PASSWORD": unquote(parsed.password or ""),
        "HOST": parsed.hostname or "",
        "PORT": str(parsed.port or 5432),
        "OPTIONS": dict(parse_qsl(parsed.query)),
    }
