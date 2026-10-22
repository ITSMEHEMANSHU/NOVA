import logging
import asyncio
from typing import Dict, Any
from app.core.config import settings
from app.cache.redis_client import cache_service

logger = logging.getLogger("oss_compass.orchestrator")

async def execute_repo_preparation(owner: str, repo: str) -> Dict[str, Any]:
    """
    Executes repository preparation, populates Layerbase Redis cache,
    and updates section loading statuses.
    """
    from app.github.client import github_client
    from app.graph.builder import graph_builder
    
    status_key = f"repo_status:{owner}:{repo}"
    await cache_service.set_json(status_key, {
        "overview": "loading",
        "tree": "loading",
        "graph": "loading",
        "contributors": "loading",
        "issues": "loading",
        "pulls": "loading"
    }, ttl=1800)

    try:
        # 1. Overview & README
        meta = await github_client.get_repository(owner, repo)
        readme = await github_client.get_readme(owner, repo)
        contributing = await github_client.get_contributing_guide(owner, repo)
        languages = await github_client.get_languages(owner, repo)

        overview_data = {
            "name": meta.get("name", repo),
            "owner": owner,
            "full_name": meta.get("full_name", f"{owner}/{repo}"),
            "description": meta.get("description"),
            "html_url": meta.get("html_url", f"https://github.com/{owner}/{repo}"),
            "stars_count": meta.get("stargazers_count", 0),
            "forks_count": meta.get("forks_count", 0),
            "open_issues_count": meta.get("open_issues_count", 0),
            "license": meta.get("license", {}).get("spdx_id") if meta.get("license") else None,
            "default_branch": meta.get("default_branch", "main"),
            "readme_markdown": readme,
            "contributing_markdown": contributing,
            "languages": languages,
            "topics": meta.get("topics", []),
            "is_cached": True
        }
        await cache_service.set_json(f"overview:{owner}:{repo}", overview_data, ttl=3600)
        
        # 2. Issues, Pulls & Contributors
        issues = await github_client.get_issues(owner, repo, per_page=20)
        pulls = await github_client.get_pull_requests(owner, repo, per_page=15)
        contributors = await github_client.get_contributors(owner, repo, per_page=20)
        
        await cache_service.set_json(f"issues:{owner}:{repo}", issues, ttl=1800)
        await cache_service.set_json(f"pulls:{owner}:{repo}", pulls, ttl=1800)
        await cache_service.set_json(f"contributors:{owner}:{repo}", contributors, ttl=3600)

        # 3. Architecture Graph
        await graph_builder.build_graph(owner, repo, branch=meta.get("default_branch", "main"))

        # Update status to ready
        await cache_service.set_json(status_key, {
            "overview": "ready",
            "tree": "ready",
            "graph": "ready",
            "contributors": "ready",
            "issues": "ready",
            "pulls": "ready"
        }, ttl=1800)

        logger.info(f"Successfully prepared repository {owner}/{repo}")
        return {"status": "ready", "owner": owner, "repo": repo}
    except Exception as e:
        logger.error(f"Error during background preparation for {owner}/{repo}: {e}")
        await cache_service.set_json(status_key, {
            "overview": "error",
            "tree": "error",
            "graph": "error",
            "contributors": "error",
            "issues": "error",
            "pulls": "error"
        }, ttl=600)
        return {"status": "error", "message": str(e)}

async def trigger_repo_preparation(owner: str, repo: str):
    """
    Launches background repository preparation task with deduplication.
    """
    status_key = f"repo_status:{owner}:{repo}"
    current_status = await cache_service.get_json(status_key)
    if current_status and current_status.get("overview") in ["queued", "loading", "ready"]:
        return  # Deduplicate: already queued or ready

    await cache_service.set_json(status_key, {
        "overview": "queued",
        "tree": "queued",
        "graph": "queued",
        "contributors": "queued",
        "issues": "queued",
        "pulls": "queued"
    }, ttl=600)

    # Launch asynchronous task
    asyncio.create_task(execute_repo_preparation(owner, repo))
