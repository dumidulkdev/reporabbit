import hashlib
import hmac
import json

SECRET = "test-webhook-secret"  # matches conftest env


def _sign(body: bytes) -> str:
    digest = hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def test_ping_valid_signature(client):
    body = json.dumps({"zen": "hello"}).encode()
    resp = client.post(
        "/api/webhooks/github",
        content=body,
        headers={"X-Hub-Signature-256": _sign(body), "X-GitHub-Event": "ping"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["event"] == "ping"


def test_push_valid_signature(client):
    body = json.dumps({"ref": "refs/heads/main"}).encode()
    resp = client.post(
        "/api/webhooks/github",
        content=body,
        headers={"X-Hub-Signature-256": _sign(body), "X-GitHub-Event": "push"},
    )
    assert resp.status_code == 200
    assert resp.json()["accepted"] is True


def test_pull_request_valid_signature(client):
    body = json.dumps({"action": "opened"}).encode()
    resp = client.post(
        "/api/webhooks/github",
        content=body,
        headers={"X-Hub-Signature-256": _sign(body), "X-GitHub-Event": "pull_request"},
    )
    assert resp.status_code == 200
    assert resp.json()["accepted"] is True


def test_invalid_signature_rejected(client):
    body = json.dumps({"zen": "hello"}).encode()
    resp = client.post(
        "/api/webhooks/github",
        content=body,
        headers={
            "X-Hub-Signature-256": "sha256=deadbeef",
            "X-GitHub-Event": "ping",
        },
    )
    assert resp.status_code == 401


def test_missing_signature_rejected(client):
    body = json.dumps({"zen": "hello"}).encode()
    resp = client.post(
        "/api/webhooks/github",
        content=body,
        headers={"X-GitHub-Event": "ping"},
    )
    assert resp.status_code == 401


def test_tampered_body_rejected(client):
    body = json.dumps({"zen": "hello"}).encode()
    signature = _sign(b'{"zen": "different"}')
    resp = client.post(
        "/api/webhooks/github",
        content=body,
        headers={"X-Hub-Signature-256": signature, "X-GitHub-Event": "ping"},
    )
    assert resp.status_code == 401
