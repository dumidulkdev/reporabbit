"""Pydantic request/response schemas."""
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# --- Auth ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Workspace ---
class WorkspaceOut(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Repositories ---
class RepositoryCreate(BaseModel):
    owner: str = Field(min_length=1, max_length=255)
    name: str = Field(min_length=1, max_length=255)
    visibility: str = Field(default="public", pattern="^(public|private)$")


class RepositoryUpdate(BaseModel):
    visibility: str | None = Field(default=None, pattern="^(public|private)$")
    sync_status: str | None = Field(
        default=None, pattern="^(never|syncing|synced|failed)$"
    )


class RepositoryOut(BaseModel):
    id: int
    owner: str
    name: str
    full_name: str
    visibility: str
    sync_status: str
    last_synced_at: datetime | None
    workspace_id: int | None
    created_at: datetime
    open_prs: int = 0
    merged_prs: int = 0

    model_config = {"from_attributes": True}


# --- Pull requests ---
class PullRequestOut(BaseModel):
    id: int
    number: int
    title: str
    author: str
    body: str | None
    url: str | None
    repo_id: int
    repo_full_name: str | None = None
    labels: list[str] = []
    additions: int
    deletions: int
    status: str
    created_at: datetime
    merged_at: datetime | None
    review_time_hours: float | None
    cycle_time_days: float | None

    model_config = {"from_attributes": True}


class PullRequestListOut(BaseModel):
    items: list[PullRequestOut]
    total: int
    page: int
    page_size: int


# --- Contributors ---
class ContributorOut(BaseModel):
    id: int
    name: str
    github_username: str
    avatar_url: str | None
    prs_merged: int
    reviews_given: int
    avg_review_time_hours: float
    additions: int
    deletions: int

    model_config = {"from_attributes": True}


# --- Alerts ---
class AlertOut(BaseModel):
    id: int
    type: str
    message: str
    repo_id: int | None
    pr_id: int | None
    repo_full_name: str | None = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Settings ---
class SettingsUpdate(BaseModel):
    workspace_name: str | None = Field(default=None, min_length=1, max_length=255)
    sync_interval_minutes: int | None = Field(default=None, ge=5, le=1440)
    stale_threshold_days: int | None = Field(default=None, ge=1, le=90)
    digest_enabled: bool | None = None


class SettingsOut(BaseModel):
    id: int
    workspace_id: int | None
    workspace_name: str
    sync_interval_minutes: int
    stale_threshold_days: int
    digest_enabled: bool

    model_config = {"from_attributes": True}


# --- Metrics ---
class OverviewOut(BaseModel):
    range: str
    cycle_time_days: float | None
    review_latency_hours: float | None
    merge_rate: float  # percent 0-100
    open_prs: int
    stale_prs: int
    total_prs: int
    merged_prs: int
    cycle_time_trend: list[dict]


class DoraOut(BaseModel):
    range: str
    lead_time_days: float | None
    deployment_frequency_per_week: float
    change_failure_rate: float  # percent 0-100
    time_to_restore_hours: float | None
