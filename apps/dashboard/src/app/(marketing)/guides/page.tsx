import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function GuidesPage() {
  const guides = [
    {
      category: "Getting Started",
      items: [
        { title: "Introduction to CodexFlow", desc: "Basic platform overview", time: "5 min", href: "/guides/intro" },
        { title: "Your First API Call", desc: "Step-by-step first request", time: "10 min", href: "/guides/first-call" },
        { title: "Stage Selection", desc: "When to use PLAN, CODE, REVIEW", time: "8 min", href: "/guides/stages" },
      ],
    },
    {
      category: "Integration",
      items: [
        { title: "VS Code Setup", desc: "CodexFlow Agent installation", time: "15 min", href: "/guides/vscode" },
        { title: "Python Integration", desc: "Using CodexFlow with OpenAI SDK", time: "10 min", href: "/guides/python" },
        { title: "Node.js Integration", desc: "JavaScript/TypeScript projects", time: "10 min", href: "/guides/nodejs" },
      ],
    },
    {
      category: "Advanced",
      items: [
        { title: "Streaming Optimization", desc: "Performance tuning with SSE", time: "12 min", href: "/guides/streaming" },
        { title: "Cost Optimization", desc: "Save money with smart model selection", time: "15 min", href: "/guides/cost" },
        { title: "Error Handling", desc: "Error management best practices", time: "10 min", href: "/guides/errors" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Guides</h1>
            <p className="text-xl text-slate-400">Learn step by step, get started quickly</p>
          </div>

          <div className="space-y-12">
            {guides.map((section) => (
              <div key={section.category}>
                <h2 className="text-2xl font-bold text-white mb-6">{section.category}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {section.items.map((guide) => (
                    <Link
                      key={guide.title}
                      href={guide.href}
                      className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-500 text-sm">📖 Guide</span>
                        <span className="text-slate-500 text-sm">{guide.time}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition mb-2">
                        {guide.title}
                      </h3>
                      <p className="text-slate-400 text-sm">{guide.desc}</p>
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
