import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { notFound } from "next/navigation";

const docs: Record<string, { title: string; content: string }> = {
  "quickstart": {
    title: "Quick Start",
    content: `
## CodexFlow in 5 Minutes

### 1. Create an Account
Create a free account from the [registration page](/register).

### 2. Get API Key
Create an API key from the Dashboard and save it securely.

### 3. Send Your First Request

\`\`\`bash
curl -X POST https://api.codexflow.dev/v1/chat/completions \\
  -H "Authorization: Bearer cfx_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
\`\`\`

### 4. Use Stages

\`\`\`bash
# For planning
-H "X-CFX-Stage: plan"

# For code writing
-H "X-CFX-Stage: code"

# For review
-H "X-CFX-Stage: review"
\`\`\`

## Next Steps
- [API Reference](/docs/api)
- [VS Code Extension](/extension)
- [Examples](/examples)
    `,
  },
  "installation": {
    title: "Installation",
    content: `
## SDK Installation

### Python
\`\`\`bash
pip install openai
\`\`\`

### Node.js
\`\`\`bash
npm install openai
\`\`\`

## Configuration

### Python
\`\`\`python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.codexflow.dev/v1",
    api_key="cfx_your_api_key"
)
\`\`\`

### Node.js
\`\`\`javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.codexflow.dev/v1',
  apiKey: 'cfx_your_api_key',
});
\`\`\`

## Environment Variables

\`\`\`bash
export CODEXFLOW_API_KEY=cfx_your_api_key
export CODEXFLOW_BASE_URL=https://api.codexflow.dev/v1
\`\`\`
    `,
  },
  "stages": {
    title: "3-Stage Routing",
    content: `
## What is a Stage?

CodexFlow selects the optimal AI model for each task. This selection is based on the "stage" concept.

## Stage Types

### PLAN
- **Model**: Claude Sonnet 4.5
- **Use**: Architecture, planning, analysis
- **Cost**: $3.00 / 1M input

### CODE
- **Model**: DeepSeek V3
- **Use**: Code writing, implementation
- **Cost**: $0.27 / 1M input

### REVIEW
- **Model**: GPT-4o-mini
- **Use**: Code review, bug detection
- **Cost**: $0.15 / 1M input

### DIRECT
- For using a specific model
- Bypasses stage routing

## Specifying Stage

### Via Header
\`\`\`
X-CFX-Stage: code
\`\`\`

### Automatic
If you don't specify a stage, it's automatically selected based on content.

## Cost Comparison

| Approach | Session | Monthly |
|----------|---------|---------|
| Single Model | $0.21 | $630 |
| 3-Stage | $0.054 | $162 |
| Savings | 74% | $468 |
    `,
  },
  "models": {
    title: "Model Selection",
    content: `
## Supported Models

### Tier 1: Premium
| Model | Provider | Strength |
|-------|----------|----------|
| claude-sonnet-4.5 | Anthropic | Reasoning |
| gpt-4o | OpenAI | General purpose |
| gemini-2.5-pro | Google | Long context |

### Tier 2: Balanced
| Model | Provider | Strength |
|-------|----------|----------|
| deepseek-v3 | DeepSeek | Code writing |
| claude-haiku-3.5 | Anthropic | Fast |
| gemini-2.0-flash | Google | Economical |

### Tier 3: Economical
| Model | Provider | Strength |
|-------|----------|----------|
| gpt-4o-mini | OpenAI | Reliable |
| gemini-flash-lite | Google | Cheapest |

## Model Selection

### Automatic (Recommended)
\`\`\`json
{"model": "auto"}
\`\`\`

### Manual
\`\`\`json
{"model": "deepseek-v3"}
\`\`\`

## Fallback Chain

If a model fails, it automatically switches to a backup model.

\`\`\`yaml
plan:
  primary: claude-sonnet-4.5
  fallback:
    - gemini-2.5-pro
    - gpt-4o
\`\`\`
    `,
  },
  "rate-limits": {
    title: "Rate Limiting",
    content: `
## Plan Limits

| Plan | Daily Requests | Concurrent Streams |
|------|----------------|-------------------|
| Free | 100 | 1 |
| Starter | 1,000 | 2 |
| Pro | 10,000 | 5 |
| Team | 50,000 | 10 |

## Rate Limit Headers

Each response includes these headers:

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1704153600
\`\`\`

## 429 Error

When rate limit is exceeded:

\`\`\`json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Daily request limit exceeded",
    "remaining": 0,
    "reset_at": "2026-01-03T00:00:00Z"
  }
}
\`\`\`

## Best Practices

1. Check rate limit headers
2. Implement exponential backoff
3. Batch requests
4. Use caching
    `,
  },
};

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = docs[slug];
  
  if (!doc) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="sticky top-24 space-y-2">
                <p className="text-slate-500 text-sm font-medium mb-4">Documentation</p>
                {Object.entries(docs).map(([s, d]) => (
                  <Link
                    key={s}
                    href={`/docs/${s}`}
                    className={`block px-4 py-2 rounded-lg transition ${
                      slug === s
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {d.title}
                  </Link>
                ))}
                <Link href="/docs/api" className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                  API Reference
                </Link>
              </nav>
            </div>

            {/* Content */}
            <article className="lg:col-span-3">
              <h1 className="text-4xl font-bold text-white mb-8">{doc.title}</h1>
              <div className="prose prose-invert prose-slate max-w-none">
                <div className="text-slate-300 space-y-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-white [&>h3]:mt-6 [&>h3]:mb-3 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>pre]:bg-slate-900 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:my-4 [&>table]:w-full [&_th]:text-left [&_th]:py-2 [&_th]:px-4 [&_th]:border-b [&_th]:border-slate-700 [&_td]:py-2 [&_td]:px-4 [&_td]:border-b [&_td]:border-slate-800">
                  {doc.content.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                    if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
                    if (line.trim() === '') return null;
                    return <p key={i}>{line}</p>;
                  })}
                </div>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
