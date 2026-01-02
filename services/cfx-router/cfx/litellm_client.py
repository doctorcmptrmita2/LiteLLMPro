"""
CF-X Router LiteLLM Client Module

Handles communication with LiteLLM proxy, including streaming and retries.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Any, AsyncGenerator, Optional

import httpx

logger = logging.getLogger(__name__)


@dataclass
class LiteLLMConfig:
    """Configuration for LiteLLM client."""
    base_url: str
    api_key: Optional[str] = None
    connect_timeout: float = 10.0
    read_timeout: float = 120.0
    max_retries: int = 1
    retry_status_codes: tuple[int, ...] = (502, 503, 504)


@dataclass
class CompletionRequest:
    """Request to send to LiteLLM."""
    model: str
    messages: list[dict[str, Any]]
    stream: bool = False
    max_tokens: Optional[int] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    stop: Optional[list[str]] = None
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for API request."""
        data: dict[str, Any] = {
            "model": self.model,
            "messages": self.messages,
            "stream": self.stream,
        }
        
        if self.max_tokens is not None:
            data["max_tokens"] = self.max_tokens
        if self.temperature is not None:
            data["temperature"] = self.temperature
        if self.top_p is not None:
            data["top_p"] = self.top_p
        if self.stop is not None:
            data["stop"] = self.stop
        
        return data


@dataclass
class CompletionResponse:
    """Response from LiteLLM."""
    id: str
    model: str
    choices: list[dict[str, Any]]
    usage: Optional[dict[str, int]] = None
    
    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CompletionResponse":
        """Create from API response dictionary."""
        return cls(
            id=data.get("id", ""),
            model=data.get("model", ""),
            choices=data.get("choices", []),
            usage=data.get("usage"),
        )


class LiteLLMClient:
    """
    Async client for LiteLLM proxy.
    
    Features:
    - Connection pooling
    - Configurable timeouts
    - Retry logic for transient errors
    - SSE streaming support
    """
    
    def __init__(self, config: LiteLLMConfig):
        """
        Initialize LiteLLM client.
        
        Args:
            config: Client configuration
        """
        self.config = config
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None or self._client.is_closed:
            headers = {}
            if self.config.api_key:
                headers["Authorization"] = f"Bearer {self.config.api_key}"
            
            self._client = httpx.AsyncClient(
                base_url=self.config.base_url,
                headers=headers,
                timeout=httpx.Timeout(
                    connect=self.config.connect_timeout,
                    read=self.config.read_timeout,
                    write=30.0,
                    pool=10.0,
                ),
                limits=httpx.Limits(
                    max_connections=100,
                    max_keepalive_connections=20,
                ),
            )
        return self._client
    
    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None
    
    async def complete(
        self,
        request: CompletionRequest,
    ) -> CompletionResponse:
        """
        Send a non-streaming completion request.
        
        Args:
            request: Completion request
            
        Returns:
            CompletionResponse
            
        Raises:
            LiteLLMError: If request fails after retries
        """
        client = await self._get_client()
        last_error: Optional[Exception] = None
        
        for attempt in range(self.config.max_retries + 1):
            try:
                response = await client.post(
                    "/v1/chat/completions",
                    json=request.to_dict(),
                )
                
                if response.status_code == 200:
                    return CompletionResponse.from_dict(response.json())
                
                # Check if should retry
                if response.status_code in self.config.retry_status_codes:
                    if attempt < self.config.max_retries:
                        logger.warning(
                            f"LiteLLM returned {response.status_code}, "
                            f"retrying ({attempt + 1}/{self.config.max_retries})"
                        )
                        await asyncio.sleep(1.0)  # Brief delay before retry
                        continue
                
                # Non-retryable error
                raise LiteLLMError(
                    status_code=response.status_code,
                    message=response.text,
                )
                
            except httpx.TimeoutException as e:
                last_error = e
                if attempt < self.config.max_retries:
                    logger.warning(f"LiteLLM timeout, retrying ({attempt + 1})")
                    continue
                    
            except httpx.ConnectError as e:
                last_error = e
                if attempt < self.config.max_retries:
                    logger.warning(f"LiteLLM connection error, retrying ({attempt + 1})")
                    await asyncio.sleep(1.0)
                    continue
        
        # All retries exhausted
        raise LiteLLMUnavailableError(
            f"LiteLLM unavailable after {self.config.max_retries + 1} attempts: {last_error}"
        )
    
    async def stream(
        self,
        request: CompletionRequest,
    ) -> AsyncGenerator[str, None]:
        """
        Send a streaming completion request.
        
        Yields SSE-formatted chunks.
        
        Args:
            request: Completion request (stream should be True)
            
        Yields:
            SSE-formatted strings (e.g., "data: {...}\n\n")
            
        Raises:
            LiteLLMError: If request fails
        """
        client = await self._get_client()
        request.stream = True
        
        try:
            async with client.stream(
                "POST",
                "/v1/chat/completions",
                json=request.to_dict(),
            ) as response:
                if response.status_code != 200:
                    body = await response.aread()
                    raise LiteLLMError(
                        status_code=response.status_code,
                        message=body.decode("utf-8"),
                    )
                
                async for line in response.aiter_lines():
                    if line:
                        yield line + "\n"
                
                # Send done marker
                yield "data: [DONE]\n\n"
                
        except httpx.TimeoutException:
            raise LiteLLMUnavailableError("LiteLLM streaming timeout")
        except httpx.ConnectError:
            raise LiteLLMUnavailableError("LiteLLM connection failed")
    
    async def health_check(self) -> bool:
        """
        Check if LiteLLM is reachable.
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            client = await self._get_client()
            response = await client.get("/health", timeout=5.0)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"LiteLLM health check failed: {e}")
            return False


class LiteLLMError(Exception):
    """Error from LiteLLM API."""
    
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"LiteLLM error {status_code}: {message}")


class LiteLLMUnavailableError(Exception):
    """LiteLLM service is unavailable."""
    pass


def format_sse_chunk(data: dict[str, Any]) -> str:
    """
    Format a dictionary as an SSE chunk.
    
    Args:
        data: Data to format
        
    Returns:
        SSE-formatted string
    """
    import json
    return f"data: {json.dumps(data)}\n\n"


def parse_sse_chunk(line: str) -> Optional[dict[str, Any]]:
    """
    Parse an SSE chunk.
    
    Args:
        line: SSE line (e.g., "data: {...}")
        
    Returns:
        Parsed dictionary or None if not a data line
    """
    import json
    
    line = line.strip()
    
    if not line.startswith("data:"):
        return None
    
    data_str = line[5:].strip()
    
    if data_str == "[DONE]":
        return None
    
    try:
        return json.loads(data_str)
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse SSE chunk: {data_str}")
        return None
