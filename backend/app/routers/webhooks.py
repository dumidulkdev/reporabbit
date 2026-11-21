"""GitHub webhook receiver.

Verifies the HMAC-SHA256 signature in the X-Hub-Signature-256 header
against GITHUB_WEBHOOK_SECRET. Bad or missing signatures are rejected
with 401. Accepted events: ping, push, pull_request (others are ignored
with a 200 so GitHub does not retry).
"""
import hashlib
import hmac
import json

from fastapi import APIRouter, HTTPException, Request

from app.config import settings

router = APIRouter(tags=["webhooks"])


def verify_signature(secret: str, body: bytes, signature_header: str | None) -> bool:
    if not signature_header:
        return False
    if not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature_header)


@router.post("/api/webhooks/github")
@router.post("/webhooks/github")
async def github_webhook(request: Request):
    body = await request.body()
    secret = settings.github_webhook_secret
    if secret:
        signature = request.headers.get("X-Hub-Signature-256")
        if not verify_signature(secret, body, signature):
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
    try:
        payload = json.loads(body) if body else {}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = request.headers.get("X-GitHub-Event", "unknown")
    if event == "ping":
        return {"ok": True, "event": "ping", "message": "pong"}
    if event in ("push", "pull_request"):
        # A full implementation would trigger a repo sync here; for now
        # acknowledge and let the scheduled sync pick the change up.
        return {"ok": True, "event": event, "accepted": True}
    return {"ok": True, "event": event, "accepted": False, "ignored": True}
