"use client";

import { useState, useEffect } from "react";

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/admin/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = actionFilter === "ALL" 
    ? logs 
    : logs.filter(log => log.action === actionFilter);

  const actionColors: Record<string, string> = {
    CREATE: "bg-green-500/20 text-green-400",
    UPDATE: "bg-blue-500/20 text-blue-400",
    DELETE: "bg-red-500/20 text-red-400",
    LOGIN: "bg-purple-500/20 text-purple-400",
    LOGOUT: "bg-slate-500/20 text-slate-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400">Sistem aktivitelerini izle</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          <option value="ALL">Tüm İşlemler</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
        </select>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
        >
          Yenile
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Zaman</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">İşlem</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Kaynak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">IP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Yükleniyor...</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Log bulunamadı</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 text-sm text-slate-300">
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${actionColors[log.action] || "bg-slate-500/20 text-slate-400"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{log.resource}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{log.ipAddress || "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {log.details ? JSON.stringify(log.details).slice(0, 50) : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
