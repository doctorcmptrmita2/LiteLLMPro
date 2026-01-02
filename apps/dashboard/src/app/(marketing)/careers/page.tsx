import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function CareersPage() {
  const openings = [
    {
      title: "Senior Backend Engineer",
      team: "Platform",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Frontend Developer",
      team: "Dashboard",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "DevOps Engineer",
      team: "Infrastructure",
      location: "Remote",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Careers</h1>
            <p className="text-xl text-slate-400">Let's build the future of AI together</p>
          </div>

          {/* Why Join */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Why CodexFlow?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: "🌍", title: "Remote-First", desc: "Work from anywhere in the world" },
                { icon: "📈", title: "Growth", desc: "Be part of a fast-growing startup" },
                { icon: "🎯", title: "Impact", desc: "Touch the lives of thousands of developers" },
                { icon: "💡", title: "Innovation", desc: "Work with cutting-edge AI technologies" },
              ].map((item) => (
                <div key={item.title} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <span className="text-3xl mb-3 block">{item.icon}</span>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Open Positions */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Open Positions</h2>
            {openings.length > 0 ? (
              <div className="space-y-4">
                {openings.map((job) => (
                  <div key={job.title} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                          <span>{job.team}</span>
                          <span>•</span>
                          <span>{job.location}</span>
                          <span>•</span>
                          <span>{job.type}</span>
                        </div>
                      </div>
                      <a href={`mailto:careers@codexflow.dev?subject=${job.title}`} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
                        Apply
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                <p className="text-slate-400">No open positions at the moment.</p>
                <p className="text-slate-500 text-sm mt-2">Feel free to send your CV anyway!</p>
              </div>
            )}
          </section>

          {/* Contact */}
          <section className="mt-16 text-center">
            <p className="text-slate-400">
              Can't find the position you're looking for?{" "}
              <a href="mailto:careers@codexflow.dev" className="text-blue-400 hover:text-blue-300">
                careers@codexflow.dev
              </a>
              {" "}— send us your CV.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
