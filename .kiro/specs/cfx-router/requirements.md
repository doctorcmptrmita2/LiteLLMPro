# Requirements Document

## Introduction

CF-X (CodexFlow), 3 aşamalı (PLAN → CODE → REVIEW) bir AI orkestrasyon platformudur. Roo Code VS Code eklentisi ile entegre çalışarak, farklı AI modellerini maliyet-etkin şekilde yönlendirir. Platform, OpenAI-uyumlu API endpoint'i üzerinden SSE streaming destekler ve kullanıcı bazlı rate limiting ile maliyet kontrolü sağlar.

## Glossary

- **Router**: FastAPI tabanlı ana gateway servisi, tüm istekleri yöneten ve politikaları uygulayan merkezi bileşen
- **LiteLLM**: Farklı AI provider'larına (Anthropic, OpenAI, DeepSeek) tek bir arayüz üzerinden erişim sağlayan proxy servisi
- **Stage**: İstek türünü belirleyen kategori (plan, code, review, direct)
- **API_Key**: Kullanıcıyı tanımlayan, hash'lenmiş olarak saklanan kimlik bilgisi
- **SSE**: Server-Sent Events, gerçek zamanlı streaming için kullanılan protokol
- **Rate_Limiter**: Günlük istek limitini kontrol eden bileşen
- **Circuit_Breaker**: Upstream hata durumlarında sistemi koruyan mekanizma
- **Easypanel**: Docker container'larını yöneten self-hosted kontrol paneli
- **Request_Log**: Her API isteğinin token, maliyet ve durum bilgilerini içeren kayıt

## Requirements

### Requirement 1: API Key Authentication

**User Story:** As a developer, I want to authenticate using an API key, so that I can securely access the AI services.

#### Acceptance Criteria

1. WHEN a request arrives without Authorization header, THEN THE Router SHALL return 401 Unauthorized with error message
2. WHEN a request contains an invalid API key format, THEN THE Router SHALL return 401 Unauthorized
3. WHEN a request contains a valid API key, THE Router SHALL verify it against the hashed keys in PostgreSQL
4. WHEN an API key is revoked, THE Router SHALL reject requests with 401 Unauthorized
5. THE Router SHALL hash API keys using SHA-256 with a configurable salt before storage
6. THE Router SHALL never log or expose raw API keys in any output

### Requirement 2: Rate Limiting

**User Story:** As a platform operator, I want to enforce daily request limits per user, so that I can control costs and prevent abuse.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL enforce a configurable daily limit (default: 1000 requests) per user
2. WHEN a user exceeds their daily limit, THE Router SHALL return 429 Too Many Requests
3. THE Router SHALL include rate limit headers in all responses: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
4. THE Rate_Limiter SHALL reset counters at 00:00 UTC daily
5. THE Rate_Limiter SHALL use atomic database operations to prevent race conditions
6. WHEN rate limit is exceeded, THE Router SHALL NOT forward the request to LiteLLM

### Requirement 3: Stage-Based Model Routing

**User Story:** As a developer, I want my requests automatically routed to the appropriate AI model based on the task type, so that I get optimal cost-performance balance.

#### Acceptance Criteria

1. WHEN X-CFX-Stage header is provided, THE Router SHALL use the specified stage (plan, code, review, direct)
2. WHEN no stage header is provided, THE Router SHALL infer the stage from message content
3. IF stage cannot be determined, THEN THE Router SHALL default to "plan" stage
4. THE Router SHALL map stages to models via a YAML configuration file
5. THE Router SHALL include X-CFX-Stage and X-CFX-Model-Used headers in responses
6. WHEN direct mode is requested, THE Router SHALL validate against an allowlist of permitted models

### Requirement 4: LiteLLM Integration and Forwarding

**User Story:** As a developer, I want my requests forwarded to AI providers through LiteLLM, so that I can access multiple AI models through a unified interface.

#### Acceptance Criteria

1. THE Router SHALL forward authenticated requests to LiteLLM at the configured internal URL
2. THE Router SHALL apply connection timeout (10s) and read timeout (120s) for LiteLLM calls
3. WHEN LiteLLM returns a transient error (502, 503, 504), THE Router SHALL retry once
4. THE Router SHALL transform requests to OpenAI-compatible format before forwarding
5. THE Router SHALL preserve all relevant request parameters (messages, temperature, max_tokens)
6. WHEN LiteLLM is unavailable, THE Router SHALL return 503 Service Unavailable

### Requirement 5: SSE Streaming Support

**User Story:** As a developer using Roo Code, I want to receive AI responses as a real-time stream, so that I can see output progressively.

#### Acceptance Criteria

1. WHEN stream=true is set in request, THE Router SHALL relay SSE events from LiteLLM to client
2. THE Router SHALL format SSE events with proper "data:" prefix and newline framing
3. THE Router SHALL send "[DONE]" marker when stream completes
4. WHEN client disconnects mid-stream, THE Router SHALL terminate the upstream connection
5. THE Router SHALL flush SSE events immediately without buffering
6. IF streaming fails mid-response, THEN THE Router SHALL log the error and close connection gracefully

### Requirement 6: Request Logging

**User Story:** As a platform operator, I want all requests logged with token usage and cost data, so that I can monitor usage and billing.

#### Acceptance Criteria

1. THE Router SHALL log each request with: request_id, user_id, stage, model, tokens, cost, latency, status
2. THE Router SHALL perform logging asynchronously to not block the response
3. IF logging fails, THEN THE Router SHALL NOT fail the user request
4. THE Router SHALL generate a unique request_id (UUID) for each request
5. THE Router SHALL include X-CFX-Request-Id header in all responses
6. WHEN streaming completes, THE Router SHALL log the final token counts

### Requirement 7: Circuit Breaker for Upstream Resilience

**User Story:** As a platform operator, I want the system to gracefully handle upstream failures, so that cascading failures are prevented.

#### Acceptance Criteria

1. WHEN 5 consecutive upstream failures occur, THE Circuit_Breaker SHALL open and reject new requests
2. WHILE circuit is open, THE Router SHALL return 503 with "Service temporarily unavailable" message
3. AFTER 30 seconds in open state, THE Circuit_Breaker SHALL allow one test request (half-open)
4. WHEN test request succeeds, THE Circuit_Breaker SHALL close and resume normal operation
5. WHEN test request fails, THE Circuit_Breaker SHALL return to open state
6. THE Router SHALL log all circuit breaker state transitions

### Requirement 8: Concurrent Request Limiting

**User Story:** As a platform operator, I want to limit concurrent streaming requests per user, so that resources are fairly distributed.

#### Acceptance Criteria

1. THE Router SHALL enforce a maximum of 2 concurrent streaming requests per user
2. WHEN a user exceeds concurrent limit, THE Router SHALL return 429 with "Too many concurrent requests"
3. THE Router SHALL track active streams per user in memory
4. WHEN a stream completes or disconnects, THE Router SHALL decrement the user's active stream count
5. THE Router SHALL NOT apply concurrent limits to non-streaming requests

### Requirement 9: Health Check Endpoint

**User Story:** As a DevOps engineer, I want a health check endpoint, so that I can monitor service availability.

#### Acceptance Criteria

1. THE Router SHALL expose GET /health endpoint without authentication
2. WHEN all dependencies are healthy, THE Router SHALL return 200 OK with status "healthy"
3. WHEN database is unreachable, THE Router SHALL return 503 with status "unhealthy"
4. WHEN LiteLLM is unreachable, THE Router SHALL return 503 with status "degraded"
5. THE Router SHALL include version information in health response

### Requirement 10: OpenAI-Compatible API Endpoint

**User Story:** As a Roo Code user, I want to use the standard OpenAI API format, so that I can integrate without code changes.

#### Acceptance Criteria

1. THE Router SHALL expose POST /v1/chat/completions endpoint
2. THE Router SHALL accept OpenAI-format request body: model, messages, stream, temperature, max_tokens
3. THE Router SHALL return OpenAI-format response with id, choices, usage fields
4. WHEN stream=true, THE Router SHALL return SSE-formatted chunks matching OpenAI format
5. THE Router SHALL return standard HTTP error codes: 400, 401, 429, 500, 503
6. THE Router SHALL ignore client-specified model and use stage-based routing instead (except direct mode)

### Requirement 11: Configuration Management

**User Story:** As a platform operator, I want to configure the system via files and environment variables, so that I can easily adjust settings without code changes.

#### Acceptance Criteria

1. THE Router SHALL load model mappings from /config/models.yaml file
2. THE Router SHALL read sensitive values (database URL, API keys) from environment variables
3. WHEN configuration file is missing, THE Router SHALL fail to start with clear error message
4. THE Router SHALL validate configuration on startup and log any warnings
5. THE Router SHALL support hot-reload of models.yaml without restart

### Requirement 12: Database Schema and Migrations

**User Story:** As a developer, I want a well-defined database schema, so that data is stored consistently and efficiently.

#### Acceptance Criteria

1. THE Router SHALL use PostgreSQL for persistent storage
2. THE Router SHALL create api_keys table with: id, user_id, key_hash, label, status, created_at
3. THE Router SHALL create usage_counters table with: id, user_id, day, request_count, updated_at
4. THE Router SHALL create request_logs table with: id, user_id, request_id, stage, model, tokens, cost, latency, status, created_at
5. THE Router SHALL use database migrations for schema changes
6. THE Router SHALL create appropriate indexes for query performance
