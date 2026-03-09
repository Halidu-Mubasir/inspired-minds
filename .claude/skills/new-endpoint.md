---
description: Create a new Django REST API endpoint with serializer, view, and URL routing. Use when adding new API functionality to the backend.
user_invocable: true
---

# Create New API Endpoint

Add a new REST API endpoint to the Inspired Minds backend.

## Steps

1. Identify the target app and resource
2. Create or update the model in `backend/<app>/models/`
3. Create the serializer in `backend/<app>/serializers/`
4. Create the view (ViewSet or APIView) in `backend/<app>/views/`
5. Register the URL in `backend/<app>/urls.py`
6. Add appropriate permissions in `backend/<app>/permissions.py`
7. Run makemigrations + migrate if models changed
8. Register model in `backend/<app>/admin.py`

## Conventions
- All endpoints under `/api/v1/`
- Use ViewSets + routers for CRUD resources
- Use APIView for custom actions
- Serializers handle validation — keep views thin
- Permission classes: IsAdmin, IsTeacher, IsStudent, custom per-resource permissions
- Filter backends: django-filter for list views
- Pagination: use project's custom pagination from `setup/pagination.py`
- All responses follow DRF standard format
