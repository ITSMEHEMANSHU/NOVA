from fastapi import APIRouter, HTTPException
from app.schemas.discovery import UserPreferences, DiscoveryResponse
from app.discovery.engine import discovery_engine

router = APIRouter(prefix="/discovery", tags=["Discovery"])

@router.post("/search", response_model=DiscoveryResponse)
async def search_repositories(preferences: UserPreferences):
    try:
        results = await discovery_engine.search(preferences)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery search failed: {str(e)}")
