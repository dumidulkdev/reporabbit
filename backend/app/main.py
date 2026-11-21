"""RepoRabbit API — FastAPI entrypoint.

All feature routes live under /api. /health is available at the root
(and under /api/health) for load balancers and the frontend.
"""
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import alerts, auth, contributors, metrics, pulls, repos, settings as settings_router, webhooks
from app.routers.repos import sync_repository
from app.seed import seed

scheduler = BackgroundScheduler()


def scheduled_sync():
    """Periodic background sync: refresh last_synced_at for synced repos.

    A full GitHub fetch per repo runs on demand via POST /repos/{id}/sync;
    the scheduled job keeps timestamps fresh and marks repos that were
    previously failing for a retry on the next manual sync.
    """
    from app.models import Repository

    db = SessionLocal()
    try:
        repos = (
            db.query(Repository)
            .filter(Repository.sync_status == "synced")
            .all()
        )
        for repo in repos:
            sync_repository(db, repo)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        result = seed(db)
        if result.get("seeded"):
            print(f"Seeded demo data: {result}")
    finally:
        db.close()
    scheduler.add_job(
        scheduled_sync,
        "interval",
        minutes=settings.sync_interval_minutes,
        id="periodic_sync",
        replace_existing=True,
    )
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="RepoRabbit API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(repos.router, prefix="/api")
app.include_router(pulls.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(contributors.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(webhooks.router)


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "reporabbit-api"}
