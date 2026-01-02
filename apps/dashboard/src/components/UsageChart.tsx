"use client";

import { useEffect, useState } from "react";
import { api, UsageData } from "@/lib/api";

export function UsageChart() {
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getUsage(7)
      .then((data) => setUsage(data.usage))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Usage (Last 7 Days)</h3>
        <p className="text-red-400">Failed to load: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Usage (Last 7 Days)</h3>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const maxRequests = Math.max(...usage.map((d) => d.requests), 1);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Usage (Last 7 Days)</h3>
      
      {usage.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No usage data yet</p>
      ) : (
        <div className="space-y-4">
          {/* Simple bar chart */}
          <div className="flex items-end gap-2 h-48">
            {usage.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all"
                  style={{
                    height: `${(day.requests / maxRequests) * 100}%`,
                    minHeight: day.requests > 0 ? "4px" : "0",
                  }}
                ></div>
                <span className="text-xs text-slate-500 mt-2">
                  {new Date(day.date).toLocaleDateString("en", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
            <div>
              <p className="text-slate-400 text-xs">Total Requests</p>
              <p className="text-white font-semibold">
                {usage.reduce((sum, d) => sum + d.requests, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Cost</p>
              <p className="text-white font-semibold">
                ${usage.reduce((sum, d) => sum + d.cost, 0).toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Tokens</p>
              <p className="text-white font-semibold">
                {usage.reduce((sum, d) => sum + d.tokens, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
