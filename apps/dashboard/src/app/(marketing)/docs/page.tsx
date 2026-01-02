import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function DocsPage() {
  const sections = [
    {
      title: "Getting Started",
      items: [
        { name: "Quick Start", href: "/docs/quickstart", desc: "Get started with CodexFlow in 5 minutes" },
        { name: "Installation", href: "/docs/installation", desc: "Create API keys and configure your environment" },
        { name: "First API Call", href: "/docs/first-call", desc: "Send your first chat completion request" },
      ],
    },
    {
      title: "Core Concepts",
      items: [
        { name: "3-Stage Routing", href: "/docs/stages", desc: "Understand PLAN, CODE, REVIEW stages" },
        { name: "Model Selection", href: "/docs/models", desc: "Which model to use and when" },
        { name: "Rate Limiting", href: "/docs/rate-limits", desc: "Usage limits and quotas" },
      ],
    },
    {
      title: "API Reference",
      items: [
        { name: "Chat Completions", href: "/docs/api/chat", desc: "POST /v1/chat/completions" },
        { name: "Streaming", href: "/docs/api/streaming", desc: "Real-time responses with SSE" },
        { name: "Error Handling", href: "/docs/api/errors", desc: "Error codes and solutions" },
      ],
    },
    {
      title: "Integrations",
      items: [
        { name: "VS Code Extension", href: "/docs/vscode", desc: "CodexFlow Agent setup" },
        { name: "Python SDK", href: "/docs/sdk/python", desc: "Using with OpenAI client" },
        { name: "Node.js SDK", href: "/docs/sdk/nodejs", desc: "JavaScript/TypeScript integration" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Documentation</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Everything you need to use the CodexFlow Platform
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-6 py-4 pl-14 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {sections.map((section) => (
              <div key={section.title} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium group-hover:text-blue-400 transition">{item.name}</h3>
                          <p className="text-slate-400 text-sm mt-1">{item.desc}</p>
                        </div>
                        <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
