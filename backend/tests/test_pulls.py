def test_list_all_pulls(client, auth_headers):
    data = client.get("/api/pulls", headers=auth_headers).json()
    assert data["total"] == 12
    assert len(data["items"]) == 12
    assert data["page"] == 1


def test_filter_by_status_merged(client, auth_headers):
    data = client.get("/api/pulls?status=merged", headers=auth_headers).json()
    assert data["total"] == 5
    assert all(p["status"] == "merged" for p in data["items"])


def test_filter_stale_only(client, auth_headers):
    data = client.get("/api/pulls?stale_only=true", headers=auth_headers).json()
    assert data["total"] == 2
    assert all(p["status"] == "stale" for p in data["items"])


def test_filter_by_author(client, auth_headers):
    data = client.get("/api/pulls?author=Dumidu%20Lakshan", headers=auth_headers).json()
    assert data["total"] == 3
    assert all(p["author"] == "Dumidu Lakshan" for p in data["items"])


def test_filter_by_label(client, auth_headers):
    data = client.get("/api/pulls?label=security", headers=auth_headers).json()
    assert data["total"] == 2  # PR #23 and PR #10


def test_search_query(client, auth_headers):
    data = client.get("/api/pulls?q=rate%20limiting", headers=auth_headers).json()
    assert data["total"] == 1
    assert "rate limiting" in data["items"][0]["title"].lower()


def test_search_no_results(client, auth_headers):
    data = client.get("/api/pulls?q=zzzznothing", headers=auth_headers).json()
    assert data["total"] == 0
    assert data["items"] == []


def test_sort_most_changed(client, auth_headers):
    data = client.get("/api/pulls?sort=most_changed", headers=auth_headers).json()
    first = data["items"][0]
    assert first["title"].startswith("Refactor metrics aggregation")
    assert first["additions"] + first["deletions"] == 1240


def test_sort_longest_waiting(client, auth_headers):
    data = client.get("/api/pulls?sort=longest_waiting", headers=auth_headers).json()
    assert data["items"][0]["title"].startswith("Fix JWT expiry")


def test_pagination(client, auth_headers):
    page1 = client.get("/api/pulls?page=1&page_size=5", headers=auth_headers).json()
    page2 = client.get("/api/pulls?page=2&page_size=5", headers=auth_headers).json()
    assert len(page1["items"]) == 5
    assert len(page2["items"]) == 5
    assert page1["total"] == 12
    ids1 = {p["id"] for p in page1["items"]}
    ids2 = {p["id"] for p in page2["items"]}
    assert not ids1 & ids2


def test_get_single_pull(client, auth_headers):
    items = client.get("/api/pulls", headers=auth_headers).json()["items"]
    pr_id = items[0]["id"]
    resp = client.get(f"/api/pulls/{pr_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == pr_id
    assert resp.json()["repo_full_name"]


def test_get_missing_pull_404(client, auth_headers):
    assert client.get("/api/pulls/99999", headers=auth_headers).status_code == 404


def test_pulls_require_auth(client):
    assert client.get("/api/pulls").status_code == 401
