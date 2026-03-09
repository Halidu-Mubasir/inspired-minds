---
description: Run Django database migrations (makemigrations + migrate). Use when models have changed or you need to apply pending migrations.
user_invocable: true
---

# Django Migrations

Run database migrations for the Inspired Minds backend.

## Steps

1. Navigate to `backend/` directory
2. Run `python manage.py makemigrations` to detect model changes
3. If new migrations were created, run `python manage.py migrate` to apply them
4. Report which migrations were created and applied
5. If there are migration conflicts, report them clearly and suggest resolution

## Notes
- Always run makemigrations before migrate
- If a specific app is mentioned, scope to that app: `python manage.py makemigrations <app_name>`
- Watch for migration dependency issues between apps
