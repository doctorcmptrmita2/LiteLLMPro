import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function ChangelogPage() {
  const releases = [
    {
      version: "1.2.0",
      date: "January 2, 2026",
      tag: "latest",
      changes: [
        { type: "feature", text: "Added Admin Panel - user and plan management" },
        { type: "feature", text: "Added billing page to Dashboard" },
        { type: "feature", text: "Added audit log system" },
        { type: "improvement", text: "Redesigned landing page" },
        { type: "fix", text: "Fixed rate limit calculation bug" },
      ],
    },
    {
      version: "1.1.0",
      date: "December 28, 2025",
      changes: [
        { type: "feature", text: "OpenRouter integration - all models with single provider" },
        { type: "feature", text: "Dashboard API integration - real data" },
        { type: "improvement", text: "Improved SSE streaming performance" },
        { type: "fix", text: "Fixed circuit breaker timeout issue" },
      ],
    },
    {
      version: "1.0.0",
      date: "December 20, 2025",
      changes: [
        { type: "feature", text: "First stable release 🎉" },
        { type: "feature", text: "3-Stage routing (PLAN/CODE/REVIEW)" },
        { type: "feature", text: "OpenAI-compatible API endpoints" },
        { type: "feature", text: "API key authentication" },
        { type: "feature", text: "Rate limiting and usage tracking" },
        { type: "feature", text: "Dashboard for usage monitoring" },
      ],
    },
    {
      version: "0.9.0-beta",
      date: "December 10, 2025",
      changes: [
        { type: "feature", text: "Beta version released" },
        { type: "feature", text: "LiteLLM proxy integration" },
        { type: "feature", text: "Fallback chain support" },
      ],
    },
  ];

  const typeColors: Record<string, string> = {
    feature: "bg-green-500/20 text-green-400",
    improvement: "bg-blue-500/20 text-blue-400",
    fix: "bg-orange-500/20 text-orange-400",
    breaking: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Changelog</h1>
            <p className="text-xl text-slate-400">CodexFlow Platform updates and new features</p>
          </div>

          <div className="space-y-12">
            {releases.map((release) => (
              <div key={release.version} className="relative pl-8 border-l-2 border-slate-800">
                <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full" />
                
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-2xl font-bold text-white">v{release.version}</h2>
                  {release.tag && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                      {release.tag}
                    </span>
                  )}
                  <span className="text-slate-500">{release.date}</span>
                </div>

                <ul className="space-y-3">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[change.type]}`}>
                        {change.type}
                      </span>
                      <span className="text-slate-300">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
