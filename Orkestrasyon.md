# CF-X Stage Orkestrasyon Analizi

## 🎯 Neden 3-Stage Orkestrasyon?

Tek model kullanmak yerine 3 aşamalı sistem kullanmanın temel nedenleri:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEK MODEL YAKLAŞIMI                          │
│                                                                 │
│   Her iş için aynı model = Overkill veya Underkill              │
│                                                                 │
│   ❌ Basit review için Claude Opus = Para israfı                │
│   ❌ Karmaşık mimari için GPT-4o-mini = Kalite kaybı            │
│   ❌ Kod üretimi için reasoning model = Yavaş + pahalı          │
└─────────────────────────────────────────────────────────────────┘

                              VS

┌─────────────────────────────────────────────────────────────────┐
│                   3-STAGE ORKESTRASYON                          │
│                                                                 │
│   Her iş için optimal model = Maliyet/Kalite dengesi            │
│                                                                 │
│   ✅ Mimari → Premium model (kalite kritik)                     │
│   ✅ Kod üretimi → Hızlı/ucuz model (hacim yüksek)              │
│   ✅ Review → Ekonomik model (basit doğrulama)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Model Benchmark Karşılaştırması (Ocak 2026)

### Coding Benchmarks

| Model | SWE-bench | HumanEval | MBPP | Hız (tok/s) | Maliyet (1M tok) |
|-------|-----------|-----------|------|-------------|------------------|
| **Claude Sonnet 4.5** | 77.2% | 92.1% | 89.4% | ~45 | $3/$15 |
| **DeepSeek V3.2** | 68.5% | 82.6% | 85.2% | ~120 | $0.28/$1.10 |
| **GPT-4o-mini** | 52.3% | 74.2% | 78.1% | ~200 | $0.15/$0.60 |
| Gemini 2.0 Flash | 58.1% | 78.4% | 80.3% | ~180 | $0.10/$0.40 |
| GPT-5 | 71.8% | 89.2% | 87.6% | ~60 | $5/$20 |

### Reasoning & Planning Benchmarks

| Model | MMLU | GPQA | MATH | Uzun Context |
|-------|------|------|------|--------------|
| **Claude Sonnet 4.5** | 88.7% | 83.4% | 78.2% | 200K ✅ |
| **DeepSeek V3.2** | 87.1% | 79.8% | 82.5% | 128K ✅ |
| **GPT-4o-mini** | 82.0% | 68.2% | 65.4% | 128K ✅ |
| Gemini 2.5 Pro | 89.2% | 84.1% | 80.3% | 1M ✅ |

---

## 🎭 Stage Tanımları ve Model Eşleştirme

### Stage 1: PLAN (Architect)

**Görev:** Spec/plan üretimi, mimari kararlar, tasarım dokümanları

**Gereksinimler:**
- ✅ Güçlü reasoning (karmaşık sistemleri anlama)
- ✅ Uzun context (büyük codebase analizi)
- ✅ Tutarlı çıktı (spec formatı)
- ❌ Hız kritik değil
- ❌ Kod üretimi YASAK

**Önerilen Model:** Claude Sonnet 4.5

**Neden?**
```
1. SWE-bench 77.2% → Gerçek dünya yazılım problemlerini anlıyor
2. 30+ saat otonom çalışma → Uzun context stabilitesi
3. GPQA 83.4% → Teknik reasoning güçlü
4. Tutarlı format → Spec/plan için ideal
```

**Alternatifler:**
| Model | Avantaj | Dezavantaj | Ne Zaman? |
|-------|---------|------------|-----------|
| Gemini 2.5 Pro | 1M context, ucuz | Daha az tutarlı | Çok büyük codebase |
| GPT-5 | Güçlü reasoning | Pahalı ($5/$20) | Enterprise |
| Claude Opus 4.1 | En güçlü | Çok pahalı ($15/$75) | Kritik mimari |

**Örnek Prompt Template:**
```
You are an expert software architect. Your task is to create a detailed 
specification for the following feature. 

RULES:
- DO NOT write any code
- Focus on architecture, data flow, and interfaces
- Use markdown format with clear sections
- Consider edge cases and error handling

Feature Request: {user_request}
Existing Codebase Context: {codebase_summary}
```

---

### Stage 2: CODE (Developer)

**Görev:** Kod üretimi, unified diff, implementation

**Gereksinimler:**
- ✅ Hızlı response (developer UX)
- ✅ Yüksek hacim (çok request)
- ✅ Kod kalitesi (çalışan kod)
- ✅ Maliyet-etkin
- ❌ Derin reasoning gerekmez (plan zaten var)

**Önerilen Model:** DeepSeek V3.2

**Neden?**
```
1. HumanEval 82.6% → Kod üretiminde güçlü
2. $0.28/$1.10 → Claude'dan 10x ucuz
3. 120 tok/s → Hızlı response
4. Open-source → Vendor lock yok
```

**Maliyet Karşılaştırması (1000 kod request):**
```
Claude Sonnet 4.5:  1000 × $0.021 = $21.00
DeepSeek V3.2:      1000 × $0.002 = $2.00
─────────────────────────────────────────
Tasarruf:           $19.00 (%90!)
```

**Alternatifler:**
| Model | Avantaj | Dezavantaj | Ne Zaman? |
|-------|---------|------------|-----------|
| Gemini 2.0 Flash | En ucuz ($0.10/$0.40) | Kod kalitesi düşük | Basit kod |
| Claude Haiku 4.5 | Hızlı, kaliteli | Daha pahalı ($1/$5) | Kritik kod |
| GPT-4o-mini | Güvenilir | Orta kalite | Fallback |

**Örnek Prompt Template:**
```
You are an expert developer. Implement the following based on the spec.

RULES:
- Output ONLY unified diff format
- Follow existing code style
- Include error handling
- Add inline comments for complex logic

Specification:
{plan_output}

Files to modify:
{file_list}
```

---

### Stage 3: REVIEW (Reviewer)

**Görev:** Kod review, güvenlik analizi, uyumluluk kontrolü

**Gereksinimler:**
- ✅ Hızlı (blocking olmadan)
- ✅ Ucuz (her commit için)
- ✅ Güvenilir (false positive düşük)
- ❌ Derin analiz gerekmez
- ❌ Kod üretimi YASAK

**Önerilen Model:** GPT-4o-mini

**Neden?**
```
1. 200 tok/s → En hızlı
2. $0.15/$0.60 → En ucuz tier-1 model
3. 82% MMLU → Yeterli anlama kapasitesi
4. Güvenilir → OpenAI stabilitesi
```

**Alternatifler:**
| Model | Avantaj | Dezavantaj | Ne Zaman? |
|-------|---------|------------|-----------|
| Gemini Flash-Lite | Daha ucuz ($0.07/$0.30) | Daha az güvenilir | Yüksek hacim |
| Claude Haiku 3.5 | Daha kaliteli | Daha pahalı | Güvenlik kritik |
| DeepSeek V3 | Ucuz | Review için overkill | - |

**Örnek Prompt Template:**
```
You are a senior code reviewer. Analyze the following diff for:

1. Security vulnerabilities (SQL injection, XSS, etc.)
2. Logic errors and edge cases
3. Code style and best practices
4. Performance issues

RULES:
- DO NOT suggest code changes
- Rate severity: LOW / MEDIUM / HIGH / CRITICAL
- Be concise, focus on actionable feedback

Diff:
{code_diff}

Original Spec:
{plan_summary}
```

---

## 🔄 Stage Inference Algoritması

Header yoksa, mesaj içeriğinden stage belirleme:

```python
def infer_stage(messages: list[Message]) -> str:
    """
    Mesaj içeriğinden stage belirle.
    
    Öncelik sırası:
    1. Explicit keywords
    2. Question patterns
    3. Code presence
    4. Default: plan
    """
    last_content = messages[-1].content.lower()
    
    # PLAN keywords (mimari, tasarım)
    plan_keywords = [
        "plan", "design", "architect", "spec", "specification",
        "how should", "what's the best way", "structure",
        "approach", "strategy", "outline", "requirements",
        "tasarla", "planla", "mimari", "nasıl yapmalı"
    ]
    
    # CODE keywords (implementasyon)
    code_keywords = [
        "implement", "code", "write", "create", "build",
        "fix", "refactor", "add", "update", "modify",
        "function", "class", "method", "api",
        "yaz", "kodla", "oluştur", "düzelt", "ekle"
    ]
    
    # REVIEW keywords (analiz)
    review_keywords = [
        "review", "check", "analyze", "audit", "security",
        "vulnerability", "bug", "issue", "problem",
        "incele", "kontrol", "analiz", "güvenlik"
    ]
    
    # Keyword matching
    if any(kw in last_content for kw in review_keywords):
        return "review"
    elif any(kw in last_content for kw in code_keywords):
        return "code"
    elif any(kw in last_content for kw in plan_keywords):
        return "plan"
    
    # Code block presence → likely code stage
    if "```" in last_content or "def " in last_content:
        return "code"
    
    # Question about how → plan
    if last_content.startswith(("how", "what", "nasıl", "ne")):
        return "plan"
    
    # Default
    return "plan"
```

### Inference Accuracy Hedefi

| Senaryo | Beklenen Stage | Confidence |
|---------|----------------|------------|
| "Design a REST API for..." | plan | 95% |
| "Implement the login function" | code | 98% |
| "Review this code for security" | review | 97% |
| "Fix the bug in auth.py" | code | 90% |
| "What's the best approach for..." | plan | 85% |
| Ambiguous request | plan (default) | - |

---

## 💰 Maliyet Optimizasyon Stratejileri

### 1. Akıllı Stage Routing

```
Basit request → Ucuz model
Karmaşık request → Premium model

Complexity Score = f(token_count, code_presence, question_depth)
```

### 2. Prompt Caching

```python
# DeepSeek cache: %95 indirim
# Claude cache: %90 indirim

# Tekrarlayan system prompt'ları cache'le
cached_system_prompt = """
You are an expert {role}...
[500+ token system prompt]
"""

# Her request'te sadece user message değişir
# Cache hit → $0.014/1M vs $0.27/1M
```

### 3. Batch Processing (Review Stage)

```python
# Gerçek zamanlı olması şart değil
# Batch API: %50 indirim

async def batch_review(diffs: list[str]):
    # 24 saat içinde işlenir
    # Maliyet: $0.075/$0.30 (vs $0.15/$0.60)
    return await openai.batch.create(...)
```

### 4. Fallback Chain

```yaml
plan:
  primary: claude-sonnet-4.5
  fallback:
    - gemini-2.5-pro      # Claude down ise
    - gpt-5               # Gemini de down ise
  timeout: 30s

code:
  primary: deepseek-v3.2
  fallback:
    - gemini-2.0-flash
    - gpt-4o-mini
  timeout: 20s

review:
  primary: gpt-4o-mini
  fallback:
    - gemini-flash-lite
    - claude-haiku-3.5
  timeout: 10s
```

---

## 📈 Stage Dağılımı Analizi

### Tipik Kullanım Paterni

```
Bir geliştirme oturumu (10 request):

PLAN:   2 request (%20) → Başlangıç tasarım
CODE:   6 request (%60) → İteratif implementasyon
REVIEW: 2 request (%20) → Final kontrol

Maliyet dağılımı:
PLAN:   2 × $0.021 = $0.042 (%78 toplam maliyet!)
CODE:   6 × $0.002 = $0.012 (%22)
REVIEW: 2 × $0.001 = $0.002 (%0)
```

### Optimizasyon Fırsatı

```
PLAN stage en pahalı ama en az kullanılan!

Strateji:
1. PLAN çıktısını cache'le (aynı feature için tekrar kullanma)
2. PLAN'ı daha kısa tut (sadece gerekli detay)
3. Basit planlar için daha ucuz model (Gemini Pro)
```

---

## 🎛️ Dinamik Model Seçimi (Gelişmiş)

### Complexity-Based Routing

```python
def select_model(stage: str, request: ChatRequest) -> str:
    """
    Request karmaşıklığına göre model seç.
    """
    complexity = calculate_complexity(request)
    
    if stage == "plan":
        if complexity > 0.8:
            return "claude-opus-4.1"      # Çok karmaşık
        elif complexity > 0.5:
            return "claude-sonnet-4.5"    # Normal
        else:
            return "gemini-2.5-pro"       # Basit
    
    elif stage == "code":
        if complexity > 0.7:
            return "claude-sonnet-4.5"    # Karmaşık kod
        elif complexity > 0.4:
            return "deepseek-v3.2"        # Normal
        else:
            return "gemini-2.0-flash"     # Basit kod
    
    elif stage == "review":
        if "security" in request.content:
            return "claude-haiku-3.5"     # Güvenlik kritik
        else:
            return "gpt-4o-mini"          # Normal review

def calculate_complexity(request: ChatRequest) -> float:
    """
    0.0 (basit) - 1.0 (karmaşık) arası skor.
    """
    factors = {
        "token_count": len(request.messages[-1].content) / 10000,
        "code_blocks": request.content.count("```") / 10,
        "file_count": request.content.count("file:") / 20,
        "question_depth": count_nested_questions(request) / 5,
    }
    return min(1.0, sum(factors.values()) / len(factors))
```

---

## 🔒 Stage-Specific Güvenlik

### PLAN Stage
```
✅ Kod üretimi YASAK
✅ Sadece markdown/text çıktı
✅ Max token: 4096 (uzun spec'ler için)
```

### CODE Stage
```
✅ Sadece diff format çıktı
✅ Dangerous pattern detection (rm -rf, DROP TABLE)
✅ Max token: 8192 (büyük refactor için)
```

### REVIEW Stage
```
✅ Kod değişikliği YASAK
✅ Sadece analiz/feedback
✅ Max token: 2048 (kısa review)
```

---

## 📊 Monitoring & Analytics

### Stage Metrikleri

```sql
-- Stage başına ortalama maliyet
SELECT 
    stage,
    AVG(cost_usd) as avg_cost,
    COUNT(*) as request_count,
    AVG(latency_ms) as avg_latency
FROM request_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY stage;

-- Model başına başarı oranı
SELECT 
    model,
    COUNT(CASE WHEN status = 'success' THEN 1 END)::float / COUNT(*) as success_rate
FROM request_logs
GROUP BY model;
```

### Alert Kuralları

```yaml
alerts:
  - name: high_plan_cost
    condition: avg(cost_usd) > 0.05 WHERE stage = 'plan'
    action: notify_slack
    
  - name: low_code_quality
    condition: error_rate > 0.1 WHERE stage = 'code'
    action: switch_to_fallback
    
  - name: slow_review
    condition: avg(latency_ms) > 5000 WHERE stage = 'review'
    action: scale_up
```

---

## ✅ Sonuç ve Öneriler

### Başlangıç Konfigürasyonu (MVP)

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

### Gelecek İyileştirmeler

1. **v1.1:** Complexity-based routing
2. **v1.2:** Prompt caching entegrasyonu
3. **v1.3:** Batch processing for review
4. **v2.0:** Multi-model ensemble (birden fazla model + voting)

### Tahmini Maliyet Tasarrufu

| Yaklaşım | Aylık Maliyet (50 user) | Tasarruf |
|----------|-------------------------|----------|
| Tek model (Claude) | $630 | - |
| 3-Stage (Temel) | $162 | %74 |
| 3-Stage + Caching | $120 | %81 |
| 3-Stage + Complexity | $100 | %84 |

---

*Rapor Tarihi: 2 Ocak 2026*
*Versiyon: 1.0*
