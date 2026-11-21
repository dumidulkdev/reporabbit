"""Alerts routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import auth
from app.database import get_db
from app.models import Alert, Repository, User
from app.schemas import AlertOut

router = APIRouter(prefix="/alerts", tags=["alerts"])


def _alert_out(alert: Alert, db: Session) -> AlertOut:
    out = AlertOut.model_validate(alert)
    if alert.repo_id:
        repo = db.query(Repository).filter(Repository.id == alert.repo_id).first()
        out.repo_full_name = repo.full_name if repo else None
    return out


@router.get("", response_model=list[AlertOut])
def list_alerts(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user),
):
    query = db.query(Alert).order_by(Alert.created_at.desc())
    if unread_only:
        query = query.filter(Alert.is_read == False)  # noqa: E712
    return [_alert_out(a, db) for a in query.all()]


@router.post("/read-all")
def read_all(db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    updated = db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})  # noqa: E712
    db.commit()
    return {"marked_read": updated}


@router.post("/{alert_id}/read", response_model=AlertOut)
def read_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return _alert_out(alert, db)
