#!/bin/sh
# Starts the API as the unprivileged "app" user.
# Mounted disks (a Render disk, a compose volume) can arrive owned by root, so while still
# root, create the upload folders and hand them to "app", then drop privileges.
set -e

MEDIA_ROOT="${MEDIA_ROOT:-/app/media}"
PRIVATE_MEDIA_ROOT="${PRIVATE_MEDIA_ROOT:-/app/private_media}"

if [ "$(id -u)" = "0" ]; then
    mkdir -p "$MEDIA_ROOT" "$PRIVATE_MEDIA_ROOT"
    chown -R app:app "$MEDIA_ROOT" "$PRIVATE_MEDIA_ROOT"
    exec setpriv --reuid=app --regid=app --init-groups "$0" "$@"
fi

# Migrations run on start; with several replicas, run them as a separate one-off job instead.
python manage.py migrate --noinput
exec daphne -b 0.0.0.0 -p "${PORT:-8000}" setup.asgi:application
