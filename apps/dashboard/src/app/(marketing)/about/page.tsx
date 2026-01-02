import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Redefining the
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> AI Coding Experience</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              CodexFlow is a 3-stage orchestration platform that enables developers to use AI models 
              more intelligently and efficiently.
            </p>
          </div>

          {/* Mission */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Our Mission</h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
              <p className="text-lg text-slate-300 leading-relaxed">
                Every developer should be able to use the optimal AI model for each task. 
                Powerful reasoning for planning, fast and economical for coding, 
                reliable models for review. CodexFlow makes this selection automatically, 
                increasing quality while reducing costs by up to 70%.
              </p>
            </div>
          </section>

          {/* Values */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "🎯", title: "Simplicity", desc: "We reduced complex AI infrastructure to a single API" },
                { icon: "⚡", title: "Performance", desc: "Millisecond-level routing, seamless streaming" },
                { icon: "💰", title: "Efficiency", desc: "Maximum value through smart model selection" },
              ].map((value) => (
                <div key={value.title} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                  <span className="text-4xl mb-4 block">{value.icon}</span>
                  <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-slate-400 text-sm">{value.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tech Stack */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Technology</h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: "FastAPI", desc: "Backend" },
                  { name: "Next.js", desc: "Dashboard" },
                  { name: "PostgreSQL", desc: "Database" },
                  { name: "LiteLLM", desc: "AI Gateway" },
                ].map((tech) => (
                  <div key={tech.name} className="text-center">
                    <p className="text-white font-semibold">{tech.name}</p>
                    <p className="text-slate-500 text-sm">{tech.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="text-center">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
              <p className="text-slate-400 mb-6">We're always here for your questions or suggestions.</p>
              <a href="/contact" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition">
                Contact Us
              </a>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
