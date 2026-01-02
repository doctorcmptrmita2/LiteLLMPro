"use client";

import { useState } from "react";

export default function BillingPage() {
  const [currentPlan] = useState("FREE");

  const plans = [
    { name: "FREE", displayName: "Free", price: 0, features: ["100 günlük istek", "1 eşzamanlı stream", "Temel modeller"] },
    { name: "STARTER", displayName: "Starter", price: 19, features: ["1,000 günlük istek", "2 eşzamanlı stream", "Tüm modeller", "Email destek"] },
    { name: "PRO", displayName: "Pro", price: 49, features: ["10,000 günlük istek", "5 eşzamanlı stream", "Öncelikli erişim", "Öncelikli destek"], popular: true },
    { name: "TEAM", displayName: "Team", price: 99, features: ["50,000 günlük istek", "10 eşzamanlı stream", "Takım yönetimi", "SLA garantisi"] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Faturalandırma</h1>
        <p className="text-slate-400">Abonelik planınızı yönetin</p>
      </div>

      {/* Current Plan */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Mevcut Plan</h2>
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-blue-400">{currentPlan}</span>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Aktif</span>
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-slate-800/50 border rounded-xl p-6 ${
              plan.popular ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-700"
            } ${currentPlan === plan.name ? "ring-2 ring-green-500/20 border-green-500" : ""}`}
          >
            {plan.popular && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full mb-4 inline-block">
                Popüler
              </span>
            )}
            <h3 className="text-lg font-semibold text-white">{plan.displayName}</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold text-white">${plan.price}</span>
              <span className="text-slate-400">/ay</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled={currentPlan === plan.name}
              className={`w-full py-2 rounded-lg font-medium transition ${
                currentPlan === plan.name
                  ? "bg-green-600/20 text-green-400 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {currentPlan === plan.name ? "Mevcut Plan" : "Yükselt"}
            </button>
          </div>
        ))}
      </div>

      {/* Payment History */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Ödeme Geçmişi</h2>
        <p className="text-slate-400 text-sm">Henüz ödeme kaydı bulunmuyor.</p>
      </div>
    </div>
  );
}
