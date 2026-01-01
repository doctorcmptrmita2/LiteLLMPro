# Implementation Plan: CF-X Router

## Overview

Bu plan, CF-X Router'ı adım adım implement eder. Her task önceki task'ların üzerine inşa edilir. Python/FastAPI kullanılacak, Hypothesis ile property-based testing yapılacak.

## Tasks

- [x] 1. Project Setup and Configuration
  - [x] 1.1 Create project structure and dependencies
    - Create `LiteLLMPro/services/cfx-router/` directory structure
    - Create `requirements.txt` with FastAPI, uvicorn, httpx, asyncpg, pydantic, python-dotenv
    - Create `pyproject.toml` for project metadata
    - _Requirements: 11.1, 11.2_

  - [x] 1.2 Implement configuration loader
    - Create `cfx/config.py` with Config dataclass
    - Load `models.yaml` for stage-to-model mapping
    - Load environment variables for secrets
    - Validate configuration on load
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 1.3 Create models.yaml configuration file
    - Create `config/models.yaml` with stage mappings
    - Define plan, code, review stages with models
    - Define direct mode allowlist
    - Define rate limit and timeout settings
    - _Requirements: 3.4, 11.1_

- [x] 2. Database Layer
  - [x] 2.1 Create database connection module
    - Create `cfx/database.py` with asyncpg connection pool
    - Implement connection health check
    - Handle connection errors gracefully
    - _Requirements: 12.1_

  - [x] 2.2 Create database schema and migrations
    - Create `migrations/001_initial_schema.sql`
    - Define api_keys, usage_counters, request_logs tables
    - Create indexes for performance
    - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 2.3 Write unit tests for database module
    - Test connection pool creation
    - Test query execution
    - Test error handling
    - _Requirements: 12.1_

- [x] 3. Authentication Module
  - [x] 3.1 Implement API key hashing
    - Create `cfx/security.py` with hash_api_key function
    - Use SHA-256 with configurable salt
    - Ensure constant-time comparison
    - _Requirements: 1.5_

  - [x] 3.2 Implement authentication middleware
    - Create `cfx/auth.py` with AuthModule class
    - Extract Bearer token from Authorization header
    - Verify against database
    - Return 401 for invalid/missing/revoked keys
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.3 Write property test for authentication
    - **Property 1: Authentication Validation**
    - **Property 2: API Key Hashing Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [x] 4. Rate Limiting Module
  - [x] 4.1 Implement rate limiter with atomic operations
    - Create `cfx/rate_limit.py` with RateLimiter class
    - Use atomic upsert for counter increment
    - Calculate remaining and reset time
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 4.2 Implement rate limit middleware
    - Check limit before processing request
    - Add X-RateLimit-* headers to response
    - Return 429 when limit exceeded
    - _Requirements: 2.2, 2.3, 2.6_

  - [x] 4.3 Write property tests for rate limiting
    - **Property 3: Rate Limit Enforcement**
    - **Property 4: Rate Limit Atomicity**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**

- [x] 5. Stage Routing Module
  - [x] 5.1 Implement stage router
    - Create `cfx/routing.py` with StageRouter class
    - Parse X-CFX-Stage header
    - Implement stage inference from message content
    - Map stage to model from config
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.2 Implement direct mode validation
    - Validate model against allowlist
    - Apply max_tokens cap for direct mode
    - Return 400 for non-allowed models
    - _Requirements: 3.6_

  - [x] 5.3 Write property tests for stage routing
    - **Property 5: Stage Routing Determinism**
    - **Property 6: Stage Inference Consistency**
    - **Property 7: Direct Mode Allowlist**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 6. Checkpoint - Core modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. LiteLLM Client Module
  - [x] 7.1 Implement LiteLLM client
    - Create `cfx/litellm_client.py` with LiteLLMClient class
    - Configure httpx async client with timeouts
    - Implement request forwarding
    - Transform request to OpenAI format
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 7.2 Implement retry logic
    - Retry once for 502, 503, 504 errors
    - No retry for other errors
    - Return 503 when LiteLLM unavailable
    - _Requirements: 4.3, 4.6_

  - [x] 7.3 Implement SSE streaming
    - Create streaming response generator
    - Format chunks with "data:" prefix
    - Send "[DONE]" on completion
    - Handle client disconnect
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [x] 7.4 Write property tests for LiteLLM client
    - **Property 8: Request Parameter Preservation**
    - **Property 9: Transient Error Retry**
    - **Property 10: SSE Streaming Format**
    - **Validates: Requirements 4.3, 4.4, 4.5, 5.1, 5.2, 5.3**

- [x] 8. Circuit Breaker Module
  - [x] 8.1 Implement circuit breaker
    - Create `cfx/resilience.py` with CircuitBreaker class
    - Implement CLOSED, OPEN, HALF_OPEN states
    - Track consecutive failures
    - Implement recovery timeout
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 Write property test for circuit breaker
    - **Property 13: Circuit Breaker State Machine**
    - **Validates: Requirements 7.1, 7.2, 7.4, 7.5**

- [x] 9. Concurrency Limiter Module
  - [x] 9.1 Implement concurrency limiter
    - Create `cfx/concurrency.py` with ConcurrencyLimiter class
    - Track active streams per user in memory
    - Implement acquire/release methods
    - Return 429 when limit exceeded
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 9.2 Write property tests for concurrency limiter
    - **Property 14: Concurrency Limit Enforcement**
    - **Property 15: Non-Streaming Concurrency Exemption**
    - **Validates: Requirements 8.1, 8.2, 8.4, 8.5**

- [x] 10. Async Logger Module
  - [x] 10.1 Implement async logger
    - Create `cfx/logger.py` with AsyncLogger class
    - Use asyncio.Queue for buffering
    - Implement background worker
    - Calculate cost from token usage
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 10.2 Implement request ID generation
    - Generate UUID for each request
    - Add X-CFX-Request-Id header to responses
    - Include request_id in log entries
    - _Requirements: 6.4, 6.5, 6.6_

  - [x] 10.3 Write property tests for logger
    - **Property 11: Request Logging Completeness**
    - **Property 12: Request ID Uniqueness**
    - **Validates: Requirements 6.1, 6.4, 6.5**

- [x] 11. Checkpoint - All modules complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Main Application
  - [x] 12.1 Create FastAPI application
    - Create `main.py` with FastAPI app
    - Wire all modules together
    - Add startup/shutdown events
    - _Requirements: 10.1_

  - [x] 12.2 Implement /v1/chat/completions endpoint
    - Accept OpenAI-format request body
    - Apply auth, rate limit, concurrency checks
    - Route to appropriate model
    - Return OpenAI-format response
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 12.3 Implement /health endpoint
    - Check database connectivity
    - Check LiteLLM connectivity
    - Return appropriate status
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 12.4 Write property tests for API compatibility
    - **Property 16: OpenAI API Compatibility**
    - **Property 17: Model Override Behavior**
    - **Validates: Requirements 10.2, 10.3, 10.6**

- [x] 13. Pydantic Models
  - [x] 13.1 Create request/response models
    - Create `cfx/models.py` with Pydantic models
    - ChatMessage, ChatCompletionRequest, ChatCompletionResponse
    - Usage, Choice models
    - Error response model
    - _Requirements: 10.2, 10.3_

- [x] 14. Docker Configuration
  - [x] 14.1 Create Dockerfile for router
    - Create `Dockerfile` with Python 3.11
    - Install dependencies
    - Configure uvicorn
    - _Requirements: N/A (deployment)_

  - [x] 14.2 Create docker-compose for local development
    - Create `docker-compose.yml`
    - Define router, postgres, litellm services
    - Configure networking
    - _Requirements: N/A (deployment)_

- [x] 15. Final Checkpoint
  - [x] Ensure all tests pass (160 tests passing)
  - Run full integration test
  - Verify SSE streaming works end-to-end

## Notes

- Tasks are all required for comprehensive testing
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Python 3.11+ required for asyncio improvements
- Hypothesis library used for property-based testing
