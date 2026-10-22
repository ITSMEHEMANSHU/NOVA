import datetime
from fastapi import APIRouter
from app.core.config import settings
from app.cache.redis_client import cache_service

router = APIRouter(tags=["Health"])

@router.get("/health")
async def get_health():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "cache": {
            "type": "redis" if cache_service.is_connected() else "in-memory-fallback",
            "redis_connected": cache_service.is_connected(),
            "layerbase_configured": bool(settings.REDIS_URL)
        },
        "ai": {
            "model": settings.GEMINI_MODEL,
            "api_key_configured": bool(settings.GEMINI_API_KEY)
        },
        "background_jobs": {
            "orchestration": "trigger.dev",
            "trigger_dev_configured": bool(settings.TRIGGER_SECRET_KEY)
        },
        "github": {
            "token_configured": bool(settings.GITHUB_TOKEN)
        }
    }
