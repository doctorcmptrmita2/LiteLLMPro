# CF-X Router - EasyPanel Deployment Rehberi

Bu rehber CF-X Router'ı EasyPanel'e adım adım deploy etmenizi sağlar.

## Genel Bakış

Üç servis deploy edeceğiz:
1. **cfx-postgres** - PostgreSQL veritabanı
2. **cfx-litellm** - LiteLLM Proxy (AI model gateway)
3. **cfx-router** - CF-X Router (FastAPI uygulaması)

---

## Adım 1: Proje Oluşturma

1. EasyPanel'e giriş yap
2. **"New Project"** butonuna tıkla
3. Proje adı: `cfx`
4. **"Create"** butonuna tıkla

---

## Adım 2: PostgreSQL Servisi (cfx-postgres)

### 2.1 Servis Oluşturma
1. Proje içinde **"+ New"** → **"Database"** → **"Postgres"**
2. Servis adı: `cfx-postgres`

### 2.2 Ayarlar
- **Database Name**: `cfx_db`
- **Username**: `cfx`
- **Password**: (güçlü bir şifre belirle, not al)

### 2.3 Deploy
1. **"Deploy"** butonuna tıkla
2. Servisin "Running" olmasını bekle

### 2.4 Bağlantı Bilgisi
Internal URL şu formatta olacak:
```
postgresql://cfx:SIFREN@cfx-postgres:5432/cfx_db
```

---

## Adım 3: LiteLLM Servisi (cfx-litellm)

### 3.1 Servis Oluşturma
1. **"+ New"** → **"App"** → **"Docker Image"**
2. Servis adı: `cfx-litellm`

### 3.2 Docker Image
```
ghcr.io/berriai/litellm:main-latest
```

### 3.3 Port Ayarı
- **Port**: `4000`
- **Protocol**: HTTP

### 3.4 Environment Variables
```
LITELLM_MASTER_KEY=sk-litellm-master-key-degistir
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
DEEPSEEK_API_KEY=sk-xxx
```

### 3.5 Config Dosyası (Mount)
1. **"Mounts"** sekmesine git
2. **"Add Mount"** → **"File"**
3. Path: `/app/config.yaml`
4. İçerik:

```yaml
model_list:
  - model_name: claude-sonnet-4.5
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: deepseek-v3
    litellm_params:
      model: deepseek/deepseek-chat
      api_key: os.environ/DEEPSEEK_API_KEY

  - model_name: gpt-4o-mini
    litellm_params:
      model: openai/gpt-4o-mini
      api_key: os.environ/OPENAI_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

  - model_name: gemini-2.5-pro
    litellm_params:
      model: gemini/gemini-2.5-pro
      api_key: os.environ/GOOGLE_API_KEY

  - model_name: gemini-2.0-flash
    litellm_params:
      model: gemini/gemini-2.0-flash
      api_key: os.environ/GOOGLE_API_KEY

litellm_settings:
  request_timeout: 120
  num_retries: 1

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
```

### 3.6 Command (Başlatma Komutu)
1. Servis ayarlarında **"Source"** sekmesine git
2. **"Command"** alanına şunu yaz:
```
litellm --config /app/config.yaml --port 4000
```

> **Alternatif:** Eğer hata alırsan, Command alanını boş bırak ve Environment Variables'a şunu ekle:
> ```
> LITELLM_CONFIG=/app/config.yaml
> ```

### 3.7 Deploy
1. **"Deploy"** butonuna tıkla
2. Logları kontrol et, "Running on port 4000" mesajını gör

---

## Adım 4: CF-X Router Servisi (cfx-router)

### 4.1 Servis Oluşturma
1. **"+ New"** → **"App"** → **"GitHub"**
2. Servis adı: `cfx-router`

### 4.2 GitHub Bağlantısı
- **Repository**: `doctorcmptrmita2/LiteLLMPro`
- **Branch**: `main`
- **Root Directory**: `services/cfx-router`

### 4.3 Build Ayarları
- **Build Type**: Dockerfile
- **Dockerfile Path**: `Dockerfile`

### 4.4 Port Ayarı
- **Port**: `8000`
- **Protocol**: HTTP

### 4.5 Environment Variables
```
DATABASE_URL=postgresql://cfx:SIFREN@cfx-postgres:5432/cfx_db
LITELLM_URL=http://cfx-litellm:4000
HASH_SALT=cfx-super-secret-salt-degistir-bunu
CFX_CONFIG_PATH=/app/config/models.yaml
LOG_LEVEL=INFO
```

### 4.6 Config Dosyası (Mount)
1. **"Mounts"** sekmesine git
2. **"Add Mount"** → **"File"**
3. Path: `/app/config/models.yaml`
4. İçerik:

```yaml
stages:
  plan:
    model: claude-sonnet-4.5
    max_tokens: 4096
    temperature: 0.3
    fallback:
      - gemini-2.5-pro
      - gpt-4o

  code:
    model: deepseek-v3
    max_tokens: 8192
    temperature: 0.2
    fallback:
      - gemini-2.0-flash
      - gpt-4o-mini

  review:
    model: gpt-4o-mini
    max_tokens: 2048
    temperature: 0.1
    fallback:
      - gemini-2.0-flash

direct:
  allowed_models:
    - claude-sonnet-4.5
    - gpt-4o
    - gpt-4o-mini
    - deepseek-v3
    - gemini-2.5-pro
    - gemini-2.0-flash
  max_tokens_cap: 8192

rate_limit:
  daily_requests: 1000
  concurrent_streams: 3

circuit_breaker:
  failure_threshold: 5
  recovery_timeout: 30
```

### 4.7 Health Check
- **Path**: `/health`
- **Port**: `8000`

### 4.8 Deploy
1. **"Deploy"** butonuna tıkla
2. Build loglarını takip et
3. "Application startup complete" mesajını gör

---

## Adım 5: Domain Ayarları

### 5.1 cfx-router için Domain
1. `cfx-router` servisine git
2. **"Domains"** sekmesi
3. **"Add Domain"**
4. Subdomain: `cfx-api` (veya istediğin isim)
5. **"Enable HTTPS"** işaretle

Sonuç: `https://cfx-api.senin-domain.com`

### 5.2 cfx-litellm için Domain (Opsiyonel)
Eğer LiteLLM'e dışarıdan erişim istiyorsan:
1. `cfx-litellm` servisine git
2. **"Domains"** sekmesi
3. Subdomain: `litellm`

---

## Adım 6: Veritabanı Migration

### 6.1 Terminal Erişimi
1. `cfx-router` servisine git
2. **"Terminal"** sekmesi
3. Shell aç

### 6.2 Migration Çalıştır
```bash
# PostgreSQL'e bağlan ve migration'ı çalıştır
psql $DATABASE_URL -f /app/migrations/001_initial_schema.sql
```

---

## Adım 7: Test

### 7.1 Health Check
```bash
curl https://cfx-api.senin-domain.com/health
```

Beklenen yanıt:
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "checks": {
    "config": true,
    "stage_router": true,
    "litellm_client": true,
    "litellm": true
  }
}
```

### 7.2 Chat Completion Test
```bash
curl -X POST https://cfx-api.senin-domain.com/v1/chat/completions \
  -H "Authorization: Bearer cfx_test_key_12345678" \
  -H "Content-Type: application/json" \
  -H "X-CFX-Stage: code" \
  -d '{
    "messages": [{"role": "user", "content": "Write hello world in Python"}],
    "stream": false
  }'
```

---

## Servis Özeti

| Servis | Port | Internal URL | Açıklama |
|--------|------|--------------|----------|
| cfx-postgres | 5432 | `cfx-postgres:5432` | PostgreSQL DB |
| cfx-litellm | 4000 | `cfx-litellm:4000` | LiteLLM Proxy |
| cfx-router | 8000 | `cfx-router:8000` | CF-X API |

---

## Sorun Giderme

### Servis Başlamıyor
1. **Logs** sekmesini kontrol et
2. Environment variables doğru mu?
3. Bağımlı servisler çalışıyor mu?

### Database Bağlantı Hatası
1. `cfx-postgres` çalışıyor mu?
2. `DATABASE_URL` doğru mu?
3. Şifrede özel karakter varsa URL encode yap

### LiteLLM Bağlantı Hatası
1. `cfx-litellm` çalışıyor mu?
2. `LITELLM_URL` doğru mu? (`http://cfx-litellm:4000`)
3. API key'ler doğru mu?

### 502/503 Hataları
1. Health check'i kontrol et
2. Circuit breaker açık olabilir, 30 saniye bekle
3. LiteLLM loglarını kontrol et

---

## Güvenlik Notları

⚠️ **Önemli:**
- `HASH_SALT` değerini mutlaka değiştir
- `LITELLM_MASTER_KEY` değerini mutlaka değiştir
- API key'leri güvenli şekilde sakla
- Production'da rate limit'leri ayarla
