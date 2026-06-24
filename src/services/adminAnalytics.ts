export type ConnectionState = {
  connected: boolean;
  status?: string;
  message?: string;
  missing?: string[];
  details?: string;
  authMode?: string;
  authSource?: string;
  updatedAt?: string;
};

export type AnalyticsSummary = ConnectionState & {
  todayUsers?: number;
  sevenDayUsers?: number;
  thirtyDayUsers?: number;
  pageViews?: number;
  averageSessionDuration?: number;
  bounceRate?: number;
  engagementRate?: number;
  conversionRate?: number;
  events?: Record<string, number>;
};

export type AnalyticsPage = {
  path: string;
  title: string;
  views: number;
  users: number;
};

export type AnalyticsSources = ConnectionState & {
  channels?: Array<{ label: string; users: number }>;
  devices?: Array<{ label: string; users: number }>;
  countries?: Array<{ label: string; users: number }>;
  deviceModels?: Array<{ label: string; users: number }>;
  deviceModelDimension?: string;
  deviceModelNote?: string;
  cities?: Array<{ label: string; users: number }>;
};

export type AnalyticsEvents = ConnectionState & {
  events?: Record<string, number>;
};

export type AnalyticsRealtime = ConnectionState & {
  activeUsers?: number;
  events?: Record<string, number>;
};

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options
  });

  if (response.status === 401) {
    throw new Error("unauthorized");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "request_failed");
  }

  return data as T;
}

export function checkAdminSession() {
  return fetchJson<{ configured: boolean; authenticated: boolean }>("/api/admin/me");
}

export function loginAdmin(password: string) {
  return fetchJson<{ ok: boolean }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password })
  });
}

export function logoutAdmin() {
  return fetchJson<{ ok: boolean }>("/api/admin/logout", { method: "POST" });
}

export function getGa4OAuthUrl() {
  return fetchJson<{
    configured: boolean;
    authUrl?: string;
    redirectUri?: string;
    scope?: string;
    status?: string;
    message?: string;
    missing?: string[];
  }>("/api/admin/ga4/oauth-url");
}

export async function loadAnalyticsDashboard() {
  const [summary, pages, sources, events, realtime] = await Promise.all([
    fetchJson<AnalyticsSummary>("/api/analytics/summary"),
    fetchJson<ConnectionState & { items?: AnalyticsPage[] }>("/api/analytics/pages"),
    fetchJson<AnalyticsSources>("/api/analytics/sources"),
    fetchJson<AnalyticsEvents>("/api/analytics/events"),
    fetchJson<AnalyticsRealtime>("/api/analytics/realtime")
  ]);

  return { summary, pages, sources, events, realtime };
}
