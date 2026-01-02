// API client for CF-X Dashboard
// Uses Next.js API routes as proxy to CFX Router

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export interface Stats {
  totalRequests: number;
  todayRequests: number;
  totalCost: number;
  avgLatency: number;
  dailyLimit: number;
}

export interface LogEntry {
  id: string;
  stage: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  status: number;
  error: string | null;
  createdAt: string;
}

export interface UsageData {
  date: string;
  requests: number;
  cost: number;
  tokens: number;
}

export interface ApiKey {
  id: string;
  prefix: string;
  label: string;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export const api = {
  getStats: () => fetchAPI<Stats>("/stats"),
  
  getLogs: (params?: { limit?: number; offset?: number; stage?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    if (params?.stage) query.set("stage", params.stage);
    const queryStr = query.toString();
    return fetchAPI<{ logs: LogEntry[]; total: number }>(`/logs${queryStr ? `?${queryStr}` : ""}`);
  },
  
  getUsage: (days = 7) => fetchAPI<{ usage: UsageData[] }>(`/usage?days=${days}`),
  
  getKeys: () => fetchAPI<{ keys: ApiKey[] }>("/keys"),
  
  createKey: (label?: string) =>
    fetchAPI<{ id: string; key: string; prefix: string; label: string; createdAt: string; message: string }>(
      "/keys",
      {
        method: "POST",
        body: JSON.stringify({ label }),
      }
    ),
  
  revokeKey: (keyId: string) =>
    fetchAPI<{ message: string }>(`/keys/${keyId}`, { method: "DELETE" }),
};
