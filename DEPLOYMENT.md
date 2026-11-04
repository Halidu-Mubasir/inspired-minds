# Deploying Inspired Minds (free tiers)

| Piece | Where | Cost |
|---|---|---|
| API + chat WebSockets | Render free web service (`render.yaml`) | $0 |
| Postgres | Neon free | $0 |
| Uploaded files | Cloudflare R2 (10 GB free) | $0 |
| LMS (`frontend/`) | Vercel project, root directory `frontend` | $0 |
| Website (`website/`) | Vercel project `inspired-minds`, root directory `website` | $0 |

Vercel can't run the API itself: chat needs long-lived WebSockets and AI tutor replies stream
from a long-running ASGI server.

**Trade-off:** the free Render service sleeps after 15 minutes without traffic. The next
visitor waits about a minute while it wakes; open chats reconnect on their own.

## 1. Database — Neon

1. Sign up at neon.tech → **New project**, region **AWS Europe (Frankfurt)**, database
   `inspired_minds`.
2. Copy the **connection string** (it ends in `?sslmode=require`). That is `DATABASE_URL`.

## 2. File storage — Cloudflare R2

1. Cloudflare dashboard → **R2** → enable (asks for a card; usage under 10 GB is free) →
   **Create bucket** `inspired-minds-uploads`. Leave public access **off**.
2. **R2 → Manage API tokens → Create token**, permission *Object Read & Write*, limited to
   that bucket. Note the **Access Key ID**, **Secret Access Key** and the
   **endpoint** `https://<account-id>.r2.cloudflarestorage.com`.

## 3. API — Render

1. Merge the work into `master` (Render deploys `master` on every push).
2. Render → **New → Blueprint** → connect `Halidu-Mubasir/inspired-minds` → fill in:
   - `DATABASE_URL` — from Neon
   - `S3_BUCKET` = `inspired-minds-uploads`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`,
     `S3_SECRET_ACCESS_KEY` — from R2
   - `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL` — leave blank for now (step 5)
   - `ANTHROPIC_API_KEY` — your key, or blank to keep AI features off
   The estimate should read **$0**. Apply.
3. When it's live, `https://<api>.onrender.com/healthz/` returns `{"status": "ok"}`.
4. Create the first admin: service → **Shell** → `python manage.py createsuperuser`.

## 4. LMS — Vercel

New project from the same repo, **Root Directory** `frontend`, framework Next.js, with:

```
NEXT_PUBLIC_API_URL=https://<api>.onrender.com/api/v1
NEXT_PUBLIC_WS_URL=wss://<api>.onrender.com/ws
```

## 5. Connect the pieces

- Render → service → **Environment**:
  - `CORS_ALLOWED_ORIGINS` = `https://<lms>.vercel.app,https://inspired-minds-nine.vercel.app`
  - `FRONTEND_URL` = `https://<lms>.vercel.app` (password reset links)
- Website project on Vercel → add, then **redeploy** (values are baked in at build time):
  ```
  NEXT_PUBLIC_API_URL=https://<api>.onrender.com/api/v1
  NEXT_PUBLIC_LMS_URL=https://<lms>.vercel.app
  ```

## Notes

- Migrations run on every start (`backend/docker-entrypoint.sh`).
- Password reset emails go to the Render logs until SMTP is set: `EMAIL_BACKEND` =
  `django.core.mail.backends.smtp.EmailBackend` plus `EMAIL_HOST`, `EMAIL_PORT`,
  `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`.
- Neon keeps point-in-time history for a short window on the free plan; export a backup
  (`pg_dump "$DATABASE_URL" > backup.sql`) before big changes.
- When there's budget: Render `plan: starter` removes the sleep. With more than one instance,
  add Render Key Value and set `REDIS_URL` (+ `USE_REDIS_CACHE=True`) so chat and rate limits
  are shared.
- Adding a domain later: point `portal.<domain>` at Vercel and `api.<domain>` at Render, add
  `api.<domain>` to `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`, and update the URLs above.
