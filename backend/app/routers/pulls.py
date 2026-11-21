"""Pull request explorer routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, or_
from sqlalchemy.orm import Session

from app import auth
from app.database import get_db
from app.models import PullRequest, Repository, User
from app.schemas import PullRequestListOut, PullRequestOut

router = APIRouter(prefix="/pulls", tags=["pulls"])


def _pr_out(pr: PullRequest, db: Session) -> PullRequestOut:
    out = PullRequestOut.model_validate(pr)
    repo = db.query(Repository).filter(Repository.id == pr.repo_id).first()
    out.repo_full_name = repo.full_name if repo else None
    return out


@router.get("", response_model=PullRequestListOut)
def list_pulls(
    q: str | None = Query(default=None, description="Search title/author"),
    author: str | None = None,
    label: str | None = None,
    status: str | None = Query(default=None, pattern="^(open|needs_review|stale|merged)$"),
    stale_only: bool = False,
    sort: str = Query(default="newest", pattern="^(newest|longest_waiting|most_changed)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    query = db.query(PullRequest)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(PullRequest.title.ilike(like), PullRequest.author.ilike(like)))
    if author:
        query = query.filter(PullRequest.author == author)
    if label:
        # labels stored as JSON list; filter in Python-friendly way via LIKE
        query = query.filter(PullRequest.labels.cast(String).like(f'%"{label}"%'))
    if status:
        query = query.filter(PullRequest.status == status)
    if stale_only:
        query = query.filter(PullRequest.status == "stale")

    total = query.count()
    if sort == "newest":
        query = query.order_by(PullRequest.created_at.desc())
    elif sort == "longest_waiting":
        query = query.order_by(PullRequest.created_at.asc())
    elif sort == "most_changed":
        query = query.order_by((PullRequest.additions + PullRequest.deletions).desc())

    prs = query.offset((page - 1) * page_size).limit(page_size).all()
    return PullRequestListOut(
        items=[_pr_out(p, db) for p in prs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{pr_id}", response_model=PullRequestOut)
def get_pull(pr_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    pr = db.query(PullRequest).filter(PullRequest.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Pull request not found")
    return _pr_out(pr, db)
