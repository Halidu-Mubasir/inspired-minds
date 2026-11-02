# Inspired Minds LMS

## Project Overview
Learning Management System for Inspired Minds Home Tuition Agency. Manages teachers, students, pairings, lessons, resources, real-time chat, and AI-powered learning tools.

## Architecture
- **Monorepo** with two sub-projects:
  - `backend/` — Django 5.x REST API + Django Channels WebSocket
  - `frontend/` — Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL
- **Real-time**: Django Channels + Redis (WebSocket chat)
- **File storage**: Local filesystem (Django media/)
- **AI**: not built yet (Phase 5). No AI app, pages or SDKs exist; add them when the phase is scheduled
- **Auth**: JWT via djangorestframework-simplejwt

## User Roles
- **Admin** — Agency staff. Manages teachers, students, pairings and the shared library. Full platform oversight.
- **Teacher** — Creates lessons, uploads resources, chats with students.
- **Student** — Views scheduled lessons and resources, accesses general library, chats with teacher.

## Backend Conventions (`backend/`)

### Django Project Structure
- Config directory: `setup/` (not the default project name)
- All models inherit from `setup.base_model.BaseModel` (UUID pk, `is_active`, `created_at`, `updated_at`)
- Each app has: `models/`, `serializers/`, `views/` as directories (not single files)
- Permissions in each app's `permissions.py`
- API versioned at `/api/v1/`

### Django Apps
| App | Purpose |
|-----|---------|
| `users` | CustomUser (email-based auth), TeacherProfile, StudentProfile, auth views |
| `pairings` | TeacherStudentPairing management |
| `lessons` | Lesson plans + LessonTopic |
| `resources` | File uploads (private + general library) |
| `enquiries` | Public website submissions (contact enquiries, tutor applications); reviewed in Django admin |
| `subjects` | Curated Subject list used by pairings, resources and profiles |
| `chat` | Real-time WebSocket chat (Django Channels) |

### Key Patterns
- Email-based authentication (USERNAME_FIELD = "email")
- Single `role` CharField on CustomUser (not boolean flags)
- Pairing is the central relationship — lessons, resources, conversations hang off it
- Resource visibility: `private` (student-specific) or `library` (all students)
- Conversation auto-created when pairing is created
- History is never deleted: users are deactivated (`users.services.deactivate_user`, which also pauses their pairings), pairings are ended, subjects are retired (`is_active=False`); FKs onto users/pairings/subjects use `PROTECT`
- Subjects are exchanged over the API by name (`SubjectNameField`), validated against active `Subject` rows
- Lesson status changes are limited by `LESSON_STATUS_TRANSITIONS` (completed is final); chat on an ended pairing is read-only
- Students never see draft lessons (`Lesson.objects.for_user`); a teacher publishes a lesson by scheduling it
- Admin-set passwords go through Django's `AUTH_PASSWORD_VALIDATORS`, like user-chosen ones

### Running Backend
```bash
cd backend
python manage.py runserver          # Dev server on :8000
python manage.py migrate            # Run migrations
python manage.py createsuperuser    # Create admin user
daphne -b 0.0.0.0 -p 8000 setup.asgi:application  # ASGI server (for WebSocket)
```

## Frontend Conventions (`frontend/`)

### Next.js Structure
- App Router with route groups: `(auth)/` (public) and `(dashboard)/` (protected)
- Role-based sub-routes: `admin/`, `teacher/`, `student/`
- `middleware.ts` handles JWT verification + role-based route protection
- Components organized by domain: `components/auth/`, `components/admin/`, etc.

### UI Conventions
- Use shadcn/ui components — install via `npx shadcn@latest add <component>`
- Style: "new-york", base color: "zinc"
- Icons: lucide-react
- Forms: react-hook-form + zod validation
- Tables: @tanstack/react-table + shadcn data-table pattern
- Toasts: sonner
- Dates: date-fns
- File upload: react-dropzone

### API Client Pattern
- All API calls in `lib/api/` modules (auth.ts, users.ts, pairings.ts, etc.)
- JWT tokens stored in localStorage; cookies hold only session expiry + role for `middleware.ts` route gating
- Access tokens last 30 min; `lib/api/client.ts` refreshes them (single-flight, and on 401). Refresh tokens rotate and are blacklisted on logout/password change
- Base URL from `NEXT_PUBLIC_API_URL` env var

### Data Fetching & State
- Server data goes through React Query (`@tanstack/react-query`); keys live in `lib/query-keys.ts`, grouped so a prefix (e.g. `queryKeys.pairings.all`) invalidates a whole family. After a mutation, invalidate rather than hand-editing local lists
- Lists are paginated, searched and filtered server-side (DRF `page`, `search`, filter params) with `PaginationControls` and `useDebouncedValue`; never filter or count only the first page client-side
- Render `ErrorState` (or `DetailPageError`, which distinguishes 404) for failed queries; don't swallow errors with `.catch(() => {})`. Use `getErrorMessage` from `lib/api/errors.ts` for toasts
- The signed-in user comes from `useAuth()` (one `AuthProvider` in `components/providers.tsx`)
- Shared UI: `PairingStatusBadge` / `LessonStatusBadge`, `UserDirectory`, `LessonList`, `ResourceBrowser`; date helpers (`formatDate`, `formatLongDate`, `formatTime`) in `lib/utils.ts` use date-fns

### Running Frontend
```bash
cd frontend
npm run dev     # Dev server on :3000
npm run build   # Production build
npm run lint    # ESLint
```

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
USE_POSTGRES=True  # SQLite (backend/db.sqlite3) when False
DB_NAME=inspired_minds DB_USER=postgres DB_PASSWORD=postgres DB_HOST=localhost DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001  # LMS frontend + marketing website
REDIS_URL=redis://localhost:6379/0
PRIVATE_MEDIA_ROOT=  # optional; resource uploads, never web-served (default backend/private_media)
ENQUIRY_THROTTLE_RATE=10/hour  # optional; public website form rate limit per IP
LOGIN_THROTTLE_RATE=10/minute  # optional; per IP
PASSWORD_RESET_THROTTLE_RATE=5/hour  # optional; per IP
FRONTEND_URL=http://localhost:3000  # LMS frontend, used in password reset links
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend  # smtp.EmailBackend in production
EMAIL_HOST= EMAIL_PORT=587 EMAIL_HOST_USER= EMAIL_HOST_PASSWORD= EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=Inspired Minds <no-reply@your-domain>  # sender for password reset emails
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### Website (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1  # contact + tutor application forms post here
```

## Implementation Phases
1. Foundation (Auth + scaffolding)
2. User Management + Pairings
3. Lesson Planning + Resources
4. Real-time Chat
5. AI Integration (not started; placeholder pages and SDKs were removed until it is scheduled)
6. Polish + Deployment

## Git Workflow
- `main` branch for stable releases
- Feature branches: `feature/<phase>-<description>` (e.g., `feature/phase1-auth`)
- Commit messages: conventional commits style

## Testing
- Backend: `python manage.py test`
- Frontend: Component tests with testing-library (to be set up)
