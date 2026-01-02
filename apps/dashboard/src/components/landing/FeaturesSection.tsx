export function FeaturesSection() {
  const features = [
    {
      icon: "🎯",
      title: "Intelligent Routing",
      description: "Automatically selects the optimal AI model based on your task type. No manual switching needed.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: "💰",
      title: "Cost Optimization",
      description: "Save up to 70% on AI costs by using the right model for each task. Premium for planning, efficient for coding.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: "⚡",
      title: "OpenAI Compatible",
      description: "Drop-in replacement for OpenAI API. Just change your base URL and you're ready to go.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: "🔒",
      title: "Enterprise Security",
      description: "SOC2 compliant, encrypted at rest and in transit. Your code never leaves our secure infrastructure.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: "📊",
      title: "Real-time Analytics",
      description: "Monitor usage, costs, and performance in real-time. Detailed logs for every request.",
      color: "from-red-500 to-rose-500",
    },
    {
      icon: "🔄",
      title: "Automatic Fallbacks",
      description: "Built-in circuit breaker and fallback models ensure 99.9% uptime even during provider outages.",
      color: "from-indigo-500 to-violet-500",
    },
  ];

  return (
    <section id="features" className="py-24 px-4 bg-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need for
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> AI-Powered Development</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            A complete platform for intelligent AI orchestration, built for developers who demand the best.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-slate-600 transition-all hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-6`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
