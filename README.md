# CF-X (CodexFlow) - AI Orchestration Platform

3-Stage AI Orchestration Platform with OpenAI-compatible API. Route requests to optimal models based on task type (PLAN, CODE, REVIEW).

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │ :80/:443
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TRAEFIK (Reverse Proxy)                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   DASHBOARD   │    │  CFX-ROUTER   │    │   LITELLM     │
│   (Next.js)   │    │   (FastAPI)   │    │   (Proxy)     │
└───────────────┘    └───────┬───────┘    └───────────────┘
                             │                     ▲
                             └─────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   POSTGRESQL    │
                    └─────────────────┘
```

## 🎯 3-Stage Model Routing

| Stage    | Model (Default)     | Use Case                           |
|----------|---------------------|------------------------------------|
| **PLAN** | Claude Sonnet 4.5   | Architecture, specs, design docs   |
| **CODE** | DeepSeek V3         | Code generation, implementation    |
| **REVIEW**| GPT-4o-mini        | Code review, security analysis     |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- API keys for AI providers (Anthropic, OpenAI, DeepSeek)

### Development Setup

1. Clone and configure:
```bash
git clone https://github.com/your-repo/cfx.git
cd cfx
cp .env.example .env
# Edit .env with your API keys
```

2. Start services:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

3. Test the API:
```bash
curl http://localhost:8000/health

curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer cfx_test_key_12345678" \
  -H "Content-Type: application/json" \
  -H "X-CFX-Stage: code" \
  -d '{"messages": [{"role": "user", "content": "Write hello world in Python"}]}'
```

### Production Deployment

See [easypanel-deploy.md](./easypanel-deploy.md) for EasyPanel deployment guide.

```bash
# Production with Traefik
docker-compose up -d
```

## 📁 Project Structure

```
cfx/
├── apps/
│   └── dashboard/           # Next.js Dashboard
├── services/
│   └── cfx-router/          # FastAPI Router
│       ├── cfx/             # Core modules
│       ├── tests/           # 160 tests
│       └── migrations/      # SQL schema
├── config/
│   └── models.yaml          # Stage → Model mapping
├── infra/
│   └── traefik/             # Reverse proxy config
├── docker-compose.yml       # Production
└── docker-compose.dev.yml   # Development
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `DEEPSEEK_API_KEY` | DeepSeek API key | Yes |
| `HASH_SALT` | API key hashing salt | Yes |
| `DATABASE_URL` | PostgreSQL connection | Yes |

### Stage Configuration (config/models.yaml)

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

## 📡 API Reference

### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint.

**Headers:**
- `Authorization: Bearer <api_key>` (required)
- `X-CFX-Stage: plan|code|review|direct` (optional)

**Response Headers:**
- `X-CFX-Request-Id` - Unique request ID
- `X-CFX-Stage` - Stage used
- `X-CFX-Model-Used` - Actual model
- `X-RateLimit-Remaining` - Remaining daily requests

**Example:**
```bash
curl -X POST https://api.cfx.dev/v1/chat/completions \
  -H "Authorization: Bearer cfx_xxx" \
  -H "X-CFX-Stage: code" \
  -d '{"messages": [{"role": "user", "content": "..."}], "stream": true}'
```

## 💰 Cost Optimization

3-stage routing provides ~74% cost savings vs single premium model:

| Approach | Monthly Cost (50 users) |
|----------|------------------------|
| Single Model (Claude) | $630 |
| 3-Stage Routing | $162 |

## 🧪 Testing

```bash
cd services/cfx-router
python -m pytest tests/ -v
# 160 tests passing
```

## 📚 Documentation

- [Project Analysis](./proje.md) - Architecture overview
- [Development Guide](./projeDevelop.md) - Cost analysis, business plan
- [Orchestration](./Orkestrasyon.md) - 3-stage model details
- [Tool Calling](./Tooling.md) - Tool calling analysis
- [IDE Fork](./IDE-Fork.md) - VS Code fork guide
- [EasyPanel Deploy](./easypanel-deploy.md) - Deployment guide

## 📄 License

MIT
