# Django API + Channels WebSockets, served by Daphne.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Collect admin/API-docs static files for whitenoise. A random key only satisfies settings at build time.
RUN SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(50))')" python manage.py collectstatic --noinput

RUN useradd --create-home --uid 10001 app \
    && mkdir -p /app/media /app/private_media \
    && chown -R app:app /app/media /app/private_media
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz/', timeout=4)"

# Migrations run on start; with several replicas, run them as a separate one-off job instead.
CMD ["sh", "-c", "python manage.py migrate --noinput && daphne -b 0.0.0.0 -p 8000 setup.asgi:application"]
