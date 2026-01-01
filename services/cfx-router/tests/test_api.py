"""
Tests for CF-X Router API Compatibility.

Includes property-based tests for OpenAI API compatibility.
"""

import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from unittest.mock import AsyncMock, MagicMock, patch
import json

from cfx.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    Role,
    Usage,
    Choice,
    ChoiceMessage,
    ErrorResponse,
)
from cfx.routing import Stage, StageRouter, RoutingResult
from cfx.config import ModelsConfig, StageConfig, DirectModeConfig


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def sample_config() -> ModelsConfig:
    """Create sample models configuration."""
    return ModelsConfig(
        stages={
            "plan": StageConfig(
                model="claude-sonnet-4.5",
                max_tokens=4096,
                temperature=0.3,
                fallback=["gemini-2.5-pro", "gpt-4o"]
            ),
            "code": StageConfig(
                model="deepseek-v3",
                max_tokens=8192,
                temperature=0.2,
                fallback=["gemini-2.0-flash", "gpt-4o-mini"]
            ),
            "review": StageConfig(
                model="gpt-4o-mini",
                max_tokens=2048,
                temperature=0.1,
                fallback=["gemini-flash-lite"]
            ),
        },
        direct=DirectModeConfig(
            allowed_models=["claude-sonnet-4.5", "gpt-4o", "deepseek-v3"],
            max_tokens_cap=8192
        ),
        rate_limit={"daily_requests": 1000, "concurrent_streams": 3},
        circuit_breaker={"failure_threshold": 5, "recovery_timeout": 30},
    )


# =============================================================================
# Property Tests
# =============================================================================

class TestOpenAIAPICompatibility:
    """
    Property-based tests for OpenAI API compatibility.
    
    **Feature: cfx-router, Property 16: OpenAI API Compatibility**
    **Validates: Requirements 10.2, 10.3**
    """
    
    @given(
        content=st.text(min_size=1, max_size=100),
        max_tokens=st.integers(min_value=1, max_value=4096),
        temperature=st.floats(min_value=0.0, max_value=2.0, allow_nan=False),
        stream=st.booleans(),
    )
    @settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture, HealthCheck.too_slow])
    def test_property_request_accepts_openai_format(
        self, content: str, max_tokens: int, temperature: float, stream: bool
    ):
        """
        Property 16: OpenAI API Compatibility (Request)
        
        *For any* valid OpenAI-format request parameters, the request
        model should accept and parse them correctly.
        
        **Validates: Requirements 10.2**
        """
        # Create OpenAI-format request
        request = ChatCompletionRequest(
            messages=[ChatMessage(role=Role.USER, content=content)],
            max_tokens=max_tokens,
            temperature=temperature,
            stream=stream,
        )
        
        # Verify all fields are preserved
        assert len(request.messages) == 1
        assert request.messages[0].content == content
        assert request.max_tokens == max_tokens
        assert request.temperature == temperature
        assert request.stream == stream
    
    @given(
        model=st.text(min_size=1, max_size=50),
        content=st.text(min_size=1, max_size=200),
        prompt_tokens=st.integers(min_value=0, max_value=10000),
        completion_tokens=st.integers(min_value=0, max_value=10000),
    )
    @settings(max_examples=100)
    def test_property_response_matches_openai_format(
        self, model: str, content: str, prompt_tokens: int, completion_tokens: int
    ):
        """
        Property 16: OpenAI API Compatibility (Response)
        
        *For any* response data, the response model should produce
        valid OpenAI-format output.
        
        **Validates: Requirements 10.3**
        """
        # Create response
        response = ChatCompletionResponse(
            id="chatcmpl-test123",
            created=1234567890,
            model=model,
            choices=[
                Choice(
                    index=0,
                    message=ChoiceMessage(role=Role.ASSISTANT, content=content),
                    finish_reason="stop",
                )
            ],
            usage=Usage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
            ),
        )
        
        # Verify OpenAI format
        assert response.object == "chat.completion"
        assert response.id.startswith("chatcmpl-")
        assert response.model == model
        assert len(response.choices) == 1
        assert response.choices[0].message.content == content
        assert response.usage.total_tokens == prompt_tokens + completion_tokens
    
    @given(
        messages=st.lists(
            st.fixed_dictionaries({
                "role": st.sampled_from(["system", "user", "assistant"]),
                "content": st.text(min_size=1, max_size=100),
            }),
            min_size=1,
            max_size=5,
        )
    )
    @settings(max_examples=100)
    def test_property_request_to_litellm_preserves_messages(self, messages: list):
        """
        Property: Request conversion to LiteLLM preserves all messages.
        
        *For any* list of messages, converting to LiteLLM format should
        preserve all message content and roles.
        
        **Validates: Requirements 10.2**
        """
        # Create request with messages
        chat_messages = [
            ChatMessage(role=Role(m["role"]), content=m["content"])
            for m in messages
        ]
        request = ChatCompletionRequest(messages=chat_messages)
        
        # Convert to LiteLLM format
        litellm_dict = request.to_litellm_dict()
        
        # Verify messages preserved
        assert len(litellm_dict["messages"]) == len(messages)
        for i, msg in enumerate(messages):
            assert litellm_dict["messages"][i]["role"] == msg["role"]
            assert litellm_dict["messages"][i]["content"] == msg["content"]


class TestModelOverrideBehavior:
    """
    Property-based tests for model override behavior.
    
    **Feature: cfx-router, Property 17: Model Override Behavior**
    **Validates: Requirements 10.6**
    """
    
    @staticmethod
    def _create_config() -> ModelsConfig:
        """Create config for property tests."""
        return ModelsConfig(
            stages={
                "plan": StageConfig(
                    model="claude-sonnet-4.5",
                    max_tokens=4096,
                    temperature=0.3,
                    fallback=["gemini-2.5-pro", "gpt-4o"]
                ),
                "code": StageConfig(
                    model="deepseek-v3",
                    max_tokens=8192,
                    temperature=0.2,
                    fallback=["gemini-2.0-flash", "gpt-4o-mini"]
                ),
                "review": StageConfig(
                    model="gpt-4o-mini",
                    max_tokens=2048,
                    temperature=0.1,
                    fallback=["gemini-flash-lite"]
                ),
            },
            direct=DirectModeConfig(
                allowed_models=["claude-sonnet-4.5", "gpt-4o", "deepseek-v3"],
                max_tokens_cap=8192
            ),
            rate_limit={"daily_requests": 1000, "concurrent_streams": 3},
            circuit_breaker={"failure_threshold": 5, "recovery_timeout": 30},
        )
    
    @given(
        stage=st.sampled_from(["plan", "code", "review"]),
        requested_model=st.sampled_from(["gpt-4", "claude-3", "gemini-pro", None]),
    )
    @settings(max_examples=100)
    def test_property_stage_overrides_model(self, stage: str, requested_model: str):
        """
        Property 17: Model Override Behavior (Stage Override)
        
        *For any* stage and requested model, the stage's configured model
        should be used instead of the requested model.
        
        **Validates: Requirements 10.6**
        """
        config = self._create_config()
        router = StageRouter(config)
        messages = [{"role": "user", "content": "Hello"}]
        
        # Route with explicit stage
        result = router.route(stage, requested_model, messages)
        
        # Stage model should be used, not requested model
        expected_model = config.stages[stage].model
        assert result.model == expected_model, \
            f"Stage {stage} should use {expected_model}, not {requested_model}"
    
    @given(
        model=st.sampled_from(["claude-sonnet-4.5", "gpt-4o", "deepseek-v3"])
    )
    @settings(max_examples=50)
    def test_property_direct_mode_uses_requested_model(self, model: str):
        """
        Property 17: Model Override Behavior (Direct Mode)
        
        *For any* allowed model in direct mode, the requested model
        should be used exactly as specified.
        
        **Validates: Requirements 10.6**
        """
        config = self._create_config()
        router = StageRouter(config)
        messages = [{"role": "user", "content": "Hello"}]
        
        # Route with direct mode
        result = router.route("direct", model, messages)
        
        # Requested model should be used
        assert result.model == model, \
            f"Direct mode should use requested model {model}"
        assert result.stage == Stage.DIRECT


# =============================================================================
# Unit Tests
# =============================================================================

class TestChatCompletionRequest:
    """Unit tests for ChatCompletionRequest model."""
    
    def test_minimal_request(self):
        """Should accept minimal valid request."""
        request = ChatCompletionRequest(
            messages=[ChatMessage(role=Role.USER, content="Hello")]
        )
        
        assert len(request.messages) == 1
        assert request.stream is False
        assert request.max_tokens is None
    
    def test_full_request(self):
        """Should accept full request with all parameters."""
        request = ChatCompletionRequest(
            messages=[
                ChatMessage(role=Role.SYSTEM, content="You are helpful"),
                ChatMessage(role=Role.USER, content="Hello"),
            ],
            model="gpt-4",
            max_tokens=1000,
            temperature=0.7,
            top_p=0.9,
            stream=True,
            stop=["END"],
            presence_penalty=0.5,
            frequency_penalty=0.5,
            user="user-123",
        )
        
        assert len(request.messages) == 2
        assert request.model == "gpt-4"
        assert request.max_tokens == 1000
        assert request.temperature == 0.7
        assert request.stream is True
    
    def test_stop_normalization(self):
        """Should normalize stop to list."""
        request = ChatCompletionRequest(
            messages=[ChatMessage(role=Role.USER, content="Hello")],
            stop="END",
        )
        
        assert request.stop == ["END"]
    
    def test_to_litellm_dict(self):
        """Should convert to LiteLLM format correctly."""
        request = ChatCompletionRequest(
            messages=[ChatMessage(role=Role.USER, content="Hello")],
            model="gpt-4",
            max_tokens=100,
            temperature=0.5,
            stream=True,
        )
        
        result = request.to_litellm_dict()
        
        assert result["model"] == "gpt-4"
        assert result["max_tokens"] == 100
        assert result["temperature"] == 0.5
        assert result["stream"] is True
        assert len(result["messages"]) == 1


class TestChatCompletionResponse:
    """Unit tests for ChatCompletionResponse model."""
    
    def test_from_litellm(self):
        """Should create from LiteLLM response."""
        litellm_response = {
            "id": "chatcmpl-123",
            "created": 1234567890,
            "model": "gpt-4",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Hello!",
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
            },
        }
        
        response = ChatCompletionResponse.from_litellm(litellm_response)
        
        assert response.id == "chatcmpl-123"
        assert response.model == "gpt-4"
        assert len(response.choices) == 1
        assert response.choices[0].message.content == "Hello!"
        assert response.usage.total_tokens == 15


class TestErrorResponse:
    """Unit tests for ErrorResponse model."""
    
    def test_create_error(self):
        """Should create error response."""
        error = ErrorResponse.create(
            message="Invalid request",
            error_type="invalid_request_error",
            param="messages",
        )
        
        assert error.error.message == "Invalid request"
        assert error.error.type == "invalid_request_error"
        assert error.error.param == "messages"
    
    def test_unauthorized(self):
        """Should create unauthorized error."""
        error = ErrorResponse.unauthorized()
        
        assert "Invalid API key" in error.error.message
        assert error.error.type == "authentication_error"
    
    def test_rate_limited(self):
        """Should create rate limit error."""
        error = ErrorResponse.rate_limited()
        
        assert "Rate limit" in error.error.message
        assert error.error.type == "rate_limit_error"
    
    def test_service_unavailable(self):
        """Should create service unavailable error."""
        error = ErrorResponse.service_unavailable()
        
        assert "unavailable" in error.error.message.lower()
        assert error.error.type == "server_error"
