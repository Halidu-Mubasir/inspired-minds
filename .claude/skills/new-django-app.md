---
description: Scaffold a new Django app following project conventions. Use when adding a new feature area or module to the backend.
user_invocable: true
---

# Scaffold New Django App

Create a new Django app following the Inspired Minds project conventions.

## Steps

1. Ask the user for the app name if not provided
2. Navigate to `backend/` directory
3. Run `python manage.py startapp <app_name>`
4. Restructure the app to follow project conventions:
   - Create `models/` directory with `__init__.py` (move models.py content or remove it)
   - Create `serializers/` directory with `__init__.py`
   - Create `views/` directory with `__init__.py`
   - Create `urls.py` with a router setup
   - Create `permissions.py` for custom permissions
5. Register the app in `setup/settings.py` INSTALLED_APPS
6. Add URL include in `setup/urls.py`
7. All models must inherit from `setup.base_model.BaseModel`

## App Structure Template
```
<app_name>/
├── __init__.py
├── admin.py
├── apps.py
├── permissions.py
├── models/
│   └── __init__.py
├── serializers/
│   └── __init__.py
├── views/
│   └── __init__.py
├── urls.py
├── tests.py
└── migrations/
    └── __init__.py
```
