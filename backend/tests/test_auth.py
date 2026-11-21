import uuid

import pytest


def _unique_email():
    return f"user-{uuid.uuid4().hex[:8]}@example.com"


def test_register_creates_user_and_returns_token(client):
    email = _unique_email()
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "password": "password123", "full_name": "Test User"},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["access_token"]
    assert resp.json()["token_type"] == "bearer"


def test_register_duplicate_email_rejected(client):
    email = _unique_email()
    payload = {"email": email, "password": "password123", "full_name": "Dup User"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 400


def test_register_short_password_rejected(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": _unique_email(), "password": "short", "full_name": "Short"},
    )
    assert resp.status_code == 422


def test_login_demo_user(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "demo@reporabbit.dev", "password": "demo1234"},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_wrong_password_rejected(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "demo@reporabbit.dev", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


def test_login_unknown_user_rejected(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "password123"},
    )
    assert resp.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    resp = client.get("/api/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "demo@reporabbit.dev"
    assert resp.json()["full_name"] == "Dumidu Lakshan"


def test_me_without_token_rejected(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_bad_token_rejected(client):
    assert (
        client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-token"}).status_code
        == 401
    )
