"""
CF-X Router Concurrency Limiter Module

Limits concurrent streaming requests per user to prevent resource exhaustion.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class ConcurrencyConfig:
    """Configuration for concurrency limiter."""
    max_concurrent_streams: int = 3  # Max concurrent streaming requests per user
    cleanup_interval: float = 60.0   # Seconds between cleanup runs


class ConcurrencyLimitExceeded(Exception):
    """Raised when user exceeds concurrent stream limit."""
    
    def __init__(self, user_id: str, current: int, limit: int):
        self.user_id = user_id
        self.current = current
        self.limit = limit
        super().__init__(
            f"User '{user_id}' has {current} active streams, limit is {limit}"
        )


class ConcurrencyLimiter:
    """
    Limits concurrent streaming requests per user.
    
    Only streaming requests count toward the limit.
    Non-streaming requests are exempt.
    
    Uses in-memory tracking with asyncio locks for thread safety.
    """
    
    def __init__(self, config: ConcurrencyConfig):
        """
        Initialize concurrency limiter.
        
        Args:
            config: Concurrency configuration
        """
        self.config = config
        self._active_streams: dict[str, int] = {}
        self._lock = asyncio.Lock()
    
    async def acquire(self, user_id: str, is_streaming: bool = True) -> bool:
        """
        Acquire a slot for a request.
        
        Args:
            user_id: User identifier
            is_streaming: Whether this is a streaming request
            
        Returns:
            True if slot acquired, False if limit exceeded
            
        Note:
            Non-streaming requests always succeed (exempt from limit).
        """
        # Non-streaming requests are exempt
        if not is_streaming:
            return True
        
        async with self._lock:
            current = self._active_streams.get(user_id, 0)
            
            if current >= self.config.max_concurrent_streams:
                logger.warning(
                    f"Concurrency limit exceeded for user '{user_id}': "
                    f"{current}/{self.config.max_concurrent_streams}"
                )
                return False
            
            self._active_streams[user_id] = current + 1
            logger.debug(
                f"Acquired stream slot for user '{user_id}': "
                f"{current + 1}/{self.config.max_concurrent_streams}"
            )
            return True
    
    async def release(self, user_id: str, is_streaming: bool = True) -> None:
        """
        Release a slot after request completes.
        
        Args:
            user_id: User identifier
            is_streaming: Whether this was a streaming request
            
        Note:
            Non-streaming requests don't need to release (they never acquired).
        """
        # Non-streaming requests never acquired a slot
        if not is_streaming:
            return
        
        async with self._lock:
            current = self._active_streams.get(user_id, 0)
            
            if current > 0:
                self._active_streams[user_id] = current - 1
                logger.debug(
                    f"Released stream slot for user '{user_id}': "
                    f"{current - 1}/{self.config.max_concurrent_streams}"
                )
                
                # Clean up if no active streams
                if self._active_streams[user_id] == 0:
                    del self._active_streams[user_id]
            else:
                logger.warning(
                    f"Attempted to release non-existent slot for user '{user_id}'"
                )
    
    async def get_active_count(self, user_id: str) -> int:
        """
        Get number of active streams for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Number of active streaming requests
        """
        async with self._lock:
            return self._active_streams.get(user_id, 0)
    
    async def get_remaining(self, user_id: str) -> int:
        """
        Get remaining available slots for a user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Number of available slots
        """
        async with self._lock:
            current = self._active_streams.get(user_id, 0)
            return max(0, self.config.max_concurrent_streams - current)
    
    async def get_stats(self) -> dict:
        """
        Get concurrency limiter statistics.
        
        Returns:
            Dictionary with stats
        """
        async with self._lock:
            total_active = sum(self._active_streams.values())
            return {
                "total_active_streams": total_active,
                "users_with_active_streams": len(self._active_streams),
                "max_concurrent_per_user": self.config.max_concurrent_streams,
                "active_by_user": dict(self._active_streams),
            }
    
    async def reset(self) -> None:
        """Reset all tracking (for testing)."""
        async with self._lock:
            self._active_streams.clear()
            logger.info("Concurrency limiter reset")


class ConcurrencyContext:
    """
    Async context manager for automatic acquire/release.
    
    Usage:
        async with ConcurrencyContext(limiter, user_id, is_streaming=True):
            # Do streaming work
            pass
    """
    
    def __init__(
        self,
        limiter: ConcurrencyLimiter,
        user_id: str,
        is_streaming: bool = True,
    ):
        """
        Initialize context.
        
        Args:
            limiter: ConcurrencyLimiter instance
            user_id: User identifier
            is_streaming: Whether this is a streaming request
        """
        self.limiter = limiter
        self.user_id = user_id
        self.is_streaming = is_streaming
        self._acquired = False
    
    async def __aenter__(self) -> "ConcurrencyContext":
        """Acquire slot on entry."""
        self._acquired = await self.limiter.acquire(self.user_id, self.is_streaming)
        
        if not self._acquired and self.is_streaming:
            current = await self.limiter.get_active_count(self.user_id)
            raise ConcurrencyLimitExceeded(
                self.user_id,
                current,
                self.limiter.config.max_concurrent_streams,
            )
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Release slot on exit."""
        if self._acquired:
            await self.limiter.release(self.user_id, self.is_streaming)
