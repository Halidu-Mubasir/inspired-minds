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

# Strip any Windows line endings from the entrypoint so sh can run it.
RUN useradd --create-home --uid 10001 app \
    && mkdir -p /app/media /app/private_media \
    && chown -R app:app /app/media /app/private_media \
    && sed -i 's/\r$//' /app/docker-entrypoint.sh \
    && chmod +x /app/docker-entrypoint.sh

# The entrypoint starts as root only to hand mounted upload disks to "app", then runs
# migrations and Daphne as "app". Hosts like Render set PORT; 8000 otherwise.
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ.get('PORT', '8000') + '/healthz/', timeout=4)"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
