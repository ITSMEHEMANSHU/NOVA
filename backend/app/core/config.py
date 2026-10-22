import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "NOVA"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api"
    
    # AI / Model Configuration
    # Official Google Gemini API Gemma model identifier
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = Field(default="gemma-4-31b-it")
    
    # GitHub API Configuration
    GITHUB_TOKEN: str = Field(default="")
    GITHUB_API_BASE: str = "https://api.github.com"
    
    # Cache / Layerbase Redis (Format: rediss://default:password@host.cloud.layerbase.dev:6379)
    REDIS_URL: str = Field(default="")
    CACHE_DEFAULT_TTL: int = 1800  # 30 minutes
    
    # Trigger.dev Background Jobs
    TRIGGER_SECRET_KEY: str = Field(default="")
    TRIGGER_API_URL: str = "https://api.trigger.dev"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://oss-compass.vercel.app"
    ]

    model_config = SettingsConfigDict(env_file=[".env", "backend/.env"], env_file_encoding="utf-8", extra="ignore")

settings = Settings()
