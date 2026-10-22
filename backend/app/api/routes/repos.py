import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from app.github.client import github_client, GitHubClientError
from app.cache.redis_client import cache_service
from app.graph.builder import graph_builder
from app.background.orchestrator import trigger_repo_preparation
from app.schemas.repository import RepositoryOverview, RepoSectionStatus, Contributor, PullRequest
from app.schemas.graph import ArchitectureGraph
from app.schemas.issues import IssueItem
from app.agent.services.gemma_service import gemma_service

logger = logging.getLogger("oss_compass.repos")
router = APIRouter(prefix="/repositories", tags=["Repositories"])

@router.post("/{owner}/{repo}/prepare")
async def prepare_repository(owner: str, repo: str):
    try:
        await trigger_repo_preparation(owner, repo)
        return {"status": "enqueued", "owner": owner, "repo": repo}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{owner}/{repo}/status", response_model=RepoSectionStatus)
async def get_repository_status(owner: str, repo: str):
    status_key = f"repo_status:{owner}:{repo}"
    cached = await cache_service.get_json(status_key)
    if cached:
        return RepoSectionStatus(**cached)
    return RepoSectionStatus()

@router.get("/{owner}/{repo}/overview", response_model=RepositoryOverview)
async def get_repository_overview(owner: str, repo: str):
    cache_key = f"overview:{owner}:{repo}"
    cached = await cache_service.get_json(cache_key)
    if cached:
        return RepositoryOverview(**cached)

    try:
        meta = await github_client.get_repository(owner, repo)
        readme = await github_client.get_readme(owner, repo)
        contributing = await github_client.get_contributing_guide(owner, repo)
        languages = await github_client.get_languages(owner, repo)
        pure_issues_count = await github_client.get_pure_issues_count(owner, repo)
        actual_issues_count = pure_issues_count if pure_issues_count is not None else meta.get("open_issues_count", 0)

        overview = RepositoryOverview(
            name=meta.get("name", repo),
            owner=owner,
            full_name=meta.get("full_name", f"{owner}/{repo}"),
            description=meta.get("description"),
            html_url=meta.get("html_url", f"https://github.com/{owner}/{repo}"),
            stars_count=meta.get("stargazers_count", 0),
            forks_count=meta.get("forks_count", 0),
            open_issues_count=actual_issues_count,
            license=meta.get("license", {}).get("spdx_id") if meta.get("license") else None,
            default_branch=meta.get("default_branch", "main"),
            readme_markdown=readme,
            contributing_markdown=contributing,
            languages=languages,
            topics=meta.get("topics", []),
            is_cached=False
        )
        await cache_service.set_json(cache_key, overview.model_dump(), ttl=3600)
        return overview
    except GitHubClientError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))

@router.get("/{owner}/{repo}/tree")
async def get_repository_tree(owner: str, repo: str, branch: Optional[str] = None):
    cache_key = f"tree:{owner}:{repo}:{branch or 'default'}"
    cached = await cache_service.get_json(cache_key)
    if cached:
        return cached

    try:
        # Get default branch if not specified
        b = branch
        if not b:
            meta = await github_client.get_repository(owner, repo)
            b = meta.get("default_branch", "main")
            
        tree_data = await github_client.get_tree(owner, repo, branch=b, recursive=True)
        raw_items = tree_data.get("tree", [])

        # Filter and structure tree
        file_tree = []
        for item in raw_items:
            path = item.get("path", "")
            if any(x in path for x in ["node_modules/", ".git/", "vendor/", "dist/", "build/"]):
                continue
            file_tree.append({
                "path": path,
                "name": path.split("/")[-1],
                "type": "directory" if item.get("type") == "tree" else "file",
                "size": item.get("size")
            })

        result = {"branch": b, "total_files": len(file_tree), "files": file_tree[:300]}
        await cache_service.set_json(cache_key, result, ttl=1800)
        return result
    except GitHubClientError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))

@router.get("/{owner}/{repo}/graph", response_model=ArchitectureGraph)
async def get_repository_graph(owner: str, repo: str, branch: Optional[str] = None):
    try:
        b = branch
        if not b:
            meta = await github_client.get_repository(owner, repo)
            b = meta.get("default_branch", "main")
        return await graph_builder.build_graph(owner, repo, branch=b)
    except GitHubClientError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to generate architecture graph: {e}")
        raise HTTPException(status_code=500, detail=f"Architecture graph generation error: {str(e)}")

@router.get("/{owner}/{repo}/contributors", response_model=List[Contributor])
async def get_repository_contributors(owner: str, repo: str):
    cache_key = f"contributors:{owner}:{repo}"
    cached = await cache_service.get_json(cache_key)
    if cached:
        return [Contributor(**c) for c in cached]

    try:
        raw_contributors = await github_client.get_contributors(owner, repo, per_page=20)
        results = []
        for idx, c in enumerate(raw_contributors):
            # Authoritative role labels only
            role = "Maintainer" if idx == 0 or c.get("contributions", 0) > 200 else "Contributor"
            results.append(Contributor(
                login=c["login"],
                id=c["id"],
                avatar_url=c["avatar_url"],
                html_url=c["html_url"],
                contributions=c["contributions"],
                role=role,
                verified_context=f"Recorded {c['contributions']} public commits"
            ))
        await cache_service.set_json(cache_key, [r.model_dump() for r in results], ttl=3600)
        return results
    except GitHubClientError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))

@router.get("/{owner}/{repo}/issues", response_model=List[IssueItem])
async def get_repository_issues(owner: str, repo: str):
    cache_key = f"issues:{owner}:{repo}"
    cached = await cache_service.get_json(cache_key)
    if cached:
        return [IssueItem(**i) for i in cached]

    try:
        raw_issues = await github_client.get_issues(owner, repo, per_page=25)
        results = []
        for item in raw_issues:
            labels = [l["name"] for l in item.get("labels", []) if isinstance(l, dict)]
            is_gfi = any("good first issue" in l.lower() for l in labels)
            is_hw = any("help wanted" in l.lower() for l in labels)
            
            # Grounded difficulty assessment
            difficulty = await gemma_service.assess_issue_difficulty(
                title=item["title"],
                body=item.get("body") or "",
                labels=labels
            )

            results.append(IssueItem(
                id=item["id"],
                number=item["number"],
                title=item["title"],
                body=item.get("body"),
                html_url=item["html_url"],
                state=item.get("state", "open"),
                created_at=item.get("created_at", ""),
                updated_at=item.get("updated_at", ""),
                author_login=item.get("user", {}).get("login", "unknown"),
                author_avatar=item.get("user", {}).get("avatar_url", ""),
                labels=labels,
                comments_count=item.get("comments", 0),
                is_good_first_issue=is_gfi,
                is_help_wanted=is_hw,
                difficulty=difficulty
            ))
        await cache_service.set_json(cache_key, [r.model_dump() for r in results], ttl=1800)
        return results
    except GitHubClientError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))

@router.get("/{owner}/{repo}/issues/{issue_number}", response_model=IssueItem)
async def get_repository_issue(owner: str, repo: str, issue_number: int):
    try:
        item = await github_client.get_issue(owner, repo, issue_number)
        labels = [l["name"] for l in item.get("labels", []) if isinstance(l, dict)]
        is_gfi = any("good first issue" in l.lower() for l in labels)
        is_hw = any("help wanted" in l.lower() for l in labels)
        
        difficulty = await gemma_service.assess_issue_difficulty(
            title=item["title"],
            body=item.get("body") or "",
            labels=labels
        )

        return IssueItem(
            id=item["id"],
            number=item["number"],
            title=item["title"],
            body=item.get("body"),
            html_url=item["html_url"],
            state=item.get("state", "open"),
            created_at=item.get("created_at", ""),
            updated_at=item.get("updated_at", ""),
            author_login=item.get("user", {}).get("login", "unknown"),
            author_avatar=item.get("user", {}).get("avatar_url", ""),
            labels=labels,
            comments_count=item.get("comments", 0),
            is_good_first_issue=is_gfi,
            is_help_wanted=is_hw,
            difficulty=difficulty
        )
    except GitHubClientError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))

@router.get("/{owner}/{repo}/pulls", response_model=List[PullRequest])
async def get_repository_pulls(owner: str, repo: str):
    cache_key = f"pulls:{owner}:{repo}"
    cached = await cache_service.get_json(cache_key)
    if cached:
        return [PullRequest(**p) for p in cached]

    try:
        raw_pulls = await github_client.get_pull_requests(owner, repo, per_page=15)
        results = []
        for p in raw_pulls:
            results.append(PullRequest(
                number=p["number"],
                title=p["title"],
                state=p.get("state", "open"),
                html_url=p["html_url"],
                created_at=p.get("created_at", ""),
                user_login=p.get("user", {}).get("login", "unknown"),
                user_avatar=p.get("user", {}).get("avatar_url", ""),
                is_merged=bool(p.get("merged_at")),
                merged_at=p.get("merged_at")
            ))
        await cache_service.set_json(cache_key, [r.model_dump() for r in results], ttl=1800)
        return results
    except GitHubClientError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
