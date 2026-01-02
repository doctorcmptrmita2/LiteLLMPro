"""
CF-X Router Async Logger Module

Provides non-blocking request logging with background worker.
"""

import asyncio
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Any
from decimal import Decimal

logger = logging.getLogger(__name__)


@dataclass
class LoggerConfig:
    """Configuration for async logger."""
    queue_size: int = 10000          # Max items in queue
    batch_size: int = 100            # Items per batch write
    flush_interval: float = 1.0      # Seconds between flushes
    retry_attempts: int = 3          # Retries for failed writes


@dataclass
class RequestLogEntry:
    """Log entry for a request."""
    request_id: str
    user_id: str
    api_key_id: Optional[str]  # UUID as string
    stage: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: Decimal
    latency_ms: int
    status_code: int
    error_message: Optional[str] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for database insertion."""
        return {
            "request_id": self.request_id,
            "user_id": self.user_id,
            "api_key_id": self.api_key_id,
            "stage": self.stage,
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "cost": float(self.cost),
            "latency_ms": self.latency_ms,
            "status_code": self.status_code,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat(),
        }


def generate_request_id() -> str:
    """
    Generate a unique request ID.
    
    Returns:
        UUID string prefixed with 'cfx-'
    """
    return f"cfx-{uuid.uuid4().hex}"


def calculate_cost(
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    pricing: Optional[dict[str, dict[str, float]]] = None,
) -> Decimal:
    """
    Calculate cost based on token usage and model pricing.
    
    Args:
        model: Model name
        prompt_tokens: Number of prompt tokens
        completion_tokens: Number of completion tokens
        pricing: Optional pricing dict {model: {prompt: price, completion: price}}
        
    Returns:
        Cost in USD as Decimal
    """
    # Default pricing per 1M tokens (approximate)
    default_pricing = {
        "gpt-4": {"prompt": 30.0, "completion": 60.0},
        "gpt-4-turbo": {"prompt": 10.0, "completion": 30.0},
        "gpt-3.5-turbo": {"prompt": 0.5, "completion": 1.5},
        "claude-3-opus": {"prompt": 15.0, "completion": 75.0},
        "claude-3-sonnet": {"prompt": 3.0, "completion": 15.0},
        "claude-3-haiku": {"prompt": 0.25, "completion": 1.25},
        "deepseek-coder": {"prompt": 0.14, "completion": 0.28},
        "deepseek-chat": {"prompt": 0.14, "completion": 0.28},
    }
    
    pricing = pricing or default_pricing
    
    # Find matching model pricing (partial match)
    model_pricing = None
    model_lower = model.lower()
    for key, prices in pricing.items():
        if key.lower() in model_lower or model_lower in key.lower():
            model_pricing = prices
            break
    
    if model_pricing is None:
        # Default to cheap pricing for unknown models
        model_pricing = {"prompt": 1.0, "completion": 2.0}
    
    # Calculate cost (pricing is per 1M tokens)
    prompt_cost = Decimal(str(prompt_tokens)) * Decimal(str(model_pricing["prompt"])) / Decimal("1000000")
    completion_cost = Decimal(str(completion_tokens)) * Decimal(str(model_pricing["completion"])) / Decimal("1000000")
    
    return prompt_cost + completion_cost


class AsyncLogger:
    """
    Async logger with background worker for non-blocking writes.
    
    Uses asyncio.Queue for buffering and batches writes for efficiency.
    """
    
    def __init__(self, config: LoggerConfig, db_pool: Optional[Any] = None):
        """
        Initialize async logger.
        
        Args:
            config: Logger configuration
            db_pool: Database connection pool (optional, for testing)
        """
        self.config = config
        self.db_pool = db_pool
        
        self._queue: asyncio.Queue[RequestLogEntry] = asyncio.Queue(maxsize=config.queue_size)
        self._worker_task: Optional[asyncio.Task] = None
        self._running = False
        self._generated_ids: set[str] = set()  # Track generated IDs for uniqueness
    
    async def start(self) -> None:
        """Start the background worker."""
        if self._running:
            return
        
        self._running = True
        self._worker_task = asyncio.create_task(self._worker())
        logger.info("Async logger started")
    
    async def stop(self) -> None:
        """Stop the background worker and flush remaining entries."""
        if not self._running:
            return
        
        self._running = False
        
        # Wait for queue to drain
        if not self._queue.empty():
            logger.info(f"Flushing {self._queue.qsize()} remaining log entries")
            await self._flush_all()
        
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Async logger stopped")
    
    async def log(self, entry: RequestLogEntry) -> bool:
        """
        Queue a log entry for async writing.
        
        Args:
            entry: Log entry to write
            
        Returns:
            True if queued successfully, False if queue is full
        """
        try:
            self._queue.put_nowait(entry)
            return True
        except asyncio.QueueFull:
            logger.warning(f"Log queue full, dropping entry {entry.request_id}")
            return False
    
    def generate_request_id(self) -> str:
        """
        Generate a unique request ID.
        
        Returns:
            Unique request ID
        """
        while True:
            request_id = generate_request_id()
            if request_id not in self._generated_ids:
                self._generated_ids.add(request_id)
                # Limit memory usage by clearing old IDs
                if len(self._generated_ids) > 100000:
                    # Keep only recent half
                    self._generated_ids = set(list(self._generated_ids)[-50000:])
                return request_id
    
    async def _worker(self) -> None:
        """Background worker that processes log entries."""
        while self._running:
            try:
                await self._process_batch()
                await asyncio.sleep(self.config.flush_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Logger worker error: {e}")
                await asyncio.sleep(1.0)  # Back off on error
    
    async def _process_batch(self) -> None:
        """Process a batch of log entries."""
        batch: list[RequestLogEntry] = []
        
        # Collect up to batch_size entries
        while len(batch) < self.config.batch_size:
            try:
                entry = self._queue.get_nowait()
                batch.append(entry)
            except asyncio.QueueEmpty:
                break
        
        if batch:
            await self._write_batch(batch)
    
    async def _flush_all(self) -> None:
        """Flush all remaining entries."""
        while not self._queue.empty():
            await self._process_batch()
    
    async def _write_batch(self, batch: list[RequestLogEntry]) -> None:
        """
        Write a batch of entries to the database.
        
        Args:
            batch: List of log entries
        """
        if not self.db_pool:
            # No database, just log
            for entry in batch:
                logger.debug(f"Log entry: {entry.to_dict()}")
            return
        
        for attempt in range(self.config.retry_attempts):
            try:
                async with self.db_pool.acquire() as conn:
                    # Batch insert
                    await conn.executemany(
                        """
                        INSERT INTO request_logs (
                            request_id, user_id, api_key_id, stage, model,
                            prompt_tokens, completion_tokens, total_tokens,
                            cost, latency_ms, status_code, error_message, created_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                        )
                        """,
                        [
                            (
                                e.request_id, e.user_id, e.api_key_id, e.stage, e.model,
                                e.prompt_tokens, e.completion_tokens, e.total_tokens,
                                float(e.cost), e.latency_ms, e.status_code,
                                e.error_message, e.created_at,
                            )
                            for e in batch
                        ],
                    )
                logger.debug(f"Wrote {len(batch)} log entries")
                return
            except Exception as e:
                logger.warning(f"Failed to write log batch (attempt {attempt + 1}): {e}")
                if attempt < self.config.retry_attempts - 1:
                    await asyncio.sleep(0.5 * (attempt + 1))
        
        logger.error(f"Failed to write {len(batch)} log entries after {self.config.retry_attempts} attempts")
    
    def get_stats(self) -> dict[str, Any]:
        """Get logger statistics."""
        return {
            "queue_size": self._queue.qsize(),
            "queue_max_size": self.config.queue_size,
            "running": self._running,
            "generated_ids_count": len(self._generated_ids),
        }
