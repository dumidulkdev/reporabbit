"""Contributors leaderboard route."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import auth
from app.database import get_db
from app.models import Contributor, User
from app.schemas import ContributorOut

router = APIRouter(prefix="/contributors", tags=["contributors"])


@router.get("", response_model=list[ContributorOut])
def list_contributors(
    db: Session = Depends(get_db), current_user: User = Depends(auth.get_current_user)
):
    contributors = (
        db.query(Contributor)
        .order_by(Contributor.prs_merged.desc(), Contributor.reviews_given.desc())
        .all()
    )
    return contributors
