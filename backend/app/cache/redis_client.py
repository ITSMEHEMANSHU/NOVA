import json
import time
import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger("oss_compass.cache")

class CacheService:
    def __init__(self):
        self._redis = None
        self._in_memory: dict[str, tuple[float, str]] = {}
        self._connected = False
        self._initialized = False

    async def initialize(self):
        if self._initialized:
            return
        self._initialized = True
        
        if not settings.REDIS_URL:
            logger.info("REDIS_URL not configured. Operating in in-memory cache fallback mode.")
            return

        try:
            import redis.asyncio as aioredis
            # Layerbase Redis uses rediss:// for TLS over port 6379
            is_ssl = settings.REDIS_URL.startswith("rediss://")
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                ssl_cert_reqs="none" if is_ssl else None,
                decode_responses=True,
                socket_timeout=1.5,
                socket_connect_timeout=10.0,
                health_check_interval=30
            )
            # Test ping
            await self._redis.ping()
            self._connected = True
            logger.info("Successfully connected to Layerbase Redis cache.")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis at {settings.REDIS_URL}: {e}. Falling back to in-memory cache.")
            self._redis = None
            self._connected = False

    async def get_json(self, key: str) -> Optional[Any]:
        if not self._initialized:
            await self.initialize()

        # Try Redis first
        if self._connected and self._redis:
            try:
                val = await self._redis.get(key)
                if val:
                    return json.loads(val)
                return None
            except Exception as e:
                logger.warning(f"Redis get error for key '{key}': {e}. Checking in-memory.")

        # In-memory fallback
        now = time.time()
        if key in self._in_memory:
            expiry, payload = self._in_memory[key]
            if now < expiry:
                return json.loads(payload)
            else:
                del self._in_memory[key]
        return None

    async def set_json(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        if not self._initialized:
            await self.initialize()

        ttl_seconds = ttl if ttl is not None else settings.CACHE_DEFAULT_TTL
        payload = json.dumps(value)

        # Try Redis
        if self._connected and self._redis:
            try:
                await self._redis.set(key, payload, ex=ttl_seconds)
                return True
            except Exception as e:
                logger.warning(f"Redis set error for key '{key}': {e}. Falling back to in-memory.")

        # In-memory fallback
        self._in_memory[key] = (time.time() + ttl_seconds, payload)
        return True

    async def delete(self, key: str):
        if not self._initialized:
            await self.initialize()
        if self._connected and self._redis:
            try:
                await self._redis.delete(key)
            except Exception:
                pass
        self._in_memory.pop(key, None)

    def is_connected(self) -> bool:
        return self._connected

cache_service = CacheService()
