# CF-X Router

3-Stage AI Orchestration Router for the CF-X Platform.

## Overview

CF-X Router implements intelligent routing of AI requests through three stages:

- **PLAN**: Architecture and specification (Claude Sonnet 4.5)
- **CODE**: Implementation and code generation (DeepSeek V3)
- **REVIEW**: Code review and validation (GPT-4o-mini)

## Features

- 🔐 API Key Authentication with SHA-256 hashing
- ⚡ Rate Limiting (1000 requests/day per user)
- 🔄 SSE Streaming support
- 🛡️ Circuit Breaker for resilience
- 📊 Async request logging
- 🎯 Automatic stage inference from message content

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your settings
vim .env

# Run migrations
python -m cfx.database migrate

# Start server
uvicorn main:app --reload --port 8000
```

## API Endpoints

### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint.

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer cfx_your_api_key" \
  -H "Content-Type: application/json" \
  -H "X-CFX-Stage: code" \
  -d '{
    "messages": [{"role": "user", "content": "Write a hello world in Python"}],
    "stream": true
  }'
```

### GET /health

Health check endpoint.

```bash
curl http://localhost:8000/health
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `LITELLM_BASE_URL` | LiteLLM proxy URL | `http://localhost:4000` |
| `HASH_SALT` | Salt for API key hashing | - |
| `DAILY_REQUEST_LIMIT` | Max requests per user per day | `1000` |
| `MAX_CONCURRENT_STREAMS` | Max concurrent streams per user | `2` |

### Stage Configuration (models.yaml)

```yaml
stages:
  plan:
    model: claude-sonnet-4.5
    max_tokens: 4096
    temperature: 0.3
  code:
    model: deepseek-v3
    max_tokens: 8192
    temperature: 0.2
  review:
    model: gpt-4o-mini
    max_tokens: 2048
    temperature: 0.1
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=cfx

# Run property tests only
pytest -k "property"
```

## License

MIT
