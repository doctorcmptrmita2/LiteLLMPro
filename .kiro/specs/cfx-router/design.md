# Design Document: CF-X Router

## Overview

CF-X Router, AI model isteklerini yöneten merkezi bir FastAPI gateway servisidir. Roo Code VS Code eklentisi ile entegre çalışarak, kullanıcı isteklerini doğrular, rate limit uygular, uygun AI modeline yönlendirir ve SSE streaming ile yanıtları iletir.

### Temel Tasarım Prensipleri

1. **Basitlik** — Orkestrasyon framework'ü kullanmadan, sade FastAPI routing
2. **Güvenilirlik** — Circuit breaker, retry, graceful degradation
3. **Performans** — Async I/O, connection pooling, minimal latency
4. **Maliyet Kontrolü** — Stage-based routing, rate limiting
5. **Gözlemlenebilirlik** — Request logging, health checks, metrics

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EASYPANEL (OVH KS-4)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────────────────────────────┐    │
│  │   Traefik   │    │           CFX-ROUTER                │    │
│  │   (proxy)   │───▶│                                     │    │
│  │   :80/:443  │    │  ┌─────────┐  ┌──────────────────┐ │    │
│  └─────────────┘    │  │  Auth   │  │   Rate Limiter   │ │    │
│                     │  │ Module  │  │     Module       │ │    │
│                     │  └────┬────┘  └────────┬─────────┘ │    │
│                     │       │                │           │    │
│                     │       ▼                ▼           │    │
│                     │  ┌─────────────────────────────┐   │    │
│                     │  │      Stage Router           │   │    │
│                     │  │  (PLAN/CODE/REVIEW/DIRECT)  │   │    │
│                     │  └──────────────┬──────────────┘   │    │
│                     │                 │                  │    │
│                     │                 ▼                  │    │
│                     │  ┌─────────────────────────────┐   │    │
│                     │  │    LiteLLM Client           │   │    │
│                     │  │  (Forwarding + Streaming)   │   │    │
│                     │  └──────────────┬──────────────┘   │    │
│                     │                 │                  │    │
│                     │                 ▼                  │    │
│                     │  ┌─────────────────────────────┐   │    │
│                     │  │    Async Logger             │   │    │
│                     │  │  (Background Queue)         │   │    │
│                     │  └─────────────────────────────┘   │    │
│                     └─────────────────────────────────────┘    │
│                                      │                         │
│         ┌────────────────────────────┼────────────────────┐    │
│         │                            │                    │    │
│         ▼                            ▼                    ▼    │
│  ┌─────────────┐            ┌─────────────┐      ┌───────────┐ │
│  │ PostgreSQL  │            │   LiteLLM   │      │ Dashboard │ │
│  │   :5432     │            │   :4000     │      │  (Next.js)│ │
│  └─────────────┘            └─────────────┘      └───────────┘ │
│                                    │                           │
└────────────────────────────────────┼───────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │Anthropic │    │ DeepSeek │    │  OpenAI  │
              │   API    │    │   API    │    │   API    │
              └──────────┘    └──────────┘    └──────────┘
```

## Components and Interfaces

### 1. Main Application (main.py)

FastAPI uygulamasının giriş noktası. Tüm modülleri birleştirir.

```python
# Pseudocode
class CFXRouter:
    def __init__(config: Config):
        self.auth = AuthModule(config.db)
        self.rate_limiter = RateLimiter(config.db, config.daily_limit)
        self.stage_router = StageRouter(config.models)
        self.litellm_client = LiteLLMClient(config.litellm_url)
        self.logger = AsyncLogger(config.db)
        self.circuit_breaker = CircuitBreaker()
        self.concurrency = ConcurrencyLimiter()

    async def handle_chat_completion(request: ChatRequest) -> Response:
        # 1. Authenticate
        user = await self.auth.verify(request.api_key)
        
        # 2. Check rate limit
        await self.rate_limiter.check(user.id)
        
        # 3. Check concurrency (if streaming)
        if request.stream:
            await self.concurrency.acquire(user.id)
        
        # 4. Determine stage and model
        stage, model = self.stage_router.route(request)
        
        # 5. Forward to LiteLLM
        response = await self.litellm_client.forward(request, model)
        
        # 6. Log (async, best-effort)
        self.logger.log_async(request, response)
        
        return response
```

### 2. Auth Module (cfx/auth.py)

API key doğrulama ve kullanıcı kimlik yönetimi.

```python
# Pseudocode
class AuthModule:
    def __init__(db: Database, salt: str):
        self.db = db
        self.salt = salt
    
    def hash_key(raw_key: str) -> str:
        return sha256(salt + raw_key).hexdigest()
    
    async def verify(api_key: str) -> User:
        key_hash = self.hash_key(api_key)
        user = await self.db.query(
            "SELECT * FROM api_keys WHERE key_hash = $1 AND status = 'active'",
            key_hash
        )
        if not user:
            raise HTTPException(401, "Invalid API key")
        return user
    
    async def create_key(user_id: str, label: str) -> str:
        raw_key = "cfx_" + generate_random(32)
        key_hash = self.hash_key(raw_key)
        await self.db.insert("api_keys", {
            "user_id": user_id,
            "key_hash": key_hash,
            "label": label,
            "status": "active"
        })
        return raw_key  # Only returned once!
```

### 3. Rate Limiter (cfx/rate_limit.py)

Günlük istek limiti kontrolü.

```python
# Pseudocode
class RateLimiter:
    def __init__(db: Database, daily_limit: int):
        self.db = db
        self.daily_limit = daily_limit
    
    async def check_and_increment(user_id: str) -> RateLimitResult:
        today = date.today()  # UTC
        
        # Atomic upsert + increment
        result = await self.db.query("""
            INSERT INTO usage_counters (user_id, day, request_count)
            VALUES ($1, $2, 1)
            ON CONFLICT (user_id, day)
            DO UPDATE SET 
                request_count = usage_counters.request_count + 1,
                updated_at = now()
            RETURNING request_count
        """, user_id, today)
        
        count = result.request_count
        remaining = max(0, self.daily_limit - count)
        reset_time = datetime.combine(today + timedelta(days=1), time.min)
        
        if count > self.daily_limit:
            raise HTTPException(429, "Daily limit exceeded")
        
        return RateLimitResult(
            limit=self.daily_limit,
            remaining=remaining,
            reset=reset_time
        )
```

### 4. Stage Router (cfx/routing.py)

Stage belirleme ve model mapping.

```python
# Pseudocode
class StageRouter:
    def __init__(config_path: str):
        self.models = load_yaml(config_path)
    
    def route(request: ChatRequest, stage_header: str | None) -> tuple[str, str]:
        if stage_header and stage_header in ["plan", "code", "review", "direct"]:
            stage = stage_header
        else:
            stage = self.infer_stage(request.messages)
        
        if stage == "direct":
            model = self.validate_direct_model(request.model)
        else:
            model = self.models[stage]
        
        return stage, model
    
    def infer_stage(messages: list) -> str:
        last_content = messages[-1].content.lower()
        
        if any(kw in last_content for kw in ["plan", "design", "architect", "spec"]):
            return "plan"
        elif any(kw in last_content for kw in ["implement", "code", "write", "fix", "refactor"]):
            return "code"
        elif any(kw in last_content for kw in ["review", "check", "analyze", "security"]):
            return "review"
        else:
            return "plan"
```

### 5. LiteLLM Client (cfx/litellm_client.py)

LiteLLM'e istek forwarding ve streaming.

```python
# Pseudocode
class LiteLLMClient:
    def __init__(base_url: str, timeout: Timeout):
        self.base_url = base_url
        self.client = httpx.AsyncClient(
            timeout=Timeout(connect=10, read=120),
            limits=Limits(max_connections=100)
        )
    
    async def forward(request: ChatRequest, model: str) -> Response:
        payload = {
            "model": model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": request.stream
        }
        
        if request.stream:
            return self.stream_response(payload)
        else:
            return await self.sync_response(payload)
    
    async def stream_response(payload: dict) -> StreamingResponse:
        async def generate():
            async with self.client.stream(
                "POST",
                f"{self.base_url}/v1/chat/completions",
                json=payload
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        yield f"{line}\n\n"
                yield "data: [DONE]\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
```

### 6. Circuit Breaker (cfx/resilience.py)

Upstream hata koruması.

```python
# Pseudocode
class CircuitBreaker:
    def __init__(failure_threshold: int = 5, recovery_timeout: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.state = "CLOSED"
        self.last_failure_time = None
    
    async def call(func: Callable) -> Any:
        if self.state == "OPEN":
            if time.now() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
            else:
                raise HTTPException(503, "Service temporarily unavailable")
        
        try:
            result = await func()
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise
```

### 7. Async Logger (cfx/logger.py)

Best-effort asenkron loglama.

```python
# Pseudocode
class AsyncLogger:
    def __init__(db: Database):
        self.db = db
        self.queue = asyncio.Queue(maxsize=1000)
        self.worker_task = asyncio.create_task(self.worker())
    
    def log_async(request: ChatRequest, response: Response, metadata: dict):
        log_entry = RequestLog(...)
        try:
            self.queue.put_nowait(log_entry)
        except asyncio.QueueFull:
            pass
    
    async def worker():
        while True:
            entry = await self.queue.get()
            try:
                await self.db.insert("request_logs", entry)
            except Exception:
                pass
```

### 8. Concurrency Limiter (cfx/concurrency.py)

Per-user streaming limiti.

```python
# Pseudocode
class ConcurrencyLimiter:
    def __init__(max_concurrent: int = 2):
        self.max_concurrent = max_concurrent
        self.active_streams: dict[str, int] = {}
        self.lock = asyncio.Lock()
    
    async def acquire(user_id: str):
        async with self.lock:
            current = self.active_streams.get(user_id, 0)
            if current >= self.max_concurrent:
                raise HTTPException(429, "Too many concurrent requests")
            self.active_streams[user_id] = current + 1
    
    async def release(user_id: str):
        async with self.lock:
            current = self.active_streams.get(user_id, 0)
            self.active_streams[user_id] = max(0, current - 1)
```

## Data Models

### Database Schema

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usage_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    day DATE NOT NULL,
    request_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, day)
);

CREATE TABLE request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    request_id VARCHAR(36) NOT NULL,
    stage VARCHAR(20) NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_usd NUMERIC(10, 6),
    latency_ms INTEGER,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Configuration (models.yaml)

```yaml
stages:
  plan:
    model: claude-sonnet-4.5
    max_tokens: 4096
  code:
    model: deepseek-v3
    max_tokens: 8192
  review:
    model: gpt-4o-mini
    max_tokens: 2048

direct:
  enabled: true
  allowlist: [gpt-4o-mini, deepseek-v3]
  max_tokens_cap: 4096

rate_limit:
  daily_requests: 1000
  concurrent_streams: 2

timeouts:
  connect: 10
  read: 120

circuit_breaker:
  failure_threshold: 5
  recovery_timeout: 30
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Property 1: Authentication Validation
*For any* API request, if the request lacks an Authorization header OR contains an invalid/revoked API key, the Router SHALL return 401 Unauthorized.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: API Key Hashing Consistency
*For any* raw API key string, hashing it with the same salt SHALL always produce the same hash value.
**Validates: Requirements 1.5**

### Property 3: Rate Limit Enforcement
*For any* user with a daily limit of N requests, the first N requests SHALL succeed, AND the (N+1)th request SHALL return 429.
**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

### Property 4: Rate Limit Atomicity
*For any* set of concurrent requests from the same user, the total count SHALL never exceed the limit due to race conditions.
**Validates: Requirements 2.5**

### Property 5: Stage Routing Determinism
*For any* request with X-CFX-Stage header, the Router SHALL route to the corresponding model as defined in models.yaml.
**Validates: Requirements 3.1, 3.4, 3.5**

### Property 6: Stage Inference Consistency
*For any* request without X-CFX-Stage header, the Router SHALL infer the stage deterministically from message content.
**Validates: Requirements 3.2, 3.3**

### Property 7: Direct Mode Allowlist
*For any* direct mode request with non-allowed model, the Router SHALL reject with 400.
**Validates: Requirements 3.6**

### Property 8: Request Parameter Preservation
*For any* valid ChatCompletionRequest, the forwarded request SHALL contain all original parameters unchanged.
**Validates: Requirements 4.4, 4.5**

### Property 9: Transient Error Retry
*For any* LiteLLM response with 502/503/504, the Router SHALL retry exactly once.
**Validates: Requirements 4.3**

### Property 10: SSE Streaming Format
*For any* streaming response, each chunk SHALL be prefixed with "data: " and end with "[DONE]".
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 11: Request Logging Completeness
*For any* completed request, the log entry SHALL contain all required fields.
**Validates: Requirements 6.1, 6.4**

### Property 12: Request ID Uniqueness
*For any* two distinct requests, their request_ids SHALL be different.
**Validates: Requirements 6.4, 6.5**

### Property 13: Circuit Breaker State Machine
*For any* sequence of 5 consecutive failures, the circuit SHALL open and return 503.
**Validates: Requirements 7.1, 7.2, 7.4, 7.5**

### Property 14: Concurrency Limit Enforcement
*For any* user with max_concurrent=2, the 3rd concurrent streaming request SHALL return 429.
**Validates: Requirements 8.1, 8.2, 8.4**

### Property 15: Non-Streaming Concurrency Exemption
*For any* non-streaming request, the concurrency limiter SHALL NOT apply.
**Validates: Requirements 8.5**

### Property 16: OpenAI API Compatibility
*For any* valid OpenAI-format request, the response SHALL conform to OpenAI format.
**Validates: Requirements 10.2, 10.3**

### Property 17: Model Override Behavior
*For any* request with client-specified model, the Router SHALL ignore it unless direct mode.
**Validates: Requirements 10.6**

## Error Handling

| HTTP Status | Error Type | Description |
|-------------|------------|-------------|
| 400 | invalid_request | Malformed request |
| 401 | authentication_error | Invalid API key |
| 429 | rate_limit_error | Limit exceeded |
| 500 | internal_error | Server error |
| 503 | service_unavailable | Upstream down |

## Testing Strategy

- **Unit Tests**: Auth, rate limiter, stage router, circuit breaker
- **Property Tests**: Hypothesis framework, 100+ iterations per property
- **Integration Tests**: End-to-end with mock LiteLLM
- **Load Tests**: Concurrent requests, circuit breaker activation
