# Car Marketplace — FastAPI Backend

RESTful API for the car dealership marketplace. Built with FastAPI, SQLAlchemy (async), PostgreSQL, and JWT authentication.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | FastAPI 0.111 |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Database | PostgreSQL 16 |
| Validation | Pydantic v2 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Async driver | asyncpg |
| File uploads | aiofiles + Pillow |
| Containerization | Docker + Docker Compose |

---

## Quick Start (Docker)

```bash
cd backend
cp .env.example .env          # edit DB credentials if needed
docker compose up -d          # starts postgres + api
docker compose exec api python seed.py   # seed admin + sample vehicles
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs  
ReDoc: http://localhost:8000/redoc

---

## Quick Start (Local)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env          # set your DATABASE_URL

# Run migrations
alembic upgrade head

# Seed
python seed.py

# Start
uvicorn app.main:app --reload
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | Async PostgreSQL URL (`postgresql+asyncpg://...`) |
| `DATABASE_URL_SYNC` | — | Sync URL for Alembic (`postgresql+psycopg2://...`) |
| `SECRET_KEY` | — | JWT signing secret (min 32 chars) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token TTL |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `UPLOAD_DIR` | `app/uploads` | Local upload directory |
| `MAX_UPLOAD_SIZE_MB` | `10` | Max image size |
| `ADMIN_EMAIL` | — | Seed admin email |
| `ADMIN_PASSWORD` | — | Seed admin password |

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register customer |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Current user |

### Vehicles (public)
| Method | Path | Description |
|---|---|---|
| GET | `/api/vehicles` | List with filters + pagination |
| GET | `/api/vehicles/featured` | Featured vehicles |
| GET | `/api/vehicles/{id}` | Vehicle detail |

### Customer Routes (JWT required)
| Method | Path | Description |
|---|---|---|
| GET/PATCH | `/api/users/me` | Profile |
| POST | `/api/users/me/change-password` | Change password |
| POST | `/api/financing` | Apply for financing |
| GET | `/api/financing/my` | My financing requests |
| POST | `/api/tradein` | Submit trade-in |
| GET | `/api/tradein/my` | My trade-ins |
| POST | `/api/appointments` | Book service appointment |
| GET | `/api/appointments/my` | My appointments |
| DELETE | `/api/appointments/{id}` | Cancel appointment |
| POST | `/api/reviews` | Submit review |
| GET | `/api/reviews` | List approved reviews |

### Admin Routes (admin JWT required)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Stats overview |
| POST/PUT/DELETE | `/api/admin/vehicles` | Vehicle CRUD |
| POST | `/api/admin/vehicles/{id}/images` | Upload image |
| DELETE | `/api/admin/vehicles/{id}/images` | Remove image |
| GET/PATCH | `/api/admin/users/{id}` | User management |
| GET/PATCH | `/api/admin/financing/{id}` | Financing management |
| GET/PATCH | `/api/admin/tradein/{id}` | Trade-in management |
| GET/PATCH | `/api/admin/appointments/{id}` | Appointment management |
| GET/PATCH/DELETE | `/api/admin/reviews/{id}` | Review moderation |

---

## Migrations

```bash
# Generate after model changes
alembic revision --autogenerate -m "describe change"

# Apply
alembic upgrade head

# Rollback one
alembic downgrade -1
```

---

## Tests

```bash
# Requires a running postgres instance (marketplace_test db)
pytest tests/ -v
```

---

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app, middleware, router registration
│   ├── config/           # Settings (pydantic-settings + .env)
│   ├── db/               # Base declarative, async engine, session
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic v2 request/response schemas
│   ├── routes/           # FastAPI routers
│   ├── services/         # Business logic / DB queries
│   ├── auth/             # JWT, bcrypt, dependencies
│   ├── middleware/       # Request logging
│   ├── utils/            # Pagination, file upload
│   └── uploads/          # Served at /uploads/*
├── alembic/              # Migration scripts
├── tests/                # pytest-asyncio test suite
├── seed.py               # Admin + sample vehicle seeder
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## Default Admin Credentials (seed)

```
Email:    admin@marketplace.com
Password: Admin123!
```

Change these in `.env` before deploying.
