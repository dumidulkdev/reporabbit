"""Metrics computed from real database data.

Window semantics: `range` selects PRs created within the last N days
(7d / 30d / 90d). Cycle time and review latency are averaged over PRs
merged inside that window; merge rate is merged / total PRs created in
the window. Because the window changes which PRs are included, the
numbers change with the range.

DORA formulas (documented here so the frontend can explain them):
- Lead time for changes: average days from PR creation to merge, for PRs
  merged in the window.
- Deployment frequency: merges in the window / (window_days / 7),
  i.e. merges per week.
- Change failure rate: failed-check alerts in the window / merges in the
  window, as a percentage. A failed check on a merged PR's repo is taken
  as a proxy for a change that broke something after merge.
- Time to restore: average hours between a failed-check alert and the
  next merged PR in the same repo after that alert (the merge that fixed
  it). Returns None when no failure/restore pair exists in the window.
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Alert, PullRequest, Repository

RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90}


def _repo_ids(db: Session, repo: str | None) -> list[int] | None:
    """Resolve a repo filter (short name or owner/name) to repository ids.

    Returns None when no filter was given (all repos), and an empty list
    when the filter matches nothing.
    """
    if not repo:
        return None
    rows = (
        db.query(Repository.id)
        .filter((Repository.name == repo) | (Repository.full_name == repo))
        .all()
    )
    return [r[0] for r in rows]


def parse_range(range_str: str) -> int:
    if range_str not in RANGE_DAYS:
        raise ValueError(f"range must be one of {sorted(RANGE_DAYS)}")
    return RANGE_DAYS[range_str]


def window_start(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


def _avg(values: list[float | None]) -> float | None:
    nums = [v for v in values if v is not None]
    return round(sum(nums) / len(nums), 2) if nums else None


def get_overview(db: Session, range_str: str, repo: str | None = None) -> dict:
    days = parse_range(range_str)
    start = window_start(days)

    query = db.query(PullRequest).filter(PullRequest.created_at >= start)
    repo_ids = _repo_ids(db, repo)
    if repo_ids is not None:
        query = query.filter(PullRequest.repo_id.in_(repo_ids))
    prs = query.all()
    merged = [p for p in prs if p.status == "merged" and p.merged_at is not None]

    cycle_time = _avg([p.cycle_time_days for p in merged])
    review_latency = _avg([p.review_time_hours for p in merged])
    total = len(prs)
    merged_count = len(merged)
    merge_rate = round(merged_count / total * 100, 1) if total else 0.0
    open_prs = sum(1 for p in prs if p.status in ("open", "needs_review"))
    stale_prs = sum(1 for p in prs if p.status == "stale")

    # Daily cycle-time trend: average cycle time of PRs merged each day.
    trend: list[dict] = []
    for i in range(days - 1, -1, -1):
        day = datetime.now(timezone.utc).date() - timedelta(days=i)
        day_merged = [
            p for p in merged if p.merged_at and p.merged_at.date() == day
        ]
        trend.append(
            {
                "date": day.isoformat(),
                "value": _avg([p.cycle_time_days for p in day_merged]),
                "merged": len(day_merged),
            }
        )

    return {
        "range": range_str,
        "cycle_time_days": cycle_time,
        "review_latency_hours": review_latency,
        "merge_rate": merge_rate,
        "open_prs": open_prs,
        "stale_prs": stale_prs,
        "total_prs": total,
        "merged_prs": merged_count,
        "cycle_time_trend": trend,
    }


def get_dora(db: Session, range_str: str, repo: str | None = None) -> dict:
    days = parse_range(range_str)
    start = window_start(days)
    repo_ids = _repo_ids(db, repo)

    merged_query = (
        db.query(PullRequest)
        .filter(PullRequest.status == "merged", PullRequest.merged_at >= start)
    )
    if repo_ids is not None:
        merged_query = merged_query.filter(PullRequest.repo_id.in_(repo_ids))
    merged = merged_query.order_by(PullRequest.merged_at).all()
    merges = len(merged)
    lead_time = _avg([p.cycle_time_days for p in merged])
    weeks = days / 7
    deployment_frequency = round(merges / weeks, 2) if weeks else 0.0

    failures_query = (
        db.query(Alert)
        .filter(Alert.type == "failed_check", Alert.created_at >= start)
    )
    if repo_ids is not None:
        failures_query = failures_query.filter(Alert.repo_id.in_(repo_ids))
    failures = failures_query.count()
    change_failure_rate = round(failures / merges * 100, 1) if merges else 0.0

    # Time to restore: for each failed_check alert, find the next merged PR
    # in the same repo after the alert; the gap is the restore time.
    restore_hours: list[float] = []
    failed_query = (
        db.query(Alert)
        .filter(Alert.type == "failed_check", Alert.created_at >= start)
    )
    if repo_ids is not None:
        failed_query = failed_query.filter(Alert.repo_id.in_(repo_ids))
    failed_alerts = failed_query.all()
    for alert in failed_alerts:
        if alert.repo_id is None:
            continue
        fix = (
            db.query(PullRequest)
            .filter(
                PullRequest.repo_id == alert.repo_id,
                PullRequest.status == "merged",
                PullRequest.merged_at > alert.created_at,
            )
            .order_by(PullRequest.merged_at)
            .first()
        )
        if fix and fix.merged_at:
            gap = (fix.merged_at - alert.created_at).total_seconds() / 3600
            restore_hours.append(round(gap, 2))
    time_to_restore = (
        round(sum(restore_hours) / len(restore_hours), 2) if restore_hours else None
    )

    return {
        "range": range_str,
        "lead_time_days": lead_time,
        "deployment_frequency_per_week": deployment_frequency,
        "change_failure_rate": change_failure_rate,
        "time_to_restore_hours": time_to_restore,
    }
