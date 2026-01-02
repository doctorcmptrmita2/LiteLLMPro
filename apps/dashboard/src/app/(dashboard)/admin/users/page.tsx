"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  plan: string;
  createdAt: string;
  _count?: { apiKeys: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(userId: string, updates: Partial<User>) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesPlan = planFilter === "ALL" || user.plan === planFilter;
    return matchesSearch && matchesRole && matchesPlan;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Kullanıcı Yönetimi</h1>
          <p className="text-slate-400">Tüm kullanıcıları görüntüle ve yönet</p>
        </div>
        <div className="text-sm text-slate-400">
          Toplam: {users.length} kullanıcı
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Email veya isim ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Tüm Roller</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Tüm Planlar</option>
          <option value="FREE">Free</option>
          <option value="STARTER">Starter</option>
          <option value="PRO">Pro</option>
          <option value="TEAM">Team</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Kullanıcı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">API Keys</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Kayıt</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Yükleniyor...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Kullanıcı bulunamadı
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} onUpdate={updateUser} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function UserRow({ user, onUpdate }: { user: User; onUpdate: (id: string, updates: Partial<User>) => void }) {
  const [showMenu, setShowMenu] = useState(false);

  const roleColors: Record<string, string> = {
    USER: "bg-slate-500/20 text-slate-400",
    ADMIN: "bg-purple-500/20 text-purple-400",
    SUPER_ADMIN: "bg-red-500/20 text-red-400",
  };

  const planColors: Record<string, string> = {
    FREE: "bg-slate-500/20 text-slate-400",
    STARTER: "bg-blue-500/20 text-blue-400",
    PRO: "bg-green-500/20 text-green-400",
    TEAM: "bg-purple-500/20 text-purple-400",
    ENTERPRISE: "bg-orange-500/20 text-orange-400",
  };

  return (
    <tr className="hover:bg-slate-800/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">{user.name?.charAt(0) || user.email.charAt(0)}</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">{user.name || "İsimsiz"}</p>
            <p className="text-slate-400 text-xs">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs rounded ${roleColors[user.role]}`}>{user.role}</span>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs rounded ${planColors[user.plan]}`}>{user.plan}</span>
      </td>
      <td className="px-6 py-4 text-sm text-slate-400">{user._count?.apiKeys || 0}</td>
      <td className="px-6 py-4 text-sm text-slate-400">
        {new Date(user.createdAt).toLocaleDateString("tr-TR")}
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
              <button
                onClick={() => { onUpdate(user.id, { role: "ADMIN" }); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
              >
                Admin Yap
              </button>
              <button
                onClick={() => { onUpdate(user.id, { plan: "PRO" }); setShowMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
              >
                Pro Plan Ver
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
