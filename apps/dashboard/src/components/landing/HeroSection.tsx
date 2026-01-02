"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-slate-300">Now with Claude Sonnet 4.5 Support</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            3-Stage AI Orchestration
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            for Intelligent Coding
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10">
          Automatically route your AI requests to the best model for each task.
          <span className="text-blue-400"> Plan</span> with Claude,
          <span className="text-green-400"> Code</span> with DeepSeek,
          <span className="text-purple-400"> Review</span> with GPT-4o-mini.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg shadow-blue-600/25"
          >
            Start Free Trial
          </Link>
          <Link
            href="#how-it-works"
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition border border-slate-700"
          >
            See How It Works
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { value: "99.9%", label: "Uptime" },
            { value: "<100ms", label: "Routing Latency" },
            { value: "70%", label: "Cost Savings" },
            { value: "10K+", label: "API Calls/Day" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Code Preview */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-sm text-slate-400">OpenAI-Compatible API</span>
            </div>
            <pre className="p-6 text-left overflow-x-auto">
              <code className="text-sm">
                <span className="text-slate-500"># Just change your base URL - that&apos;s it!</span>{"\n"}
                <span className="text-purple-400">curl</span> <span className="text-blue-400">-X POST</span> https://api.codexflow.dev/v1/chat/completions \{"\n"}
                {"  "}<span className="text-blue-400">-H</span> <span className="text-green-400">&quot;Authorization: Bearer $API_KEY&quot;</span> \{"\n"}
                {"  "}<span className="text-blue-400">-H</span> <span className="text-green-400">&quot;X-CFX-Stage: code&quot;</span> \{"\n"}
                {"  "}<span className="text-blue-400">-d</span> <span className="text-yellow-400">&apos;&#123;&quot;model&quot;: &quot;auto&quot;, &quot;messages&quot;: [...]&#125;&apos;</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
