# CodexFlow - EasyPanel Deployment Rehberi (Detaylı)

**Tarih:** 3 Ocak 2026  
**Versiyon:** 2.0 (Son Versiyon)  
**Tahmini Süre:** 45-60 dakika

---

## 📋 İçindekiler

1. [Ön Hazırlık](#1-ön-hazırlık)
2. [Proje Oluşturma](#2-proje-oluşturma)
3. [PostgreSQL Veritabanı](#3-postgresql-veritabanı)
4. [LiteLLM Proxy](#4-litellm-proxy)
5. [CFX Router](#5-cfx-router)
6. [CFX Dashboard](#6-cfx-dashboard)
7. [Domain Ayarları](#7-domain-ayarları)
8. [Veritabanı Migration](#8-veritabanı-migration)
9. [Test ve Doğrulama](#9-test-ve-doğrulama)
10. [Sorun Giderme](#10-sorun-giderme)

---

## 1. Ön Hazırlık

### 1.1 Gerekli Hesaplar ve API Key'ler

Deployment öncesi şunlara ihtiyacınız var:

| Gereksinim | Nereden Alınır? | Açıklama |
|------------|-----------------|----------|
| EasyPanel hesabı | easypanel.io | VPS üzerinde kurulu olmalı |
| OpenRouter API Key | openrouter.ai | Tüm AI modelleri için tek key |
| GitHub hesabı | github.com | Repo erişimi için |
| Domain (opsiyonel) | Herhangi bir registrar | Custom domain için |

### 1.2 OpenRouter API Key Alma

1. https://openrouter.ai adresine git
2. "Sign Up" ile hesap oluştur
3. Dashboard → "Keys" → "Create Key"
4. Key'i kopyala ve güvenli bir yere kaydet
5. "Credits" → En az $5 yükle (test için)

> **Not:** OpenRouter tek bir API key ile Claude, GPT, DeepSeek, Gemini hepsine erişim sağlar.

### 1.3 Güvenlik Değerleri Hazırlama

Aşağıdaki değerleri şimdiden hazırlayın (rastgele, güçlü):

```
DB_PASSWORD=          # Min 16 karakter, örn: Xk9#mP2$vL5nQ8wR
HASH_SALT=            # Min 32 karakter, örn: cfx-salt-a7b3c9d2e5f8g1h4j6k0m3n5p8q2r4s6
LITELLM_MASTER_KEY=   # Örn: sk-litellm-x7y9z2w4v6u8t0s3r5q7p9o1n3m5l7k9
AUTH_SECRET=          # Min 32 karakter, örn: cfx-auth-b2c4d6e8f0g2h4j6k8l0m2n4p6q8r0s2
OPENROUTER_API_KEY=   # OpenRouter'dan aldığınız key
```

> **Güvenlik İpucu:** Bu değerleri bir şifre yöneticisinde saklayın!

---

## 2. Proje Oluşturma

### 2.1 EasyPanel'e Giriş

1. Tarayıcıda EasyPanel URL'nizi açın (örn: `https://panel.sunucunuz.com`)
2. Admin kullanıcı ile giriş yapın

### 2.2 Yeni Proje Oluşturma


1. Sol menüden **"Projects"** sekmesine tıkla
2. Sağ üstte **"+ New Project"** butonuna tıkla
3. Proje bilgilerini gir:

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Project Name** | `codexflow` | Küçük harf, tire kullanabilirsin |
| **Description** | `AI Orchestration Platform` | Opsiyonel |

4. **"Create Project"** butonuna tıkla

### 2.3 Proje Adı Neden Önemli?

```
codexflow
    │
    └── Bu isim şu yerlerde kullanılacak:
        • Servis internal URL'lerinde: codexflow-postgres, codexflow-router
        • Docker network adında: codexflow_default
        • Volume adlarında: codexflow_postgres-data
```

> **Öneri:** Kısa, anlamlı ve tire içermeyen bir isim seçin.

---

## 3. PostgreSQL Veritabanı

### 3.1 Neden PostgreSQL?

- **Güvenilirlik:** ACID uyumlu, veri kaybı riski düşük
- **RLS (Row Level Security):** Kullanıcı bazlı veri izolasyonu
- **JSON desteği:** Esnek veri yapıları
- **EasyPanel entegrasyonu:** Tek tıkla kurulum

### 3.2 Servis Oluşturma

1. Proje içinde **"+ New"** butonuna tıkla
2. **"Database"** kategorisini seç
3. **"Postgres"** seç

### 3.3 Servis Adı ve Anlamı

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Service Name** | `cfx-postgres` | `cfx` = CodexFlow kısaltması |

```
cfx-postgres
 │    │
 │    └── postgres: Veritabanı türü
 └── cfx: Proje kısaltması (CodexFlow)
```

### 3.4 Veritabanı Ayarları

**"Settings"** sekmesinde:

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Database Name** | `cfx_db` | Ana veritabanı adı |
| **Username** | `cfx` | DB kullanıcı adı |
| **Password** | `[HAZIRLADIĞINIZ_DB_PASSWORD]` | Güçlü şifre |

```
cfx_db
 │  │
 │  └── db: database kısaltması
 └── cfx: proje kısaltması
```

### 3.5 Deploy

1. **"Deploy"** butonuna tıkla
2. Status'un **"Running"** olmasını bekle (1-2 dakika)
3. Yeşil tik görünce devam et

### 3.6 Bağlantı Bilgisi (Önemli!)

Deploy sonrası **"Connection"** sekmesinde şunu göreceksiniz:

```
Internal URL: postgresql://cfx:[PASSWORD]@cfx-postgres:5432/cfx_db
```

**Bu URL'i not alın!** Diğer servislerde kullanacaksınız.

```
postgresql://cfx:Xk9#mP2$vL5nQ8wR@cfx-postgres:5432/cfx_db
     │       │         │              │        │      │
     │       │         │              │        │      └── Veritabanı adı
     │       │         │              │        └── Port (PostgreSQL default)
     │       │         │              └── Servis adı (internal DNS)
     │       │         └── Şifre
     │       └── Kullanıcı adı
     └── Protokol
```

---

## 4. LiteLLM Proxy

### 4.1 LiteLLM Nedir?

LiteLLM, farklı AI provider'ları (OpenAI, Anthropic, Google, vb.) tek bir API altında birleştiren bir proxy'dir.

```
┌─────────────────────────────────────────────────────────┐
│                      LiteLLM Proxy                      │
│                                                         │
│   claude-sonnet-4.5  ──┐                               │
│   deepseek-v3        ──┼──► OpenRouter ──► AI Models   │
│   gpt-4o-mini        ──┘                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Servis Oluşturma

1. **"+ New"** → **"App"** → **"Docker Image"**
2. Servis adı gir:

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Service Name** | `cfx-litellm` | LiteLLM proxy servisi |

```
cfx-litellm
 │    │
 │    └── litellm: Servis türü (AI proxy)
 └── cfx: Proje kısaltması
```

### 4.3 Docker Image Ayarı

**"Source"** sekmesinde:

| Alan | Değer |
|------|-------|
| **Image** | `ghcr.io/berriai/litellm:main-latest` |

```
ghcr.io/berriai/litellm:main-latest
   │       │       │         │
   │       │       │         └── Tag: En son stabil versiyon
   │       │       └── Image adı
   │       └── Organizasyon
   └── GitHub Container Registry
```

### 4.4 Port Ayarı

**"Domains"** sekmesinde:

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Port** | `4000` | LiteLLM default portu |
| **Protocol** | `HTTP` | Internal iletişim |

### 4.5 Environment Variables

**"Environment"** sekmesinde şu değişkenleri ekle:

```bash
# LiteLLM Master Key (admin erişimi için)
LITELLM_MASTER_KEY=sk-litellm-x7y9z2w4v6u8t0s3r5q7p9o1n3m5l7k9

# OpenRouter API Key (tüm modeller için)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
```

**Her değişken için açıklama:**

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `LITELLM_MASTER_KEY` | LiteLLM admin API key'i | `sk-litellm-xxx` |
| `OPENROUTER_API_KEY` | OpenRouter'dan aldığınız key | `sk-or-v1-xxx` |

### 4.6 Config Dosyası (Mount)

1. **"Mounts"** sekmesine git
2. **"+ Add Mount"** → **"File"**
3. Ayarları gir:

| Alan | Değer |
|------|-------|
| **Mount Path** | `/app/config.yaml` |
| **Content** | Aşağıdaki YAML |


```yaml
# LiteLLM Proxy Configuration
# OpenRouter üzerinden tüm modellere erişim

model_list:
  # ═══════════════════════════════════════════════════════════
  # PLAN Stage - Mimari ve planlama için premium model
  # ═══════════════════════════════════════════════════════════
  - model_name: claude-sonnet-4.5
    litellm_params:
      model: openrouter/anthropic/claude-sonnet-4
      api_key: os.environ/OPENROUTER_API_KEY
    model_info:
      max_tokens: 8192
      input_cost_per_token: 0.000003    # $3/1M token
      output_cost_per_token: 0.000015   # $15/1M token

  # ═══════════════════════════════════════════════════════════
  # CODE Stage - Kod üretimi için maliyet-etkin model
  # ═══════════════════════════════════════════════════════════
  - model_name: deepseek-v3
    litellm_params:
      model: openrouter/deepseek/deepseek-chat
      api_key: os.environ/OPENROUTER_API_KEY
    model_info:
      max_tokens: 8192
      input_cost_per_token: 0.00000027  # $0.27/1M token
      output_cost_per_token: 0.0000011  # $1.10/1M token

  # ═══════════════════════════════════════════════════════════
  # REVIEW Stage - Hızlı ve ekonomik review modeli
  # ═══════════════════════════════════════════════════════════
  - model_name: gpt-4o-mini
    litellm_params:
      model: openrouter/openai/gpt-4o-mini
      api_key: os.environ/OPENROUTER_API_KEY
    model_info:
      max_tokens: 16384
      input_cost_per_token: 0.00000015  # $0.15/1M token
      output_cost_per_token: 0.0000006  # $0.60/1M token

  # ═══════════════════════════════════════════════════════════
  # Fallback Modeller
  # ═══════════════════════════════════════════════════════════
  - model_name: gemini-2.5-pro
    litellm_params:
      model: openrouter/google/gemini-2.5-pro-preview
      api_key: os.environ/OPENROUTER_API_KEY

  - model_name: gemini-2.0-flash
    litellm_params:
      model: openrouter/google/gemini-2.0-flash-001
      api_key: os.environ/OPENROUTER_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: openrouter/openai/gpt-4o
      api_key: os.environ/OPENROUTER_API_KEY

litellm_settings:
  stream: true              # Streaming aktif
  request_timeout: 120      # 2 dakika timeout
  num_retries: 1            # 1 retry denemesi

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

**Config dosyası açıklaması:**

```yaml
model_list:
  - model_name: claude-sonnet-4.5          # CFX Router bu isimle çağırır
    litellm_params:
      model: openrouter/anthropic/claude-sonnet-4  # OpenRouter model path
      api_key: os.environ/OPENROUTER_API_KEY       # Env'den oku
```

### 4.7 Başlatma Komutu (Command)

**"Source"** sekmesinde **"Command"** alanına:

```
--config /app/config.yaml --port 4000
```

> **Not:** Bazı EasyPanel versiyonlarında `litellm` prefix'i gerekebilir:
> ```
> litellm --config /app/config.yaml --port 4000
> ```

### 4.8 Deploy ve Doğrulama

1. **"Deploy"** butonuna tıkla
2. **"Logs"** sekmesini aç
3. Şu mesajları ara:

```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:4000
LiteLLM Proxy running on http://0.0.0.0:4000
```

### 4.9 Internal URL

Deploy sonrası LiteLLM'e internal erişim:

```
http://cfx-litellm:4000
```

> **Önemli:** Bu URL sadece aynı proje içindeki servislerden erişilebilir.

---

## 5. CFX Router

### 5.1 CFX Router Nedir?

CFX Router, sistemin beynidir. Şu işleri yapar:

```
┌─────────────────────────────────────────────────────────┐
│                     CFX Router                          │
│                                                         │
│  1. API Key Doğrulama (SHA256 hash)                    │
│  2. Rate Limit Kontrolü (günlük limit)                 │
│  3. Stage Belirleme (PLAN/CODE/REVIEW)                 │
│  4. Model Routing (stage → model)                      │
│  5. Request Logging (async)                            │
│  6. Circuit Breaker (hata yönetimi)                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Servis Oluşturma

1. **"+ New"** → **"App"** → **"GitHub"**
2. Servis adı:

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Service Name** | `cfx-router` | Ana API servisi |

```
cfx-router
 │    │
 │    └── router: İstek yönlendirici
 └── cfx: Proje kısaltması
```

### 5.3 GitHub Bağlantısı

**"Source"** sekmesinde:

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Repository** | `kullanici/LiteLLMPro` | GitHub repo URL |
| **Branch** | `main` | Ana branch |
| **Root Directory** | `services/cfx-router` | Router klasörü |

```
LiteLLMPro/
├── apps/
│   └── dashboard/        # Dashboard (ayrı servis)
├── services/
│   └── cfx-router/       # ◄── BU KLASÖR
│       ├── Dockerfile
│       ├── main.py
│       ├── cfx/
│       └── migrations/
└── config/
```

### 5.4 Build Ayarları

| Alan | Değer |
|------|-------|
| **Build Type** | `Dockerfile` |
| **Dockerfile Path** | `Dockerfile` |

### 5.5 Port Ayarı

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Port** | `8000` | FastAPI default portu |
| **Protocol** | `HTTP` | |

### 5.6 Environment Variables

**"Environment"** sekmesinde:

```bash
# Veritabanı bağlantısı (PostgreSQL'den aldığınız URL)
DATABASE_URL=postgresql://cfx:SIFRENIZ@cfx-postgres:5432/cfx_db

# LiteLLM bağlantısı (internal URL)
LITELLM_URL=http://cfx-litellm:4000

# LiteLLM API key (LiteLLM'de tanımladığınız master key)
LITELLM_API_KEY=sk-litellm-x7y9z2w4v6u8t0s3r5q7p9o1n3m5l7k9

# API key hash'leme için salt (güvenlik)
HASH_SALT=cfx-salt-a7b3c9d2e5f8g1h4j6k0m3n5p8q2r4s6

# Config dosyası yolu
CFX_CONFIG_PATH=/app/config/models.yaml

# Log seviyesi
LOG_LEVEL=INFO
```

**Her değişkenin açıklaması:**

| Değişken | Ne İşe Yarar? | Örnek |
|----------|---------------|-------|
| `DATABASE_URL` | PostgreSQL bağlantı string'i | `postgresql://user:pass@host:port/db` |
| `LITELLM_URL` | LiteLLM proxy adresi | `http://cfx-litellm:4000` |
| `LITELLM_API_KEY` | LiteLLM'e erişim key'i | `sk-litellm-xxx` |
| `HASH_SALT` | API key'leri hash'lemek için | Rastgele 32+ karakter |
| `CFX_CONFIG_PATH` | Stage-model mapping dosyası | `/app/config/models.yaml` |
| `LOG_LEVEL` | Log detay seviyesi | `DEBUG`, `INFO`, `WARNING`, `ERROR` |

### 5.7 Config Dosyası (Mount)

1. **"Mounts"** → **"+ Add Mount"** → **"File"**
2. Ayarlar:

| Alan | Değer |
|------|-------|
| **Mount Path** | `/app/config/models.yaml` |
| **Content** | Aşağıdaki YAML |


```yaml
# CFX Router - Stage to Model Mapping
# Her stage için hangi modelin kullanılacağını belirler

stages:
  # ═══════════════════════════════════════════════════════════
  # PLAN Stage
  # Kullanım: Mimari tasarım, spec yazımı, planlama
  # ═══════════════════════════════════════════════════════════
  plan:
    model: claude-sonnet-4.5      # Ana model
    max_tokens: 4096              # Max çıktı token
    temperature: 0.3              # Düşük = daha tutarlı
    timeout: 30                   # Saniye
    fallback:                     # Ana model başarısız olursa
      - gemini-2.5-pro
      - gpt-4o

  # ═══════════════════════════════════════════════════════════
  # CODE Stage
  # Kullanım: Kod yazma, implementasyon, refactoring
  # ═══════════════════════════════════════════════════════════
  code:
    model: deepseek-v3            # Maliyet-etkin kod modeli
    max_tokens: 8192              # Uzun kod çıktıları için
    temperature: 0.2              # Çok düşük = deterministik
    timeout: 60                   # Kod üretimi uzun sürebilir
    fallback:
      - gemini-2.0-flash
      - gpt-4o-mini

  # ═══════════════════════════════════════════════════════════
  # REVIEW Stage
  # Kullanım: Kod inceleme, güvenlik analizi, bug tespiti
  # ═══════════════════════════════════════════════════════════
  review:
    model: gpt-4o-mini            # Hızlı ve ekonomik
    max_tokens: 2048              # Review için yeterli
    temperature: 0.1              # En düşük = en tutarlı
    timeout: 20                   # Hızlı yanıt
    fallback:
      - gemini-2.0-flash
      - claude-haiku-3.5

# ═══════════════════════════════════════════════════════════
# Direct Mode
# Stage bypass edip direkt model seçimi
# ═══════════════════════════════════════════════════════════
direct:
  allowed_models:                 # İzin verilen modeller
    - claude-sonnet-4.5
    - claude-haiku-3.5
    - gpt-4o
    - gpt-4o-mini
    - deepseek-v3
    - gemini-2.5-pro
    - gemini-2.0-flash
  max_tokens_cap: 8192            # Max token limiti

# ═══════════════════════════════════════════════════════════
# Stage Inference Keywords
# X-CFX-Stage header yoksa mesajdan stage tahmin et
# ═══════════════════════════════════════════════════════════
inference:
  plan_keywords:
    - plan
    - design
    - architect
    - spec
    - structure
    - tasarla
    - planla
    - mimari
    
  code_keywords:
    - implement
    - code
    - write
    - create
    - fix
    - yaz
    - kodla
    - oluştur
    
  review_keywords:
    - review
    - check
    - analyze
    - security
    - incele
    - kontrol

# ═══════════════════════════════════════════════════════════
# Rate Limiting
# ═══════════════════════════════════════════════════════════
rate_limit:
  daily_requests: 1000            # Günlük istek limiti
  concurrent_streams: 3           # Eşzamanlı stream limiti

# ═══════════════════════════════════════════════════════════
# Circuit Breaker
# Hata durumunda servisi koruma
# ═══════════════════════════════════════════════════════════
circuit_breaker:
  failure_threshold: 5            # 5 hata sonrası aç
  recovery_timeout: 30            # 30 saniye bekle
```

### 5.8 Health Check

**"Advanced"** sekmesinde:

| Alan | Değer |
|------|-------|
| **Health Check Path** | `/health` |
| **Health Check Port** | `8000` |

### 5.9 Deploy ve Doğrulama

1. **"Deploy"** butonuna tıkla
2. Build loglarını takip et (3-5 dakika)
3. Şu mesajları ara:

```
INFO:     Started server process
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 5.10 Internal URL

```
http://cfx-router:8000
```

---

## 6. CFX Dashboard

### 6.1 Dashboard Nedir?

Next.js ile yazılmış web arayüzü:

```
┌─────────────────────────────────────────────────────────┐
│                    CFX Dashboard                        │
│                                                         │
│  • Landing Page (pazarlama)                            │
│  • Login/Register (kimlik doğrulama)                   │
│  • Dashboard (kullanım istatistikleri)                 │
│  • API Keys (key yönetimi)                             │
│  • Logs (istek geçmişi)                                │
│  • Billing (plan yönetimi)                             │
│  • Admin Panel (yönetici araçları)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Servis Oluşturma

1. **"+ New"** → **"App"** → **"GitHub"**
2. Servis adı:

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Service Name** | `cfx-dashboard` | Web arayüzü |

```
cfx-dashboard
 │    │
 │    └── dashboard: Web UI
 └── cfx: Proje kısaltması
```

### 6.3 GitHub Bağlantısı

| Alan | Değer | Açıklama |
|------|-------|----------|
| **Repository** | `kullanici/LiteLLMPro` | Aynı repo |
| **Branch** | `main` | |
| **Root Directory** | `apps/dashboard` | Dashboard klasörü |

```
LiteLLMPro/
├── apps/
│   └── dashboard/        # ◄── BU KLASÖR
│       ├── Dockerfile
│       ├── package.json
│       ├── prisma/
│       └── src/
└── services/
    └── cfx-router/
```

### 6.4 Build Ayarları

| Alan | Değer |
|------|-------|
| **Build Type** | `Dockerfile` |
| **Dockerfile Path** | `Dockerfile` |

### 6.5 Port Ayarı

| Alan | Değer |
|------|-------|
| **Port** | `3000` |
| **Protocol** | `HTTP` |

### 6.6 Environment Variables

```bash
# Veritabanı bağlantısı (aynı PostgreSQL)
DATABASE_URL=postgresql://cfx:SIFRENIZ@cfx-postgres:5432/cfx_db

# NextAuth secret (session şifreleme)
AUTH_SECRET=cfx-auth-b2c4d6e8f0g2h4j6k8l0m2n4p6q8r0s2

# NextAuth URL (dashboard domain'i)
NEXTAUTH_URL=https://app.codexflow.dev

# CFX Router API URL (internal)
CFX_API_URL=http://cfx-router:8000

# Public API URL (external, kullanıcıların göreceği)
NEXT_PUBLIC_API_URL=https://api.codexflow.dev
```

**Değişken açıklamaları:**

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | Prisma ORM için DB bağlantısı |
| `AUTH_SECRET` | NextAuth session şifreleme key'i |
| `NEXTAUTH_URL` | Dashboard'un public URL'i |
| `CFX_API_URL` | Router'a internal erişim |
| `NEXT_PUBLIC_API_URL` | Kullanıcıların API'ye erişim URL'i |

### 6.7 Deploy

1. **"Deploy"** butonuna tıkla
2. Build loglarını takip et (5-8 dakika, Next.js build uzun sürer)
3. Şu mesajları ara:

```
▲ Next.js 14.x.x
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

---

## 7. Domain Ayarları

### 7.1 Domain Stratejisi

Önerilen yapı:

| Servis | Subdomain | Tam URL |
|--------|-----------|---------|
| Dashboard | `app` | `https://app.codexflow.dev` |
| API (Router) | `api` | `https://api.codexflow.dev` |
| LiteLLM | (internal) | Dışarıya açma |

### 7.2 CFX Router için Domain

1. `cfx-router` servisine git
2. **"Domains"** sekmesi
3. **"+ Add Domain"**

| Alan | Değer |
|------|-------|
| **Domain Type** | `Subdomain` veya `Custom Domain` |
| **Subdomain** | `api` |
| **Enable HTTPS** | ✅ İşaretle |

Sonuç: `https://api.codexflow.dev`

### 7.3 CFX Dashboard için Domain

1. `cfx-dashboard` servisine git
2. **"Domains"** sekmesi
3. **"+ Add Domain"**

| Alan | Değer |
|------|-------|
| **Domain Type** | `Subdomain` veya `Custom Domain` |
| **Subdomain** | `app` |
| **Enable HTTPS** | ✅ İşaretle |

Sonuç: `https://app.codexflow.dev`

### 7.4 Custom Domain Kullanımı

Eğer kendi domain'inizi kullanacaksanız:

1. DNS ayarlarında A veya CNAME kaydı ekleyin:
   ```
   api.codexflow.dev  →  CNAME  →  sunucunuz.easypanel.host
   app.codexflow.dev  →  CNAME  →  sunucunuz.easypanel.host
   ```

2. EasyPanel'de domain eklerken "Custom Domain" seçin
3. SSL sertifikası otomatik alınacak (Let's Encrypt)

---

## 8. Veritabanı Migration

### 8.1 CFX Router Migration

1. `cfx-router` servisine git
2. **"Terminal"** sekmesi
3. **"Open Terminal"** butonuna tıkla
4. Şu komutu çalıştır:

```bash
# Migration dosyasını çalıştır
psql $DATABASE_URL -f /app/migrations/001_initial_schema.sql
```

**Beklenen çıktı:**
```
CREATE TABLE
CREATE INDEX
CREATE TABLE
...
```

### 8.2 CFX Dashboard Migration

1. `cfx-dashboard` servisine git
2. **"Terminal"** sekmesi
3. Şu komutları çalıştır:

```bash
# Prisma schema'yı veritabanına uygula
npx prisma db push

# Seed data'yı yükle (admin kullanıcı, planlar, vb.)
npx tsx prisma/seed.ts
```

**Beklenen çıktı:**
```
🌱 Seeding database...
✅ Created admin user: admin@cfx.dev
✅ Created pricing plans
✅ Created site settings
🎉 Seeding completed!
```

### 8.3 Admin Kullanıcı Bilgileri

Seed script ile oluşturulan admin:

| Alan | Değer |
|------|-------|
| **Email** | `admin@cfx.dev` |
| **Şifre** | `admin123456` |
| **Rol** | `SUPER_ADMIN` |

⚠️ **İLK GİRİŞTEN SONRA ŞİFREYİ DEĞİŞTİRİN!**

---

## 9. Test ve Doğrulama

### 9.1 Health Check Testi

```bash
# Router health check
curl https://api.codexflow.dev/health
```

**Beklenen yanıt:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "checks": {
    "config": true,
    "stage_router": true,
    "litellm_client": true,
    "database": true,
    "litellm": true
  }
}
```

### 9.2 API Key Oluşturma (Dashboard'dan)

1. `https://app.codexflow.dev` adresine git
2. Admin ile giriş yap
3. **Dashboard** → **API Keys** → **"Yeni Key Oluştur"**
4. Key'i kopyala (sadece bir kez gösterilir!)

### 9.3 Chat Completion Testi

```bash
curl -X POST https://api.codexflow.dev/v1/chat/completions \
  -H "Authorization: Bearer cfx_SIZIN_API_KEYINIZ" \
  -H "Content-Type: application/json" \
  -H "X-CFX-Stage: code" \
  -d '{
    "messages": [
      {"role": "user", "content": "Python ile merhaba dünya yaz"}
    ],
    "stream": false
  }'
```

**Beklenen yanıt:**
```json
{
  "id": "chatcmpl-xxx",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "```python\nprint(\"Merhaba Dünya!\")\n```"
      }
    }
  ],
  "model": "deepseek-v3",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 20,
    "total_tokens": 35
  }
}
```

### 9.4 Streaming Testi

```bash
curl -X POST https://api.codexflow.dev/v1/chat/completions \
  -H "Authorization: Bearer cfx_SIZIN_API_KEYINIZ" \
  -H "Content-Type: application/json" \
  -H "X-CFX-Stage: plan" \
  -d '{
    "messages": [
      {"role": "user", "content": "Basit bir todo uygulaması tasarla"}
    ],
    "stream": true
  }'
```

**Beklenen yanıt (SSE formatında):**
```
data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":"# Todo"}}]}

data: {"id":"chatcmpl-xxx","choices":[{"delta":{"content":" Uygulaması"}}]}

...

data: [DONE]
```

---

## 10. Sorun Giderme

### 10.1 Servis Başlamıyor

**Kontrol listesi:**
1. **Logs** sekmesini kontrol et
2. Environment variables doğru mu?
3. Bağımlı servisler (postgres, litellm) çalışıyor mu?

### 10.2 Database Bağlantı Hatası

```
Error: Connection refused to cfx-postgres:5432
```

**Çözüm:**
1. `cfx-postgres` servisinin "Running" olduğunu doğrula
2. `DATABASE_URL` formatını kontrol et
3. Şifrede özel karakter varsa URL encode yap:
   - `#` → `%23`
   - `@` → `%40`
   - `$` → `%24`

### 10.3 LiteLLM Bağlantı Hatası

```
Error: Cannot connect to http://cfx-litellm:4000
```

**Çözüm:**
1. `cfx-litellm` servisinin "Running" olduğunu doğrula
2. LiteLLM loglarında hata var mı kontrol et
3. Config dosyası doğru mount edilmiş mi?

### 10.4 502/503 Hataları

**Olası nedenler:**
1. Circuit breaker açık (5 ardışık hata sonrası)
2. LiteLLM timeout
3. OpenRouter API key geçersiz

**Çözüm:**
1. 30 saniye bekle (circuit breaker recovery)
2. LiteLLM loglarını kontrol et
3. OpenRouter dashboard'dan key'i doğrula

### 10.5 API Key Geçersiz Hatası

```json
{"error": "Unauthorized", "message": "Invalid API key"}
```

**Çözüm:**
1. Key'in `cfx_` ile başladığını doğrula
2. Key'in revoke edilmediğini kontrol et
3. `HASH_SALT` değerinin Router'da doğru olduğunu kontrol et

---

## 📊 Servis Özet Tablosu

| Servis | Port | Internal URL | External URL | Açıklama |
|--------|------|--------------|--------------|----------|
| `cfx-postgres` | 5432 | `cfx-postgres:5432` | - | PostgreSQL DB |
| `cfx-litellm` | 4000 | `cfx-litellm:4000` | - | AI Proxy |
| `cfx-router` | 8000 | `cfx-router:8000` | `api.codexflow.dev` | API Gateway |
| `cfx-dashboard` | 3000 | `cfx-dashboard:3000` | `app.codexflow.dev` | Web UI |

---

## 🔐 Güvenlik Kontrol Listesi

Deployment sonrası şunları kontrol edin:

- [ ] `HASH_SALT` değiştirildi mi?
- [ ] `LITELLM_MASTER_KEY` değiştirildi mi?
- [ ] `AUTH_SECRET` değiştirildi mi?
- [ ] Admin şifresi değiştirildi mi?
- [ ] HTTPS aktif mi?
- [ ] LiteLLM dışarıya açık değil mi?
- [ ] Rate limit'ler uygun mu?

---

## 🎉 Tebrikler!

CodexFlow platformunuz artık hazır! 

**Sonraki adımlar:**
1. Admin panelden planları düzenleyin
2. Test API key'i oluşturun
3. IDE extension'ı yapılandırın
4. Kullanıcıları davet edin

---

*Rehber Tarihi: 3 Ocak 2026*  
*Versiyon: 2.0*
