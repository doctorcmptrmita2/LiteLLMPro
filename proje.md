# CF-X (CodexFlow) v3 — Detaylı Proje Analiz Raporu

## 📋 Yönetici Özeti

CF-X, **Plan-Code-Review** döngüsüyle çalışan bir AI orkestrasyon platformudur. Cursor AI benzeri bir deneyimi, maliyet kontrolü ve modülerlik ile sunmayı hedefler. Proje 4 ana konteyner üzerine kurulu bir monorepo mimarisine sahiptir.

---

## 🏗️ Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────────┐
│                         İNTERNET                                │
└─────────────────────────────┬───────────────────────────────────┘
                              │ :80/:443
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TRAEFIK (Reverse Proxy)                    │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │  "/" → Dashboard │              │ "/v1/*" → Router │          │
│  └─────────────────┘              └─────────────────┘           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   DASHBOARD   │    │  CFX-ROUTER   │    │   LITELLM     │
│   (Next.js)   │    │   (FastAPI)   │    │   (Proxy)     │
│               │    │               │    │               │
│ • UI/UX       │    │ • Auth        │◄───│ • Anthropic   │
│ • Logs View   │    │ • Rate Limit  │    │ • OpenAI      │
│ • API Keys    │    │ • Routing     │    │ • DeepSeek    │
│ • Usage Stats │    │ • SSE Relay   │    │ • Fallback    │
└───────┬───────┘    └───────┬───────┘    └───────────────┘
        │                    │                     ▲
        │                    │                     │
        │                    └─────────────────────┘
        │                    (Internal: http://litellm:4000)
        │
        └────────────────────┬────────────────────────────────────
                             ▼
                    ┌───────────────┐
                    │   SUPABASE    │
                    │   (Postgres)  │
                    │               │
                    │ • api_keys    │
                    │ • usage_count │
                    │ • request_logs│
                    │ • RLS Enabled │
                    └───────────────┘
```

---

## 🎯 3-Stage Orkestrasyon Modeli

| Stage    | Model (Önerilen)    | Görev                              | Çıktı Formatı    |
|----------|---------------------|------------------------------------|------------------|
| **PLAN** | Claude 4.5 Sonnet   | Spec/plan üretimi, kod YASAK       | Markdown spec    |
| **CODE** | DeepSeek V3         | Unified diff üretimi               | Unified diff     |
| **REVIEW**| GPT-4o-mini/Nano   | Güvenlik + mantık + uyumluluk      | Review raporu    |

### Stage Routing Mantığı
```python
# X-CFX-Stage header varsa → direkt kullan
# Yoksa → mesaj içeriğinden inference
# Belirsizse → default: PLAN
```

---

## 📁 Monorepo Yapısı

```
LiteLLMPro/
├── apps/
│   └── dashboard/                 # Next.js App Router
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── dashboard/
│       │       ├── page.tsx       # Ana dashboard
│       │       └── logs/
│       │           └── page.tsx   # Log görüntüleme
│       ├── components/
│       │   ├── UsageSummary.tsx
│       │   ├── LogsTable.tsx
│       │   └── Filters.tsx
│       ├── lib/
│       │   └── supabaseServer.ts
│       └── middleware.ts          # Hafif auth (yetkili değil)
│
├── services/
│   └── cfx-router/                # FastAPI Router (YETKİLİ)
│       ├── main.py                # FastAPI entry point
│       ├── requirements.txt
│       └── cfx/
│           ├── __init__.py
│           ├── config.py          # models.yaml yükleyici
│           ├── auth.py            # API key doğrulama
│           ├── security.py        # Hash fonksiyonları
│           ├── rate_limit.py      # Günlük limit (1000 req)
│           ├── concurrency.py     # Per-user stream cap
│           ├── routing.py         # Stage → Model mapping
│           ├── openai_compat.py   # OpenAI format dönüşümü
│           ├── litellm_client.py  # LiteLLM forwarding
│           ├── logger.py          # Async best-effort logging
│           ├── background.py      # Background task queue
│           └── resilience.py      # Circuit breaker, retry
│
├── config/
│   └── models.yaml                # Stage → Model mapping (tek kaynak)
│
├── infra/
│   └── traefik/
│       ├── traefik.yml            # Static config
│       └── dynamic.yml            # Dynamic routing rules
│
├── docker-compose.yml             # 4 konteyner orkestrasyonu
├── .env.example                   # Env template
└── README.md
```

---

## 🔐 Güvenlik Sınırları (KRİTİK)

### Secret Dağılımı

| Konteyner   | İzin Verilen Secretlar                          | YASAK                          |
|-------------|------------------------------------------------|--------------------------------|
| Dashboard   | `SUPABASE_URL`, `SUPABASE_ANON_KEY`            | SERVICE_ROLE_KEY, Provider keys|
| Router      | `SUPABASE_SERVICE_ROLE_KEY`, `HASH_SALT`       | Provider API keys              |
| LiteLLM     | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.    | Supabase keys                  |
| Traefik     | TLS certs, ACME config                          | Tüm uygulama secretları        |

### RLS (Row Level Security) Stratejisi

```sql
-- Dashboard sadece kendi verilerini okuyabilir
CREATE POLICY "Users read own logs" ON request_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Router (service role) her şeyi yazabilir
-- Service role RLS'i bypass eder
```

---

## 🔄 Inter-Service Kontratları

### 1. Router API (Public via Traefik)

```
POST /v1/chat/completions
Headers:
  Authorization: Bearer <api_key>
  X-CFX-Stage: plan|code|review|direct (opsiyonel)

Response Headers:
  X-CFX-Request-Id: uuid
  X-CFX-Stage: plan|code|review
  X-CFX-Model-Used: claude-4.5-sonnet
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 847
  X-RateLimit-Reset: 2025-01-03T00:00:00Z

Status Codes:
  200 - Success
  401 - Unauthorized (invalid API key)
  429 - Rate limit exceeded
  503 - Upstream unavailable (circuit breaker)
  500 - Internal error
```

### 2. Router → LiteLLM (Internal)

```
Base URL: http://litellm:4000
Timeout: 30s connect, 120s read
Retry: 1x for 502/503/504
Streaming: SSE relay with proper framing
```

### 3. SSE Streaming Format

```
data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":" world"}}]}

data: [DONE]
```

---

## 💾 Veritabanı Şeması

### api_keys
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  key_hash TEXT NOT NULL,           -- SHA256 hash, asla raw key
  label TEXT,
  status TEXT DEFAULT 'active',     -- active | revoked
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

### usage_counters
```sql
CREATE TABLE usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  day DATE NOT NULL,                -- UTC day bucket
  request_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, day)
);
```

### request_logs
```sql
CREATE TABLE request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  api_key_id UUID,
  request_id TEXT NOT NULL,
  session_id TEXT,
  stage TEXT NOT NULL,              -- plan | code | review | direct
  model TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  total_tokens INT,
  cost_usd NUMERIC(10,6),
  latency_ms INT,
  status TEXT NOT NULL,             -- success | error | rate_limited
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_logs_user_day ON request_logs(user_id, created_at);
```

---

## ⚡ Stabilite & Resilience Gereksinimleri

### 1. Rate Limit Abstraction
```python
class RateLimiter(Protocol):
    async def check_and_increment(
        self, user_id: str, day_utc: date, limit: int
    ) -> tuple[bool, int, datetime]:
        """Returns (allowed, remaining, reset_ts)"""
        ...

# MVP: PostgresRateLimiter (atomic upsert)
# Scale: RedisRateLimiter (drop-in replacement)
```

### 2. Async Logging (Best-Effort)
```python
# Logging ASLA user request'i fail etmemeli
# Background queue kullan
# Streaming: start + completion log (best-effort)
```

### 3. Streaming Robustness
- Client disconnect → upstream stream durdur
- Timeout: connect 10s, read 120s
- Unbounded buffering YOK
- Graceful termination + error logging

### 4. Circuit Breaker
```python
# 5 ardışık failure → circuit OPEN
# 30s sonra HALF-OPEN (1 test request)
# Success → CLOSED, Fail → OPEN
```

### 5. Per-User Concurrency Cap
```python
# Max 2 concurrent streaming request per user
# 3. request → 429 "Too many concurrent requests"
```

---

## 🚀 Implementation Plan (Part Sistemi)

Her Part MAX 3 dosya değiştirir ve tek bir domain'e odaklanır.

| Part | Domain   | Dosyalar                                                    |
|------|----------|-------------------------------------------------------------|
| 1    | Router   | `config/models.yaml`, `main.py`, `cfx/config.py`            |
| 2    | Router   | `cfx/auth.py`, `cfx/security.py`, `main.py`                 |
| 3    | Router   | `cfx/rate_limit.py`, `cfx/concurrency.py`, `main.py`        |
| 4    | Router   | `cfx/litellm_client.py`, `cfx/openai_compat.py`, `main.py`  |
| 5    | Router   | `cfx/logger.py`, `cfx/background.py`, `main.py`             |
| 6    | Dashboard| `dashboard/page.tsx`, `UsageSummary.tsx`, `supabaseServer.ts`|
| 7    | Dashboard| `logs/page.tsx`, `LogsTable.tsx`, `Filters.tsx`             |
| 8    | Infra    | `docker-compose.yml`, `traefik.yml`, `dynamic.yml`          |

---

## 🤖 Ajan Katmanı (Opsiyonel - MVP Sonrası)

### CrewAI Entegrasyonu
```python
# Rol bazlı ajanlar:
# - Architect Agent (PLAN stage)
# - Developer Agent (CODE stage)  
# - Reviewer Agent (REVIEW stage)

# LiteLLM köprü olarak kullanılır
from crewai import Agent, Crew
agent = Agent(llm="litellm/claude-4.5-sonnet")
```

### LangGraph Entegrasyonu
```python
# State machine ile çok adımlı workflow
# Plan → Code → Review → Approve/Reject döngüsü
from langgraph.graph import StateGraph

workflow = StateGraph(AgentState)
workflow.add_node("plan", plan_node)
workflow.add_node("code", code_node)
workflow.add_node("review", review_node)
```

### ⚠️ Ajan Katmanı Uyarısı
> Cursor'ı bire bir klonlamak için ajan framework'leri tek başına yetmez. Asıl fark:
> - Edit güvenliği (diff doğrulama)
> - Test koşma politikası
> - Repo index/embedding
> - Tool izinleri
> - Rollback mekanizması
>
> **Öneri:** MVP'de tek ajan + net workflow, sonra kademeli rol ekleme.

---

## 🔧 Teknoloji Stack Özeti

| Katman        | Teknoloji                    | Versiyon/Not                    |
|---------------|------------------------------|--------------------------------|
| Dashboard     | Next.js (App Router)         | 14.x, Tailwind dark theme      |
| Router        | FastAPI                      | 0.109+, async/await            |
| Proxy         | LiteLLM                      | Latest, container              |
| Database      | Supabase (Postgres)          | RLS enabled                    |
| Reverse Proxy | Traefik                      | v3.x, path-based routing       |
| Auth          | Supabase Auth + Custom Keys  | JWT + hashed API keys          |
| Streaming     | SSE                          | OpenAI-compatible format       |

---

## 📊 Roo Code Uyumluluğu

Roo Code, OpenAI-compatible endpoint bekler:

```typescript
// Roo Code settings.json
{
  "roocode.apiProvider": "openai-compatible",
  "roocode.apiBaseUrl": "https://your-domain.com/v1",
  "roocode.apiKey": "cfx_xxxxx"
}
```

Gereksinimler:
- ✅ `POST /v1/chat/completions`
- ✅ SSE streaming (`stream: true`)
- ✅ `data:` framing + `[DONE]` terminator
- ✅ Standard error codes (401, 429, 500)

---

## 💰 Maliyet Kontrol Stratejisi

```
┌─────────────────────────────────────────────────────────┐
│                    MALIYET PİRAMİDİ                     │
├─────────────────────────────────────────────────────────┤
│  ▲ Claude 4.5 (PLAN)     │ Yüksek kalite, düşük hacim   │
│  │ ~$15/1M token         │ Sadece spec/plan için        │
├──┼──────────────────────────────────────────────────────┤
│  │ DeepSeek V3 (CODE)    │ Orta maliyet, yüksek hacim   │
│  │ ~$0.27/1M token       │ Kod üretimi için             │
├──┼──────────────────────────────────────────────────────┤
│  │ GPT-4o-mini (REVIEW)  │ Düşük maliyet, hızlı         │
│  ▼ ~$0.15/1M token       │ Review/validation için       │
└─────────────────────────────────────────────────────────┘

Günlük Limit: 1000 request/user
Direct Mode: Whitelist + max_tokens cap
```

---

## ✅ Sonraki Adımlar

1. **PART 1'e başla:** Router foundation (config + skeleton)
2. Her part sonunda manuel test checklist
3. Approval sonrası sonraki part'a geç
4. Part 8 sonunda end-to-end test

---

*Rapor Tarihi: 2 Ocak 2026*
*Versiyon: 1.0*
