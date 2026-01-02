"use client";

import { useEffect, useState } from "react";
import { api, ApiKey } from "@/lib/api";

export default function DashboardKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");

  const loadKeys = () => {
    setLoading(true);
    api.getKeys()
      .then((data) => setKeys(data.keys))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await api.createKey(label || undefined);
      setNewKey(result.key);
      setLabel("");
      loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Bu anahtarı iptal etmek istediğinize emin misiniz?")) return;
    try {
      await api.revokeKey(keyId);
      loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke key");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">API Anahtarları</h1>
        <p className="text-slate-400">API anahtarlarınızı yönetin</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Kapat</button>
        </div>
      )}

      {newKey && (
        <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
          <p className="text-green-400 font-semibold mb-2">Yeni API Anahtarı Oluşturuldu!</p>
          <p className="text-slate-300 text-sm mb-2">Bu anahtarı şimdi kopyalayın. Tekrar gösterilmeyecek.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-800 px-4 py-2 rounded font-mono text-sm break-all text-white">{newKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(newKey); alert("Kopyalandı!"); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white">Kopyala</button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-3 text-sm text-slate-400 underline">Anahtarımı kaydettim</button>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Yeni Anahtar Oluştur</h2>
        <div className="flex gap-4">
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Anahtar etiketi (opsiyonel)" className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white" />
          <button onClick={handleCreate} disabled={creating} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 text-white">{creating ? "Oluşturuluyor..." : "Oluştur"}</button>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Prefix</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Etiket</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Durum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Oluşturulma</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Son Kullanım</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Yükleniyor...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Henüz API anahtarı yok</td></tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-white">{key.prefix}...</td>
                  <td className="px-4 py-3 text-slate-300">{key.label}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${key.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{key.status === "active" ? "Aktif" : "İptal"}</span></td>
                  <td className="px-4 py-3 text-slate-400">{new Date(key.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td className="px-4 py-3 text-slate-400">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString("tr-TR") : "Hiç"}</td>
                  <td className="px-4 py-3">{key.status === "active" && <button onClick={() => handleRevoke(key.id)} className="text-red-400 hover:text-red-300 text-sm">İptal Et</button>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
