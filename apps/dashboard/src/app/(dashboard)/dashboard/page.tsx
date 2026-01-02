import { StatsCards } from "@/components/StatsCards";
import { UsageChart } from "@/components/UsageChart";
import { RecentRequests } from "@/components/RecentRequests";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Monitor your AI usage and performance</p>
      </div>

      <StatsCards />

      <div className="grid lg:grid-cols-2 gap-6">
        <UsageChart />
        <RecentRequests />
      </div>
    </div>
  );
}
