# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a **full-stack car dealership marketplace** ("NOVA Motors") with two separate apps that run concurrently:

- **Frontend** — Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion. Runs on port 3000.
- **Backend** — FastAPI (async), SQLAlchemy 2.0 (async ORM), Alembic migrations, PostgreSQL (Neon hosted). Runs on port 8000.

The frontend calls the backend exclusively via `lib/api.ts`, which wraps `fetch` and injects auth/admin headers. The backend base URL defaults to `http://localhost:8000` and is overridden by `NEXT_PUBLIC_API_URL`.

---

## Running the Project

### Frontend
```bash
# From repo root
npm run dev          # dev server on :3000
npm run build        # production build
npm run lint         # ESLint
npm run clean:cache  # delete .next cache
```

### Backend
```bash
# From backend/
.\venv\Scripts\Activate.ps1   # Windows — activate venv
uvicorn app.main:app --reload  # dev server on :8000
```

API docs live at `http://localhost:8000/docs` (Swagger) and `/redoc`.

### Database Migrations
```bash
# From backend/
alembic upgrade head                       # apply all migrations
alembic revision --autogenerate -m "desc"  # generate new migration
alembic downgrade -1                       # roll back one step
```

### Seeding
```bash
# From backend/
python seed.py   # creates admin user and sample vehicles
```

### Tests
```bash
# From backend/ — requires a local postgres DB named marketplace_test
pytest                          # run all tests
pytest tests/test_auth.py       # run a single file
pytest -k "test_login"          # run a single test by name
```
Tests use an in-memory ASGI client (httpx + ASGITransport) and a dedicated `marketplace_test` database that is created/dropped per session in `tests/conftest.py`.

---

## Backend Structure

```
backend/
  app/
    main.py              # FastAPI app, router registration, CORS, static mounts
    config/settings.py   # pydantic-settings; all env vars loaded here via get_settings()
    db/
      base.py            # DeclarativeBase + TimestampMixin + UUIDMixin
      session.py         # async + sync engines, AsyncSessionLocal, get_db() dependency
    models/              # SQLAlchemy ORM models (one per domain)
    schemas/             # Pydantic in/out schemas
    routes/              # FastAPI routers (one per domain), all prefixed /api/...
    services/            # Business logic, called by routes
      marketplaces/      # eBay + Facebook publishers (base.py, ebay.py, facebook.py, mapper.py)
    auth/                # JWT creation/decode, password hashing, get_current_user dependency
    utils/               # Pagination helper, file upload
    middleware/          # Request logging
    uploads/             # Served at /uploads via StaticFiles
  alembic/versions/      # Migration scripts
  tests/
    conftest.py          # Fixtures: DB setup, AsyncClient, user_token
    test_auth.py
```

All routers are registered in `app/main.py`. To add a new router: create `app/routes/yourmodule.py`, import it in `main.py`, and add it to the `for router in [...]` list.

### Settings pattern
All config is in `app/config/settings.py` as a `pydantic-settings` `BaseSettings` subclass. Always call `get_settings()` (LRU-cached) — never read `os.environ` directly.

### Auth
- JWT access + refresh tokens. `get_current_user` and `get_current_admin` are FastAPI `Depends` in `app/auth/dependencies.py`.
- Admin routes use the `x-admin-auth` header sent by the frontend for a simpler admin-password flow (separate from user JWT auth).

### Marketplace publishers
`app/services/marketplaces/` follows a base-class pattern:
- `base.py` — `BaseMarketplacePublisher` ABC + `PublishResult` dataclass
- `ebay.py` — mock mode (default) + production skeleton. Controlled by `EBAY_MOCK_MODE` env var.
- `facebook.py` — generates copy/paste listing text only (no direct-post API exists).
- `mapper.py` — converts Vehicle ORM objects to platform-specific payload dicts.

---

## Frontend Structure

```
app/                    # Next.js App Router pages
  admin/page.tsx        # Full admin dashboard (auth, vehicles, financing, reviews, etc.)
  inventory/page.tsx    # Public vehicle listing
  inventory/[id]/       # Vehicle detail
  car/[id]/             # Alternative vehicle detail route
  reviews/page.tsx
  contact/page.tsx
components/             # Shared React components (Navbar, Footer, LuxuryCarCard, etc.)
lib/
  api.ts                # All backend API calls — single source of truth for HTTP
  types.ts              # All TypeScript types matching backend Pydantic schemas
  auth-context.tsx      # React context for user auth state
  vehicleAdapter.ts     # Shape-normalisation for vehicle data
  data.ts               # Static/seed data used in dev
```

### Frontend ↔ Backend contract
`lib/types.ts` mirrors backend Pydantic schemas exactly. When you add a backend schema field, add it to `lib/types.ts` and update `lib/api.ts` if a new endpoint is involved.

### Admin page
`app/admin/page.tsx` is a large single-file dashboard. It is structured as a set of named sub-components (`AdminSetup`, `AdminLogin`, `VehicleForm`, `VehicleList`, etc.) composed under a main `AdminPage` component. The `AdminSidebar` component drives which view is active. When adding admin features: add a new view identifier to `AdminView` in `components/AdminSidebar.tsx` and a corresponding render block in `AdminPage`.

---

## Key Environment Variables

| Variable | Where | Notes |
|---|---|---|
| `SQL_DATABASE_URL` | backend `.env` | asyncpg connection string |
| `SQL_DATABASE_URL_SYNC` | backend `.env` | psycopg2 (used by Alembic) |
| `SECRET_KEY` | backend `.env` | JWT signing key |
| `OPENAI_API_KEY` | backend `.env` | Used for AI content generation |
| `EBAY_MOCK_MODE` | backend `.env` | `true` = no real eBay API calls |
| `EBAY_CLIENT_ID/SECRET` | backend `.env` | Required only when mock mode is off |
| `NEXT_PUBLIC_API_URL` | frontend `.env.local` | Defaults to `http://localhost:8000` |

All backend vars are declared in `app/config/settings.py` — add new vars there before using them anywhere else.

---

## Database

- Hosted on **Neon** (PostgreSQL). Connection strings are in `alembic.ini` (sync, for migrations) and `.env` (async, for the app).
- The `alembic.ini` `sqlalchemy.url` is the sync URL. The app uses the async URL from `.env`.
- All models inherit `Base`, `UUIDMixin` (UUID pk), and `TimestampMixin` (`created_at`, `updated_at`).
- New models must be imported in `alembic/env.py` target metadata so Alembic can detect them.
