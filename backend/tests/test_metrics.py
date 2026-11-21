"""Metrics are computed from the seeded DB data, so expected values are
derived from the seed table in app/seed.py:

Seeded PRs (12 total, created 2..78 days ago). Merged: #42 (1.6d cycle),
#41 (1.2d), #18 (2.1d), #23 (1.9d), #22 (1.4d) -> avg cycle 1.64d.
7d window: 2 PRs created, 2 merged. 90d window: all 12 PRs, 5 merged.
One failed_check alert sits 3.4h before PR #42 merged (time to restore).
"""


def test_overview_90d(client, auth_headers):
    resp = client.get("/api/metrics/overview?range=90d", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total_prs"] == 12
    assert data["merged_prs"] == 5
    assert data["cycle_time_days"] == 1.64
    assert data["review_latency_hours"] == 4.72  # (4.5+3.0+6.8+5.2+4.1)/5
    assert data["merge_rate"] == 41.7  # 5/12
    assert data["stale_prs"] == 2
    assert len(data["cycle_time_trend"]) == 90


def test_overview_range_changes_numbers(client, auth_headers):
    d7 = client.get("/api/metrics/overview?range=7d", headers=auth_headers).json()
    d90 = client.get("/api/metrics/overview?range=90d", headers=auth_headers).json()
    assert d7["total_prs"] == 2
    assert d7["merged_prs"] == 2
    assert d7["total_prs"] != d90["total_prs"]
    assert d7["cycle_time_days"] == 1.4  # (1.6 + 1.2) / 2
    assert d7["cycle_time_days"] != d90["cycle_time_days"]
    assert d7["merge_rate"] == 100.0


def test_overview_invalid_range_rejected(client, auth_headers):
    assert (
        client.get("/api/metrics/overview?range=1y", headers=auth_headers).status_code
        == 422
    )


def test_dora_90d(client, auth_headers):
    resp = client.get("/api/metrics/dora?range=90d", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["lead_time_days"] == 1.64
    assert data["deployment_frequency_per_week"] == 0.39  # 5 merges / (90/7)
    assert data["change_failure_rate"] == 20.0  # 1 failed check / 5 merges
    assert data["time_to_restore_hours"] == 3.4


def test_dora_7d(client, auth_headers):
    data = client.get("/api/metrics/dora?range=7d", headers=auth_headers).json()
    assert data["lead_time_days"] == 1.4
    assert data["deployment_frequency_per_week"] == 2.0  # 2 merges / 1 week
    assert data["change_failure_rate"] == 50.0  # 1 failed check / 2 merges
    assert data["time_to_restore_hours"] == 3.4


def test_metrics_require_auth(client):
    assert client.get("/api/metrics/overview").status_code == 401
    assert client.get("/api/metrics/dora").status_code == 401
