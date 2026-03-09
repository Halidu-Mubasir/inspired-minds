---
description: Test API endpoints using curl or the Django dev server. Use to verify endpoints work correctly after changes.
user_invocable: true
---

# Test API Endpoints

Test Inspired Minds backend API endpoints.

## Steps

1. Ensure the backend dev server is running on port 8000
2. For auth-protected endpoints, first get a JWT token by calling POST `/api/v1/auth/login/`
3. Make the API request using curl with the Authorization header
4. Report the response status and body
5. If the request fails, analyze the error and suggest fixes

## Common Test Commands

```bash
# Login and get token
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "testpass123"}'

# Authenticated request
curl http://localhost:8000/api/v1/<endpoint>/ \
  -H "Authorization: Bearer <access_token>"
```

## Notes
- Always include Content-Type header for POST/PUT requests
- Check both success and error cases
- Verify permission restrictions (try with different roles)
