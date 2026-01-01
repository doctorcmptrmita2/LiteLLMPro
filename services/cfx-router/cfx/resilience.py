"""
CF-X Router Resilience Module

Provides circuit breaker pattern for handling upstream failures.
"""

import asyncio
import logging
import time
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, TypeVar, Optional

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CircuitState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation, requests pass through
    OPEN = "open"          # Failing, requests are rejected
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""
    failure_threshold: int = 5      # Consecutive failures before opening
    recovery_timeout: float = 30.0  # Seconds before trying half-open
    half_open_max_calls: int = 1    # Max calls in half-open state


class CircuitBreaker:
    """
    Circuit breaker for protecting against cascading failures.
    
    States:
    - CLOSED: Normal operation, all requests pass through
    - OPEN: Service is failing, requests are immediately rejected
    - HALF_OPEN: Testing if service recovered, limited requests allowed
    
    Transitions:
    - CLOSED → OPEN: After `failure_threshold` consecutive failures
    - OPEN → HALF_OPEN: After `recovery_timeout` seconds
    - HALF_OPEN → CLOSED: On successful request
    - HALF_OPEN → OPEN: On failed request
    """
    
    def __init__(self, config: CircuitBreakerConfig, name: str = "default"):
        """
        Initialize circuit breaker.
        
        Args:
            config: Circuit breaker configuration
            name: Name for logging purposes
        """
        self.config = config
        self.name = name
        
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time: Optional[float] = None
        self._half_open_calls = 0
        self._lock = asyncio.Lock()
    
    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        return self._state
    
    @property
    def is_closed(self) -> bool:
        """Check if circuit is closed (normal operation)."""
        return self._state == CircuitState.CLOSED
    
    @property
    def is_open(self) -> bool:
        """Check if circuit is open (rejecting requests)."""
        return self._state == CircuitState.OPEN
    
    @property
    def is_half_open(self) -> bool:
        """Check if circuit is half-open (testing recovery)."""
        return self._state == CircuitState.HALF_OPEN
    
    async def _check_state_transition(self) -> None:
        """Check if state should transition based on time."""
        if self._state == CircuitState.OPEN:
            if self._last_failure_time is not None:
                elapsed = time.monotonic() - self._last_failure_time
                if elapsed >= self.config.recovery_timeout:
                    logger.info(
                        f"Circuit '{self.name}' transitioning from OPEN to HALF_OPEN "
                        f"after {elapsed:.1f}s"
                    )
                    self._state = CircuitState.HALF_OPEN
                    self._half_open_calls = 0
    
    async def can_execute(self) -> bool:
        """
        Check if a request can be executed.
        
        Returns:
            True if request should proceed, False if circuit is open
        """
        async with self._lock:
            await self._check_state_transition()
            
            if self._state == CircuitState.CLOSED:
                return True
            
            if self._state == CircuitState.HALF_OPEN:
                if self._half_open_calls < self.config.half_open_max_calls:
                    self._half_open_calls += 1
                    return True
                return False
            
            # OPEN state
            return False
    
    async def record_success(self) -> None:
        """Record a successful request."""
        async with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                logger.info(f"Circuit '{self.name}' transitioning from HALF_OPEN to CLOSED")
                self._state = CircuitState.CLOSED
            
            self._failure_count = 0
    
    async def record_failure(self) -> None:
        """Record a failed request."""
        async with self._lock:
            self._failure_count += 1
            self._last_failure_time = time.monotonic()
            
            if self._state == CircuitState.HALF_OPEN:
                logger.warning(
                    f"Circuit '{self.name}' transitioning from HALF_OPEN to OPEN "
                    f"(test request failed)"
                )
                self._state = CircuitState.OPEN
                self._half_open_calls = 0
            
            elif self._state == CircuitState.CLOSED:
                if self._failure_count >= self.config.failure_threshold:
                    logger.warning(
                        f"Circuit '{self.name}' transitioning from CLOSED to OPEN "
                        f"after {self._failure_count} consecutive failures"
                    )
                    self._state = CircuitState.OPEN
    
    async def execute(
        self,
        func: Callable[..., Any],
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        """
        Execute a function with circuit breaker protection.
        
        Args:
            func: Async function to execute
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func
            
        Returns:
            Result of func
            
        Raises:
            CircuitOpenError: If circuit is open
            Exception: Any exception from func (also records failure)
        """
        if not await self.can_execute():
            raise CircuitOpenError(
                f"Circuit '{self.name}' is open, request rejected"
            )
        
        try:
            result = await func(*args, **kwargs)
            await self.record_success()
            return result
        except Exception as e:
            await self.record_failure()
            raise
    
    async def reset(self) -> None:
        """Reset circuit breaker to closed state."""
        async with self._lock:
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            self._last_failure_time = None
            self._half_open_calls = 0
            logger.info(f"Circuit '{self.name}' reset to CLOSED")
    
    def get_stats(self) -> dict[str, Any]:
        """Get circuit breaker statistics."""
        return {
            "name": self.name,
            "state": self._state.value,
            "failure_count": self._failure_count,
            "last_failure_time": self._last_failure_time,
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "recovery_timeout": self.config.recovery_timeout,
            },
        }


class CircuitOpenError(Exception):
    """Raised when circuit breaker is open."""
    pass


class CircuitBreakerRegistry:
    """
    Registry for managing multiple circuit breakers.
    
    Useful for having separate circuits for different services/models.
    """
    
    def __init__(self, default_config: Optional[CircuitBreakerConfig] = None):
        """
        Initialize registry.
        
        Args:
            default_config: Default config for new circuit breakers
        """
        self.default_config = default_config or CircuitBreakerConfig()
        self._breakers: dict[str, CircuitBreaker] = {}
        self._lock = asyncio.Lock()
    
    async def get(self, name: str) -> CircuitBreaker:
        """
        Get or create a circuit breaker by name.
        
        Args:
            name: Circuit breaker name
            
        Returns:
            CircuitBreaker instance
        """
        async with self._lock:
            if name not in self._breakers:
                self._breakers[name] = CircuitBreaker(
                    config=self.default_config,
                    name=name,
                )
            return self._breakers[name]
    
    async def get_all_stats(self) -> list[dict[str, Any]]:
        """Get statistics for all circuit breakers."""
        return [cb.get_stats() for cb in self._breakers.values()]
    
    async def reset_all(self) -> None:
        """Reset all circuit breakers."""
        for cb in self._breakers.values():
            await cb.reset()
