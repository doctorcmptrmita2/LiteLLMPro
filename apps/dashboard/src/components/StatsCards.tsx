"use client";

import { useEffect, useState } from "react";
import { api, Stats } from "@/lib/api";

type ChangeType = "positive" | "negative" | "neutral";

interface CardData {
  title: string;
  value: string;
  change: string;
  changeType: ChangeType;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 text-red-400">
        Failed to load stats: {error}
      </div>
    );
  }

  const cards: CardData[] = stats ? [
    {
      title: "Total Requests",
      value: stats.totalRequests.toLocaleString(),
      change: "All time",
      changeType: "neutral",
    },
    {
      title: "Today's Requests",
      value: `${stats.todayRequests.toLocaleString()} / ${stats.dailyLimit.toLocaleString()}`,
      change: `${Math.round((stats.todayRequests / stats.dailyLimit) * 100)}% used`,
      changeType: stats.todayRequests > stats.dailyLimit * 0.8 ? "negative" : "positive",
    },
    {
      title: "Total Cost",
      value: `$${stats.totalCost.toFixed(4)}`,
      change: "All time",
      changeType: "neutral",
    },
    {
      title: "Avg Latency",
      value: `${stats.avgLatency}ms`,
      change: stats.avgLatency < 2000 ? "Good" : "Slow",
      changeType: stats.avgLatency < 2000 ? "positive" : "negative",
    },
  ] : [];

  const getChangeColor = (type: ChangeType): string => {
    switch (type) {
      case "positive":
        return "text-green-400";
      case "negative":
        return "text-red-400";
      default:
        return "text-slate-500";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
            <div className="h-8 bg-slate-700 rounded w-32 mb-1"></div>
            <div className="h-4 bg-slate-700 rounded w-16"></div>
          </div>
        ))
      ) : (
        cards.map((card) => (
          <div
            key={card.title}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
          >
            <p className="text-slate-400 text-sm">{card.title}</p>
            <p className="text-2xl font-bold text-white mt-2">{card.value}</p>
            <p className={`text-sm mt-1 ${getChangeColor(card.changeType)}`}>
              {card.change}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
