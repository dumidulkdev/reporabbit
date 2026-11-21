"""Settings routes (single settings row, created on first use)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import auth
from app.config import settings as app_settings
from app.database import get_db
from app.models import Setting, User
from app.schemas import SettingsOut, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


def _get_or_create(db: Session) -> Setting:
    setting = db.query(Setting).first()
    if setting is None:
        setting = Setting(
            workspace_name="My Workspace",
            sync_interval_minutes=app_settings.sync_interval_minutes,
            stale_threshold_days=app_settings.stale_threshold_days,
            digest_enabled=True,
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    return _get_or_create(db)


@router.put("", response_model=SettingsOut)
def update_settings(
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    setting = _get_or_create(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(setting, field, value)
    db.commit()
    db.refresh(setting)
    return setting
