"""Minimal GitHub REST API client.

Works without a token for public data (60 req/hour). With GITHUB_TOKEN set
it sends an Authorization header (5,000 req/hour). Handles pagination via
the Link header, reads X-RateLimit headers, backs off when the limit is
exhausted, and caches GET responses in a small in-memory TTL cache.
"""
import time
from urllib.parse import urlparse, parse_qs

import httpx

from app.config import settings

BASE_URL = "https://api.github.com"
CACHE_TTL_SECONDS = 300


class GitHubRateLimitError(Exception):
    """Raised when the GitHub rate limit is exhausted."""

    def __init__(self, reset_at: float):
        self.reset_at = reset_at
        super().__init__(f"GitHub rate limit exceeded, resets at {reset_at}")


class GitHubClient:
    def __init__(self, token: str | None = None, timeout: float = 15.0):
        self.token = token or settings.github_token
        self.timeout = timeout
        self._cache: dict[str, tuple[float, object]] = {}

    def _headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _cache_get(self, key: str):
        entry = self._cache.get(key)
        if entry and time.time() - entry[0] < CACHE_TTL_SECONDS:
            return entry[1]
        self._cache.pop(key, None)
        return None

    def _cache_set(self, key: str, value: object):
        self._cache[key] = (time.time(), value)

    def _check_rate_limit(self, response: httpx.Response):
        remaining = response.headers.get("X-RateLimit-Remaining")
        if remaining is not None and int(remaining) <= 0:
            reset = float(response.headers.get("X-RateLimit-Reset", time.time() + 60))
            raise GitHubRateLimitError(reset)

    def _get(self, path: str, params: dict | None = None) -> dict | list:
        cache_key = f"{path}?{params}"
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached
        url = f"{BASE_URL}{path}"
        response = httpx.get(url, headers=self._headers(), params=params, timeout=self.timeout)
        self._check_rate_limit(response)
        if response.status_code == 403 and "rate limit" in response.text.lower():
            reset = float(response.headers.get("X-RateLimit-Reset", time.time() + 60))
            raise GitHubRateLimitError(reset)
        response.raise_for_status()
        data = response.json()
        self._cache_set(cache_key, data)
        return data

    def _get_paginated(self, path: str, params: dict | None = None) -> list:
        """Follow Link: rel="next" until exhausted (cap at 10 pages)."""
        items: list = []
        url: str | None = f"{BASE_URL}{path}"
        query = dict(params or {})
        for _ in range(10):
            response = httpx.get(
                url, headers=self._headers(), params=query, timeout=self.timeout
            )
            self._check_rate_limit(response)
            response.raise_for_status()
            page_items = response.json()
            if isinstance(page_items, list):
                items.extend(page_items)
            link = response.headers.get("Link", "")
            next_url = None
            for part in link.split(","):
                if 'rel="next"' in part:
                    next_url = part.split(";")[0].strip().strip("<>")
            if not next_url:
                break
            url = next_url
            query = {}
        return items

    def list_user_repos(self, username: str) -> list[dict]:
        return self._get_paginated(f"/users/{username}/repos", {"per_page": 100, "sort": "updated"})

    def list_pull_requests(self, owner: str, repo: str, state: str = "all") -> list[dict]:
        return self._get_paginated(
            f"/repos/{owner}/{repo}/pulls", {"state": state, "per_page": 100}
        )

    def list_issues(self, owner: str, repo: str, state: str = "open") -> list[dict]:
        return self._get_paginated(
            f"/repos/{owner}/{repo}/issues", {"state": state, "per_page": 100}
        )

    def get_repo(self, owner: str, repo: str) -> dict:
        return self._get(f"/repos/{owner}/{repo}")
