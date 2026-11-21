# RepoRabbit — Backend

FastAPI backend for RepoRabbit, a GitHub Engineering Analytics platform.
SQLite by default (`DATABASE_URL` env var switches to PostgreSQL).

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set SECRET_KEY at minimum
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Demo login (seeded on first start): `demo@reporabbit.dev` / `demo1234`

## Endpoints

All routes are under `/api` (except `/health`, also mirrored at `/api/health`).

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| POST | `/api/auth/register` | Register user, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user (Bearer token) |
| GET/POST | `/api/repos` | List / connect a repository |
| GET/PATCH/DELETE | `/api/repos/{id}` | Repo detail / update / remove |
| POST | `/api/repos/{id}/sync` | Sync a repo from GitHub (falls back to local refresh offline) |
| GET | `/api/metrics/overview?range=7d\|30d\|90d` | Cycle time, review latency, merge rate, open/stale PRs |
| GET | `/api/metrics/dora?range=7d\|30d\|90d` | DORA: lead time, deployment frequency, change failure rate, time to restore |
| GET | `/api/pulls?q=&author=&label=&status=&stale_only=&sort=&page=&page_size=` | PR explorer |
| GET | `/api/pulls/{id}` | PR detail |
| GET | `/api/contributors` | Contributor leaderboard |
| GET | `/api/alerts` | Alerts (`?unread_only=true`) |
| POST | `/api/alerts/read-all` | Mark all alerts read |
| POST | `/api/alerts/{id}/read` | Mark one alert read |
| GET/PUT | `/api/settings` | Workspace settings |
| POST | `/api/webhooks/github` | GitHub webhook (HMAC-SHA256, `X-Hub-Signature-256`) |

All `/api/*` routes except `/health` and the webhook require a Bearer JWT.

## Metrics formulas

See the module docstring in `app/metrics.py`. In short: the `range`
window selects PRs created in the last N days; cycle time and review
latency average over PRs merged in that window; DORA lead time is the
same cycle-time average, deployment frequency is merges per week,
change failure rate is failed-check alerts / merges, and time to
restore is the average gap between a failed-check alert and the next
merged PR in the same repo.

## Configuration (`.env`)

- `DATABASE_URL` — default `sqlite:///./reporabbit.db`; PostgreSQL example in `.env.example`
- `SECRET_KEY` — JWT signing key
- `GITHUB_TOKEN` — optional, raises the GitHub rate limit for syncs
- `GITHUB_WEBHOOK_SECRET` — required for webhook signature verification
- `SYNC_INTERVAL_MINUTES` — background sync cadence (default 60)
- `STALE_THRESHOLD_DAYS` — stale-PR threshold (default 7)

## Migrations

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Tests

```bash
python -m pytest -q
```

Tests use a temp SQLite database and cover auth, metrics calculations,
PR filtering/sorting, the webhook signature, and the repo/alert/settings
endpoints.

## Project layout

```
app/
  main.py          # FastAPI app, lifespan (seed + scheduler), CORS
  config.py        # pydantic-settings
  database.py      # SQLAlchemy engine/session
  models.py        # User, Workspace, Repository, PullRequest, Contributor, Alert, Setting
  schemas.py       # Pydantic request/response models
  auth.py          # bcrypt hashing + JWT
  github_client.py # GitHub REST client (pagination, rate-limit, TTL cache)
  metrics.py       # Overview + DORA calculations from DB data
  seed.py          # Idempotent demo seed (4 repos, 12 PRs, 5 contributors, 5 alerts)
  routers/         # auth, repos, pulls, metrics, contributors, alerts, settings, webhooks
alembic/           # migrations
tests/             # pytest suite
```
