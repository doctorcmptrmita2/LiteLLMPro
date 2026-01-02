"""
CF-X Router - Main FastAPI Application

3-Stage AI Orchestration Platform with OpenAI-compatible API.
"""

import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import FastAPI, Request, Response, HTTPException, Header, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from cfx import __version__
from cfx.config import load_config, ModelsConfig
from cfx.auth import AuthModule, AuthResult
from cfx.rate_limit import RateLimiter, RateLimitConfig
from cfx.concurrency import ConcurrencyLimiter, ConcurrencyConfig, ConcurrencyContext
from cfx.routing import StageRouter, Stage
from cfx.litellm_client import (
    LiteLLMClient, 
    LiteLLMConfig, 
    CompletionRequest,
    LiteLLMError,
    LiteLLMUnavailableError,
)
from cfx.resilience import CircuitBreaker, CircuitBreakerConfig, CircuitOpenError
from cfx.logger import AsyncLogger, LoggerConfig, RequestLogEntry, calculate_cost
from cfx.database import Database, DatabaseConfig
from cfx.models import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ErrorResponse,
    HealthStatus,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# =============================================================================
# Application State
# =============================================================================

class AppState:
    """Application state container."""
    
    def __init__(self):
        self.config: Optional[ModelsConfig] = None
        self.database: Optional[Database] = None
        self.auth: Optional[AuthModule] = None
        self.rate_limiter: Optional[RateLimiter] = None
        self.concurrency_limiter: Optional[ConcurrencyLimiter] = None
        self.stage_router: Optional[StageRouter] = None
        self.litellm_client: Optional[LiteLLMClient] = None
        self.circuit_breaker: Optional[CircuitBreaker] = None
        self.async_logger: Optional[AsyncLogger] = None


app_state = AppState()


# =============================================================================
# Lifespan Management
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info(f"Starting CF-X Router v{__version__}")
    
    # Load configuration
    config_path = os.getenv("CFX_CONFIG_PATH")
    try:
        app_state.config = load_config(config_path)
        logger.info(f"Loaded configuration")
    except FileNotFoundError:
        logger.warning("Config file not found, using defaults")
        # Create default config
        from cfx.config import ModelsConfig, StageConfig, DirectModeConfig
        app_state.config = ModelsConfig(
            stages={
                "plan": StageConfig(model="claude-sonnet-4.5", max_tokens=4096, temperature=0.3),
                "code": StageConfig(model="deepseek-v3", max_tokens=8192, temperature=0.2),
                "review": StageConfig(model="gpt-4o-mini", max_tokens=2048, temperature=0.1),
            },
            direct=DirectModeConfig(
                allowed_models=["claude-sonnet-4.5", "deepseek-v3", "gpt-4o-mini"],
                max_tokens_cap=8192,
            ),
            rate_limit={"daily_requests": 1000, "concurrent_streams": 3},
            circuit_breaker={"failure_threshold": 5, "recovery_timeout": 30},
        )
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        raise
    
    # Initialize database
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        db_config = DatabaseConfig(dsn=db_url)
        app_state.database = Database(db_config)
        await app_state.database.connect()
        logger.info("Database connected")
    else:
        logger.warning("DATABASE_URL not set, running without database")
    
    # Initialize auth module
    hash_salt = os.getenv("HASH_SALT", "cfx-default-salt")
    app_state.auth = AuthModule(
        db_pool=app_state.database.pool if app_state.database else None,
        hash_salt=hash_salt,
    )
    
    # Initialize rate limiter
    rate_config = RateLimitConfig(
        daily_limit=app_state.config.rate_limit.get("daily_requests", 1000),
    )
    app_state.rate_limiter = RateLimiter(
        config=rate_config,
        db_pool=app_state.database.pool if app_state.database else None,
    )
    
    # Initialize concurrency limiter
    conc_config = ConcurrencyConfig(
        max_concurrent_streams=app_state.config.rate_limit.get("concurrent_streams", 3),
    )
    app_state.concurrency_limiter = ConcurrencyLimiter(conc_config)
    
    # Initialize stage router
    app_state.stage_router = StageRouter(app_state.config)
    
    # Initialize LiteLLM client
    litellm_url = os.getenv("LITELLM_URL", "http://litellm:4000")
    litellm_api_key = os.getenv("LITELLM_API_KEY", "")
    litellm_config = LiteLLMConfig(
        base_url=litellm_url,
        api_key=litellm_api_key,
        connect_timeout=10.0,
        read_timeout=120.0,
    )
    app_state.litellm_client = LiteLLMClient(litellm_config)
    
    # Initialize circuit breaker
    cb_config = CircuitBreakerConfig(
        failure_threshold=app_state.config.circuit_breaker.get("failure_threshold", 5),
        recovery_timeout=app_state.config.circuit_breaker.get("recovery_timeout", 30.0),
    )
    app_state.circuit_breaker = CircuitBreaker(cb_config, name="litellm")
    
    # Initialize async logger
    logger_config = LoggerConfig()
    app_state.async_logger = AsyncLogger(
        config=logger_config,
        db_pool=app_state.database.pool if app_state.database else None,
    )
    await app_state.async_logger.start()
    
    logger.info("CF-X Router started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down CF-X Router")
    
    if app_state.async_logger:
        await app_state.async_logger.stop()
    
    if app_state.litellm_client:
        await app_state.litellm_client.close()
    
    if app_state.database:
        await app_state.database.disconnect()
    
    logger.info("CF-X Router shutdown complete")


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="CF-X Router",
    description="3-Stage AI Orchestration Platform with OpenAI-compatible API",
    version=__version__,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Dependencies
# =============================================================================

async def get_auth_result(
    authorization: Optional[str] = Header(None),
) -> AuthResult:
    """Authenticate request and return auth result."""
    if not app_state.auth:
        raise HTTPException(status_code=500, detail="Auth not initialized")
    
    result = await app_state.auth.authenticate(authorization)
    
    if not result.authenticated:
        raise HTTPException(
            status_code=401,
            detail=ErrorResponse.unauthorized(result.error or "Unauthorized").model_dump(),
        )
    
    return result


# =============================================================================
# Endpoints
# =============================================================================

@app.get("/health")
async def health_check() -> HealthStatus:
    """
    Health check endpoint.
    
    Returns status of all dependencies.
    """
    checks = {
        "config": app_state.config is not None,
        "stage_router": app_state.stage_router is not None,
        "litellm_client": app_state.litellm_client is not None,
    }
    
    # Check database
    if app_state.database:
        try:
            checks["database"] = await app_state.database.health_check()
        except Exception:
            checks["database"] = False
    
    # Check LiteLLM
    if app_state.litellm_client:
        try:
            checks["litellm"] = await app_state.litellm_client.health_check()
        except Exception:
            checks["litellm"] = False
    
    # Determine overall status
    all_healthy = all(checks.values())
    critical_healthy = checks.get("config", False) and checks.get("litellm_client", False)
    
    if all_healthy:
        return HealthStatus.healthy(__version__, checks)
    elif critical_healthy:
        return HealthStatus.degraded(__version__, checks)
    else:
        return HealthStatus.unhealthy(__version__, checks)


@app.post("/v1/chat/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    raw_request: Request,
    auth: AuthResult = Depends(get_auth_result),
    x_cfx_stage: Optional[str] = Header(None, alias="X-CFX-Stage"),
):
    """
    OpenAI-compatible chat completions endpoint.
    
    Supports:
    - Stage-based routing (PLAN, CODE, REVIEW)
    - Direct model selection
    - Streaming responses
    - Rate limiting
    - Concurrency limiting
    """
    start_time = time.monotonic()
    request_id = app_state.async_logger.generate_request_id() if app_state.async_logger else "unknown"
    
    # Check rate limit
    if app_state.rate_limiter and auth.user_id:
        allowed, remaining, reset_time = await app_state.rate_limiter.check_and_increment(
            auth.user_id
        )
        
        if not allowed:
            return JSONResponse(
                status_code=429,
                content=ErrorResponse.rate_limited(
                    f"Rate limit exceeded. Resets at {reset_time.isoformat()}"
                ).model_dump(),
                headers={
                    "X-RateLimit-Limit": str(app_state.rate_limiter.config.daily_limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": reset_time.isoformat(),
                    "X-CFX-Request-Id": request_id,
                },
            )
    
    # Route to appropriate model
    try:
        messages_dict = [msg.model_dump(exclude_none=True) for msg in request.messages]
        routing_result = app_state.stage_router.route(
            stage_header=x_cfx_stage,
            requested_model=request.model,
            messages=messages_dict,
            max_tokens=request.max_tokens,
        )
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content=ErrorResponse.invalid_request(str(e)).model_dump(),
            headers={"X-CFX-Request-Id": request_id},
        )
    
    # Check circuit breaker
    if app_state.circuit_breaker and not await app_state.circuit_breaker.can_execute():
        return JSONResponse(
            status_code=503,
            content=ErrorResponse.service_unavailable(
                "Service temporarily unavailable due to upstream issues"
            ).model_dump(),
            headers={"X-CFX-Request-Id": request_id},
        )
    
    # Build completion request
    completion_request = CompletionRequest(
        model=routing_result.model,
        messages=messages_dict,
        stream=request.stream,
        max_tokens=routing_result.max_tokens,
        temperature=routing_result.temperature if request.temperature is None else request.temperature,
        top_p=request.top_p,
        stop=request.stop,
    )
    
    # Common response headers
    response_headers = {
        "X-CFX-Request-Id": request_id,
        "X-CFX-Stage": routing_result.stage.value,
        "X-CFX-Model-Used": routing_result.model,
    }
    
    if app_state.rate_limiter and auth.user_id:
        _, remaining, reset_time = await app_state.rate_limiter.get_status(auth.user_id)
        response_headers.update({
            "X-RateLimit-Limit": str(app_state.rate_limiter.config.daily_limit),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": reset_time.isoformat(),
        })
    
    # Handle streaming
    if request.stream:
        return await handle_streaming_request(
            completion_request=completion_request,
            auth=auth,
            request_id=request_id,
            routing_result=routing_result,
            response_headers=response_headers,
            start_time=start_time,
        )
    
    # Handle non-streaming
    return await handle_non_streaming_request(
        completion_request=completion_request,
        auth=auth,
        request_id=request_id,
        routing_result=routing_result,
        response_headers=response_headers,
        start_time=start_time,
    )


async def handle_streaming_request(
    completion_request: CompletionRequest,
    auth: AuthResult,
    request_id: str,
    routing_result,
    response_headers: dict,
    start_time: float,
):
    """Handle streaming chat completion request."""
    
    # Check concurrency limit
    if app_state.concurrency_limiter and auth.user_id:
        acquired = await app_state.concurrency_limiter.acquire(auth.user_id, is_streaming=True)
        if not acquired:
            return JSONResponse(
                status_code=429,
                content=ErrorResponse.rate_limited(
                    "Too many concurrent streaming requests"
                ).model_dump(),
                headers=response_headers,
            )
    
    async def stream_generator():
        """Generate SSE stream."""
        try:
            async for chunk in app_state.litellm_client.stream(completion_request):
                yield chunk
            
            # Record success
            if app_state.circuit_breaker:
                await app_state.circuit_breaker.record_success()
                
        except (LiteLLMError, LiteLLMUnavailableError) as e:
            logger.error(f"LiteLLM streaming error: {e}")
            if app_state.circuit_breaker:
                await app_state.circuit_breaker.record_failure()
            # Send error in SSE format
            error_data = ErrorResponse.service_unavailable(str(e)).model_dump()
            yield f"data: {error_data}\n\n"
            
        finally:
            # Release concurrency slot
            if app_state.concurrency_limiter and auth.user_id:
                await app_state.concurrency_limiter.release(auth.user_id, is_streaming=True)
            
            # Log request (best effort)
            latency_ms = int((time.monotonic() - start_time) * 1000)
            await log_request(
                request_id=request_id,
                auth=auth,
                routing_result=routing_result,
                prompt_tokens=0,  # Unknown for streaming
                completion_tokens=0,
                latency_ms=latency_ms,
                status_code=200,
            )
    
    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers=response_headers,
    )


async def handle_non_streaming_request(
    completion_request: CompletionRequest,
    auth: AuthResult,
    request_id: str,
    routing_result,
    response_headers: dict,
    start_time: float,
):
    """Handle non-streaming chat completion request."""
    
    try:
        response = await app_state.litellm_client.complete(completion_request)
        
        # Record success
        if app_state.circuit_breaker:
            await app_state.circuit_breaker.record_success()
        
        latency_ms = int((time.monotonic() - start_time) * 1000)
        
        # Log request
        prompt_tokens = response.usage.get("prompt_tokens", 0) if response.usage else 0
        completion_tokens = response.usage.get("completion_tokens", 0) if response.usage else 0
        
        await log_request(
            request_id=request_id,
            auth=auth,
            routing_result=routing_result,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            status_code=200,
        )
        
        # Build response
        result = ChatCompletionResponse.from_litellm({
            "id": response.id,
            "created": int(datetime.now(timezone.utc).timestamp()),
            "model": routing_result.model,
            "choices": response.choices,
            "usage": response.usage,
        })
        
        return JSONResponse(
            content=result.model_dump(),
            headers=response_headers,
        )
        
    except LiteLLMUnavailableError as e:
        logger.error(f"LiteLLM unavailable: {e}")
        if app_state.circuit_breaker:
            await app_state.circuit_breaker.record_failure()
        
        latency_ms = int((time.monotonic() - start_time) * 1000)
        await log_request(
            request_id=request_id,
            auth=auth,
            routing_result=routing_result,
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=latency_ms,
            status_code=503,
            error_message=str(e),
        )
        
        return JSONResponse(
            status_code=503,
            content=ErrorResponse.service_unavailable(str(e)).model_dump(),
            headers=response_headers,
        )
        
    except LiteLLMError as e:
        logger.error(f"LiteLLM error: {e}")
        if app_state.circuit_breaker:
            await app_state.circuit_breaker.record_failure()
        
        latency_ms = int((time.monotonic() - start_time) * 1000)
        await log_request(
            request_id=request_id,
            auth=auth,
            routing_result=routing_result,
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=latency_ms,
            status_code=e.status_code,
            error_message=str(e),
        )
        
        return JSONResponse(
            status_code=e.status_code,
            content=ErrorResponse.create(
                message=e.message,
                error_type="upstream_error",
            ).model_dump(),
            headers=response_headers,
        )


async def log_request(
    request_id: str,
    auth: AuthResult,
    routing_result,
    prompt_tokens: int,
    completion_tokens: int,
    latency_ms: int,
    status_code: int,
    error_message: Optional[str] = None,
):
    """Log request to async logger."""
    if not app_state.async_logger:
        return
    
    cost = calculate_cost(
        model=routing_result.model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )
    
    entry = RequestLogEntry(
        request_id=request_id,
        user_id=auth.user_id or "unknown",
        api_key_id=auth.api_key_id or 0,
        stage=routing_result.stage.value,
        model=routing_result.model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=prompt_tokens + completion_tokens,
        cost=cost,
        latency_ms=latency_ms,
        status_code=status_code,
        error_message=error_message,
    )
    
    await app_state.async_logger.log(entry)


# =============================================================================
# Error Handlers
# =============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail if isinstance(exc.detail, dict) else {"error": {"message": str(exc.detail)}},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.exception(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse.create(
            message="Internal server error",
            error_type="server_error",
        ).model_dump(),
    )


# =============================================================================
# Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
