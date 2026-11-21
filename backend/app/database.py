"""SQLAlchemy engine / session setup.

SQLite is the default (DATABASE_URL env var). PostgreSQL works by pointing
DATABASE_URL at a postgres DSN, e.g.
    DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/reporabbit
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

connect_args = {}
if settings.database_url.startswith("sqlite"):
    # SQLite needs check_same_thread=False for use with FastAPI threads.
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
