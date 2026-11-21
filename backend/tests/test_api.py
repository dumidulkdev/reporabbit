def test_list_repos_seeded(client, auth_headers):
    resp = client.get("/api/repos", headers=auth_headers)
    assert resp.status_code == 200
    repos = resp.json()
    assert len(repos) == 4
    names = {r["name"] for r in repos}
    assert names == {"reporabbit", "astro-commerce", "fastapi-invoicing", "notes-api"}
    notes = next(r for r in repos if r["name"] == "notes-api")
    assert notes["sync_status"] == "failed"


def test_create_and_delete_repo(client, auth_headers):
    created = client.post(
        "/api/repos",
        json={"owner": "dumidulkdev", "name": "test-repo", "visibility": "public"},
        headers=auth_headers,
    )
    assert created.status_code == 201, created.text
    repo_id = created.json()["id"]
    assert created.json()["full_name"] == "dumidulkdev/test-repo"

    got = client.get(f"/api/repos/{repo_id}", headers=auth_headers)
    assert got.status_code == 200

    deleted = client.delete(f"/api/repos/{repo_id}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get(f"/api/repos/{repo_id}", headers=auth_headers).status_code == 404


def test_create_duplicate_repo_rejected(client, auth_headers):
    resp = client.post(
        "/api/repos",
        json={"owner": "dumidulkdev", "name": "reporabbit"},
        headers=auth_headers,
    )
    assert resp.status_code == 400


def test_sync_repo(client, auth_headers):
    repos = client.get("/api/repos", headers=auth_headers).json()
    repo_id = next(r["id"] for r in repos if r["name"] == "reporabbit")
    resp = client.post(f"/api/repos/{repo_id}/sync", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["sync_status"] == "synced"
    assert data["last_synced_at"] is not None


def test_sync_missing_repo_404(client, auth_headers):
    assert client.post("/api/repos/99999/sync", headers=auth_headers).status_code == 404


def test_contributors(client, auth_headers):
    resp = client.get("/api/contributors", headers=auth_headers)
    assert resp.status_code == 200
    contributors = resp.json()
    assert len(contributors) == 5
    assert contributors[0]["name"] == "Dumidu Lakshan"  # most merged first


def test_alerts_and_read(client, auth_headers):
    alerts = client.get("/api/alerts", headers=auth_headers).json()
    assert len(alerts) == 5
    assert any(a["type"] == "failed_sync" for a in alerts)
    unread = client.get("/api/alerts?unread_only=true", headers=auth_headers).json()
    assert len(unread) == 5

    first = alerts[0]
    read = client.post(f"/api/alerts/{first['id']}/read", headers=auth_headers)
    assert read.status_code == 200
    assert read.json()["is_read"] is True

    all_read = client.post("/api/alerts/read-all", headers=auth_headers)
    assert all_read.status_code == 200
    assert all_read.json()["marked_read"] == 4
    assert client.get("/api/alerts?unread_only=true", headers=auth_headers).json() == []


def test_settings_get_and_update(client, auth_headers):
    current = client.get("/api/settings", headers=auth_headers).json()
    assert current["workspace_name"] == "Dumidu's Workspace"
    assert current["stale_threshold_days"] == 7

    updated = client.put(
        "/api/settings",
        json={"stale_threshold_days": 14, "digest_enabled": False},
        headers=auth_headers,
    ).json()
    assert updated["stale_threshold_days"] == 14
    assert updated["digest_enabled"] is False
    assert updated["workspace_name"] == "Dumidu's Workspace"  # untouched fields kept


def test_health(client):
    assert client.get("/health").json() == {"status": "ok", "service": "reporabbit-api"}
    assert client.get("/api/health").status_code == 200
