import Link from "next/link";

export function ExtensionSection() {
  return (
    <section id="extension" className="py-24 px-4 bg-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span>🔌</span>
              <span>VS Code Extension</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                CodeFlow Agent
              </span>
              <br />
              <span className="text-white">for VS Code</span>
            </h2>
            
            <p className="text-xl text-slate-400 mb-8">
              Bring the power of 3-stage AI orchestration directly into your IDE. 
              Plan, code, and review without leaving VS Code.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                "Automatic stage detection from context",
                "Inline code suggestions and completions",
                "One-click code review and security analysis",
                "Integrated chat with project context",
                "Git-aware suggestions",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-slate-300">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="https://marketplace.visualstudio.com"
                target="_blank"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.583 2.207L9.5 9.5l-5.5-4.5L2 6.5v11l2-1.5 5.5-4.5 8.083 7.293L22 17V7l-4.417-4.793zM4 14.5v-5l3.5 2.5L4 14.5zm13.5 2.5l-6-5 6-5v10z"/>
                </svg>
                Install Extension
              </Link>
              <Link
                href="/docs/extension"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition border border-slate-700"
              >
                View Documentation
              </Link>
            </div>
          </div>

          {/* VS Code Preview */}
          <div className="relative">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
              {/* VS Code title bar */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-sm text-slate-400 ml-2">CodeFlow Agent - VS Code</span>
              </div>
              
              {/* VS Code content */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-12 bg-slate-800/50 border-r border-slate-700 py-4 flex flex-col items-center gap-4">
                  <div className="w-6 h-6 text-slate-500">📁</div>
                  <div className="w-6 h-6 text-slate-500">🔍</div>
                  <div className="w-6 h-6 text-blue-400">🤖</div>
                  <div className="w-6 h-6 text-slate-500">⚙️</div>
                </div>
                
                {/* Main content */}
                <div className="flex-1 p-4">
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">CODE</span>
                      <span className="text-sm text-slate-400">Using DeepSeek V3</span>
                    </div>
                    <p className="text-slate-300 text-sm">
                      Generate a React component for user authentication with form validation...
                    </p>
                  </div>
                  
                  <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm">
                    <div className="text-purple-400">export function</div>
                    <div className="text-blue-400 ml-2">AuthForm() &#123;</div>
                    <div className="text-slate-400 ml-4">// Generated code...</div>
                    <div className="text-blue-400 ml-2">&#125;</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
