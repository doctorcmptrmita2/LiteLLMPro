import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { notFound } from "next/navigation";

const guides: Record<string, { title: string; time: string; category: string; content: string }> = {
  "intro": {
    title: "Introduction to CodexFlow",
    time: "5 min",
    category: "Getting Started",
    content: `
## What is CodexFlow?

CodexFlow is a 3-stage AI orchestration platform. It automatically selects the optimal AI model for each task, increasing quality while reducing costs.

## The 3 Stages

### 1. PLAN (Planning)
- **Model**: Claude Sonnet 4.5
- **Use**: Architecture design, system planning, complex problem solving
- **Strength**: Deep reasoning, long context

### 2. CODE (Code Writing)
- **Model**: DeepSeek V3
- **Use**: Code generation, implementation
- **Strength**: Fast, economical, quality code

### 3. REVIEW (Review)
- **Model**: GPT-4o-mini
- **Use**: Code review, bug detection, optimization suggestions
- **Strength**: Reliable, consistent

## Why CodexFlow?

- **70% Cost Savings**: Smart model selection
- **OpenAI-Compatible API**: No need to change your existing code
- **Streaming Support**: Real-time responses
- **Fallback Chain**: Uninterrupted service
    `,
  },
  "first-call": {
    title: "Your First API Call",
    time: "10 min",
    category: "Getting Started",
    content: `
## Prerequisites

1. CodexFlow account ([sign up](/register))
2. API key (create from Dashboard)

## Step 1: Create API Key

1. Log in to [Dashboard](/dashboard)
2. Go to "API Keys" page
3. Click "Create New Key" button
4. Save the key securely

## Step 2: First Request

### With cURL:

\`\`\`bash
curl -X POST https://api.codexflow.dev/v1/chat/completions \\
  -H "Authorization: Bearer cfx_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
\`\`\`

### With Python:

\`\`\`python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.codexflow.dev/v1",
    api_key="cfx_your_api_key"
)

response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
\`\`\`

## Step 3: Specify Stage

Use the \`X-CFX-Stage\` header to specify a stage:

\`\`\`bash
curl -X POST https://api.codexflow.dev/v1/chat/completions \\
  -H "Authorization: Bearer cfx_your_api_key" \\
  -H "X-CFX-Stage: code" \\
  -d '{"model": "auto", "messages": [...]}'
\`\`\`

## Next Steps

- Read the [Stage Selection](/guides/stages) guide
- Install [VS Code Extension](/guides/vscode)
    `,
  },
  "stages": {
    title: "Stage Selection Guide",
    time: "8 min",
    category: "Getting Started",
    content: `
## What is a Stage?

A stage indicates what phase your request is in. CodexFlow selects the optimal model based on this information.

## Stage Types

### PLAN
- Architecture design
- System planning
- Complex problem analysis
- Strategy determination

**Example usage:**
\`\`\`
"Design a microservice architecture for an e-commerce site"
"Analyze the security vulnerabilities of this system"
\`\`\`

### CODE
- Code writing
- Function implementation
- Bug fixes
- Refactoring

**Example usage:**
\`\`\`
"Convert this function to TypeScript"
"Add pagination"
\`\`\`

### REVIEW
- Code review
- Bug detection
- Performance analysis
- Best practice suggestions

**Example usage:**
\`\`\`
"Review this code for security"
"Suggest performance improvements"
\`\`\`

### DIRECT
- When you want to use a specific model
- To bypass stage routing

## Specifying Stage

### Via Header:
\`\`\`
X-CFX-Stage: code
\`\`\`

### Automatic (auto):
If you don't specify a stage, CodexFlow automatically selects based on content.

## Tips

1. Break complex tasks into PLAN → CODE → REVIEW
2. CODE is sufficient for simple code changes
3. Use REVIEW before PRs
    `,
  },
  "vscode": {
    title: "VS Code Extension Setup",
    time: "15 min",
    category: "Integration",
    content: `
## CodexFlow Agent

CodexFlow Agent is the official extension developed for VS Code.

## Installation

### From Marketplace:
1. Open VS Code
2. Extensions (Ctrl+Shift+X)
3. Search "CodexFlow Agent"
4. Install

### Command Line:
\`\`\`bash
code --install-extension codexflow.codexflow-agent
\`\`\`

## Configuration

Add to settings.json:

\`\`\`json
{
  "codexflow.apiKey": "cfx_your_api_key",
  "codexflow.apiBaseUrl": "https://api.codexflow.dev/v1",
  "codexflow.defaultStage": "auto"
}
\`\`\`

## Usage

### Chat Panel
- \`Cmd+Shift+P\` → "CodexFlow: Open Chat"

### Stage Commands
- \`@plan\` - Planning questions
- \`@code\` - Code writing
- \`@review\` - Code review

### Context Menu
- Select code → Right-click → CodexFlow options

### Keyboard Shortcuts
- \`Cmd+Shift+C\` - Open chat
- \`Cmd+Shift+E\` - Explain selected code
- \`Cmd+Shift+R\` - Refactor selected code

## Features

- ✅ Inline chat
- ✅ Code completion
- ✅ Auto-apply changes
- ✅ Multi-file context
- ✅ Git integration
    `,
  },
  "python": {
    title: "Python Integration",
    time: "10 min",
    category: "Integration",
    content: `
## Using with OpenAI SDK

CodexFlow is fully compatible with the OpenAI API. Just change the base_url.

## Installation

\`\`\`bash
pip install openai
\`\`\`

## Basic Usage

\`\`\`python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.codexflow.dev/v1",
    api_key="cfx_your_api_key"
)

# Simple request
response = client.chat.completions.create(
    model="auto",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
\`\`\`

## Specifying Stage

\`\`\`python
response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Design a REST API"}],
    extra_headers={"X-CFX-Stage": "plan"}
)
\`\`\`

## Streaming

\`\`\`python
stream = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Write a long story"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
\`\`\`

## Async Usage

\`\`\`python
from openai import AsyncOpenAI

client = AsyncOpenAI(
    base_url="https://api.codexflow.dev/v1",
    api_key="cfx_your_api_key"
)

async def main():
    response = await client.chat.completions.create(
        model="auto",
        messages=[{"role": "user", "content": "Hello!"}]
    )
    print(response.choices[0].message.content)
\`\`\`
    `,
  },
  "nodejs": {
    title: "Node.js Integration",
    time: "10 min",
    category: "Integration",
    content: `
## Using with OpenAI SDK

## Installation

\`\`\`bash
npm install openai
\`\`\`

## Basic Usage

\`\`\`javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.codexflow.dev/v1',
  apiKey: 'cfx_your_api_key',
});

const response = await client.chat.completions.create({
  model: 'auto',
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.choices[0].message.content);
\`\`\`

## Specifying Stage

\`\`\`javascript
const response = await client.chat.completions.create({
  model: 'auto',
  messages: [{ role: 'user', content: 'Design a REST API' }],
}, {
  headers: { 'X-CFX-Stage': 'plan' }
});
\`\`\`

## Streaming

\`\`\`javascript
const stream = await client.chat.completions.create({
  model: 'auto',
  messages: [{ role: 'user', content: 'Write a story' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
\`\`\`

## TypeScript

\`\`\`typescript
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';

const client = new OpenAI({
  baseURL: 'https://api.codexflow.dev/v1',
  apiKey: process.env.CODEXFLOW_API_KEY,
});

const messages: ChatCompletionMessageParam[] = [
  { role: 'user', content: 'Hello!' }
];

const response = await client.chat.completions.create({
  model: 'auto',
  messages,
});
\`\`\`
    `,
  },
};

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides[slug];
  
  if (!guide) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <article className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link href="/guides" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">
              ← Back to Guides
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-sm">{guide.category}</span>
              <span className="text-slate-500">{guide.time} read</span>
            </div>
            <h1 className="text-4xl font-bold text-white">{guide.title}</h1>
          </div>

          <div className="prose prose-invert prose-slate max-w-none">
            <div className="text-slate-300 space-y-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-4 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-white [&>h3]:mt-6 [&>h3]:mb-3 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>pre]:bg-slate-900 [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:my-4">
              {guide.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>;
                if (line.trim() === '') return null;
                return <p key={i}>{line}</p>;
              })}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
