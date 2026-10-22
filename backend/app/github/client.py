import re
import base64
import logging
from typing import Dict, List, Optional, Any
import httpx
from app.core.config import settings

logger = logging.getLogger("oss_compass.github")

class GitHubClientError(Exception):
    def __init__(self, message: str, status_code: int = 500, is_rate_limit: bool = False):
        super().__init__(message)
        self.status_code = status_code
        self.is_rate_limit = is_rate_limit

class GitHubClient:
    def __init__(self):
        self.base_url = settings.GITHUB_API_BASE
        self._headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "OSS-Compass-App"
        }
        if settings.GITHUB_TOKEN:
            self._headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    def _validate_repo_params(self, owner: str, repo: str):
        # Prevent URL tampering / injection
        if not re.match(r"^[a-zA-Z0-9_\-\.]+$", owner) or not re.match(r"^[a-zA-Z0-9_\-\.]+$", repo):
            raise GitHubClientError(f"Invalid owner '{owner}' or repo '{repo}' parameter.", status_code=400)

    async def _request(self, method: str, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Any:
        url = f"{self.base_url}{endpoint}" if endpoint.startswith("/") else f"{self.base_url}/{endpoint}"
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.request(method, url, headers=self._headers, params=params)
                
                # Check rate limits
                if response.status_code == 403 and "rate limit" in response.text.lower():
                    remaining = response.headers.get("x-ratelimit-remaining", "0")
                    reset_time = response.headers.get("x-ratelimit-reset", "unknown")
                    logger.error(f"GitHub API rate limit exceeded. Remaining: {remaining}, Reset: {reset_time}")
                    raise GitHubClientError("GitHub API rate limit exceeded. Consider adding a GITHUB_TOKEN.", status_code=429, is_rate_limit=True)
                
                if response.status_code == 404:
                    raise GitHubClientError(f"Resource not found: {endpoint}", status_code=404)
                
                if response.status_code >= 400:
                    raise GitHubClientError(f"GitHub API error ({response.status_code}): {response.text[:200]}", status_code=response.status_code)
                
                return response.json()
            except httpx.RequestError as exc:
                logger.error(f"Network error accessing GitHub API: {exc}")
                raise GitHubClientError(f"Network error communicating with GitHub: {str(exc)}", status_code=503)

    async def search_repositories(self, query: str, sort: str = "stars", order: str = "desc", per_page: int = 15, page: int = 1) -> Dict[str, Any]:
        return await self._request("GET", "/search/repositories", params={
            "q": query,
            "sort": sort,
            "order": order,
            "per_page": per_page,
            "page": page
        })

    async def get_repository(self, owner: str, repo: str) -> Dict[str, Any]:
        self._validate_repo_params(owner, repo)
        return await self._request("GET", f"/repos/{owner}/{repo}")

    async def get_readme(self, owner: str, repo: str) -> Optional[str]:
        self._validate_repo_params(owner, repo)
        try:
            data = await self._request("GET", f"/repos/{owner}/{repo}/readme")
            content = data.get("content", "")
            encoding = data.get("encoding", "")
            if encoding == "base64" and content:
                return base64.b64decode(content).decode("utf-8", errors="replace")
            return content
        except GitHubClientError as e:
            if e.status_code == 404:
                return None
            raise

    async def get_contributing_guide(self, owner: str, repo: str) -> Optional[str]:
        self._validate_repo_params(owner, repo)
        # Check standard paths: CONTRIBUTING.md, .github/CONTRIBUTING.md, docs/CONTRIBUTING.md
        candidate_paths = ["CONTRIBUTING.md", ".github/CONTRIBUTING.md", "docs/CONTRIBUTING.md", "contributing.md"]
        for path in candidate_paths:
            try:
                content = await self.get_file_content(owner, repo, path)
                if content:
                    return content
            except Exception:
                continue
        return None

    async def get_languages(self, owner: str, repo: str) -> Dict[str, int]:
        self._validate_repo_params(owner, repo)
        try:
            return await self._request("GET", f"/repos/{owner}/{repo}/languages")
        except GitHubClientError as e:
            if e.status_code == 404:
                return {}
            raise

    async def get_tree(self, owner: str, repo: str, branch: str = "main", recursive: bool = True) -> Dict[str, Any]:
        self._validate_repo_params(owner, repo)
        params = {"recursive": "1"} if recursive else {}
        try:
            return await self._request("GET", f"/repos/{owner}/{repo}/git/trees/{branch}", params=params)
        except GitHubClientError as e:
            if e.status_code == 404 and branch == "main":
                # Try "master" as fallback default branch
                return await self._request("GET", f"/repos/{owner}/{repo}/git/trees/master", params=params)
            raise

    async def get_file_content(self, owner: str, repo: str, path: str, branch: Optional[str] = None) -> Optional[str]:
        self._validate_repo_params(owner, repo)
        endpoint = f"/repos/{owner}/{repo}/contents/{path}"
        params = {"ref": branch} if branch else {}
        try:
            data = await self._request("GET", endpoint, params=params)
            if isinstance(data, dict) and data.get("content"):
                return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
            return None
        except GitHubClientError as e:
            if e.status_code == 404:
                return None
            raise

    async def get_contributors(self, owner: str, repo: str, per_page: int = 30) -> List[Dict[str, Any]]:
        self._validate_repo_params(owner, repo)
        try:
            data = await self._request("GET", f"/repos/{owner}/{repo}/contributors", params={"per_page": per_page})
            return data if isinstance(data, list) else []
        except GitHubClientError as e:
            if e.status_code == 404:
                return []
            raise

    async def get_issues(self, owner: str, repo: str, state: str = "open", per_page: int = 30) -> List[Dict[str, Any]]:
        self._validate_repo_params(owner, repo)
        # Note: GitHub API includes PRs in /issues unless filtered
        data = await self._request("GET", f"/repos/{owner}/{repo}/issues", params={
            "state": state,
            "per_page": per_page,
            "sort": "updated",
            "direction": "desc"
        })
        # Filter out pull requests
        return [item for item in data if "pull_request" not in item]

    async def get_issue(self, owner: str, repo: str, issue_number: int) -> Dict[str, Any]:
        self._validate_repo_params(owner, repo)
        return await self._request("GET", f"/repos/{owner}/{repo}/issues/{issue_number}")

    async def get_pull_requests(self, owner: str, repo: str, state: str = "all", per_page: int = 20) -> List[Dict[str, Any]]:
        self._validate_repo_params(owner, repo)
        return await self._request("GET", f"/repos/{owner}/{repo}/pulls", params={
            "state": state,
            "per_page": per_page,
            "sort": "updated",
            "direction": "desc"
        })

github_client = GitHubClient()
