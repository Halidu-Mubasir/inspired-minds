---
description: Run Django backend tests. Use when you want to verify backend functionality, after code changes, or to check for regressions.
user_invocable: true
---

# Run Backend Tests

Run the Django test suite for the Inspired Minds backend.

## Steps

1. Navigate to `backend/` directory
2. Run `python manage.py test` (or scoped to a specific app if specified)
3. Report test results: passed, failed, errors
4. If tests fail, analyze the failure output and suggest fixes
5. If a specific app or test class is mentioned, run only those: `python manage.py test <app>.<TestClass>`

## Notes
- Use `--verbosity=2` for detailed output
- Use `--keepdb` to reuse the test database for faster runs
- Common test patterns: test permissions, test serializers, test views
