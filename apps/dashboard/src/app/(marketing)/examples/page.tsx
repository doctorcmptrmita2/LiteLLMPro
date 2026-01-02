import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function ExamplesPage() {
  const examples = [
    {
      title: "Chat Completion with Python",
      desc: "Simple chat completion example using OpenAI SDK",
      lang: "Python",
      code: `from openai import OpenAI

client = OpenAI(
    base_url="https://api.codexflow.dev/v1",
    api_key="cfx_your_api_key"
)

response = client.chat.completions.create(
    model="auto",
    messages=[
        {"role": "user", "content": "Write a hello world in Python"}
    ],
    extra_headers={"X-CFX-Stage": "code"}
)

print(response.choices[0].message.content)`,
    },
    {
      title: "Streaming with Node.js",
      desc: "Real-time responses with SSE streaming",
      lang: "JavaScript",
      code: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.codexflow.dev/v1',
  apiKey: 'cfx_your_api_key',
});

const stream = await client.chat.completions.create({
  model: 'auto',
  messages: [{ role: 'user', content: 'Explain async/await' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}`,
    },
    {
      title: "API Call with cURL",
      desc: "Direct API call from terminal",
      lang: "Bash",
      code: `curl -X POST https://api.codexflow.dev/v1/chat/completions \\
  -H "Authorization: Bearer cfx_your_api_key" \\
  -H "Content-Type: application/json" \\
  -H "X-CFX-Stage: plan" \\
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Design a REST API for a todo app"}
    ]
  }'`,
    },
    {
      title: "3-Stage Workflow",
      desc: "Complete PLAN → CODE → REVIEW flow example",
      lang: "Python",
      code: `# 1. PLAN: Design architecture
plan = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Design auth system"}],
    extra_headers={"X-CFX-Stage": "plan"}
)

# 2. CODE: Write the code
code = client.chat.completions.create(
    model="auto",
    messages=[
        {"role": "assistant", "content": plan.choices[0].message.content},
        {"role": "user", "content": "Now implement it"}
    ],
    extra_headers={"X-CFX-Stage": "code"}
)

# 3. REVIEW: Review the code
review = client.chat.completions.create(
    model="auto",
    messages=[
        {"role": "assistant", "content": code.choices[0].message.content},
        {"role": "user", "content": "Review this code for security issues"}
    ],
    extra_headers={"X-CFX-Stage": "review"}
)`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Code Examples</h1>
            <p className="text-xl text-slate-400">Copy, paste, run</p>
          </div>

          <div className="space-y-8">
            {examples.map((example) => (
              <div key={example.title} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{example.title}</h3>
                      <p className="text-slate-400 text-sm mt-1">{example.desc}</p>
                    </div>
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-sm">
                      {example.lang}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <pre className="p-6 overflow-x-auto text-sm">
                    <code className="text-slate-300">{example.code}</code>
                  </pre>
                  <button
                    className="absolute top-4 right-4 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-slate-400 mb-4">Visit GitHub for more examples</p>
            <a
              href="https://github.com/codexflow/examples"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
              </svg>
              codexflow/examples
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
