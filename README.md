# RepoRabbit

GitHub Engineering Analytics — find out what is stuck, and why.

RepoRabbit connects your GitHub repositories, syncs pull requests, and turns
them into the numbers an engineering lead actually checks every morning:
cycle time, review latency, DORA metrics, stale PRs, and who is carrying the
review load. It is a working tool, not a marketing page: dense, scannable,
dark-only, and quiet.

## Who it is for

- **Engineering leads** who want to see bottlenecks across repositories
  without digging through GitHub by hand.
- **Developers** who want to know which of their PRs are stale, blocked, or
  waiting on review — and who can unblock them.
- **Small teams** that want DORA metrics and PR analytics without standing up
  a full observability platform.

## Screenshots

The UI is built and running; the screens below describe what each page
shows. No screenshot image files are shipped in this repository — run the
app locally (see [Setup](#setup)) to see them live.

- **Dashboard** — overview cards for cycle time, review latency, merge rate,
  and open/stale PRs, plus trend charts and a list of PRs that need attention.
- **Pull Requests** — searchable, filterable PR explorer with author, label,
  status and stale filters, sorting, pagination, and per-PR detail.
- **Repositories** — connected repositories with sync status, last sync time,
  and per-repo sync controls.
- **Contributors** — leaderboard of contributors by merged PRs, reviews, and
  cycle time.
- **Alerts** — stale-PR, failed-check, and blocked-PR alerts, with mark-as-read.
- **Settings** — workspace settings: sync interval, stale-PR threshold, and
  GitHub connection details.

## Features

### Backend (FastAPI)

- JWT authentication — register, login, and a current-user endpoint.
- Repository management — connect, list, update, and remove repositories.
- GitHub sync — fetch PRs from the GitHub REST API per repository, plus a
  sync-all endpoint and an APScheduler background job that re-syncs on a
  configurable interval.
- Metrics — cycle time, review latency, merge rate, open/stale PR counts,
  and the four DORA metrics (deployment frequency, lead time for changes,
  change failure rate, time to restore service) over 7d / 30d / 90d windows.
- PR explorer API — search, filter by author/label/status, stale-only flag,
  sorting, and pagination.
- Contributor leaderboard.
- Alerts — stale PRs, failed checks, and blocked PRs, with read/unread state.
- GitHub webhooks — HMAC-SHA256 signature verification
  (`X-Hub-Signature-256`) for `pull_request` and `check_run` events.
- SQLite by default, PostgreSQL via `DATABASE_URL`; Alembic migrations.
- Seeded demo data and demo login on first start.
- 43 pytest tests covering auth, metrics, PR filtering/sorting, webhooks,
  and the repo/alert/settings endpoints.

### Frontend (Astro + React)

- 7 pages: Dashboard, Pull Requests, Repositories, Contributors, Alerts,
  Settings, and Login.
- React islands for the interactive parts (dashboard, PR explorer, repo
  management, alerts, settings) inside fast Astro pages.
- Dark-only, Linear-style UI built from the design system in
  [`docs/DESIGN.md`](docs/DESIGN.md) — near-black canvas, one accent colour,
  Inter Variable type, no gradients.
- API client with token handling in `localStorage`, plus a clearly labelled
  sample-data fallback when the backend is unreachable.
- Toasts for success and error feedback (`react-hot-toast`).
- Icons throughout from `lucide-react`.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Astro 5, React 19, Tailwind CSS v4, TypeScript |
| Frontend UI | `lucide-react` icons, `react-hot-toast` |
| Backend | Python 3.12, FastAPI, Uvicorn |
| ORM / migrations | SQLAlchemy 2, Alembic |
| Auth | JWT (`python-jose`), `passlib` + `bcrypt` |
| GitHub | GitHub REST API via `httpx`, webhooks with HMAC-SHA256 |
| Background jobs | APScheduler |
| Database | SQLite (default) / PostgreSQL 16 (Docker) |
| Tests | pytest (backend) |
| Containers | Docker, Docker Compose |

## Architecture

```text
                    +------------------+
                    |  Astro frontend  |  React islands, Tailwind
                    |  (port 4321)     |
                    +--------+---------+
                             |  REST / JSON, Bearer <redacted>
                             v
                    +------------------+
                    |  FastAPI backend |  /api/* routes, JWT auth
                    |  (port 8000)     |  APScheduler background sync
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
   +------------------+            +------------------+
   |  SQLAlchemy ORM  |            |  GitHub REST API |
   |  SQLite (dev) /  |            |  + webhooks      |
   |  PostgreSQL (Docker)           |  (PRs, checks)   |
   +------------------+            +------------------+
```

- The frontend talks only to the FastAPI backend over `/api`.
- The backend is the only component that talks to GitHub: outbound REST
  calls during sync, inbound webhook POSTs for live updates.
- The scheduled sync job refreshes previously synced repositories every
  `SYNC_INTERVAL_MINUTES` (default 60); a full fetch per repo runs on demand
  via `POST /api/repos/{id}/sync`.

## Setup

### Prerequisites

- Python 3.12
- Node.js 24 (and npm)
- Docker and Docker Compose (only for the containerised setup)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set SECRET_KEY at minimum
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

On first start the database is created and demo data is seeded. Demo login:

- Email: `demo@reporabbit.dev`
- Password: `demo1234`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env        # PUBLIC_API_URL=http://localhost:8000
npm run dev                 # http://localhost:4321
```

Production build:

```bash
npm run build
npm run preview
```

### Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./reporabbit.db` | Database URL. Use `postgresql://user:pass@host:5432/db` for PostgreSQL. |
| `SECRET_KEY` | `change-me-in-production` | JWT signing key. Set a long random value. |
| `GITHUB_TOKEN` | _(empty)_ | Optional. A personal access token raises the GitHub API rate limit for syncs. Without one, syncs use the unauthenticated rate limit. |
| `GITHUB_WEBHOOK_SECRET` | _(empty)_ | Secret used to verify GitHub webhook signatures. Required for webhooks to be accepted. |
| `SYNC_INTERVAL_MINUTES` | `60` | Background sync cadence in minutes. |
| `STALE_THRESHOLD_DAYS` | `7` | A PR open longer than this is flagged stale. |
| `PUBLIC_API_URL` | `http://localhost:8000` | Frontend: base URL of the FastAPI backend. |

### Docker

```bash
docker compose up --build
```

This starts three services:

- `db` — PostgreSQL 16 (port 5432, data in a named volume).
- `api` — FastAPI backend (port 8000), connected to `db` via `DATABASE_URL`.
- `web` — Astro frontend (port 4321), built with `PUBLIC_API_URL`
  pointing at the API.

Open http://localhost:4321 and log in with the demo account
(`demo@reporabbit.dev` / `demo1234`).

## API overview

All routes except `/health` and the webhook require a `Bearer <redacted>` header.
Full interactive docs are at `/docs` when the backend is running.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` (also `/api/health`) | Liveness check |
| POST | `/api/auth/register` | Register a user, returns JWT |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/repos` | List connected repositories |
| POST | `/api/repos` | Connect a repository |
| GET | `/api/repos/{id}` | Repository detail |
| PATCH | `/api/repos/{id}` | Update a repository |
| DELETE | `/api/repos/{id}` | Remove a repository |
| POST | `/api/repos/{id}/sync` | Sync one repo from GitHub |
| POST | `/api/repos/sync` | Sync all connected repos |
| GET | `/api/metrics/overview?range=7d\|30d\|90d` | Cycle time, review latency, merge rate, open/stale PRs |
| GET | `/api/metrics/dora?range=7d\|30d\|90d` | DORA: lead time, deployment frequency, change failure rate, time to restore |
| GET | `/api/pulls?q=&author=&label=&status=&stale_only=&sort=&page=&page_size=` | PR explorer |
| GET | `/api/pulls/{id}` | PR detail |
| GET | `/api/contributors` | Contributor leaderboard |
| GET | `/api/alerts?unread_only=true` | Alerts |
| POST | `/api/alerts/read-all` | Mark all alerts read |
| POST | `/api/alerts/{id}/read` | Mark one alert read |
| GET | `/api/settings` | Workspace settings |
| PUT | `/api/settings` | Update workspace settings |
| POST | `/api/webhooks/github` | GitHub webhook (HMAC-SHA256 verified) |

### Metrics formulas

The `range` window selects PRs created in the last N days. Cycle time and
review latency average over PRs merged in that window. DORA lead time is
the same cycle-time average; deployment frequency is merges per week;
change failure rate is failed-check alerts divided by merges; time to
restore is the average gap between a failed-check alert and the next
merged PR in the same repo. See the module docstring in
`backend/app/metrics.py` for the exact definitions.

## Testing

```bash
cd backend
python -m pytest -q        # 43 tests, temp SQLite database
```

Tests cover auth (register/login/me, invalid credentials), metrics
calculations, PR filtering/sorting/pagination, webhook signature
verification, and the repo/alert/settings endpoints. They use a temporary
SQLite database, so they never touch the dev database.

## GitHub sync and webhooks

### Sync

Connect a repo from the Repositories page (or `POST /api/repos`), then sync
it from the UI or with `POST /api/repos/{id}/sync`. Without a
`GITHUB_TOKEN` the GitHub REST API allows 60 requests per hour per IP,
which is enough for a handful of small repos; add a token for anything
bigger. If GitHub is unreachable, sync falls back to a local refresh so
the UI keeps working.

### Webhooks

To get live updates instead of waiting for the next sync:

1. Set `GITHUB_WEBHOOK_SECRET` in the backend environment (same value in
   both places).
2. In the repository on GitHub: Settings → Webhooks → Add webhook.
3. Payload URL: `https://<your-host>/api/webhooks/github`, content type
   `application/json`, secret: the same value as above.
4. Select the `pull_request` and `check_run` events.

Incoming payloads are verified with HMAC-SHA256 against
`X-Hub-Signature-256`; requests with a missing or invalid signature are
rejected with 401.

## Project structure

```text
reporabbit/
├── README.md                 # this file
├── DESIGN.md                 # UI design contract (copy of docs/DESIGN.md)
├── docker-compose.yml        # db (Postgres) + api + web
├── .gitignore
├── docs/
│   └── DESIGN.md             # UI design system and screen specs
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/              # migrations (initial schema)
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint, scheduler, lifespan
│   │   ├── config.py         # settings from environment variables
│   │   ├── database.py       # SQLAlchemy engine and session
│   │   ├── models.py         # User, Repository, PullRequest, Alert, ...
│   │   ├── schemas.py        # Pydantic request/response models
│   │   ├── auth.py           # password hashing, JWT creation/verification
│   │   ├── github_client.py  # GitHub REST API client
│   │   ├── metrics.py        # overview + DORA calculations
│   │   ├── seed.py           # demo data + demo user
│   │   └── routers/
│   │       ├── auth.py repos.py pulls.py metrics.py
│   │       ├── contributors.py alerts.py settings.py webhooks.py
│   └── tests/                # pytest: auth, metrics, pulls, webhooks, api
└── frontend/
    ├── Dockerfile
    ├── astro.config.mjs
    ├── package.json
    └── src/
        ├── pages/            # index, pulls, repos, contributors, alerts,
        │                     # settings, login
        ├── components/       # DashboardApp, PullsExplorer, ReposApp,
        │                     # ContributorsApp, AlertsApp, SettingsApp,
        │                     # LoginForm, Sidebar, TopBar, charts, bits
        ├── lib/              # api.ts (API client), store.ts, sample.ts
        └── styles/global.css
```

## Roadmap and limitations

- **Sample-data fallback** — when the backend is unreachable, the frontend
  shows clearly labelled sample data so the UI can still be explored. It is
  a fallback, not real data: check for the sample-data notice before
  trusting any number.
- **GitHub rate limits** — without a `GITHUB_TOKEN`, syncs are limited to
  60 GitHub API requests per hour. Large organisations will need a token.
- **Dark-only UI** — there is no light theme; the design system is built
  for dark mode only.
- **Single workspace** — settings are workspace-wide; there is no
  multi-organisation support yet.
- **Background sync is a refresh** — the scheduled job refreshes sync
  timestamps and retries previously failing repos; a full per-repo fetch
  runs on demand via the sync endpoints.

Planned next steps: per-repo DORA breakdowns, review-assignment
suggestions from the contributor data, Slack/email alert delivery, and a
light theme.

## License

MIT — see `LICENSE` if present in a future release. This repository
currently ships without a license file; all rights reserved by default
until one is added.
