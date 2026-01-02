"use client";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function StatusPage() {
  const services = [
    { name: "API Gateway", status: "operational", uptime: "99.99%" },
    { name: "Dashboard", status: "operational", uptime: "99.95%" },
    { name: "Authentication", status: "operational", uptime: "99.99%" },
    { name: "Database", status: "operational", uptime: "99.99%" },
    { name: "LiteLLM Proxy", status: "operational", uptime: "99.90%" },
  ];

  const incidents = [
    {
      date: "December 28, 2025",
      title: "API Gateway Slowdown",
      status: "resolved",
      desc: "Temporary slowdown due to high traffic. Resolved with scaling.",
    },
    {
      date: "December 15, 2025",
      title: "Scheduled Maintenance",
      status: "completed",
      desc: "30-minute maintenance window for database optimization.",
    },
  ];

  const statusColors: Record<string, string> = {
    operational: "bg-green-500",
    degraded: "bg-yellow-500",
    outage: "bg-red-500",
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Overall Status */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-full px-6 py-3 mb-6">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 font-semibold">All Systems Operational</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">System Status</h1>
            <p className="text-slate-400">Last updated: {new Date().toLocaleString("en-US")}</p>
          </div>

          {/* Services */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Services</h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              {services.map((service, i) => (
                <div
                  key={service.name}
                  className={`flex items-center justify-between p-4 ${
                    i !== services.length - 1 ? "border-b border-slate-800" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${statusColors[service.status]}`} />
                    <span className="text-white font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 text-sm">{service.uptime} uptime</span>
                    <span className="text-green-400 text-sm capitalize">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Uptime Chart Placeholder */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Last 90 Days</h2>
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex gap-1">
                {Array.from({ length: 90 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-8 rounded-sm ${
                      Math.random() > 0.02 ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    title={`${90 - i} days ago`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-sm text-slate-500">
                <span>90 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </section>

          {/* Incidents */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Recent Incidents</h2>
            {incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div
                    key={incident.title}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        incident.status === "resolved" || incident.status === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {incident.status === "resolved" ? "Resolved" : "Completed"}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{incident.desc}</p>
                    <span className="text-slate-500 text-sm">{incident.date}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
                <span className="text-4xl mb-4 block">✨</span>
                <p className="text-slate-400">No incidents in the last 90 days.</p>
              </div>
            )}
          </section>

          {/* Subscribe */}
          <section className="mt-12">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Stay Updated</h3>
              <p className="text-slate-400 text-sm mb-4">
                Get email notifications when system status changes.
              </p>
              <div className="flex max-w-md mx-auto gap-2">
                <input
                  type="email"
                  placeholder="email@example.com"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                />
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
                  Subscribe
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
