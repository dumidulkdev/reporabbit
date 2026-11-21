"""Seed realistic demo data. Idempotent: safe to run on every startup —
it only inserts when the database is empty (no users and no repos).
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models import Alert, Contributor, PullRequest, Repository, Setting, User, Workspace

DEMO_EMAIL = "demo@reporabbit.dev"
DEMO_PASSWORD = "demo1234"

NOW = datetime.now(timezone.utc)


def _days_ago(days: float) -> datetime:
    return NOW - timedelta(days=days)


# (title, author, repo, number, days_ago_created, status, cycle_days, review_hours, +add, -del, labels)
PRS = [
    ("Add rate limiting to the GitHub sync worker", "Dumidu Lakshan", "reporabbit", 42, 2, "merged", 1.6, 4.5, 180, 42, ["backend", "performance"]),
    ("Fix stale PR detection threshold in settings", "Anika Perera", "reporabbit", 41, 5, "merged", 1.2, 3.0, 64, 18, ["bugfix"]),
    ("Refactor metrics aggregation queries", "Kavindu Rajapakse", "reporabbit", 44, 9, "needs_review", None, None, 860, 380, ["backend", "refactor"]),
    ("Add DORA metrics panel to dashboard", "Shenali Fernando", "reporabbit", 45, 14, "open", None, None, 320, 12, ["frontend", "metrics"]),
    ("Upgrade Astro to v5 and fix build warnings", "Dumidu Lakshan", "astro-commerce", 18, 20, "merged", 2.1, 6.8, 210, 95, ["frontend", "deps"]),
    ("Add cart persistence with localStorage", "Nethmi Silva", "astro-commerce", 19, 26, "open", None, None, 145, 20, ["frontend"]),
    ("Improve product image loading with lazy sizes", "Anika Perera", "astro-commerce", 17, 33, "stale", None, 8.5, 96, 44, ["frontend", "performance"]),
    ("Add Stripe webhook signature verification", "Kavindu Rajapakse", "fastapi-invoicing", 23, 41, "merged", 1.9, 5.2, 132, 30, ["backend", "security"]),
    ("Fix invoice PDF generation for multi-page totals", "Shenali Fernando", "fastapi-invoicing", 24, 48, "needs_review", None, None, 88, 61, ["bugfix"]),
    ("Add Alembic migration for invoice line items", "Dumidu Lakshan", "fastapi-invoicing", 22, 55, "merged", 1.4, 4.1, 74, 9, ["backend", "database"]),
    ("Add full-text search to notes API", "Nethmi Silva", "notes-api", 9, 63, "stale", None, 11.0, 410, 26, ["backend", "feature"]),
    ("Fix JWT expiry handling on refresh", "Anika Perera", "notes-api", 10, 78, "open", None, None, 52, 14, ["bugfix", "security"]),
]

CONTRIBUTORS = [
    # (name, github_username, prs_merged, reviews_given, avg_review_h, +add, -del)
    ("Dumidu Lakshan", "dumidulkdev", 3, 9, 4.2, 464, 146),
    ("Anika Perera", "anikaperera", 1, 7, 5.8, 212, 76),
    ("Shenali Fernando", "shenalif", 0, 5, 6.1, 408, 73),
    ("Kavindu Rajapakse", "kavindur", 1, 6, 3.9, 992, 410),
    ("Nethmi Silva", "nethmis", 0, 4, 7.4, 555, 46),
]

REPOS = [
    ("dumidulkdev", "reporabbit", "public", "synced", 0.2),
    ("dumidulkdev", "astro-commerce", "public", "synced", 1.5),
    ("dumidulkdev", "fastapi-invoicing", "public", "synced", 3.0),
    ("dumidulkdev", "notes-api", "public", "failed", 26.0),
]


def seed(db: Session) -> dict:
    """Seed demo data if the DB is empty. Returns counts of rows created."""
    if db.query(User).first() is not None or db.query(Repository).first() is not None:
        return {"seeded": False}

    user = User(
        email=DEMO_EMAIL,
        full_name="Dumidu Lakshan",
        hashed_password=hash_password(DEMO_PASSWORD),
    )
    db.add(user)
    db.flush()

    workspace = Workspace(name="Dumidu's Workspace", owner_id=user.id)
    db.add(workspace)
    db.flush()

    repos: dict[str, Repository] = {}
    for owner, name, visibility, sync_status, synced_hours_ago in REPOS:
        repo = Repository(
            owner=owner,
            name=name,
            full_name=f"{owner}/{name}",
            visibility=visibility,
            sync_status=sync_status,
            last_synced_at=_days_ago(synced_hours_ago / 24),
            workspace_id=workspace.id,
        )
        db.add(repo)
        db.flush()
        repos[name] = repo

    pr_by_number: dict[int, PullRequest] = {}
    for title, author, repo_name, number, days_ago, status, cycle_days, review_h, add, dele, labels in PRS:
        created = _days_ago(days_ago)
        merged_at = created + timedelta(days=cycle_days) if cycle_days else None
        pr = PullRequest(
            number=number,
            title=title,
            author=author,
            body=f"Implements: {title}.",
            url=f"https://github.com/dumidulkdev/{repo_name}/pull/{number}",
            repo_id=repos[repo_name].id,
            labels=labels,
            additions=add,
            deletions=dele,
            status=status,
            created_at=created,
            merged_at=merged_at,
            review_time_hours=review_h,
            cycle_time_days=cycle_days,
        )
        db.add(pr)
        db.flush()
        pr_by_number[number] = pr

    for name, username, merged, reviews, avg_h, add, dele in CONTRIBUTORS:
        db.add(Contributor(
            name=name,
            github_username=username,
            avatar_url=f"https://github.com/{username}.png",
            workspace_id=workspace.id,
            prs_merged=merged,
            reviews_given=reviews,
            avg_review_time_hours=avg_h,
            additions=add,
            deletions=dele,
        ))

    invoicing = repos["fastapi-invoicing"]
    notes_api = repos["notes-api"]
    astro = repos["astro-commerce"]
    reporabbit = repos["reporabbit"]
    # The failed-check alert is placed 3.4h before PR #42 merged, so the
    # DORA time-to-restore metric has a real failure/restore pair in every
    # range window (7d / 30d / 90d).
    failed_at = pr_by_number[42].merged_at - timedelta(hours=3.4)
    alerts = [
        ("stale_pr", "PR #17 'Improve product image loading with lazy sizes' has been open for 33 days", astro.id, 17, _days_ago(1)),
        ("large_pr", "PR #44 'Refactor metrics aggregation queries' changes 1,240 lines", reporabbit.id, 44, _days_ago(2)),
        ("failed_check", "CI checks failed on PR #42 'Add rate limiting to the GitHub sync worker'", reporabbit.id, 42, failed_at),
        ("failed_sync", "Sync failed for notes-api: GitHub API rate limit exceeded", notes_api.id, None, _days_ago(1)),
        ("stale_pr", "PR #9 'Add full-text search to notes API' is stale (63 days old)", notes_api.id, 9, _days_ago(3)),
    ]
    for alert_type, message, repo_id, pr_number, created in alerts:
        db.add(Alert(
            type=alert_type,
            message=message,
            repo_id=repo_id,
            pr_id=pr_by_number[pr_number].id if pr_number else None,
            created_at=created,
        ))

    db.add(Setting(
        workspace_id=workspace.id,
        workspace_name="Dumidu's Workspace",
        sync_interval_minutes=60,
        stale_threshold_days=7,
        digest_enabled=True,
    ))
    db.commit()
    return {"seeded": True, "repos": 4, "prs": len(PRS), "contributors": 5, "alerts": 5}
