import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { notFound } from "next/navigation";

const posts: Record<string, { title: string; date: string; category: string; content: string }> = {
  "cfx-1-2-release": {
    title: "CodexFlow 1.2 Released: Admin Panel and More",
    date: "January 2, 2026",
    category: "Announcement",
    content: `
## What's New

CodexFlow 1.2 brings many new features to our platform. Here are the highlights:

### 🛡️ Admin Panel

Now you can manage the entire platform from one place:

- **User Management**: View users, change roles, update plans
- **Plan Management**: Edit pricing plans, set limits
- **System Settings**: SEO, cache, maintenance mode control
- **Audit Logs**: Monitor all system activities

### 💳 Billing Page

The new billing page added to Dashboard allows you to:

- View your current plan
- Compare plans
- Easily upgrade

### 🎨 Redesigned Landing Page

- Modern and professional design
- CodexFlow Agent extension showcase
- Detailed feature descriptions
- New pricing section

### 🔧 Technical Improvements

- Fixed rate limit calculation bug
- Improved Dashboard API integration
- Completed Prisma ORM integration

## Update

Existing users automatically have access to new features. New users can create an account through the [registration page](/register).

## Next Steps

- Stripe integration (payments)
- Email verification
- Team/organization support

Join our [Discord](https://discord.gg/codexflow) for questions!
    `,
  },
  "cost-savings": {
    title: "70% Cost Savings with 3-Stage Routing",
    date: "December 28, 2025",
    category: "Technical",
    content: `
## The Problem

Using a single AI model is both expensive and inefficient. Claude Sonnet 4.5 is a great model, but it's overkill for a simple code review.

## The Solution: 3-Stage Routing

CodexFlow automatically selects the optimal model for each task:

### PLAN Stage
- **Model**: Claude Sonnet 4.5
- **Use**: Architecture design, planning
- **Cost**: $3.00 / 1M input tokens

### CODE Stage  
- **Model**: DeepSeek V3
- **Use**: Code writing
- **Cost**: $0.27 / 1M input tokens

### REVIEW Stage
- **Model**: GPT-4o-mini
- **Use**: Code review
- **Cost**: $0.15 / 1M input tokens

## Cost Comparison

| Approach | Session Cost | Monthly (100 sessions/day) |
|----------|--------------|---------------------------|
| Single Model (Claude) | $0.21 | $630 |
| 3-Stage Routing | $0.054 | $162 |
| **Savings** | **74%** | **$468** |

## How It Works

\`\`\`bash
# Use X-CFX-Stage header to specify stage
curl -X POST https://api.codexflow.dev/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "X-CFX-Stage: code" \\
  -d '{"messages": [...]}'
\`\`\`

## Conclusion

With smart model routing, maintain quality while reducing costs.
    `,
  },
  "openrouter-integration": {
    title: "OpenRouter Integration: One API, All Models",
    date: "December 25, 2025",
    category: "Integration",
    content: `
## What is OpenRouter?

OpenRouter is a gateway service that provides access to multiple AI providers through a single API.

## Why OpenRouter?

- **Single API Key**: Claude, GPT, DeepSeek, Gemini - all with one key
- **Automatic Fallback**: Switch to another provider if one goes down
- **Cost Optimization**: Choose the most affordable provider
- **Simple Integration**: OpenAI-compatible API

## CodexFlow + OpenRouter

CodexFlow now accesses all models through OpenRouter:

\`\`\`yaml
# litellm_config.yaml
model_list:
  - model_name: claude-sonnet-4.5
    litellm_params:
      model: openrouter/anthropic/claude-sonnet-4
      
  - model_name: deepseek-v3
    litellm_params:
      model: openrouter/deepseek/deepseek-chat
      
  - model_name: gpt-4o-mini
    litellm_params:
      model: openrouter/openai/gpt-4o-mini
\`\`\`

## Benefits

1. Single API key management
2. Automatic rate limit handling
3. Fallback on provider outages
4. Detailed usage analytics

## Getting Started

Get your OpenRouter API key from [openrouter.ai](https://openrouter.ai) and add it to CodexFlow.
    `,
  },
  "codexflow-guide": {
    title: "AI Coding in VS Code: CodexFlow Agent Guide",
    date: "December 20, 2025",
    category: "Guide",
    content: `
## What is CodexFlow Agent?

CodexFlow Agent is an AI coding assistant developed for VS Code. It uses 3-stage routing to select the optimal model for each task.

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "CodexFlow Agent"
4. Click Install

## Configuration

Add your API key in Settings:

\`\`\`json
{
  "codexflow.apiKey": "cfx_your_api_key",
  "codexflow.apiBaseUrl": "https://api.codexflow.dev/v1"
}
\`\`\`

## Usage

### Chat Panel
- Cmd+Shift+P → "CodexFlow: Open Chat"
- Type your questions, AI responds

### Stage Commands
- \`@plan\` - Architecture/planning questions
- \`@code\` - Code writing
- \`@review\` - Code review

### Inline Actions
- Select code → Right-click → "CodexFlow: Explain"
- Select code → Right-click → "CodexFlow: Refactor"

## Tips

1. Start complex tasks with @plan
2. Use @code for code writing
3. Use @review before PRs

## Troubleshooting

- Check if API key is correct
- Check your internet connection
- Reinstall the extension
    `,
  },
  "litellm-comparison": {
    title: "LiteLLM vs Direct API: Which is Better?",
    date: "December 15, 2025",
    category: "Comparison",
    content: `
## Introduction

When developing AI applications, you have two options: Use provider APIs directly or use a gateway like LiteLLM.

## Direct API Usage

### Advantages
- Fewer dependencies
- Full control
- Access to provider-specific features

### Disadvantages
- Separate code for each provider
- Difficult fallback management
- Manual rate limit handling

## LiteLLM Gateway

### Advantages
- Single API, all models
- Automatic fallback
- Built-in rate limiting
- Unified logging

### Disadvantages
- Extra layer
- Some provider-specific features may be missing

## Comparison Table

| Feature | Direct API | LiteLLM |
|---------|------------|---------|
| Setup Ease | Medium | Easy |
| Flexibility | High | Medium |
| Fallback | Manual | Automatic |
| Logging | Manual | Built-in |
| Cost Tracking | Manual | Automatic |

## CodexFlow's Choice

CodexFlow uses LiteLLM because:

1. **Unified Interface**: All models same API
2. **Reliability**: Automatic fallback is critical
3. **Observability**: Detailed logging and metrics
4. **Cost Control**: Token and cost tracking

## Conclusion

Direct API is sufficient for simple projects. For production applications, a gateway like LiteLLM is highly recommended.
    `,
  },
  "our-story": {
    title: "The CodexFlow Story: Why We Started This Project",
    date: "December 10, 2025",
    category: "Story",
    content: `
## The Beginning

It all started with frustrations we experienced while using Cursor and Windsurf.

## The Problems

### 1. Single Model Dependency
Cursor only uses Claude. What if Claude goes down? Or what if another model gives better results?

### 2. No Cost Control
Every request goes to a premium model. Does it make sense to use Claude Opus for a simple "explain this code"?

### 3. Closed Ecosystem
You can't add your own models. You can't use local LLMs.

## The Solution: CodexFlow

We developed CodexFlow to solve these problems:

### 3-Stage Routing
The optimal model for each task. Claude for planning, DeepSeek for code, GPT-4o-mini for review.

### Open Architecture
- OpenAI-compatible API
- Any LLM can be added
- Self-host option

### Cost Transparency
- Token-based pricing
- Detailed usage reports
- Budget alerts

## Roadmap

### Q1 2026
- Team/Organization support
- SSO integration
- Custom model routing rules

### Q2 2026
- On-premise deployment
- Enterprise SLA
- Advanced analytics

## Join Us

CodexFlow is not open source but we're open to community feedback. Join our Discord and let's shape the future together!

[Join Discord](https://discord.gg/codexflow)
    `,
  },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts[slug];
  
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <article className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link href="/blog" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
              ← Back to Blog
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">{post.category}</span>
              <span className="text-slate-500">{post.date}</span>
            </div>
            <h1 className="text-4xl font-bold text-white">{post.title}</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none">
            <div className="text-slate-300 space-y-6 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-white [&>h3]:mt-6 [&>h3]:mb-3 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>pre]:bg-slate-900 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>table]:w-full [&>table]:border-collapse [&_th]:text-left [&_th]:py-2 [&_th]:px-4 [&_th]:border-b [&_th]:border-slate-700 [&_td]:py-2 [&_td]:px-4 [&_td]:border-b [&_td]:border-slate-800">
              {post.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i}>{line}</p>;
              })}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Share</h3>
            <div className="flex gap-4">
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://codexflow.dev/blog/${slug}`)}`} className="text-slate-400 hover:text-white">Twitter</a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://codexflow.dev/blog/${slug}`)}`} className="text-slate-400 hover:text-white">LinkedIn</a>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
