from fastapi import APIRouter, HTTPException
from app.schemas.ai import IssueAnalysisRequest, IssueAnalysisResponse
from app.agent.services.gemma_service import gemma_service
from app.github.client import github_client
from app.cache.redis_client import cache_service

router = APIRouter(prefix="/analysis", tags=["AI Analysis"])

@router.post("/issue", response_model=IssueAnalysisResponse)
async def analyze_issue(req: IssueAnalysisRequest):
    try:
        # Check cache
        cache_key = f"analysis:issue:{req.owner}:{req.repo}:{req.issue_number}:{req.user_experience}"
        cached = await cache_service.get_json(cache_key)
        if cached:
            return IssueAnalysisResponse(**cached)

        # Retrieve bounded repo context
        readme = await github_client.get_readme(req.owner, req.repo)
        
        # Bounded files list
        retrieved_files = []
        try:
            tree_data = await github_client.get_tree(req.owner, req.repo)
            raw_tree = tree_data.get("tree", [])
            retrieved_files = [
                item["path"] for item in raw_tree 
                if item.get("type") == "blob" and not any(x in item["path"] for x in ["node_modules/", ".git/", "vendor/"])
            ][:40]
        except Exception:
            pass

        result = await gemma_service.explain_issue(
            owner=req.owner,
            repo=req.repo,
            issue_number=req.issue_number,
            issue_title=req.issue_title,
            issue_body=req.issue_body or "",
            user_experience=req.user_experience or "beginner",
            retrieved_files=retrieved_files,
            readme_snippet=readme
        )
        
        await cache_service.set_json(cache_key, result.model_dump(), ttl=1800)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Issue analysis failed: {str(e)}")
