"""Pytest fixtures: temp SQLite DB, seeded app, authenticated client."""
import os
import tempfile

import pytest

# Env vars must be set BEFORE importing the app (settings/engine are
# module-level singletons).
_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
_tmp.close()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["GITHUB_WEBHOOK_SECRET"] = "test-webhook-secret"
os.environ["GITHUB_TOKEN"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def auth_headers(client):
    """Log in as the seeded demo user."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "demo@reporabbit.dev", "password": "demo1234"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
