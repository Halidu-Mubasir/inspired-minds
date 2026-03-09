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
- **AI**: Abstract provider pattern (pluggable Claude/OpenAI/etc.)
- **Auth**: JWT via djangorestframework-simplejwt

## User Roles
- **Admin** — Agency staff. Manages teachers, students, pairings. Full platform oversight.
- **Teacher** — Creates lessons, uploads resources, chats with students, uses AI tools.
- **Student** — Views lessons/resources, accesses general library, chats with teacher, uses AI chatbot.

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
| `chat` | Real-time WebSocket chat (Django Channels) |
| `ai_services` | AI chatbot + tools (abstract provider pattern) |

### Key Patterns
- Email-based authentication (USERNAME_FIELD = "email")
- Single `role` CharField on CustomUser (not boolean flags)
- Pairing is the central relationship — lessons, resources, conversations hang off it
- Resource visibility: `private` (student-specific) or `library` (all students)
- Conversation auto-created when pairing is created
- AI providers: abstract `BaseChatProvider` ABC with concrete adapters

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
- JWT tokens stored in cookies + localStorage (dual storage)
- Token refresh handled automatically
- Base URL from `NEXT_PUBLIC_API_URL` env var

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
DATABASE_URL=postgres://user:pass@localhost:5432/inspired_minds
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
REDIS_URL=redis://localhost:6379/0
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-20250514
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## Implementation Phases
1. Foundation (Auth + scaffolding)
2. User Management + Pairings
3. Lesson Planning + Resources
4. Real-time Chat
5. AI Integration
6. Polish + Deployment

## Git Workflow
- `main` branch for stable releases
- Feature branches: `feature/<phase>-<description>` (e.g., `feature/phase1-auth`)
- Commit messages: conventional commits style

## Testing
- Backend: `python manage.py test`
- Frontend: Component tests with testing-library (to be set up)
