"""
Tests for CF-X Router Rate Limiting Module.

Includes property-based tests using Hypothesis.
"""

import pytest
from hypothesis import given, strategies as st, settings
from datetime import datetime, timezone

from cfx.rate_limit import RateLimiter, RateLimitConfig


# =============================================================================
# Property Tests
# =============================================================================

class TestRateLimitProperties:
    """
    Property-based tests for rate limiting.
    
    **Feature: cfx-router, Property 3: Rate Limit Enforcement**
    **Feature: cfx-router, Property 4: Rate Limit Atomicity**
    **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
    """
    
    @given(
        limit=st.integers(min_value=1, max_value=100),
        num_requests=st.integers(min_value=1, max_value=50)
    )
    @settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_property_rate_limit_enforcement(
        self, limit: int, num_requests: int
    ):
        """
        Property 3: Rate Limit Enforcement
        
        *For any* rate limit and number of requests, requests within the limit
        should be allowed, and requests exceeding the limit should be denied.
        
        **Validates: Requirements 2.1, 2.2, 2.3**
        """
        config = RateLimitConfig(daily_limit=limit)
        limiter = RateLimiter(config, db_pool=None)
        user_id = "test-user"
        
        allowed_count = 0
        denied_count = 0
        
        for i in range(num_requests):
            allowed, remaining, reset_time = await limiter.check_and_increment(user_id)
            if allowed:
                allowed_count += 1
            else:
                denied_count += 1
        
        # First `limit` requests should be allowed
        expected_allowed = min(limit, num_requests)
        expected_denied = max(0, num_requests - limit)
        
        assert allowed_count == expected_allowed, \
            f"Expected {expected_allowed} allowed, got {allowed_count}"
        assert denied_count == expected_denied, \
            f"Expected {expected_denied} denied, got {denied_count}"
    
    @given(
        limit=st.integers(min_value=1, max_value=100)
    )
    @settings(max_examples=50)
    @pytest.mark.asyncio
    async def test_property_remaining_decreases(self, limit: int):
        """
        Property: Remaining count decreases with each request.
        
        *For any* rate limit, the remaining count should decrease by 1
        with each request until it reaches 0.
        
        **Validates: Requirements 2.5**
        """
        config = RateLimitConfig(daily_limit=limit)
        limiter = RateLimiter(config, db_pool=None)
        user_id = "test-user"
        
        for i in range(min(limit + 5, 30)):  # Cap iterations for speed
            allowed, remaining, reset_time = await limiter.check_and_increment(user_id)
            
            if i < limit:
                # Before hitting limit, remaining should decrease
                expected_remaining = limit - (i + 1)
                assert remaining == expected_remaining, \
                    f"Request {i+1}: expected remaining {expected_remaining}, got {remaining}"
            else:
                # After hitting limit, remaining should be 0
                assert remaining == 0, \
                    f"Request {i+1}: remaining should be 0 after limit"
    
    @given(
        limit=st.integers(min_value=1, max_value=100),
        num_users=st.integers(min_value=2, max_value=5)
    )
    @settings(max_examples=50)
    @pytest.mark.asyncio
    async def test_property_user_isolation(self, limit: int, num_users: int):
        """
        Property: Rate limits are isolated per user.
        
        *For any* number of users, each user should have their own
        independent rate limit counter.
        
        **Validates: Requirements 2.1**
        """
        config = RateLimitConfig(daily_limit=limit)
        limiter = RateLimiter(config, db_pool=None)
        users = [f"user-{i}" for i in range(num_users)]
        
        # Each user makes one request
        for user_id in users:
            allowed, remaining, reset_time = await limiter.check_and_increment(user_id)
            
            # First request for each user should be allowed
            assert allowed, f"First request for user should be allowed"
            assert remaining == limit - 1, f"Remaining should be limit - 1"


# =============================================================================
# Unit Tests
# =============================================================================

class TestRateLimitConfig:
    """Unit tests for RateLimitConfig."""
    
    def test_default_values(self):
        """Should have sensible defaults."""
        config = RateLimitConfig()
        assert config.daily_limit == 1000


class TestRateLimiter:
    """Unit tests for RateLimiter."""
    
    @pytest.mark.asyncio
    async def test_first_request_allowed(self):
        """First request should always be allowed."""
        config = RateLimitConfig(daily_limit=1000)
        limiter = RateLimiter(config, db_pool=None)
        
        allowed, remaining, reset_time = await limiter.check_and_increment("user-1")
        
        assert allowed is True
        assert remaining == 999
    
    @pytest.mark.asyncio
    async def test_limit_exceeded(self):
        """Request exceeding limit should be denied."""
        config = RateLimitConfig(daily_limit=5)
        limiter = RateLimiter(config, db_pool=None)
        
        # Make requests up to limit
        for _ in range(5):
            await limiter.check_and_increment("user-1")
        
        # Next request should be denied
        allowed, remaining, reset_time = await limiter.check_and_increment("user-1")
        
        assert allowed is False
        assert remaining == 0
    
    @pytest.mark.asyncio
    async def test_get_status(self):
        """Should return correct status."""
        config = RateLimitConfig(daily_limit=1000)
        limiter = RateLimiter(config, db_pool=None)
        
        # Initially 0
        current, remaining, reset_time = await limiter.get_status("user-1")
        assert current == 0
        assert remaining == 1000
        
        # After 3 requests
        for _ in range(3):
            await limiter.check_and_increment("user-1")
        
        current, remaining, reset_time = await limiter.get_status("user-1")
        assert current == 3
        assert remaining == 997
    
    @pytest.mark.asyncio
    async def test_different_users_independent(self):
        """Different users should have independent counters."""
        config = RateLimitConfig(daily_limit=1000)
        limiter = RateLimiter(config, db_pool=None)
        
        # User 1 makes 5 requests
        for _ in range(5):
            await limiter.check_and_increment("user-1")
        
        # User 2's first request should still be allowed
        allowed, remaining, reset_time = await limiter.check_and_increment("user-2")
        
        assert allowed is True
        assert remaining == 999
    
    @pytest.mark.asyncio
    async def test_reset_at_is_tomorrow(self):
        """Reset time should be midnight tomorrow UTC."""
        config = RateLimitConfig(daily_limit=1000)
        limiter = RateLimiter(config, db_pool=None)
        
        allowed, remaining, reset_time = await limiter.check_and_increment("user-1")
        
        now = datetime.now(timezone.utc)
        assert reset_time > now
        assert reset_time.hour == 0
        assert reset_time.minute == 0
        assert reset_time.second == 0
    
    @pytest.mark.asyncio
    async def test_reset_usage(self):
        """Should reset usage counter."""
        config = RateLimitConfig(daily_limit=1000)
        limiter = RateLimiter(config, db_pool=None)
        
        # Make some requests
        for _ in range(5):
            await limiter.check_and_increment("user-1")
        
        # Reset
        await limiter.reset_usage("user-1")
        
        # Should be back to 0
        current, remaining, reset_time = await limiter.get_status("user-1")
        assert current == 0
        assert remaining == 1000
