"""
CF-X Router Pydantic Models

OpenAI-compatible request/response models for the chat completions API.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# Enums
# =============================================================================

class Role(str, Enum):
    """Message roles."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"
    FUNCTION = "function"


class FinishReason(str, Enum):
    """Reasons for completion finish."""
    STOP = "stop"
    LENGTH = "length"
    TOOL_CALLS = "tool_calls"
    CONTENT_FILTER = "content_filter"
    FUNCTION_CALL = "function_call"


# =============================================================================
# Request Models
# =============================================================================

class ChatMessage(BaseModel):
    """A single chat message."""
    role: Role
    content: Optional[str] = None
    name: Optional[str] = None
    tool_calls: Optional[list[dict[str, Any]]] = None
    tool_call_id: Optional[str] = None
    
    model_config = {"extra": "allow"}


class FunctionDefinition(BaseModel):
    """Function definition for tool calling."""
    name: str
    description: Optional[str] = None
    parameters: Optional[dict[str, Any]] = None


class ToolDefinition(BaseModel):
    """Tool definition."""
    type: Literal["function"] = "function"
    function: FunctionDefinition


class ResponseFormat(BaseModel):
    """Response format specification."""
    type: Literal["text", "json_object"] = "text"


class ChatCompletionRequest(BaseModel):
    """
    OpenAI-compatible chat completion request.
    
    Supports all standard OpenAI parameters plus CF-X extensions.
    """
    # Required
    messages: list[ChatMessage]
    
    # Model selection (may be overridden by stage routing)
    model: Optional[str] = None
    
    # Generation parameters
    max_tokens: Optional[int] = Field(default=None, ge=1, le=128000)
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    n: Optional[int] = Field(default=1, ge=1, le=10)
    
    # Streaming
    stream: bool = False
    
    # Stop sequences
    stop: Optional[Union[str, list[str]]] = None
    
    # Penalties
    presence_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0)
    frequency_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0)
    
    # Logit bias
    logit_bias: Optional[dict[str, float]] = None
    
    # User identification
    user: Optional[str] = None
    
    # Tool/Function calling
    tools: Optional[list[ToolDefinition]] = None
    tool_choice: Optional[Union[str, dict[str, Any]]] = None
    
    # Response format
    response_format: Optional[ResponseFormat] = None
    
    # Seed for reproducibility
    seed: Optional[int] = None
    
    model_config = {"extra": "allow"}
    
    @field_validator("stop", mode="before")
    @classmethod
    def normalize_stop(cls, v):
        """Normalize stop to list."""
        if isinstance(v, str):
            return [v]
        return v
    
    def to_litellm_dict(self) -> dict[str, Any]:
        """Convert to dictionary for LiteLLM API call."""
        data: dict[str, Any] = {
            "messages": [msg.model_dump(exclude_none=True) for msg in self.messages],
            "stream": self.stream,
        }
        
        # Add optional parameters if set
        if self.model:
            data["model"] = self.model
        if self.max_tokens is not None:
            data["max_tokens"] = self.max_tokens
        if self.temperature is not None:
            data["temperature"] = self.temperature
        if self.top_p is not None:
            data["top_p"] = self.top_p
        if self.n is not None and self.n != 1:
            data["n"] = self.n
        if self.stop:
            data["stop"] = self.stop
        if self.presence_penalty is not None:
            data["presence_penalty"] = self.presence_penalty
        if self.frequency_penalty is not None:
            data["frequency_penalty"] = self.frequency_penalty
        if self.logit_bias:
            data["logit_bias"] = self.logit_bias
        if self.user:
            data["user"] = self.user
        if self.tools:
            data["tools"] = [t.model_dump() for t in self.tools]
        if self.tool_choice:
            data["tool_choice"] = self.tool_choice
        if self.response_format:
            data["response_format"] = self.response_format.model_dump()
        if self.seed is not None:
            data["seed"] = self.seed
        
        return data


# =============================================================================
# Response Models
# =============================================================================

class Usage(BaseModel):
    """Token usage information."""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChoiceMessage(BaseModel):
    """Message in a completion choice."""
    role: Role = Role.ASSISTANT
    content: Optional[str] = None
    tool_calls: Optional[list[dict[str, Any]]] = None
    function_call: Optional[dict[str, Any]] = None
    
    model_config = {"extra": "allow"}


class Choice(BaseModel):
    """A single completion choice."""
    index: int
    message: ChoiceMessage
    finish_reason: Optional[FinishReason] = None
    logprobs: Optional[dict[str, Any]] = None


class ChatCompletionResponse(BaseModel):
    """
    OpenAI-compatible chat completion response.
    """
    id: str
    object: Literal["chat.completion"] = "chat.completion"
    created: int
    model: str
    choices: list[Choice]
    usage: Optional[Usage] = None
    system_fingerprint: Optional[str] = None
    
    model_config = {"extra": "allow"}
    
    @classmethod
    def from_litellm(cls, data: dict[str, Any]) -> "ChatCompletionResponse":
        """Create from LiteLLM response dictionary."""
        choices = []
        for c in data.get("choices", []):
            message_data = c.get("message", {})
            message = ChoiceMessage(
                role=message_data.get("role", "assistant"),
                content=message_data.get("content"),
                tool_calls=message_data.get("tool_calls"),
                function_call=message_data.get("function_call"),
            )
            choices.append(Choice(
                index=c.get("index", 0),
                message=message,
                finish_reason=c.get("finish_reason"),
                logprobs=c.get("logprobs"),
            ))
        
        usage = None
        if "usage" in data:
            usage = Usage(**data["usage"])
        
        return cls(
            id=data.get("id", ""),
            created=data.get("created", 0),
            model=data.get("model", ""),
            choices=choices,
            usage=usage,
            system_fingerprint=data.get("system_fingerprint"),
        )


# =============================================================================
# Streaming Response Models
# =============================================================================

class DeltaMessage(BaseModel):
    """Delta message for streaming."""
    role: Optional[Role] = None
    content: Optional[str] = None
    tool_calls: Optional[list[dict[str, Any]]] = None
    function_call: Optional[dict[str, Any]] = None


class StreamChoice(BaseModel):
    """A single streaming choice."""
    index: int
    delta: DeltaMessage
    finish_reason: Optional[FinishReason] = None
    logprobs: Optional[dict[str, Any]] = None


class ChatCompletionChunk(BaseModel):
    """
    OpenAI-compatible streaming chunk.
    """
    id: str
    object: Literal["chat.completion.chunk"] = "chat.completion.chunk"
    created: int
    model: str
    choices: list[StreamChoice]
    system_fingerprint: Optional[str] = None
    
    model_config = {"extra": "allow"}
    
    @classmethod
    def from_litellm(cls, data: dict[str, Any]) -> "ChatCompletionChunk":
        """Create from LiteLLM streaming chunk."""
        choices = []
        for c in data.get("choices", []):
            delta_data = c.get("delta", {})
            delta = DeltaMessage(
                role=delta_data.get("role"),
                content=delta_data.get("content"),
                tool_calls=delta_data.get("tool_calls"),
                function_call=delta_data.get("function_call"),
            )
            choices.append(StreamChoice(
                index=c.get("index", 0),
                delta=delta,
                finish_reason=c.get("finish_reason"),
                logprobs=c.get("logprobs"),
            ))
        
        return cls(
            id=data.get("id", ""),
            created=data.get("created", 0),
            model=data.get("model", ""),
            choices=choices,
            system_fingerprint=data.get("system_fingerprint"),
        )


# =============================================================================
# Error Models
# =============================================================================

class ErrorDetail(BaseModel):
    """Error detail information."""
    message: str
    type: str
    param: Optional[str] = None
    code: Optional[str] = None


class ErrorResponse(BaseModel):
    """
    OpenAI-compatible error response.
    """
    error: ErrorDetail
    
    @classmethod
    def create(
        cls,
        message: str,
        error_type: str = "invalid_request_error",
        param: Optional[str] = None,
        code: Optional[str] = None,
    ) -> "ErrorResponse":
        """Create an error response."""
        return cls(
            error=ErrorDetail(
                message=message,
                type=error_type,
                param=param,
                code=code,
            )
        )
    
    @classmethod
    def unauthorized(cls, message: str = "Invalid API key") -> "ErrorResponse":
        """Create unauthorized error."""
        return cls.create(
            message=message,
            error_type="authentication_error",
            code="invalid_api_key",
        )
    
    @classmethod
    def rate_limited(
        cls,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
    ) -> "ErrorResponse":
        """Create rate limit error."""
        return cls.create(
            message=message,
            error_type="rate_limit_error",
            code="rate_limit_exceeded",
        )
    
    @classmethod
    def service_unavailable(
        cls,
        message: str = "Service temporarily unavailable",
    ) -> "ErrorResponse":
        """Create service unavailable error."""
        return cls.create(
            message=message,
            error_type="server_error",
            code="service_unavailable",
        )
    
    @classmethod
    def invalid_request(
        cls,
        message: str,
        param: Optional[str] = None,
    ) -> "ErrorResponse":
        """Create invalid request error."""
        return cls.create(
            message=message,
            error_type="invalid_request_error",
            param=param,
        )


# =============================================================================
# CF-X Extension Models
# =============================================================================

class CFXMetadata(BaseModel):
    """CF-X specific metadata included in responses."""
    request_id: str
    stage: str
    model_used: str
    inferred_stage: bool = False
    latency_ms: Optional[int] = None
    cost_usd: Optional[float] = None
    
    model_config = {"protected_namespaces": ()}


class HealthStatus(BaseModel):
    """Health check response."""
    status: Literal["healthy", "degraded", "unhealthy"]
    version: str
    timestamp: datetime
    checks: dict[str, bool]
    
    @classmethod
    def healthy(cls, version: str, checks: dict[str, bool]) -> "HealthStatus":
        """Create healthy status."""
        return cls(
            status="healthy",
            version=version,
            timestamp=datetime.utcnow(),
            checks=checks,
        )
    
    @classmethod
    def degraded(cls, version: str, checks: dict[str, bool]) -> "HealthStatus":
        """Create degraded status."""
        return cls(
            status="degraded",
            version=version,
            timestamp=datetime.utcnow(),
            checks=checks,
        )
    
    @classmethod
    def unhealthy(cls, version: str, checks: dict[str, bool]) -> "HealthStatus":
        """Create unhealthy status."""
        return cls(
            status="unhealthy",
            version=version,
            timestamp=datetime.utcnow(),
            checks=checks,
        )
