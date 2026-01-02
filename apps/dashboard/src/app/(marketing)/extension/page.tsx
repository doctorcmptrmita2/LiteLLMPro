import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function ExtensionPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-400 text-sm">VS Code Extension</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              CodexFlow Agent
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Harness the power of CodexFlow from within VS Code. 3-stage AI orchestration, 
            intelligent code completion, and inline chat — all in your editor.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="vscode:extension/codexflow.codexflow-agent"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
              </svg>
              Open in VS Code
            </a>
            <a
              href="https://marketplace.visualstudio.com/items?itemName=codexflow.codexflow-agent"
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition border border-slate-700"
            >
              View on Marketplace
            </a>
          </div>

          {/* Extension Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm text-slate-400">CodexFlow Agent</span>
              </div>
              <div className="p-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/logo.svg" alt="CodexFlow" className="w-12 h-12" />
                  <div>
                    <h3 className="text-xl font-bold text-white">CodexFlow</h3>
                    <p className="text-slate-400 text-sm">AI Agent • LiteLLM Gateway</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                  <p className="text-slate-300 text-sm">
                    <span className="text-blue-400">@plan</span> Design a REST API: user registration, login, and profile management
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2 text-slate-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Orchestrator
                  </span>
                  <span className="text-slate-500">default</span>
                  <span className="text-slate-500">✓ 6 auto-approved</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Stage Commands",
                desc: "Use @plan, @code, @review commands to select the right model",
              },
              {
                icon: "💬",
                title: "Inline Chat",
                desc: "Right-click on code to chat with AI",
              },
              {
                icon: "⚡",
                title: "Streaming",
                desc: "Real-time responses, seamless experience",
              },
              {
                icon: "📁",
                title: "Context Aware",
                desc: "Automatically understands open files and project structure",
              },
              {
                icon: "🔄",
                title: "Auto Apply",
                desc: "Automatically apply code changes",
              },
              {
                icon: "📊",
                title: "Usage Tracking",
                desc: "Token usage and cost tracking",
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Installation */}
        <section className="max-w-4xl mx-auto px-4 mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Installation</h2>
          <div className="space-y-6">
            {[
              { step: 1, title: "Install the Extension", desc: "Install CodexFlow Agent from VS Code Marketplace" },
              { step: 2, title: "Get API Key", desc: "Create an API key from CodexFlow Dashboard" },
              { step: 3, title: "Configure", desc: "Enter your API key in extension settings" },
              { step: 4, title: "Start Using", desc: "Open CodexFlow Chat with Cmd+Shift+P" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Get Started Now</h2>
            <p className="text-slate-400 mb-8">
              Experience AI-powered coding with CodexFlow Agent
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="bg-white text-slate-900 px-8 py-3 rounded-xl font-semibold hover:bg-slate-100 transition"
              >
                Create Free Account
              </Link>
              <Link
                href="/docs/vscode"
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Documentation →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
