"use client";

import { useEffect, useState } from "react";
import { api, LogEntry } from "@/lib/api";

export function RecentRequests() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLogs({ limit: 10 })
      .then((data) => setLogs(data.logs))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "plan":
        return "bg-purple-500/20 text-purple-400";
      case "code":
        return "bg-blue-500/20 text-blue-400";
      case "review":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-400";
    if (status >= 400 && status < 500) return "text-yellow-400";
    return "text-red-400";
  };

  if (error) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Requests</h3>
        <p className="text-red-400">Failed to load: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Requests</h3>
      
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="h-6 w-16 bg-slate-700 rounded"></div>
              <div className="h-4 w-32 bg-slate-700 rounded"></div>
              <div className="h-4 w-16 bg-slate-700 rounded ml-auto"></div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-slate-400 text-center py-8">No requests yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                <th className="pb-2">Stage</th>
                <th className="pb-2">Model</th>
                <th className="pb-2">Tokens</th>
                <th className="pb-2">Latency</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Time</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-700/50">
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStageColor(log.stage)}`}>
                      {log.stage.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 text-slate-300">{log.model}</td>
                  <td className="py-2 text-slate-300">{log.totalTokens}</td>
                  <td className="py-2 text-slate-300">{log.latency}ms</td>
                  <td className={`py-2 ${getStatusColor(log.status)}`}>{log.status}</td>
                  <td className="py-2 text-slate-500">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
