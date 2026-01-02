export function HowItWorksSection() {
  const stages = [
    {
      stage: "PLAN",
      model: "Claude Sonnet 4.5",
      color: "blue",
      icon: "📋",
      description: "Architecture decisions, specifications, and design documents. Uses premium reasoning for complex planning tasks.",
      examples: ["System design", "API specifications", "Architecture decisions"],
    },
    {
      stage: "CODE",
      model: "DeepSeek V3",
      color: "green",
      icon: "💻",
      description: "Code generation, implementation, and refactoring. Optimized for high-quality code at lower cost.",
      examples: ["Write functions", "Implement features", "Refactor code"],
    },
    {
      stage: "REVIEW",
      model: "GPT-4o-mini",
      color: "purple",
      icon: "🔍",
      description: "Code review, security analysis, and validation. Fast and economical for review tasks.",
      examples: ["Code review", "Security audit", "Bug detection"],
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">3-Stage Routing</span> Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Each stage uses the optimal model for its specific task, maximizing quality while minimizing cost.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {stages.map((stage, index) => (
            <div key={stage.stage} className="relative">
              {/* Connector line */}
              {index < stages.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-slate-600 to-slate-700" />
              )}
              
              <div className={`bg-slate-800/50 border border-slate-700 rounded-2xl p-8 h-full hover:border-${stage.color}-500/50 transition`}>
                {/* Stage badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 bg-${stage.color}-500/10 text-${stage.color}-400 border border-${stage.color}-500/20`}>
                  <span>{stage.icon}</span>
                  <span>{stage.stage}</span>
                </div>

                {/* Model */}
                <h3 className="text-2xl font-bold text-white mb-2">{stage.model}</h3>
                
                {/* Description */}
                <p className="text-slate-400 mb-6">{stage.description}</p>

                {/* Examples */}
                <div className="space-y-2">
                  <p className="text-sm text-slate-500 font-medium">Best for:</p>
                  <ul className="space-y-2">
                    {stage.examples.map((example) => (
                      <li key={example} className="flex items-center gap-2 text-slate-300">
                        <svg className={`w-4 h-4 text-${stage.color}-400`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Flow diagram */}
        <div className="mt-16 bg-slate-800/30 border border-slate-700 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center text-2xl mb-2">📝</div>
              <p className="text-sm text-slate-400">Your Request</p>
            </div>
            <svg className="w-8 h-8 text-slate-600 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-2xl mb-2">🧠</div>
              <p className="text-sm text-slate-400">CodexFlow Router</p>
            </div>
            <svg className="w-8 h-8 text-slate-600 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center text-2xl mb-2">🤖</div>
              <p className="text-sm text-slate-400">Optimal Model</p>
            </div>
            <svg className="w-8 h-8 text-slate-600 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center text-2xl mb-2">✨</div>
              <p className="text-sm text-slate-400">Best Result</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
