"""
CF-X Router Rate Limiting Module

Provides daily request rate limiting per user with atomic operations.
"""

import logging
from dataclasses import dataclass
from datetime import date, datetime, timezone, timedelta
from typing import Any, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Configuration for rate limiter."""
    daily_limit: int = 1000


class RateLimiter:
    """
    Rate limiter with atomic operations.
    
    Supports both PostgreSQL (production) and in-memory (development) backends.
    """
    
    def __init__(self, config: RateLimitConfig, db_pool: Optional[Any] = None):
        """
        Initialize rate limiter.
        
        Args:
            config: Rate limit configuration
            db_pool: Database connection pool (optional, uses in-memory if None)
        """
        self.config = config
        self.db_pool = db_pool
        
        # In-memory storage for development
        self._counters: dict[str, int] = {}
        self._last_reset: Optional[date] = None
    
    def _get_today_utc(self) -> date:
        """Get current UTC date."""
        return datetime.now(timezone.utc).date()
    
    def _get_reset_time(self) -> datetime:
        """Get next reset time (midnight UTC)."""
        today = self._get_today_utc()
        tomorrow = today + timedelta(days=1)
        return datetime(
            tomorrow.year, tomorrow.month, tomorrow.day,
            0, 0, 0, tzinfo=timezone.utc
        )
    
    def _maybe_reset_memory(self) -> None:
        """Reset in-memory counters if day changed."""
        today = self._get_today_utc()
        if self._last_reset != today:
            self._counters.clear()
            self._last_reset = today
    
    async def check_and_increment(
        self,
        user_id: str,
    ) -> Tuple[bool, int, datetime]:
        """
        Check rate limit and increment counter atomically.
        
        Args:
            user_id: User identifier
            
        Returns:
            Tuple of (allowed, remaining, reset_time)
        """
        reset_time = self._get_reset_time()
        limit = self.config.daily_limit
        
        # Use database if available
        if self.db_pool is not None:
            return await self._check_db(user_id, limit, reset_time)
        
        # Fall back to in-memory
        return await self._check_memory(user_id, limit, reset_time)
    
    async def _check_db(
        self,
        user_id: str,
        limit: int,
        reset_time: datetime,
    ) -> Tuple[bool, int, datetime]:
        """Check rate limit using database."""
        today = self._get_today_utc()
        
        try:
            async with self.db_pool.acquire() as conn:
                # Atomic upsert and check
                row = await conn.fetchrow(
                    """
                    INSERT INTO usage_counters (user_id, day, request_count)
                    VALUES ($1, $2, 1)
                    ON CONFLICT (user_id, day)
                    DO UPDATE SET 
                        request_count = usage_counters.request_count + 1,
                        updated_at = NOW()
                    RETURNING request_count
                    """,
                    user_id,
                    today
                )
                
                current_count = row["request_count"]
                allowed = current_count <= limit
                remaining = max(0, limit - current_count)
                
                return (allowed, remaining, reset_time)
                
        except Exception as e:
            logger.error(f"Database error in rate limiter: {e}")
            # On error, allow the request but log it
            return (True, limit, reset_time)
    
    async def _check_memory(
        self,
        user_id: str,
        limit: int,
        reset_time: datetime,
    ) -> Tuple[bool, int, datetime]:
        """Check rate limit using in-memory storage."""
        self._maybe_reset_memory()
        
        current = self._counters.get(user_id, 0) + 1
        self._counters[user_id] = current
        
        allowed = current <= limit
        remaining = max(0, limit - current)
        
        return (allowed, remaining, reset_time)
    
    async def get_status(
        self,
        user_id: str,
    ) -> Tuple[int, int, datetime]:
        """
        Get current rate limit status without incrementing.
        
        Args:
            user_id: User identifier
            
        Returns:
            Tuple of (current_count, remaining, reset_time)
        """
        reset_time = self._get_reset_time()
        limit = self.config.daily_limit
        
        if self.db_pool is not None:
            today = self._get_today_utc()
            try:
                async with self.db_pool.acquire() as conn:
                    row = await conn.fetchrow(
                        """
                        SELECT request_count
                        FROM usage_counters
                        WHERE user_id = $1 AND day = $2
                        """,
                        user_id,
                        today
                    )
                    current = row["request_count"] if row else 0
            except Exception as e:
                logger.error(f"Database error getting status: {e}")
                current = 0
        else:
            self._maybe_reset_memory()
            current = self._counters.get(user_id, 0)
        
        remaining = max(0, limit - current)
        return (current, remaining, reset_time)
    
    async def reset_usage(self, user_id: str) -> None:
        """
        Reset usage counter for a user (admin function).
        
        Args:
            user_id: User to reset
        """
        if self.db_pool is not None:
            today = self._get_today_utc()
            try:
                async with self.db_pool.acquire() as conn:
                    await conn.execute(
                        """
                        UPDATE usage_counters
                        SET request_count = 0, updated_at = NOW()
                        WHERE user_id = $1 AND day = $2
                        """,
                        user_id,
                        today
                    )
            except Exception as e:
                logger.error(f"Database error resetting usage: {e}")
        else:
            self._maybe_reset_memory()
            if user_id in self._counters:
                self._counters[user_id] = 0
