"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    // TODO: Implement save
    setTimeout(() => {
      setMessage("Ayarlar kaydedildi!");
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }, 1000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
        <p className="text-slate-400">Hesap ayarlarınızı yönetin</p>
      </div>

      {message && (
        <div className="bg-green-500/20 text-green-400 p-4 rounded-lg">{message}</div>
      )}

      {/* Profile Settings */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Profil Bilgileri</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-slate-400 mb-2">İsim</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Şifre Değiştir</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Mevcut Şifre</label>
            <input type="password" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Yeni Şifre</label>
            <input type="password" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Yeni Şifre (Tekrar)</label>
            <input type="password" className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white" />
          </div>
          <button className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
            Şifreyi Değiştir
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-4">Tehlikeli Bölge</h2>
        <p className="text-slate-400 text-sm mb-4">
          Hesabınızı silmek geri alınamaz bir işlemdir. Tüm verileriniz kalıcı olarak silinecektir.
        </p>
        <button className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
          Hesabı Sil
        </button>
      </div>
    </div>
  );
}
