"""SQLAlchemy models for RepoRabbit."""
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    workspaces = relationship("Workspace", back_populates="owner", cascade="all, delete-orphan")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    owner = relationship("User", back_populates="workspaces")
    repositories = relationship("Repository", back_populates="workspace")
    contributors = relationship("Contributor", back_populates="workspace")
    setting = relationship("Setting", back_populates="workspace", uselist=False)


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    owner = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    full_name = Column(String(255), unique=True, index=True, nullable=False)
    visibility = Column(String(20), default="public", nullable=False)
    sync_status = Column(
        String(20), default="never", nullable=False
    )  # never | syncing | synced | failed
    last_synced_at = Column(DateTime, nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="repositories")
    pull_requests = relationship("PullRequest", back_populates="repository", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="repository")


class PullRequest(Base):
    __tablename__ = "pull_requests"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False)
    author = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    url = Column(String(500), nullable=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    labels = Column(JSON, default=list, nullable=False)
    additions = Column(Integer, default=0, nullable=False)
    deletions = Column(Integer, default=0, nullable=False)
    # open | needs_review | stale | merged
    status = Column(String(20), default="open", nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)
    merged_at = Column(DateTime, nullable=True)
    review_time_hours = Column(Float, nullable=True)
    cycle_time_days = Column(Float, nullable=True)

    repository = relationship("Repository", back_populates="pull_requests")
    alerts = relationship("Alert", back_populates="pull_request")


class Contributor(Base):
    __tablename__ = "contributors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    github_username = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    prs_merged = Column(Integer, default=0, nullable=False)
    reviews_given = Column(Integer, default=0, nullable=False)
    avg_review_time_hours = Column(Float, default=0.0, nullable=False)
    additions = Column(Integer, default=0, nullable=False)
    deletions = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="contributors")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    # stale_pr | large_pr | failed_check | failed_sync
    type = Column(String(30), nullable=False)
    message = Column(String(1000), nullable=False)
    repo_id = Column(Integer, ForeignKey("repositories.id"), nullable=True)
    pr_id = Column(Integer, ForeignKey("pull_requests.id"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    repository = relationship("Repository", back_populates="alerts")
    pull_request = relationship("PullRequest", back_populates="alerts")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), unique=True, nullable=True)
    workspace_name = Column(String(255), default="My Workspace", nullable=False)
    sync_interval_minutes = Column(Integer, default=60, nullable=False)
    stale_threshold_days = Column(Integer, default=7, nullable=False)
    digest_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=_utcnow, nullable=False)

    workspace = relationship("Workspace", back_populates="setting")
