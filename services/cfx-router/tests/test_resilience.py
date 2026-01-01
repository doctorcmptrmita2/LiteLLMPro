"""
Tests for CF-X Router Resilience Module.

Includes property-based tests using Hypothesis.
"""

import asyncio
import pytest
from hypothesis import given, strategies as st, settings, assume
from hypothesis.stateful import RuleBasedStateMachine, rule, invariant, initialize

from cfx.resilience import (
    CircuitBreaker,
    CircuitBreakerConfig,
    CircuitBreakerRegistry,
    CircuitState,
    CircuitOpenError,
)


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def config() -> CircuitBreakerConfig:
    """Create test configuration."""
    return CircuitBreakerConfig(
        failure_threshold=3,
        recovery_timeout=1.0,
        half_open_max_calls=1,
    )


@pytest.fixture
def circuit_breaker(config: CircuitBreakerConfig) -> CircuitBreaker:
    """Create test circuit breaker."""
    return CircuitBreaker(config, name="test")


# =============================================================================
# Property Tests
# =============================================================================

class TestCircuitBreakerProperties:
    """
    Property-based tests for Circuit Breaker.
    
    **Feature: cfx-router, Property 13: Circuit Breaker State Machine**
    **Validates: Requirements 7.1, 7.2, 7.4, 7.5**
    """
    
    @given(
        failure_threshold=st.integers(min_value=1, max_value=20),
        recovery_timeout=st.floats(min_value=0.1, max_value=60.0),
    )
    @settings(max_examples=50)
    def test_property_initial_state_is_closed(
        self, failure_threshold: int, recovery_timeout: float
    ):
        """
        Property: Circuit breaker always starts in CLOSED state.
        
        *For any* valid configuration, a new circuit breaker should be CLOSED.
        
        **Validates: Requirement 7.1**
        """
        config = CircuitBreakerConfig(
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
        )
        cb = CircuitBreaker(config, name="test")
        
        assert cb.state == CircuitState.CLOSED, "Initial state should be CLOSED"
        assert cb.is_closed is True
        assert cb.is_open is False
        assert cb.is_half_open is False
    
    @given(
        failure_threshold=st.integers(min_value=1, max_value=10),
        num_failures=st.integers(min_value=1, max_value=20),
    )
    @settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_property_opens_after_threshold_failures(
        self, failure_threshold: int, num_failures: int
    ):
        """
        Property 13: Circuit opens after exactly threshold consecutive failures.
        
        *For any* failure threshold N, the circuit should:
        - Stay CLOSED for failures 1 to N-1
        - Transition to OPEN on failure N
        
        **Validates: Requirements 7.1, 7.2**
        """
        config = CircuitBreakerConfig(
            failure_threshold=failure_threshold,
            recovery_timeout=60.0,  # Long timeout to prevent auto-recovery
        )
        cb = CircuitBreaker(config, name="test")
        
        for i in range(1, num_failures + 1):
            await cb.record_failure()
            
            if i < failure_threshold:
                assert cb.state == CircuitState.CLOSED, \
                    f"Should stay CLOSED after {i} failures (threshold={failure_threshold})"
            else:
                assert cb.state == CircuitState.OPEN, \
                    f"Should be OPEN after {i} failures (threshold={failure_threshold})"
    
    @given(
        failure_threshold=st.integers(min_value=1, max_value=5),
        successes_before_failure=st.integers(min_value=0, max_value=10),
    )
    @settings(max_examples=50)
    @pytest.mark.asyncio
    async def test_property_success_resets_failure_count(
        self, failure_threshold: int, successes_before_failure: int
    ):
        """
        Property: Success resets consecutive failure count.
        
        *For any* number of successes followed by failures less than threshold,
        the circuit should remain CLOSED.
        
        **Validates: Requirement 7.1**
        """
        config = CircuitBreakerConfig(
            failure_threshold=failure_threshold,
            recovery_timeout=60.0,
        )
        cb = CircuitBreaker(config, name="test")
        
        # Record some failures (less than threshold)
        for _ in range(failure_threshold - 1):
            await cb.record_failure()
        
        # Record a success - should reset counter
        await cb.record_success()
        
        # Record failures again (less than threshold)
        for _ in range(failure_threshold - 1):
            await cb.record_failure()
        
        # Should still be CLOSED because success reset the counter
        assert cb.state == CircuitState.CLOSED, \
            "Success should reset failure count"


class CircuitBreakerStateMachine(RuleBasedStateMachine):
    """
    Stateful property test for circuit breaker state machine.
    
    Tests all valid state transitions:
    - CLOSED → OPEN (after threshold failures)
    - OPEN → HALF_OPEN (after recovery timeout)
    - HALF_OPEN → CLOSED (on success)
    - HALF_OPEN → OPEN (on failure)
    
    **Feature: cfx-router, Property 13: Circuit Breaker State Machine**
    **Validates: Requirements 7.1, 7.2, 7.4, 7.5**
    """
    
    def __init__(self):
        super().__init__()
        self.config = CircuitBreakerConfig(
            failure_threshold=3,
            recovery_timeout=0.1,  # Short for testing
            half_open_max_calls=1,
        )
        self.cb = CircuitBreaker(self.config, name="state_machine_test")
        self.failure_count = 0
        self.expected_state = CircuitState.CLOSED
        # Create event loop for this state machine
        self._loop = asyncio.new_event_loop()
    
    def teardown(self):
        """Clean up event loop."""
        self._loop.close()
    
    def _run_async(self, coro):
        """Run async coroutine in our event loop."""
        return self._loop.run_until_complete(coro)
    
    @rule()
    def record_success(self):
        """Record a successful request."""
        self._run_async(self.cb.record_success())
        
        if self.expected_state == CircuitState.HALF_OPEN:
            self.expected_state = CircuitState.CLOSED
        
        self.failure_count = 0
    
    @rule()
    def record_failure(self):
        """Record a failed request."""
        self._run_async(self.cb.record_failure())
        
        if self.expected_state == CircuitState.HALF_OPEN:
            self.expected_state = CircuitState.OPEN
            self.failure_count = 1
        elif self.expected_state == CircuitState.CLOSED:
            self.failure_count += 1
            if self.failure_count >= self.config.failure_threshold:
                self.expected_state = CircuitState.OPEN
    
    @rule()
    def wait_for_recovery(self):
        """Wait for recovery timeout to elapse."""
        import time
        if self.expected_state == CircuitState.OPEN:
            time.sleep(self.config.recovery_timeout + 0.05)
            # State will transition on next can_execute check
    
    @rule()
    def check_can_execute(self):
        """Check if execution is allowed."""
        result = self._run_async(self.cb.can_execute())
        
        # Update expected state if transitioning from OPEN
        if self.expected_state == CircuitState.OPEN:
            # Check if enough time has passed
            if self.cb._last_failure_time is not None:
                import time
                elapsed = time.monotonic() - self.cb._last_failure_time
                if elapsed >= self.config.recovery_timeout:
                    self.expected_state = CircuitState.HALF_OPEN
        
        if self.expected_state == CircuitState.CLOSED:
            assert result is True, "CLOSED circuit should allow execution"
        elif self.expected_state == CircuitState.OPEN:
            assert result is False, "OPEN circuit should reject execution"
    
    @invariant()
    def state_is_valid(self):
        """Circuit state should always be one of the valid states."""
        assert self.cb.state in [
            CircuitState.CLOSED,
            CircuitState.OPEN,
            CircuitState.HALF_OPEN,
        ], f"Invalid state: {self.cb.state}"
    
    @invariant()
    def failure_count_non_negative(self):
        """Failure count should never be negative."""
        assert self.cb._failure_count >= 0, "Failure count should be non-negative"


# Run the state machine test
TestCircuitBreakerStateMachine = CircuitBreakerStateMachine.TestCase



# =============================================================================
# Unit Tests
# =============================================================================

class TestCircuitBreakerConfig:
    """Unit tests for CircuitBreakerConfig."""
    
    def test_default_values(self):
        """Should have sensible defaults."""
        config = CircuitBreakerConfig()
        
        assert config.failure_threshold == 5
        assert config.recovery_timeout == 30.0
        assert config.half_open_max_calls == 1


class TestCircuitBreaker:
    """Unit tests for CircuitBreaker."""
    
    @pytest.mark.asyncio
    async def test_initial_state(self, circuit_breaker: CircuitBreaker):
        """Should start in CLOSED state."""
        assert circuit_breaker.state == CircuitState.CLOSED
        assert circuit_breaker.is_closed is True
        assert circuit_breaker.is_open is False
        assert circuit_breaker.is_half_open is False
    
    @pytest.mark.asyncio
    async def test_can_execute_when_closed(self, circuit_breaker: CircuitBreaker):
        """Should allow execution when CLOSED."""
        result = await circuit_breaker.can_execute()
        assert result is True
    
    @pytest.mark.asyncio
    async def test_opens_after_threshold_failures(self, circuit_breaker: CircuitBreaker):
        """Should open after threshold consecutive failures."""
        # Record failures up to threshold
        for _ in range(circuit_breaker.config.failure_threshold):
            await circuit_breaker.record_failure()
        
        assert circuit_breaker.state == CircuitState.OPEN
        assert circuit_breaker.is_open is True
    
    @pytest.mark.asyncio
    async def test_rejects_when_open(self, circuit_breaker: CircuitBreaker):
        """Should reject execution when OPEN."""
        # Open the circuit
        for _ in range(circuit_breaker.config.failure_threshold):
            await circuit_breaker.record_failure()
        
        result = await circuit_breaker.can_execute()
        assert result is False
    
    @pytest.mark.asyncio
    async def test_transitions_to_half_open_after_timeout(self, config: CircuitBreakerConfig):
        """Should transition to HALF_OPEN after recovery timeout."""
        config.recovery_timeout = 0.1  # Short timeout for testing
        cb = CircuitBreaker(config, name="test")
        
        # Open the circuit
        for _ in range(config.failure_threshold):
            await cb.record_failure()
        
        assert cb.state == CircuitState.OPEN
        
        # Wait for recovery timeout
        await asyncio.sleep(0.15)
        
        # Check can_execute triggers state transition
        result = await cb.can_execute()
        
        assert cb.state == CircuitState.HALF_OPEN
        assert result is True
    
    @pytest.mark.asyncio
    async def test_closes_on_success_in_half_open(self, config: CircuitBreakerConfig):
        """Should close on success when HALF_OPEN."""
        config.recovery_timeout = 0.1
        cb = CircuitBreaker(config, name="test")
        
        # Open the circuit
        for _ in range(config.failure_threshold):
            await cb.record_failure()
        
        # Wait for recovery
        await asyncio.sleep(0.15)
        await cb.can_execute()  # Transition to HALF_OPEN
        
        # Record success
        await cb.record_success()
        
        assert cb.state == CircuitState.CLOSED
    
    @pytest.mark.asyncio
    async def test_reopens_on_failure_in_half_open(self, config: CircuitBreakerConfig):
        """Should reopen on failure when HALF_OPEN."""
        config.recovery_timeout = 0.1
        cb = CircuitBreaker(config, name="test")
        
        # Open the circuit
        for _ in range(config.failure_threshold):
            await cb.record_failure()
        
        # Wait for recovery
        await asyncio.sleep(0.15)
        await cb.can_execute()  # Transition to HALF_OPEN
        
        # Record failure
        await cb.record_failure()
        
        assert cb.state == CircuitState.OPEN
    
    @pytest.mark.asyncio
    async def test_execute_success(self, circuit_breaker: CircuitBreaker):
        """Should execute function and record success."""
        async def success_func():
            return "success"
        
        result = await circuit_breaker.execute(success_func)
        
        assert result == "success"
        assert circuit_breaker._failure_count == 0
    
    @pytest.mark.asyncio
    async def test_execute_failure(self, circuit_breaker: CircuitBreaker):
        """Should record failure when function raises."""
        async def fail_func():
            raise ValueError("test error")
        
        with pytest.raises(ValueError):
            await circuit_breaker.execute(fail_func)
        
        assert circuit_breaker._failure_count == 1
    
    @pytest.mark.asyncio
    async def test_execute_rejects_when_open(self, circuit_breaker: CircuitBreaker):
        """Should raise CircuitOpenError when circuit is open."""
        # Open the circuit
        for _ in range(circuit_breaker.config.failure_threshold):
            await circuit_breaker.record_failure()
        
        async def some_func():
            return "should not run"
        
        with pytest.raises(CircuitOpenError):
            await circuit_breaker.execute(some_func)
    
    @pytest.mark.asyncio
    async def test_reset(self, circuit_breaker: CircuitBreaker):
        """Should reset to CLOSED state."""
        # Open the circuit
        for _ in range(circuit_breaker.config.failure_threshold):
            await circuit_breaker.record_failure()
        
        assert circuit_breaker.state == CircuitState.OPEN
        
        # Reset
        await circuit_breaker.reset()
        
        assert circuit_breaker.state == CircuitState.CLOSED
        assert circuit_breaker._failure_count == 0
    
    @pytest.mark.asyncio
    async def test_get_stats(self, circuit_breaker: CircuitBreaker):
        """Should return statistics."""
        await circuit_breaker.record_failure()
        
        stats = circuit_breaker.get_stats()
        
        assert stats["name"] == "test"
        assert stats["state"] == "closed"
        assert stats["failure_count"] == 1
        assert "config" in stats


class TestCircuitBreakerRegistry:
    """Unit tests for CircuitBreakerRegistry."""
    
    @pytest.mark.asyncio
    async def test_get_creates_new(self):
        """Should create new circuit breaker if not exists."""
        registry = CircuitBreakerRegistry()
        
        cb = await registry.get("service-a")
        
        assert cb is not None
        assert cb.name == "service-a"
    
    @pytest.mark.asyncio
    async def test_get_returns_existing(self):
        """Should return existing circuit breaker."""
        registry = CircuitBreakerRegistry()
        
        cb1 = await registry.get("service-a")
        cb2 = await registry.get("service-a")
        
        assert cb1 is cb2
    
    @pytest.mark.asyncio
    async def test_get_all_stats(self):
        """Should return stats for all circuit breakers."""
        registry = CircuitBreakerRegistry()
        
        await registry.get("service-a")
        await registry.get("service-b")
        
        stats = await registry.get_all_stats()
        
        assert len(stats) == 2
        names = [s["name"] for s in stats]
        assert "service-a" in names
        assert "service-b" in names
    
    @pytest.mark.asyncio
    async def test_reset_all(self):
        """Should reset all circuit breakers."""
        registry = CircuitBreakerRegistry()
        
        cb_a = await registry.get("service-a")
        cb_b = await registry.get("service-b")
        
        # Open both circuits
        for _ in range(5):
            await cb_a.record_failure()
            await cb_b.record_failure()
        
        assert cb_a.state == CircuitState.OPEN
        assert cb_b.state == CircuitState.OPEN
        
        # Reset all
        await registry.reset_all()
        
        assert cb_a.state == CircuitState.CLOSED
        assert cb_b.state == CircuitState.CLOSED
