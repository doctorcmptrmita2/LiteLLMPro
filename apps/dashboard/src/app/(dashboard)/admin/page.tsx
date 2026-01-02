import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    redirect("/dashboard");
  }

  const adminCards = [
    {
      title: "Users",
      description: "Manage users, approve accounts, change plans",
      href: "/admin/users",
      icon: "👥",
      stats: "1,234 users",
      color: "blue",
    },
    {
      title: "Plans & Pricing",
      description: "Configure subscription plans and pricing",
      href: "/admin/plans",
      icon: "📦",
      stats: "4 plans",
      color: "green",
    },
    {
      title: "System Settings",
      description: "SEO, cache, maintenance mode",
      href: "/admin/system",
      icon: "🖥️",
      stats: "All systems operational",
      color: "purple",
    },
    {
      title: "Audit Logs",
      description: "View system activity and changes",
      href: "/admin/audit",
      icon: "📋",
      stats: "Last 24h: 156 events",
      color: "orange",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-slate-400">Manage your CodexFlow platform</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: "1,234", change: "+12%" },
          { label: "Active Subscriptions", value: "456", change: "+8%" },
          { label: "Revenue (MTD)", value: "$12,345", change: "+23%" },
          { label: "API Calls (Today)", value: "45.2K", change: "+5%" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-green-400 text-sm mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Admin Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {adminCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-3xl">{card.icon}</span>
                <h3 className="text-lg font-semibold text-white mt-3">{card.title}</h3>
                <p className="text-slate-400 text-sm mt-1">{card.description}</p>
                <p className="text-slate-500 text-sm mt-3">{card.stats}</p>
              </div>
              <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { action: "New user registered", user: "john@example.com", time: "2 minutes ago" },
            { action: "Plan upgraded to Pro", user: "jane@example.com", time: "15 minutes ago" },
            { action: "API key created", user: "dev@company.com", time: "1 hour ago" },
            { action: "User account suspended", user: "spam@test.com", time: "2 hours ago" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
              <div>
                <p className="text-white text-sm">{activity.action}</p>
                <p className="text-slate-500 text-xs">{activity.user}</p>
              </div>
              <span className="text-slate-500 text-xs">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
