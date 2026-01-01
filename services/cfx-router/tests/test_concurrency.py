"""
Tests for CF-X Router Concurrency Limiter Module.

Includes property-based tests using Hypothesis.
"""

import asyncio
import pytest
from hypothesis import given, strategies as st, settings, assume

from cfx.concurrency import (
    ConcurrencyLimiter,
    ConcurrencyConfig,
    ConcurrencyContext,
    ConcurrencyLimitExceeded,
)


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def config() -> ConcurrencyConfig:
    """Create test configuration."""
    return ConcurrencyConfig(
        max_concurrent_streams=3,
        cleanup_interval=60.0,
    )


@pytest.fixture
def limiter(config: ConcurrencyConfig) -> ConcurrencyLimiter:
    """Create test concurrency limiter."""
    return ConcurrencyLimiter(config)


# =============================================================================
# Property Tests
# =============================================================================

class TestConcurrencyLimiterProperties:
    """
    Property-based tests for Concurrency Limiter.
    
    **Feature: cfx-router, Property 14: Concurrency Limit Enforcement**
    **Feature: cfx-router, Property 15: Non-Streaming Concurrency Exemption**
    **Validates: Requirements 8.1, 8.2, 8.4, 8.5**
    """
    
    @given(
        max_concurrent=st.integers(min_value=1, max_value=10),
        num_acquires=st.integers(min_value=1, max_value=20),
    )
    @settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_property_enforces_limit(
        self, max_concurrent: int, num_acquires: int
    ):
        """
        Property 14: Concurrency limit is strictly enforced.
        
        *For any* max_concurrent limit N and number of acquire attempts M:
        - First N acquires should succeed
        - Acquires N+1 to M should fail
        
        **Validates: Requirements 8.1, 8.2**
        """
        config = ConcurrencyConfig(max_concurrent_streams=max_concurrent)
        limiter = ConcurrencyLimiter(config)
        user_id = "test-user"
        
        successful_acquires = 0
        failed_acquires = 0
        
        for _ in range(num_acquires):
            result = await limiter.acquire(user_id, is_streaming=True)
            if result:
                successful_acquires += 1
            else:
                failed_acquires += 1
        
        # Should have exactly max_concurrent successful acquires
        assert successful_acquires == min(max_concurrent, num_acquires), \
            f"Expected {min(max_concurrent, num_acquires)} successful acquires, got {successful_acquires}"
        
        # Remaining should fail
        expected_failures = max(0, num_acquires - max_concurrent)
        assert failed_acquires == expected_failures, \
            f"Expected {expected_failures} failed acquires, got {failed_acquires}"
    
    @given(
        max_concurrent=st.integers(min_value=1, max_value=5),
        num_non_streaming=st.integers(min_value=1, max_value=50),
    )
    @settings(max_examples=50)
    @pytest.mark.asyncio
    async def test_property_non_streaming_exempt(
        self, max_concurrent: int, num_non_streaming: int
    ):
        """
        Property 15: Non-streaming requests are exempt from concurrency limit.
        
        *For any* number of non-streaming requests, all should succeed
        regardless of the concurrency limit.
        
        **Validates: Requirements 8.4, 8.5**
        """
        config = ConcurrencyConfig(max_concurrent_streams=max_concurrent)
        limiter = ConcurrencyLimiter(config)
        user_id = "test-user"
        
        # All non-streaming acquires should succeed
        for i in range(num_non_streaming):
            result = await limiter.acquire(user_id, is_streaming=False)
            assert result is True, \
                f"Non-streaming acquire {i+1} should always succeed"
        
        # Active count should still be 0 (non-streaming don't count)
        active = await limiter.get_active_count(user_id)
        assert active == 0, \
            "Non-streaming requests should not affect active count"
    
    @given(
        max_concurrent=st.integers(min_value=1, max_value=5),
        acquire_release_pairs=st.integers(min_value=1, max_value=20),
    )
    @settings(max_examples=50)
    @pytest.mark.asyncio
    async def test_property_acquire_release_balance(
        self, max_concurrent: int, acquire_release_pairs: int
    ):
        """
        Property: Acquire and release operations are balanced.
        
        *For any* sequence of acquire-release pairs, the final active count
        should be 0.
        
        **Validates: Requirement 8.3**
        """
        config = ConcurrencyConfig(max_concurrent_streams=max_concurrent)
        limiter = ConcurrencyLimiter(config)
        user_id = "test-user"
        
        # Acquire and release in pairs
        for _ in range(acquire_release_pairs):
            await limiter.acquire(user_id, is_streaming=True)
            await limiter.release(user_id, is_streaming=True)
        
        # Should be back to 0
        active = await limiter.get_active_count(user_id)
        assert active == 0, \
            f"After balanced acquire/release, active should be 0, got {active}"
    
    @given(
        max_concurrent=st.integers(min_value=2, max_value=5),
        num_users=st.integers(min_value=2, max_value=5),
    )
    @settings(max_examples=50)
    @pytest.mark.asyncio
    async def test_property_per_user_isolation(
        self, max_concurrent: int, num_users: int
    ):
        """
        Property: Concurrency limits are per-user, not global.
        
        *For any* number of users, each user should have their own
        independent concurrency limit.
        
        **Validates: Requirement 8.1**
        """
        config = ConcurrencyConfig(max_concurrent_streams=max_concurrent)
        limiter = ConcurrencyLimiter(config)
        
        # Each user should be able to acquire max_concurrent slots
        for user_num in range(num_users):
            user_id = f"user-{user_num}"
            
            for i in range(max_concurrent):
                result = await limiter.acquire(user_id, is_streaming=True)
                assert result is True, \
                    f"User {user_id} should be able to acquire slot {i+1}"
            
            # Next acquire should fail
            result = await limiter.acquire(user_id, is_streaming=True)
            assert result is False, \
                f"User {user_id} should not exceed limit"
        
        # Total active should be num_users * max_concurrent
        stats = await limiter.get_stats()
        assert stats["total_active_streams"] == num_users * max_concurrent


# =============================================================================
# Unit Tests
# =============================================================================

class TestConcurrencyConfig:
    """Unit tests for ConcurrencyConfig."""
    
    def test_default_values(self):
        """Should have sensible defaults."""
        config = ConcurrencyConfig()
        
        assert config.max_concurrent_streams == 3
        assert config.cleanup_interval == 60.0


class TestConcurrencyLimiter:
    """Unit tests for ConcurrencyLimiter."""
    
    @pytest.mark.asyncio
    async def test_acquire_success(self, limiter: ConcurrencyLimiter):
        """Should allow acquire within limit."""
        result = await limiter.acquire("user-1", is_streaming=True)
        assert result is True
    
    @pytest.mark.asyncio
    async def test_acquire_at_limit(self, limiter: ConcurrencyLimiter):
        """Should reject acquire at limit."""
        user_id = "user-1"
        
        # Fill up to limit
        for _ in range(limiter.config.max_concurrent_streams):
            await limiter.acquire(user_id, is_streaming=True)
        
        # Next should fail
        result = await limiter.acquire(user_id, is_streaming=True)
        assert result is False
    
    @pytest.mark.asyncio
    async def test_release_frees_slot(self, limiter: ConcurrencyLimiter):
        """Should free slot on release."""
        user_id = "user-1"
        
        # Fill up to limit
        for _ in range(limiter.config.max_concurrent_streams):
            await limiter.acquire(user_id, is_streaming=True)
        
        # Release one
        await limiter.release(user_id, is_streaming=True)
        
        # Should be able to acquire again
        result = await limiter.acquire(user_id, is_streaming=True)
        assert result is True
    
    @pytest.mark.asyncio
    async def test_non_streaming_always_succeeds(self, limiter: ConcurrencyLimiter):
        """Non-streaming requests should always succeed."""
        user_id = "user-1"
        
        # Fill streaming slots
        for _ in range(limiter.config.max_concurrent_streams):
            await limiter.acquire(user_id, is_streaming=True)
        
        # Non-streaming should still work
        result = await limiter.acquire(user_id, is_streaming=False)
        assert result is True
    
    @pytest.mark.asyncio
    async def test_non_streaming_release_is_noop(self, limiter: ConcurrencyLimiter):
        """Non-streaming release should be a no-op."""
        user_id = "user-1"
        
        # Acquire streaming
        await limiter.acquire(user_id, is_streaming=True)
        
        # Release non-streaming (should not affect count)
        await limiter.release(user_id, is_streaming=False)
        
        # Should still have 1 active
        active = await limiter.get_active_count(user_id)
        assert active == 1
    
    @pytest.mark.asyncio
    async def test_get_active_count(self, limiter: ConcurrencyLimiter):
        """Should return correct active count."""
        user_id = "user-1"
        
        assert await limiter.get_active_count(user_id) == 0
        
        await limiter.acquire(user_id, is_streaming=True)
        assert await limiter.get_active_count(user_id) == 1
        
        await limiter.acquire(user_id, is_streaming=True)
        assert await limiter.get_active_count(user_id) == 2
    
    @pytest.mark.asyncio
    async def test_get_remaining(self, limiter: ConcurrencyLimiter):
        """Should return correct remaining slots."""
        user_id = "user-1"
        max_slots = limiter.config.max_concurrent_streams
        
        assert await limiter.get_remaining(user_id) == max_slots
        
        await limiter.acquire(user_id, is_streaming=True)
        assert await limiter.get_remaining(user_id) == max_slots - 1
    
    @pytest.mark.asyncio
    async def test_get_stats(self, limiter: ConcurrencyLimiter):
        """Should return statistics."""
        await limiter.acquire("user-1", is_streaming=True)
        await limiter.acquire("user-2", is_streaming=True)
        
        stats = await limiter.get_stats()
        
        assert stats["total_active_streams"] == 2
        assert stats["users_with_active_streams"] == 2
        assert stats["max_concurrent_per_user"] == limiter.config.max_concurrent_streams
    
    @pytest.mark.asyncio
    async def test_reset(self, limiter: ConcurrencyLimiter):
        """Should reset all tracking."""
        await limiter.acquire("user-1", is_streaming=True)
        await limiter.acquire("user-2", is_streaming=True)
        
        await limiter.reset()
        
        stats = await limiter.get_stats()
        assert stats["total_active_streams"] == 0
        assert stats["users_with_active_streams"] == 0
    
    @pytest.mark.asyncio
    async def test_release_nonexistent_is_safe(self, limiter: ConcurrencyLimiter):
        """Releasing non-existent slot should be safe."""
        # Should not raise
        await limiter.release("nonexistent-user", is_streaming=True)
    
    @pytest.mark.asyncio
    async def test_cleanup_on_zero(self, limiter: ConcurrencyLimiter):
        """Should clean up user entry when count reaches 0."""
        user_id = "user-1"
        
        await limiter.acquire(user_id, is_streaming=True)
        await limiter.release(user_id, is_streaming=True)
        
        # User should be removed from tracking
        stats = await limiter.get_stats()
        assert user_id not in stats["active_by_user"]


class TestConcurrencyContext:
    """Unit tests for ConcurrencyContext."""
    
    @pytest.mark.asyncio
    async def test_context_acquires_and_releases(self, limiter: ConcurrencyLimiter):
        """Should acquire on enter and release on exit."""
        user_id = "user-1"
        
        async with ConcurrencyContext(limiter, user_id, is_streaming=True):
            active = await limiter.get_active_count(user_id)
            assert active == 1
        
        # After exit, should be released
        active = await limiter.get_active_count(user_id)
        assert active == 0
    
    @pytest.mark.asyncio
    async def test_context_raises_on_limit(self, limiter: ConcurrencyLimiter):
        """Should raise ConcurrencyLimitExceeded when limit reached."""
        user_id = "user-1"
        
        # Fill up slots
        for _ in range(limiter.config.max_concurrent_streams):
            await limiter.acquire(user_id, is_streaming=True)
        
        # Context should raise
        with pytest.raises(ConcurrencyLimitExceeded) as exc_info:
            async with ConcurrencyContext(limiter, user_id, is_streaming=True):
                pass
        
        assert exc_info.value.user_id == user_id
        assert exc_info.value.limit == limiter.config.max_concurrent_streams
    
    @pytest.mark.asyncio
    async def test_context_releases_on_exception(self, limiter: ConcurrencyLimiter):
        """Should release slot even if exception occurs."""
        user_id = "user-1"
        
        with pytest.raises(ValueError):
            async with ConcurrencyContext(limiter, user_id, is_streaming=True):
                raise ValueError("test error")
        
        # Should still be released
        active = await limiter.get_active_count(user_id)
        assert active == 0
    
    @pytest.mark.asyncio
    async def test_context_non_streaming_no_acquire(self, limiter: ConcurrencyLimiter):
        """Non-streaming context should not acquire slot."""
        user_id = "user-1"
        
        async with ConcurrencyContext(limiter, user_id, is_streaming=False):
            active = await limiter.get_active_count(user_id)
            assert active == 0  # Non-streaming doesn't count
    
    @pytest.mark.asyncio
    async def test_nested_contexts(self, limiter: ConcurrencyLimiter):
        """Should handle nested contexts correctly."""
        user_id = "user-1"
        
        async with ConcurrencyContext(limiter, user_id, is_streaming=True):
            assert await limiter.get_active_count(user_id) == 1
            
            async with ConcurrencyContext(limiter, user_id, is_streaming=True):
                assert await limiter.get_active_count(user_id) == 2
            
            assert await limiter.get_active_count(user_id) == 1
        
        assert await limiter.get_active_count(user_id) == 0


class TestConcurrentAccess:
    """Tests for concurrent access scenarios."""
    
    @pytest.mark.asyncio
    async def test_concurrent_acquires(self, limiter: ConcurrencyLimiter):
        """Should handle concurrent acquire attempts correctly."""
        user_id = "user-1"
        max_slots = limiter.config.max_concurrent_streams
        
        # Try to acquire more than limit concurrently
        tasks = [
            limiter.acquire(user_id, is_streaming=True)
            for _ in range(max_slots + 5)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Exactly max_slots should succeed
        successful = sum(1 for r in results if r)
        assert successful == max_slots
    
    @pytest.mark.asyncio
    async def test_concurrent_acquire_release(self, limiter: ConcurrencyLimiter):
        """Should handle concurrent acquire and release correctly."""
        user_id = "user-1"
        
        async def acquire_work_release():
            acquired = await limiter.acquire(user_id, is_streaming=True)
            if acquired:
                await asyncio.sleep(0.01)  # Simulate work
                await limiter.release(user_id, is_streaming=True)
            return acquired
        
        # Run many concurrent operations
        tasks = [acquire_work_release() for _ in range(20)]
        await asyncio.gather(*tasks)
        
        # Should end up with 0 active
        active = await limiter.get_active_count(user_id)
        assert active == 0
