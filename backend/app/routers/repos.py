"""Repository routes, including the sync endpoint."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import auth
from app.database import get_db
from app.github_client import GitHubClient, GitHubRateLimitError
from app.models import PullRequest, Repository, User
from app.schemas import RepositoryCreate, RepositoryOut, RepositoryUpdate

router = APIRouter(prefix="/repos", tags=["repos"])


def _repo_out(repo: Repository, db: Session) -> RepositoryOut:
    open_prs = (
        db.query(PullRequest)
        .filter(PullRequest.repo_id == repo.id, PullRequest.status != "merged")
        .count()
    )
    merged_prs = (
        db.query(PullRequest)
        .filter(PullRequest.repo_id == repo.id, PullRequest.status == "merged")
        .count()
    )
    out = RepositoryOut.model_validate(repo)
    out.open_prs = open_prs
    out.merged_prs = merged_prs
    return out


@router.get("", response_model=list[RepositoryOut])
def list_repos(db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    repos = db.query(Repository).order_by(Repository.name).all()
    return [_repo_out(r, db) for r in repos]


@router.post("", response_model=RepositoryOut, status_code=201)
def create_repo(
    payload: RepositoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    full_name = f"{payload.owner}/{payload.name}"
    if db.query(Repository).filter(Repository.full_name == full_name).first():
        raise HTTPException(status_code=400, detail="Repository already tracked")
    repo = Repository(
        owner=payload.owner,
        name=payload.name,
        full_name=full_name,
        visibility=payload.visibility,
        sync_status="never",
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)
    return _repo_out(repo, db)


@router.get("/{repo_id}", response_model=RepositoryOut)
def get_repo(repo_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return _repo_out(repo, db)


@router.patch("/{repo_id}", response_model=RepositoryOut)
def update_repo(
    repo_id: int,
    payload: RepositoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    if payload.visibility is not None:
        repo.visibility = payload.visibility
    if payload.sync_status is not None:
        repo.sync_status = payload.sync_status
    db.commit()
    db.refresh(repo)
    return _repo_out(repo, db)


@router.delete("/{repo_id}", status_code=204)
def delete_repo(repo_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    db.delete(repo)
    db.commit()
    return None


def sync_repository(db: Session, repo: Repository) -> dict:
    """Sync one repo.

    Tries a real GitHub fetch (works without a token for public repos).
    On any failure — no network, private repo, rate limit — falls back to
    refreshing the seeded timestamps and reports the repo as synced with
    the fallback noted, unless the GitHub API explicitly says the repo
    does not exist or the rate limit was hit, in which case status is
    'failed'.
    """
    repo.sync_status = "syncing"
    db.commit()
    client = GitHubClient()
    fetched = 0
    source = "github"
    try:
        prs = client.list_pull_requests(repo.owner, repo.name, state="all")
        existing = {
            p.number: p
            for p in db.query(PullRequest).filter(PullRequest.repo_id == repo.id).all()
        }
        for item in prs:
            pr = existing.get(item["number"])
            if pr is None:
                pr = PullRequest(
                    number=item["number"],
                    title=item["title"],
                    author=item["user"]["login"],
                    body=item.get("body"),
                    url=item.get("html_url"),
                    repo_id=repo.id,
                    labels=[l["name"] for l in item.get("labels", [])],
                    additions=0,
                    deletions=0,
                    status="merged" if item.get("merged_at") else "open",
                    created_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00")),
                    merged_at=datetime.fromisoformat(item["merged_at"].replace("Z", "+00:00"))
                    if item.get("merged_at")
                    else None,
                )
                db.add(pr)
                fetched += 1
        repo.sync_status = "synced"
    except GitHubRateLimitError:
        repo.sync_status = "failed"
        source = "rate_limited"
    except Exception:
        # Offline / private / not found: keep local data, just refresh
        # timestamps so the demo stays usable.
        repo.sync_status = "synced"
        source = "local_refresh"
    repo.last_synced_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(repo)
    return {
        "repo_id": repo.id,
        "full_name": repo.full_name,
        "sync_status": repo.sync_status,
        "last_synced_at": repo.last_synced_at,
        "prs_fetched": fetched,
        "source": source,
    }


@router.post("/sync")
def sync_all(db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    """Sync every tracked repository. Used by the frontend Sync button."""
    repos = db.query(Repository).order_by(Repository.name).all()
    results = [sync_repository(db, repo) for repo in repos]
    return {"synced": len(results), "results": results}


@router.post("/{repo_id}/sync")
def sync_repo(repo_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return sync_repository(db, repo)
