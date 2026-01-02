"use client";

import { useState, useEffect } from "react";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
}

const defaultSettings: SiteSettings = {
  siteName: "CodexFlow Platform",
  siteDescription: "3-Stage AI Orchestration Platform",
  siteKeywords: "AI, LLM, API, Claude, GPT, DeepSeek",
  maintenanceMode: false,
  registrationEnabled: true,
  cacheEnabled: true,
  cacheTTL: 3600,
};

export default function AdminSystemPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage("Ayarlar kaydedildi!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Hata oluştu!");
    } finally {
      setSaving(false);
    }
  }

  async function clearCache() {
    try {
      const res = await fetch("/api/admin/cache", { method: "DELETE" });
      if (res.ok) {
        setMessage("Cache temizlendi!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Cache temizlenemedi!");
    }
  }

  if (loading) {
    return <div className="text-slate-400">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Sistem Ayarları</h1>
        <p className="text-slate-400">SEO, cache ve genel sistem ayarları</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes("Hata") ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
          {message}
        </div>
      )}

      {/* SEO Settings */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">🔍 SEO Ayarları</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Site Adı</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Site Açıklaması</label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Anahtar Kelimeler</label>
            <input
              type="text"
              value={settings.siteKeywords}
              onChange={(e) => setSettings({ ...settings, siteKeywords: e.target.value })}
              placeholder="AI, LLM, API, ..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* System Controls */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">⚙️ Sistem Kontrolleri</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-700">
            <div>
              <p className="text-white font-medium">Bakım Modu</p>
              <p className="text-slate-400 text-sm">Siteyi geçici olarak kapatır</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`relative w-14 h-7 rounded-full transition ${
                settings.maintenanceMode ? "bg-red-500" : "bg-slate-600"
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${
                settings.maintenanceMode ? "left-8" : "left-1"
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-700">
            <div>
              <p className="text-white font-medium">Kayıt Aktif</p>
              <p className="text-slate-400 text-sm">Yeni kullanıcı kaydına izin ver</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })}
              className={`relative w-14 h-7 rounded-full transition ${
                settings.registrationEnabled ? "bg-green-500" : "bg-slate-600"
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${
                settings.registrationEnabled ? "left-8" : "left-1"
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Cache Settings */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">💾 Cache Ayarları</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-700">
            <div>
              <p className="text-white font-medium">Cache Aktif</p>
              <p className="text-slate-400 text-sm">API yanıtlarını önbelleğe al</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, cacheEnabled: !settings.cacheEnabled })}
              className={`relative w-14 h-7 rounded-full transition ${
                settings.cacheEnabled ? "bg-green-500" : "bg-slate-600"
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${
                settings.cacheEnabled ? "left-8" : "left-1"
              }`} />
            </button>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Cache TTL (saniye)</label>
            <input
              type="number"
              value={settings.cacheTTL}
              onChange={(e) => setSettings({ ...settings, cacheTTL: parseInt(e.target.value) || 3600 })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
          >
            Cache Temizle
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
        >
          {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </button>
      </div>
    </div>
  );
}
