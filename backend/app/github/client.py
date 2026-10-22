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
        for path in ["CONTRIBUTING.md", ".github/CONTRIBUTING.md"]:
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

    async def get_issues(
        self, 
        owner: str, 
        repo: str, 
        state: str = "open", 
        page: int = 1, 
        per_page: int = 25
    ) -> Dict[str, Any]:
        self._validate_repo_params(owner, repo)
        try:
            # Query /search/issues with is:issue to filter out PRs server-side
            search_query = f"repo:{owner}/{repo} is:issue is:{state}"
            data = await self._request("GET", "/search/issues", params={
                "q": search_query,
                "sort": "updated",
                "order": "desc",
                "per_page": per_page,
                "page": page
            })
            if isinstance(data, dict) and "items" in data:
                return {
                    "items": data["items"],
                    "total_count": data.get("total_count", len(data["items"]))
                }
        except Exception as e:
            logger.warning(f"Search issues fallback: {e}")

        # Fallback to standard issues endpoint
        data = await self._request("GET", f"/repos/{owner}/{repo}/issues", params={
            "state": state,
            "per_page": per_page,
            "page": page,
            "sort": "updated",
            "direction": "desc"
        })
        filtered = [item for item in data if "pull_request" not in item]
        return {
            "items": filtered,
            "total_count": len(filtered)
        }

    async def get_pure_issues_count(self, owner: str, repo: str) -> Optional[int]:
        self._validate_repo_params(owner, repo)
        try:
            search_query = f"repo:{owner}/{repo} is:issue is:open"
            data = await self._request("GET", "/search/issues", params={"q": search_query, "per_page": 1})
            if isinstance(data, dict) and "total_count" in data:
                return data["total_count"]
        except Exception as e:
            logger.warning(f"Failed to query pure issues count: {e}")
        return None

    async def get_issue(self, owner: str, repo: str, issue_number: int) -> Dict[str, Any]:
        self._validate_repo_params(owner, repo)
        return await self._request("GET", f"/repos/{owner}/{repo}/issues/{issue_number}")

    async def get_pull_requests(
        self, 
        owner: str, 
        repo: str, 
        state: str = "all", 
        page: int = 1, 
        per_page: int = 20
    ) -> Dict[str, Any]:
        self._validate_repo_params(owner, repo)
        try:
            state_query = ""
            if state == "open":
                state_query = " is:open"
            elif state == "closed":
                state_query = " is:closed"
            elif state == "merged":
                state_query = " is:merged"

            search_query = f"repo:{owner}/{repo} is:pr{state_query}"
            data = await self._request("GET", "/search/issues", params={
                "q": search_query,
                "sort": "updated",
                "order": "desc",
                "per_page": per_page,
                "page": page
            })
            if isinstance(data, dict) and "items" in data:
                return {
                    "items": data["items"],
                    "total_count": data.get("total_count", len(data["items"]))
                }
        except Exception as e:
            logger.warning(f"Search pulls fallback: {e}")

        # Fallback to standard pulls endpoint
        gh_state = "all" if state in ("all", "merged") else state
        data = await self._request("GET", f"/repos/{owner}/{repo}/pulls", params={
            "state": gh_state,
            "per_page": per_page,
            "page": page,
            "sort": "updated",
            "direction": "desc"
        })
        items = data if isinstance(data, list) else []
        return {
            "items": items,
            "total_count": len(items)
        }

    async def get_issue_activity(self, owner: str, repo: str, issue_number: int) -> Dict[str, Any]:
        self._validate_repo_params(owner, repo)
        
        # 1. Fetch raw issue to get assignees and metadata
        issue = await self.get_issue(owner, repo, issue_number)
        
        raw_assignees = issue.get("assignees") or []
        if not raw_assignees and issue.get("assignee"):
            raw_assignees = [issue["assignee"]]
        
        assignees = [
            {
                "login": a.get("login", ""),
                "avatar_url": a.get("avatar_url", ""),
                "html_url": a.get("html_url", f"https://github.com/{a.get('login', '')}")
            }
            for a in raw_assignees if isinstance(a, dict) and a.get("login")
        ]
        
        # 2. Query open pull requests mentioning this issue
        linked_prs = []
        try:
            pr_search = await self._request("GET", "/search/issues", params={
                "q": f"repo:{owner}/{repo} is:pr {issue_number}",
                "sort": "updated",
                "order": "desc",
                "per_page": 5
            })
            for pr in (pr_search.get("items") or []):
                pr_title = pr.get("title", "")
                pr_body = pr.get("body") or ""
                ref_patterns = [
                    f"#{issue_number}",
                    f"fixes #{issue_number}",
                    f"closes #{issue_number}",
                    f"resolves #{issue_number}",
                    f"issues/{issue_number}"
                ]
                has_ref = any(p in pr_title.lower() or p in pr_body.lower() for p in ref_patterns) or str(issue_number) in pr_title
                
                if has_ref or len(pr_search.get("items", [])) <= 2:
                    pr_state = "open"
                    if pr.get("pull_request", {}).get("merged_at"):
                        pr_state = "merged"
                    elif pr.get("state") == "closed":
                        pr_state = "closed"
                    else:
                        pr_state = "open"
                        
                    linked_prs.append({
                        "number": pr.get("number"),
                        "title": pr.get("title", ""),
                        "html_url": pr.get("html_url", ""),
                        "state": pr_state,
                        "author_login": pr.get("user", {}).get("login", "unknown"),
                        "author_avatar": pr.get("user", {}).get("avatar_url", ""),
                        "created_at": pr.get("created_at", ""),
                        "updated_at": pr.get("updated_at", ""),
                        "is_draft": bool(pr.get("draft", False))
                    })
        except Exception as e:
            logger.warning(f"Error querying linked PRs for issue {issue_number}: {e}")

        # 3. Check recent comments for intent to work
        recent_claims = []
        try:
            comments = await self._request("GET", f"/repos/{owner}/{repo}/issues/{issue_number}/comments", params={
                "per_page": 10,
                "sort": "created",
                "direction": "desc"
            })
            claim_keywords = [
                "work on this",
                "working on this",
                "take this",
                "pick this up",
                "assign me",
                "assigned to",
                "can i do this",
                "pr incoming",
                "solving this",
                "fixing this",
                "i am working on"
            ]
            if isinstance(comments, list):
                for c in comments:
                    body = (c.get("body") or "").lower()
                    if any(kw in body for kw in claim_keywords):
                        recent_claims.append({
                            "author_login": c.get("user", {}).get("login", "unknown"),
                            "author_avatar": c.get("user", {}).get("avatar_url", ""),
                            "comment_body": (c.get("body") or "")[:250],
                            "created_at": c.get("created_at", ""),
                            "html_url": c.get("html_url", "")
                        })
        except Exception as e:
            logger.warning(f"Error querying comments for issue {issue_number}: {e}")

        # Determine status
        open_prs = [pr for pr in linked_prs if pr["state"] == "open"]
        if assignees:
            has_active_workers = True
            status_badge = "ASSIGNED"
            names = ", ".join([f"@{a['login']}" for a in assignees])
            status_summary = f"Currently assigned to {names}. A contributor is officially designated to work on this issue."
        elif open_prs:
            has_active_workers = True
            status_badge = "PR_IN_PROGRESS"
            first_pr = open_prs[0]
            status_summary = f"Active Pull Request #{first_pr['number']} is open by @{first_pr['author_login']}. Work is actively being submitted for this issue."
        elif recent_claims:
            has_active_workers = True
            status_badge = "CLAIMED"
            first_claim = recent_claims[0]
            status_summary = f"@{first_claim['author_login']} commented expressing intent to work on this issue recently."
        else:
            has_active_workers = False
            status_badge = "AVAILABLE"
            status_summary = "No existing contributors or active pull requests detected. This issue appears open and available for you to work on!"

        return {
            "issue_number": issue_number,
            "has_active_workers": has_active_workers,
            "status_badge": status_badge,
            "status_summary": status_summary,
            "assignees": assignees,
            "linked_prs": linked_prs,
            "recent_claims": recent_claims
        }


github_client = GitHubClient()
