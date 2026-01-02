"use client";

import { useEffect, useState } from "react";
import { api, LogEntry } from "@/lib/api";

export default function DashboardLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    api.getLogs({ limit, offset: page * limit, stage: stage || undefined })
      .then((data) => { setLogs(data.logs); setTotal(data.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [stage, page]);

  const getStageColor = (s: string) => {
    switch (s) {
      case "plan": return "bg-purple-500/20 text-purple-400";
      case "code": return "bg-blue-500/20 text-blue-400";
      case "review": return "bg-green-500/20 text-green-400";
      default: return "bg-slate-500/20 text-slate-400";
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-400";
    if (status >= 400 && status < 500) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">İstek Logları</h1>
          <p className="text-slate-400">API isteklerinizi izleyin</p>
        </div>
        <select value={stage} onChange={(e) => { setStage(e.target.value); setPage(0); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white">
          <option value="">Tüm Aşamalar</option>
          <option value="plan">PLAN</option>
          <option value="code">CODE</option>
          <option value="review">REVIEW</option>
          <option value="direct">DIRECT</option>
        </select>
      </div>

      {error ? (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-red-400">Loglar yüklenemedi: {error}</div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Request ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Aşama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Model</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Maliyet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Gecikme</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Durum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Zaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Yükleniyor...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Log bulunamadı</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{log.id.slice(0, 16)}...</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStageColor(log.stage)}`}>{log.stage.toUpperCase()}</span></td>
                    <td className="px-4 py-3 text-slate-300">{log.model}</td>
                    <td className="px-4 py-3 text-slate-300">{log.totalTokens.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-300">${log.cost.toFixed(6)}</td>
                    <td className="px-4 py-3 text-slate-300">{log.latency}ms</td>
                    <td className={`px-4 py-3 ${getStatusColor(log.status)}`}>{log.status}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString("tr-TR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <span className="text-sm text-slate-400">Gösterilen {page * limit + 1}-{Math.min((page + 1) * limit, total)} / {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50 text-white">Önceki</button>
              <button onClick={() => setPage(page + 1)} disabled={(page + 1) * limit >= total} className="px-3 py-1 bg-slate-700 rounded disabled:opacity-50 text-white">Sonraki</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
