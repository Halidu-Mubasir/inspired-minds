# Deploying Inspired Minds

| Piece | Where | Config |
|---|---|---|
| API, chat WebSockets, Postgres, Redis, uploads | Render | `render.yaml` (Blueprint) |
| LMS (`frontend/`) | Vercel project, root directory `frontend` | env vars below |
| Website (`website/`) | Vercel project `inspired-minds`, root directory `website` | env vars below |

Vercel can't run the API: chat needs long-lived WebSockets, AI tutor replies stream from a
long-running ASGI server, and uploads need a persistent disk.

## 1. Backend on Render

1. Merge the work into `master` (Render deploys `master` on every push).
2. Render dashboard → **New → Blueprint** → connect `Halidu-Mubasir/inspired-minds` → **Apply**.
   It creates `inspired-minds-api` (web, Frankfurt), `inspired-minds-db` (Postgres) and
   `inspired-minds-redis` (Key Value). `SECRET_KEY` is generated for you.
3. When prompted (or later under the service's **Environment**), set:
   - `CORS_ALLOWED_ORIGINS` = `https://<lms>.vercel.app,https://inspired-minds-nine.vercel.app`
   - `FRONTEND_URL` = `https://<lms>.vercel.app` (password reset links)
   - `ANTHROPIC_API_KEY` = your key, or leave empty to keep AI features off
4. When the deploy is live, open `https://<api>.onrender.com/healthz/` — expect `{"status": "ok"}`.
5. Create the first admin: service → **Shell** → `python manage.py createsuperuser`.
   Sign in to the LMS with it, then add teachers and students from the admin pages.

Password reset emails print to the logs until SMTP is configured: set `EMAIL_BACKEND` to
`django.core.mail.backends.smtp.EmailBackend` plus `EMAIL_HOST`, `EMAIL_PORT`,
`EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` and `DEFAULT_FROM_EMAIL`.

## 2. LMS on Vercel

New project from the same repo, **Root Directory** `frontend`, framework Next.js. Environment
variables (Production and Preview), then deploy:

```
NEXT_PUBLIC_API_URL=https://<api>.onrender.com/api/v1
NEXT_PUBLIC_WS_URL=wss://<api>.onrender.com/ws
```

## 3. Website on Vercel

On the existing `inspired-minds` project add, then **redeploy** (`NEXT_PUBLIC_*` values are
baked in at build time):

```
NEXT_PUBLIC_API_URL=https://<api>.onrender.com/api/v1
NEXT_PUBLIC_LMS_URL=https://<lms>.vercel.app
```

## Notes

- The disk pins the API to one instance; migrations run on each start (`docker-entrypoint.sh`).
- Avatars are served by Django (`SERVE_MEDIA`); resource files stay private behind the API.
- Back up Postgres from the Render dashboard. The disk is snapshotted daily by Render.
- Adding a domain later: point `portal.<domain>` at Vercel and `api.<domain>` at Render, add
  `api.<domain>` to `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`, and update the URLs above.
