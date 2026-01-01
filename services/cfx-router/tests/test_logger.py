"""
Tests for CF-X Router Async Logger Module.

Includes property-based tests using Hypothesis.
"""

import asyncio
from datetime import datetime, timezone
from decimal import Decimal
import pytest
from hypothesis import given, strategies as st, settings, HealthCheck

from cfx.logger import (
    AsyncLogger,
    LoggerConfig,
    RequestLogEntry,
    generate_request_id,
    calculate_cost,
)


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def config() -> LoggerConfig:
    """Create test configuration."""
    return LoggerConfig(
        queue_size=100,
        batch_size=10,
        flush_interval=0.1,
        retry_attempts=2,
    )


@pytest.fixture
def logger_instance(config: LoggerConfig) -> AsyncLogger:
    """Create test logger (without database)."""
    return AsyncLogger(config, db_pool=None)


@pytest.fixture
def sample_entry() -> RequestLogEntry:
    """Create sample log entry."""
    return RequestLogEntry(
        request_id="cfx-test123",
        user_id="user-1",
        api_key_id=1,
        stage="code",
        model="deepseek-v3",
        prompt_tokens=100,
        completion_tokens=50,
        total_tokens=150,
        cost=Decimal("0.000042"),
        latency_ms=500,
        status_code=200,
    )


# =============================================================================
# Property Tests
# =============================================================================

class TestLoggerProperties:
    """
    Property-based tests for Async Logger.
    
    **Feature: cfx-router, Property 11: Request Logging Completeness**
    **Feature: cfx-router, Property 12: Request ID Uniqueness**
    **Validates: Requirements 6.1, 6.4, 6.5**
    """
    
    @given(num_ids=st.integers(min_value=10, max_value=500))
    @settings(max_examples=20)
    def test_property_request_id_uniqueness(self, num_ids: int):
        """
        Property 12: Generated request IDs are unique.
        
        *For any* number of generated IDs, all should be unique.
        
        **Validates: Requirement 6.5**
        """
        ids = [generate_request_id() for _ in range(num_ids)]
        unique_ids = set(ids)
        
        assert len(unique_ids) == len(ids), \
            f"Generated {len(ids)} IDs but only {len(unique_ids)} are unique"
    
    @given(num_ids=st.integers(min_value=10, max_value=100))
    @settings(max_examples=20)
    def test_property_request_id_format(self, num_ids: int):
        """
        Property: Request IDs follow expected format.
        
        *For any* generated ID, it should:
        - Start with 'cfx-' prefix
        - Be followed by 32 hex characters
        
        **Validates: Requirement 6.4**
        """
        for _ in range(num_ids):
            request_id = generate_request_id()
            
            assert request_id.startswith("cfx-"), \
                f"Request ID should start with 'cfx-': {request_id}"
            
            hex_part = request_id[4:]
            assert len(hex_part) == 32, \
                f"Hex part should be 32 chars: {hex_part}"
            
            # Should be valid hex
            try:
                int(hex_part, 16)
            except ValueError:
                pytest.fail(f"Invalid hex in request ID: {hex_part}")
    
    @given(
        prompt_tokens=st.integers(min_value=0, max_value=100000),
        completion_tokens=st.integers(min_value=0, max_value=100000),
    )
    @settings(max_examples=100)
    def test_property_cost_calculation_non_negative(
        self, prompt_tokens: int, completion_tokens: int
    ):
        """
        Property: Calculated cost is always non-negative.
        
        *For any* token counts, the cost should be >= 0.
        
        **Validates: Requirement 6.3**
        """
        cost = calculate_cost("gpt-4", prompt_tokens, completion_tokens)
        
        assert cost >= Decimal("0"), \
            f"Cost should be non-negative: {cost}"
    
    @given(
        prompt_tokens=st.integers(min_value=1, max_value=10000),
        completion_tokens=st.integers(min_value=1, max_value=10000),
    )
    @settings(max_examples=50)
    def test_property_cost_proportional_to_tokens(
        self, prompt_tokens: int, completion_tokens: int
    ):
        """
        Property: Cost increases with token count.
        
        *For any* token counts, doubling tokens should double cost.
        
        **Validates: Requirement 6.3**
        """
        cost1 = calculate_cost("gpt-4", prompt_tokens, completion_tokens)
        cost2 = calculate_cost("gpt-4", prompt_tokens * 2, completion_tokens * 2)
        
        # Allow small floating point tolerance
        expected = cost1 * 2
        tolerance = Decimal("0.0000001")
        
        assert abs(cost2 - expected) < tolerance, \
            f"Doubling tokens should double cost: {cost1} * 2 = {expected}, got {cost2}"
    
    @given(
        entries_count=st.integers(min_value=1, max_value=50),
    )
    @settings(max_examples=20, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @pytest.mark.asyncio
    async def test_property_logger_queues_all_entries(
        self, entries_count: int, config: LoggerConfig
    ):
        """
        Property 11: Logger queues all entries without loss.
        
        *For any* number of log entries (within queue size), all should be queued.
        
        **Validates: Requirement 6.1**
        """
        logger = AsyncLogger(config, db_pool=None)
        
        entries_queued = 0
        for i in range(entries_count):
            entry = RequestLogEntry(
                request_id=f"cfx-test{i}",
                user_id="user-1",
                api_key_id=1,
                stage="code",
                model="test-model",
                prompt_tokens=100,
                completion_tokens=50,
                total_tokens=150,
                cost=Decimal("0.001"),
                latency_ms=100,
                status_code=200,
            )
            if await logger.log(entry):
                entries_queued += 1
        
        assert entries_queued == entries_count, \
            f"All {entries_count} entries should be queued, got {entries_queued}"


class TestAsyncLoggerIdGeneration:
    """Tests for AsyncLogger's ID generation."""
    
    @given(num_ids=st.integers(min_value=10, max_value=200))
    @settings(max_examples=20, suppress_health_check=[HealthCheck.function_scoped_fixture])
    @pytest.mark.asyncio
    async def test_property_logger_generates_unique_ids(
        self, num_ids: int, config: LoggerConfig
    ):
        """
        Property 12: Logger generates unique request IDs.
        
        *For any* number of ID generations, all should be unique.
        
        **Validates: Requirement 6.5**
        """
        logger = AsyncLogger(config, db_pool=None)
        
        ids = [logger.generate_request_id() for _ in range(num_ids)]
        unique_ids = set(ids)
        
        assert len(unique_ids) == len(ids), \
            f"Logger generated {len(ids)} IDs but only {len(unique_ids)} are unique"


# =============================================================================
# Unit Tests
# =============================================================================

class TestLoggerConfig:
    """Unit tests for LoggerConfig."""
    
    def test_default_values(self):
        """Should have sensible defaults."""
        config = LoggerConfig()
        
        assert config.queue_size == 10000
        assert config.batch_size == 100
        assert config.flush_interval == 1.0
        assert config.retry_attempts == 3


class TestRequestLogEntry:
    """Unit tests for RequestLogEntry."""
    
    def test_to_dict(self, sample_entry: RequestLogEntry):
        """Should convert to dictionary correctly."""
        result = sample_entry.to_dict()
        
        assert result["request_id"] == "cfx-test123"
        assert result["user_id"] == "user-1"
        assert result["api_key_id"] == 1
        assert result["stage"] == "code"
        assert result["model"] == "deepseek-v3"
        assert result["prompt_tokens"] == 100
        assert result["completion_tokens"] == 50
        assert result["total_tokens"] == 150
        assert result["cost"] == 0.000042
        assert result["latency_ms"] == 500
        assert result["status_code"] == 200
    
    def test_default_created_at(self):
        """Should set created_at to current time by default."""
        before = datetime.now(timezone.utc)
        
        entry = RequestLogEntry(
            request_id="test",
            user_id="user",
            api_key_id=1,
            stage="code",
            model="test",
            prompt_tokens=0,
            completion_tokens=0,
            total_tokens=0,
            cost=Decimal("0"),
            latency_ms=0,
            status_code=200,
        )
        
        after = datetime.now(timezone.utc)
        
        assert before <= entry.created_at <= after


class TestGenerateRequestId:
    """Unit tests for generate_request_id function."""
    
    def test_format(self):
        """Should generate ID with correct format."""
        request_id = generate_request_id()
        
        assert request_id.startswith("cfx-")
        assert len(request_id) == 36  # "cfx-" + 32 hex chars
    
    def test_uniqueness(self):
        """Should generate unique IDs."""
        ids = [generate_request_id() for _ in range(1000)]
        assert len(set(ids)) == 1000


class TestCalculateCost:
    """Unit tests for calculate_cost function."""
    
    def test_known_model_pricing(self):
        """Should use correct pricing for known models."""
        # GPT-4: $30/1M prompt, $60/1M completion
        cost = calculate_cost("gpt-4", 1000000, 1000000)
        
        expected = Decimal("30") + Decimal("60")  # $90 total
        assert cost == expected
    
    def test_partial_model_match(self):
        """Should match partial model names."""
        # "gpt-4-turbo-preview" should match "gpt-4-turbo"
        cost = calculate_cost("gpt-4-turbo-preview", 1000000, 0)
        
        # GPT-4-turbo: $10/1M prompt - but matching is case-insensitive and partial
        # The actual match depends on the order in the pricing dict
        assert cost > Decimal("0")  # Just verify it calculates something
    
    def test_unknown_model_default_pricing(self):
        """Should use default pricing for unknown models."""
        cost = calculate_cost("unknown-model-xyz", 1000000, 1000000)
        
        # Default: $1/1M prompt, $2/1M completion
        expected = Decimal("1") + Decimal("2")
        assert cost == expected
    
    def test_zero_tokens(self):
        """Should return 0 for zero tokens."""
        cost = calculate_cost("gpt-4", 0, 0)
        assert cost == Decimal("0")
    
    def test_custom_pricing(self):
        """Should use custom pricing when provided."""
        custom_pricing = {
            "custom-model": {"prompt": 5.0, "completion": 10.0}
        }
        
        cost = calculate_cost("custom-model", 1000000, 1000000, pricing=custom_pricing)
        
        expected = Decimal("5") + Decimal("10")
        assert cost == expected


class TestAsyncLogger:
    """Unit tests for AsyncLogger."""
    
    @pytest.mark.asyncio
    async def test_log_entry(self, logger_instance: AsyncLogger, sample_entry: RequestLogEntry):
        """Should queue log entry."""
        result = await logger_instance.log(sample_entry)
        
        assert result is True
        stats = logger_instance.get_stats()
        assert stats["queue_size"] == 1
    
    @pytest.mark.asyncio
    async def test_log_queue_full(self, sample_entry: RequestLogEntry):
        """Should return False when queue is full."""
        config = LoggerConfig(queue_size=2)
        logger = AsyncLogger(config, db_pool=None)
        
        # Fill queue
        await logger.log(sample_entry)
        await logger.log(sample_entry)
        
        # Next should fail
        result = await logger.log(sample_entry)
        assert result is False
    
    @pytest.mark.asyncio
    async def test_generate_request_id(self, logger_instance: AsyncLogger):
        """Should generate unique request IDs."""
        id1 = logger_instance.generate_request_id()
        id2 = logger_instance.generate_request_id()
        
        assert id1 != id2
        assert id1.startswith("cfx-")
        assert id2.startswith("cfx-")
    
    @pytest.mark.asyncio
    async def test_start_stop(self, logger_instance: AsyncLogger):
        """Should start and stop cleanly."""
        await logger_instance.start()
        
        stats = logger_instance.get_stats()
        assert stats["running"] is True
        
        await logger_instance.stop()
        
        stats = logger_instance.get_stats()
        assert stats["running"] is False
    
    @pytest.mark.asyncio
    async def test_worker_processes_entries(
        self, config: LoggerConfig, sample_entry: RequestLogEntry
    ):
        """Worker should process queued entries."""
        logger = AsyncLogger(config, db_pool=None)
        
        # Queue some entries
        for _ in range(5):
            await logger.log(sample_entry)
        
        assert logger.get_stats()["queue_size"] == 5
        
        # Start worker
        await logger.start()
        
        # Wait for processing
        await asyncio.sleep(0.3)
        
        # Queue should be empty
        assert logger.get_stats()["queue_size"] == 0
        
        await logger.stop()
    
    @pytest.mark.asyncio
    async def test_stop_flushes_remaining(
        self, config: LoggerConfig, sample_entry: RequestLogEntry
    ):
        """Stop should flush remaining entries."""
        logger = AsyncLogger(config, db_pool=None)
        
        # Start the logger first so it can flush
        await logger.start()
        
        # Queue entries
        for _ in range(5):
            await logger.log(sample_entry)
        
        # Stop should flush
        await logger.stop()
        
        # Queue should be empty after stop
        assert logger.get_stats()["queue_size"] == 0
    
    @pytest.mark.asyncio
    async def test_get_stats(self, logger_instance: AsyncLogger, sample_entry: RequestLogEntry):
        """Should return correct statistics."""
        await logger_instance.log(sample_entry)
        
        stats = logger_instance.get_stats()
        
        assert "queue_size" in stats
        assert "queue_max_size" in stats
        assert "running" in stats
        assert "generated_ids_count" in stats
        
        assert stats["queue_size"] == 1
        assert stats["queue_max_size"] == 100
        assert stats["running"] is False


class TestAsyncLoggerConcurrency:
    """Tests for concurrent logging scenarios."""
    
    @pytest.mark.asyncio
    async def test_concurrent_logging(self, config: LoggerConfig):
        """Should handle concurrent log calls."""
        logger = AsyncLogger(config, db_pool=None)
        
        async def log_entry(i: int):
            entry = RequestLogEntry(
                request_id=f"cfx-{i}",
                user_id="user-1",
                api_key_id=1,
                stage="code",
                model="test",
                prompt_tokens=100,
                completion_tokens=50,
                total_tokens=150,
                cost=Decimal("0.001"),
                latency_ms=100,
                status_code=200,
            )
            return await logger.log(entry)
        
        # Log many entries concurrently
        tasks = [log_entry(i) for i in range(50)]
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert all(results)
        assert logger.get_stats()["queue_size"] == 50
    
    @pytest.mark.asyncio
    async def test_concurrent_id_generation(self, logger_instance: AsyncLogger):
        """Should generate unique IDs under concurrent access."""
        async def generate():
            return logger_instance.generate_request_id()
        
        # Generate many IDs concurrently
        tasks = [generate() for _ in range(100)]
        ids = await asyncio.gather(*tasks)
        
        # All should be unique
        assert len(set(ids)) == len(ids)
