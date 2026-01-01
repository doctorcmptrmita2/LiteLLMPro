"""
Tests for CF-X Router LiteLLM Client Module.

Includes property-based tests using Hypothesis.
"""

import json
import pytest
from hypothesis import given, strategies as st, settings
from unittest.mock import AsyncMock, MagicMock, patch

from cfx.litellm_client import (
    LiteLLMConfig,
    LiteLLMClient,
    CompletionRequest,
    CompletionResponse,
    LiteLLMError,
    LiteLLMUnavailableError,
    format_sse_chunk,
    parse_sse_chunk,
)


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def config() -> LiteLLMConfig:
    """Create test configuration."""
    return LiteLLMConfig(
        base_url="http://localhost:4000",
        connect_timeout=5.0,
        read_timeout=30.0,
        max_retries=1,
    )


@pytest.fixture
def client(config: LiteLLMConfig) -> LiteLLMClient:
    """Create test client."""
    return LiteLLMClient(config)


@pytest.fixture
def sample_request() -> CompletionRequest:
    """Create sample completion request."""
    return CompletionRequest(
        model="gpt-4",
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=100,
        temperature=0.7,
    )


# =============================================================================
# Property Tests
# =============================================================================

class TestLiteLLMClientProperties:
    """
    Property-based tests for LiteLLM client.
    
    **Feature: cfx-router, Property 8: Request Parameter Preservation**
    **Feature: cfx-router, Property 9: Transient Error Retry**
    **Feature: cfx-router, Property 10: SSE Streaming Format**
    **Validates: Requirements 4.3, 4.4, 4.5, 5.1, 5.2, 5.3**
    """
    
    @given(
        model=st.text(min_size=1, max_size=50),
        content=st.text(min_size=1, max_size=500),
        max_tokens=st.integers(min_value=1, max_value=8192),
        temperature=st.floats(min_value=0.0, max_value=2.0, allow_nan=False),
    )
    @settings(max_examples=100)
    def test_property_request_parameter_preservation(
        self, model: str, content: str, max_tokens: int, temperature: float
    ):
        """
        Property 8: Request Parameter Preservation
        
        *For any* valid request parameters, converting to dict and back
        should preserve all values.
        
        **Validates: Requirements 4.4, 4.5**
        """
        request = CompletionRequest(
            model=model,
            messages=[{"role": "user", "content": content}],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        
        data = request.to_dict()
        
        assert data["model"] == model, "Model should be preserved"
        assert data["messages"][0]["content"] == content, "Content should be preserved"
        assert data["max_tokens"] == max_tokens, "max_tokens should be preserved"
        assert data["temperature"] == temperature, "temperature should be preserved"
    
    @given(
        data=st.dictionaries(
            keys=st.text(min_size=1, max_size=20),
            values=st.one_of(
                st.text(max_size=100),
                st.integers(),
                st.floats(allow_nan=False, allow_infinity=False),
                st.booleans(),
            ),
            min_size=1,
            max_size=10,
        )
    )
    @settings(max_examples=100)
    def test_property_sse_format_roundtrip(self, data: dict):
        """
        Property 10: SSE Streaming Format (Round-trip)
        
        *For any* dictionary data, formatting as SSE and parsing back
        should produce the same data.
        
        **Validates: Requirements 5.1, 5.2, 5.3**
        """
        # Format as SSE
        sse_chunk = format_sse_chunk(data)
        
        # Should start with "data: "
        assert sse_chunk.startswith("data: "), "SSE chunk should start with 'data: '"
        
        # Should end with double newline
        assert sse_chunk.endswith("\n\n"), "SSE chunk should end with double newline"
        
        # Parse back
        parsed = parse_sse_chunk(sse_chunk.strip())
        
        assert parsed == data, "Parsed data should match original"
    
    @given(
        content=st.text(min_size=1, max_size=200)
    )
    @settings(max_examples=100)
    def test_property_sse_chunk_contains_data(self, content: str):
        """
        Property: SSE chunks contain the original data.
        
        *For any* content, the SSE chunk should contain the JSON-encoded content.
        
        **Validates: Requirements 5.1**
        """
        data = {"content": content}
        sse_chunk = format_sse_chunk(data)
        
        # The JSON should be in the chunk
        assert json.dumps(data) in sse_chunk, "SSE chunk should contain JSON data"


# =============================================================================
# Unit Tests
# =============================================================================

class TestCompletionRequest:
    """Unit tests for CompletionRequest."""
    
    def test_to_dict_minimal(self):
        """Should create dict with required fields only."""
        request = CompletionRequest(
            model="gpt-4",
            messages=[{"role": "user", "content": "Hello"}],
        )
        
        data = request.to_dict()
        
        assert data["model"] == "gpt-4"
        assert data["messages"] == [{"role": "user", "content": "Hello"}]
        assert data["stream"] is False
        assert "max_tokens" not in data
        assert "temperature" not in data
    
    def test_to_dict_full(self):
        """Should include all optional fields when set."""
        request = CompletionRequest(
            model="gpt-4",
            messages=[{"role": "user", "content": "Hello"}],
            stream=True,
            max_tokens=100,
            temperature=0.7,
            top_p=0.9,
            stop=["END"],
        )
        
        data = request.to_dict()
        
        assert data["stream"] is True
        assert data["max_tokens"] == 100
        assert data["temperature"] == 0.7
        assert data["top_p"] == 0.9
        assert data["stop"] == ["END"]


class TestCompletionResponse:
    """Unit tests for CompletionResponse."""
    
    def test_from_dict(self):
        """Should create response from API dict."""
        data = {
            "id": "chatcmpl-123",
            "model": "gpt-4",
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": "Hello!"},
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
            },
        }
        
        response = CompletionResponse.from_dict(data)
        
        assert response.id == "chatcmpl-123"
        assert response.model == "gpt-4"
        assert len(response.choices) == 1
        assert response.usage["total_tokens"] == 15
    
    def test_from_dict_minimal(self):
        """Should handle minimal response."""
        data = {}
        
        response = CompletionResponse.from_dict(data)
        
        assert response.id == ""
        assert response.model == ""
        assert response.choices == []
        assert response.usage is None


class TestSSEFormatting:
    """Unit tests for SSE formatting functions."""
    
    def test_format_sse_chunk(self):
        """Should format data as SSE chunk."""
        data = {"content": "Hello"}
        
        result = format_sse_chunk(data)
        
        assert result == 'data: {"content": "Hello"}\n\n'
    
    def test_parse_sse_chunk_valid(self):
        """Should parse valid SSE chunk."""
        line = 'data: {"content": "Hello"}'
        
        result = parse_sse_chunk(line)
        
        assert result == {"content": "Hello"}
    
    def test_parse_sse_chunk_done(self):
        """Should return None for [DONE] marker."""
        line = "data: [DONE]"
        
        result = parse_sse_chunk(line)
        
        assert result is None
    
    def test_parse_sse_chunk_non_data(self):
        """Should return None for non-data lines."""
        assert parse_sse_chunk("event: message") is None
        assert parse_sse_chunk(": comment") is None
        assert parse_sse_chunk("") is None
    
    def test_parse_sse_chunk_invalid_json(self):
        """Should return None for invalid JSON."""
        line = "data: {invalid json}"
        
        result = parse_sse_chunk(line)
        
        assert result is None


class TestLiteLLMClient:
    """Unit tests for LiteLLMClient."""
    
    @pytest.mark.asyncio
    async def test_complete_success(self, client: LiteLLMClient, sample_request: CompletionRequest):
        """Should return response on success."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "chatcmpl-123",
            "model": "gpt-4",
            "choices": [{"message": {"content": "Hello!"}}],
        }
        
        mock_http_client = AsyncMock()
        mock_http_client.post.return_value = mock_response
        mock_http_client.is_closed = False
        
        client._client = mock_http_client
        
        response = await client.complete(sample_request)
        
        assert response.id == "chatcmpl-123"
        assert response.model == "gpt-4"
    
    @pytest.mark.asyncio
    async def test_complete_retry_on_503(self, client: LiteLLMClient, sample_request: CompletionRequest):
        """Should retry on 503 error."""
        # First call returns 503, second returns 200
        mock_response_503 = MagicMock()
        mock_response_503.status_code = 503
        mock_response_503.text = "Service Unavailable"
        
        mock_response_200 = MagicMock()
        mock_response_200.status_code = 200
        mock_response_200.json.return_value = {
            "id": "chatcmpl-123",
            "model": "gpt-4",
            "choices": [],
        }
        
        mock_http_client = AsyncMock()
        mock_http_client.post.side_effect = [mock_response_503, mock_response_200]
        mock_http_client.is_closed = False
        
        client._client = mock_http_client
        
        response = await client.complete(sample_request)
        
        assert response.id == "chatcmpl-123"
        assert mock_http_client.post.call_count == 2
    
    @pytest.mark.asyncio
    async def test_complete_no_retry_on_400(self, client: LiteLLMClient, sample_request: CompletionRequest):
        """Should not retry on 400 error."""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        
        mock_http_client = AsyncMock()
        mock_http_client.post.return_value = mock_response
        mock_http_client.is_closed = False
        
        client._client = mock_http_client
        
        with pytest.raises(LiteLLMError) as exc_info:
            await client.complete(sample_request)
        
        assert exc_info.value.status_code == 400
        assert mock_http_client.post.call_count == 1
    
    @pytest.mark.asyncio
    async def test_complete_unavailable_after_retries(self, client: LiteLLMClient, sample_request: CompletionRequest):
        """Should raise unavailable after all retries exhausted."""
        import httpx
        
        mock_http_client = AsyncMock()
        mock_http_client.post.side_effect = httpx.ConnectError("Connection refused")
        mock_http_client.is_closed = False
        
        client._client = mock_http_client
        
        with pytest.raises(LiteLLMUnavailableError):
            await client.complete(sample_request)
        
        # Should have tried max_retries + 1 times
        assert mock_http_client.post.call_count == client.config.max_retries + 1
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, client: LiteLLMClient):
        """Should return True when healthy."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        
        mock_http_client = AsyncMock()
        mock_http_client.get.return_value = mock_response
        mock_http_client.is_closed = False
        
        client._client = mock_http_client
        
        result = await client.health_check()
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, client: LiteLLMClient):
        """Should return False when unhealthy."""
        import httpx
        
        mock_http_client = AsyncMock()
        mock_http_client.get.side_effect = httpx.ConnectError("Connection refused")
        mock_http_client.is_closed = False
        
        client._client = mock_http_client
        
        result = await client.health_check()
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_close(self, client: LiteLLMClient):
        """Should close HTTP client."""
        mock_http_client = AsyncMock()
        mock_http_client.is_closed = False
        
        client._client = mock_http_client
        
        await client.close()
        
        mock_http_client.aclose.assert_called_once()
        assert client._client is None
