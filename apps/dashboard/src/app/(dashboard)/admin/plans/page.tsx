"use client";

import { useState, useEffect } from "react";

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  dailyRequests: number;
  concurrentStreams: number;
  maxTokensPerRequest: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

const defaultPlans: PricingPlan[] = [
  {
    id: "free",
    name: "FREE",
    displayName: "Free",
    description: "Başlangıç için ideal",
    monthlyPrice: 0,
    yearlyPrice: 0,
    dailyRequests: 100,
    concurrentStreams: 1,
    maxTokensPerRequest: 4096,
    features: ["100 günlük istek", "1 eşzamanlı stream", "Temel modeller"],
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "starter",
    name: "STARTER",
    displayName: "Starter",
    description: "Bireysel geliştiriciler için",
    monthlyPrice: 1900,
    yearlyPrice: 19000,
    dailyRequests: 1000,
    concurrentStreams: 2,
    maxTokensPerRequest: 8192,
    features: ["1,000 günlük istek", "2 eşzamanlı stream", "Tüm modeller", "Email destek"],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "pro",
    name: "PRO",
    displayName: "Pro",
    description: "Profesyonel kullanım",
    monthlyPrice: 4900,
    yearlyPrice: 49000,
    dailyRequests: 10000,
    concurrentStreams: 5,
    maxTokensPerRequest: 16384,
    features: ["10,000 günlük istek", "5 eşzamanlı stream", "Öncelikli erişim", "Öncelikli destek"],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "team",
    name: "TEAM",
    displayName: "Team",
    description: "Takımlar için",
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    dailyRequests: 50000,
    concurrentStreams: 10,
    maxTokensPerRequest: 32768,
    features: ["50,000 günlük istek", "10 eşzamanlı stream", "Takım yönetimi", "SLA garantisi"],
    isActive: true,
    sortOrder: 3,
  },
];

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PricingPlan[]>(defaultPlans);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const res = await fetch("/api/admin/plans");
      if (res.ok) {
        const data = await res.json();
        if (data.plans?.length > 0) {
          setPlans(data.plans);
        }
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  }

  async function savePlan(plan: PricingPlan) {
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (res.ok) {
        fetchPlans();
        setEditingPlan(null);
      }
    } catch (error) {
      console.error("Failed to save plan:", error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plan Yönetimi</h1>
          <p className="text-slate-400">Fiyatlandırma planlarını düzenle</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-slate-800/50 border rounded-xl p-6 ${
              plan.isActive ? "border-slate-700" : "border-red-900/50 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{plan.displayName}</h3>
              <span className={`px-2 py-1 text-xs rounded ${
                plan.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}>
                {plan.isActive ? "Aktif" : "Pasif"}
              </span>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-white">
                ${(plan.monthlyPrice / 100).toFixed(0)}
              </span>
              <span className="text-slate-400">/ay</span>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Günlük İstek</span>
                <span className="text-white">{plan.dailyRequests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Eşzamanlı Stream</span>
                <span className="text-white">{plan.concurrentStreams}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Token</span>
                <span className="text-white">{plan.maxTokensPerRequest.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setEditingPlan(plan)}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
            >
              Düzenle
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <PlanEditModal
          plan={editingPlan}
          onSave={savePlan}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}


interface PlanEditModalProps {
  plan: PricingPlan;
  onSave: (plan: PricingPlan) => void;
  onClose: () => void;
}

function PlanEditModal({ plan, onSave, onClose }: PlanEditModalProps) {
  const [editedPlan, setEditedPlan] = useState(plan);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-white mb-4">{plan.displayName} Planını Düzenle</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Görünen Ad</label>
            <input
              type="text"
              value={editedPlan.displayName}
              onChange={(e) => setEditedPlan({ ...editedPlan, displayName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Aylık Fiyat (cent)</label>
              <input
                type="number"
                value={editedPlan.monthlyPrice}
                onChange={(e) => setEditedPlan({ ...editedPlan, monthlyPrice: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Yıllık Fiyat (cent)</label>
              <input
                type="number"
                value={editedPlan.yearlyPrice}
                onChange={(e) => setEditedPlan({ ...editedPlan, yearlyPrice: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Günlük İstek</label>
              <input
                type="number"
                value={editedPlan.dailyRequests}
                onChange={(e) => setEditedPlan({ ...editedPlan, dailyRequests: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Eşzamanlı</label>
              <input
                type="number"
                value={editedPlan.concurrentStreams}
                onChange={(e) => setEditedPlan({ ...editedPlan, concurrentStreams: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Max Token</label>
              <input
                type="number"
                value={editedPlan.maxTokensPerRequest}
                onChange={(e) => setEditedPlan({ ...editedPlan, maxTokensPerRequest: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editedPlan.isActive}
              onChange={(e) => setEditedPlan({ ...editedPlan, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm text-slate-400">Plan Aktif</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg">İptal</button>
          <button onClick={() => onSave(editedPlan)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Kaydet</button>
        </div>
      </div>
    </div>
  );
}
