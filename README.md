# ReneSola Pakistan — Solar PV Website

A B2B marketing and catalogue site for a solar PV manufacturer: product catalogue with
filterable specs, application scenarios, project case studies, a download centre, blog,
lead capture, and a Groq-powered AI product assistant.

```
renesola/
├── backend/          FastAPI + SQLAlchemy + Supabase Postgres
├── frontend/         Next.js 15 (public site + admin panel)
└── REQUIREMENTS.md   Full functional spec
```

---

## Architecture

```
                    ┌──────────────── Supabase ────────────────┐
                    │  Postgres 17  ·  Storage bucket          │
                    └───────┬─────────────────────┬────────────┘
                            │                     │
                  ┌─────────┴─────────┐           │ public image URLs
                  │  FastAPI backend  │           │
                  │  · CMS API        │           │
                  │  · Lead capture   │           │
                  │  · AI search      │───► Groq  │
                  └─────────┬─────────┘           │
                            │ REST                │
                  ┌─────────┴─────────────────────┴────────────┐
                  │  Next.js — public site (4 locales) + admin │
                  └────────────────────────────────────────────┘
```

**Why search works this way.** Retrieval is Postgres full-text search plus `pg_trgm`
trigram similarity, not vector embeddings. Generating embeddings needs a model that does
not fit inside Vercel's 250 MB function limit, and Groq serves LLMs only — no embedding
endpoint. FTS handles a catalogue this size well, costs nothing extra, and deploys
anywhere. Query terms are OR'd rather than AND'd, so a full natural-language question
still matches.

---

## Local setup

### Backend

```bash
cd backend
cp .env.example .env          # fill in Supabase, Groq, and SECRET_KEY
uv sync
uv run alembic upgrade head
uv run python -m app.seed.create_admin you@example.com "YourStrongPassword"
uv run python -m app.seed.run         # optional: load demo catalogue + images
uv run uvicorn app.main:app --reload --port 8000
```

API docs: <http://localhost:8000/docs>

> On Windows, keep the virtualenv **outside** any OneDrive-synced folder — sync locks
> make installs hang. Set `UV_PROJECT_ENVIRONMENT` to a local path.

### Frontend

```bash
cd frontend
cp .env.local.example .env.local      # point NEXT_PUBLIC_API_URL at the backend
npm install
npm run dev
```

Site: <http://localhost:3000> · Admin: <http://localhost:3000/admin>

---

## Deploying to Vercel

Two separate Vercel projects from the same repository.

### 1. Backend

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Framework preset | Other |

Environment variables: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `GROQ_API_KEY`, `GROQ_MODEL`,
`SECRET_KEY`, `ENVIRONMENT=production`, `DEBUG=false`, `BACKEND_CORS_ORIGINS`
(your frontend URL), and the `SMTP_*` / `SALES_EMAIL` / `SERVICE_EMAIL` values.

Use the Supabase **session pooler** connection string — serverless functions open and
drop connections constantly, and the direct connection will exhaust its limit.

### 2. Frontend

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Framework preset | Next.js |

Environment variables: `NEXT_PUBLIC_API_URL` (the deployed backend URL),
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`.

After the frontend is live, set `BACKEND_CORS_ORIGINS` on the backend to that URL and
redeploy.

### Supabase Storage

The bucket must be **public** — the site loads product images directly from it. Uploads
require the `sb_secret_…` key; the publishable key cannot write.

### Things that cost real time on the first deploy

Each of these produced a symptom that pointed somewhere else entirely.

| Symptom | Cause |
|---|---|
| Every path returns `FUNCTION_INVOCATION_FAILED`, builds succeed | The project's Framework Preset was left on Next.js from when it was created against `frontend/`, so `api/*.py` was never built as a Python function. `vercel.json` sets `"framework": null` to override the dashboard. |
| `/api/v1/*` 404 while another function works | The ASGI `app` was assigned inside a `try/except`; the builder only recognises an unconditional module-level assignment. |
| `ModuleNotFoundError: No module named 'asyncpg'` | `DATABASE_URL` carried a driver the app does not ship. Settings now coerce any Postgres URL to `+psycopg`. |
| `database "postgres\n" does not exist` | A trailing newline from pasting into the dashboard. Settings now strip whitespace from every string. |
| Connection succeeds but `relation "products" does not exist` | `DATABASE_URL` pointed at a different Supabase project. Check the pooler host and project ref. |
| AI answers silently fall back to a plain result list | A `GROQ_BASE_URL` in the environment already contained `/openai/v1`, which the SDK appends again. The base URL is normalised and passed explicitly. |

Environment variable edits only take effect on a **new** deployment — saving them and
reloading the old one changes nothing.

---

## What is in the admin panel

`/admin` — hidden from the public nav and excluded from `robots.txt`.

| Screen | What it does |
|---|---|
| Dashboard | Counts, storage backend status, quick actions |
| Products | List, create, edit, delete — specs, features, spec tables, images |
| Blog | List, create, edit, delete — HTML editor with live preview |
| Media | Upload images and PDFs, copy URLs, delete |
| Inquiries | Sales inbox with status pipeline, notes, CSV export |
| Service requests | After-sales fault reports with attached photos |

**Roles:** `admin` (everything), `editor` (content, no deletes or user management),
`sales` (inquiries only).

---

## Content model

Translatable fields are stored as JSONB keyed by locale — `{"en": "…", "ur": "…"}` —
so one row carries every language. Filterable specs (power, efficiency, cell technology)
are real indexed columns; display-only nested content (features, spec tables) is JSONB.

Locales: English, Urdu (RTL), Arabic (RTL), Chinese.

---

## Useful commands

```bash
# Backend
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
uv run python -m app.seed.run --no-images     # reseed text only
curl -X POST localhost:8000/api/v1/search/reindex -H "Authorization: Bearer $TOKEN"

# Frontend
npm run build        # production build
npx tsc --noEmit     # type check
```

---

## Notes on the reference site

The information architecture follows renesola-energy.com, with several deliberate
departures:

- Product URLs live under `/products/…` rather than the reference site's `Customer_case/…`
- Specification tables are real HTML, not images — searchable, translatable, accessible
- Product listings support filtering by power, efficiency, and cell technology
- Scenario pages carry real body copy instead of image galleries alone
- Case studies have detail pages

Seed content and images are pulled from the reference site for development. **Replace
product photography, certificate images, and certificate numbers with your own before
going live** — a customer who verifies a certificate number will find the mismatch.
