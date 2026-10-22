import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.cache.redis_client import cache_service


# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("oss_compass")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing OSS Compass backend services...")
    await cache_service.initialize()
    yield
    logger.info("Shutting down OSS Compass backend services...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent AI-powered open-source contribution and codebase exploration platform.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
from app.api.routes.health import router as health_router
from app.api.routes.discovery import router as discovery_router
from app.api.routes.repos import router as repos_router
from app.api.routes.analysis import router as analysis_router
from app.api.routes.issue_proof import router as issue_proof_router

app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(discovery_router, prefix=settings.API_V1_PREFIX)
app.include_router(repos_router, prefix=settings.API_V1_PREFIX)
app.include_router(analysis_router, prefix=settings.API_V1_PREFIX)
app.include_router(issue_proof_router, prefix=settings.API_V1_PREFIX)



@app.get("/")
def root():
    return {
        "service": "OSS Compass Backend API",
        "docs": "/docs",
        "health": "/api/health"
    }
