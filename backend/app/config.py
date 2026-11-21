"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "RepoRabbit"
    database_url: str = "sqlite:///./reporabbit.db"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    github_token: str | None = None
    github_webhook_secret: str | None = None
    sync_interval_minutes: int = 60
    stale_threshold_days: int = 7
    cors_origins: list[str] = [
        "http://localhost:4321",  # Astro dev server
        "http://localhost:3000",
    ]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
