"""Metrics routes."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import auth, metrics
from app.database import get_db
from app.models import User
from app.schemas import DoraOut, OverviewOut

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/overview", response_model=OverviewOut)
def overview(
    range: str = Query(default="30d", pattern="^(7d|30d|90d)$"),
    repo: str | None = Query(default=None),
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return metrics.get_overview(db, range, repo)


@router.get("/dora", response_model=DoraOut)
def dora(
    range: str = Query(default="30d", pattern="^(7d|30d|90d)$"),
    repo: str | None = Query(default=None),
    current_user: User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    return metrics.get_dora(db, range, repo)
