import { ArrowLeft, BarChart3, Lock, LogOut, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AnalyticsPage,
  AnalyticsSummary,
  AnalyticsSources,
  checkAdminSession,
  getGa4OAuthUrl,
  loadAnalyticsDashboard,
  loginAdmin,
  logoutAdmin
} from "../services/adminAnalytics";

type DashboardData = Awaited<ReturnType<typeof loadAnalyticsDashboard>>;

const emptyDataMessage = "尚未累積資料";
const emptyListMessage = "GA4 尚未累積足夠資料";

function formatNumber(value?: number) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("zh-TW").format(value ?? 0);
}

function formatPercent(value?: number) {
  if (!Number.isFinite(value)) return "0.0%";
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}

function formatDuration(seconds?: number) {
  if (!Number.isFinite(seconds)) return "0秒";
  const minutes = Math.floor((seconds ?? 0) / 60);
  const rest = Math.round((seconds ?? 0) % 60);
  return minutes > 0 ? `${minutes}分${rest}秒` : `${rest}秒`;
}

function StatusNotice({
  message = emptyDataMessage,
  status,
  missing = [],
  details,
  tone = "warning"
}: {
  message?: string;
  status?: string;
  missing?: string[];
  details?: string;
  tone?: "warning" | "success";
}) {
  const toneClass =
    tone === "success"
      ? "border-signal-cyan/20 bg-signal-cyan/[0.04] text-signal-cyan"
      : "border-signal-amber/20 bg-signal-amber/[0.04] text-signal-amber";

  return (
    <div className={`rounded-md border px-4 py-3 text-sm leading-6 ${toneClass}`}>
      <div className="flex flex-col gap-1">
        <p>{message}</p>
        {status ? <p className="text-xs opacity-75">狀態 {status}</p> : null}
        {missing.length > 0 ? <p className="text-xs opacity-75">缺少欄位 {missing.join("、")}</p> : null}
        {details ? <p className="line-clamp-3 text-xs opacity-75">細節 {details}</p> : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="data-card interactive-surface rounded-md border border-white/10 bg-white/[0.035] p-4 transition hover:border-signal-cyan/35 hover:bg-white/[0.055]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-steel-500">{label}</p>
      <p className="mt-4 font-plex text-2xl font-medium text-white md:text-3xl">{value}</p>
      <p className="mt-3 text-xs leading-5 text-steel-400">{detail}</p>
    </div>
  );
}

function RankingList({
  title,
  items,
  valueLabel
}: {
  title: string;
  items: Array<{ label: string; value: number; sub?: string }>;
  valueLabel: string;
}) {
  return (
    <div className="data-card rounded-md border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-plex text-lg font-medium text-white">{title}</h3>
      <div className="mt-5 divide-y divide-white/10">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="grid grid-cols-[auto_1fr_auto] gap-3 py-3">
              <span className="font-plex text-xs text-steel-500">{String(index + 1).padStart(2, "0")}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-steel-200">{item.label}</p>
                {item.sub ? <p className="mt-1 truncate text-xs text-steel-500">{item.sub}</p> : null}
              </div>
              <p className="text-sm text-signal-cyan">
                {formatNumber(item.value)} <span className="text-xs text-steel-500">{valueLabel}</span>
              </p>
            </div>
          ))
        ) : (
          <p className="py-4 text-sm text-steel-500">{emptyListMessage}</p>
        )}
      </div>
    </div>
  );
}

function hasListData(items?: Array<unknown>) {
  return Boolean(items?.length);
}

function hasMetricData(summary?: AnalyticsSummary) {
  return Boolean(
    (summary?.todayUsers ?? 0) > 0 ||
      (summary?.sevenDayUsers ?? 0) > 0 ||
      (summary?.thirtyDayUsers ?? 0) > 0 ||
      (summary?.pageViews ?? 0) > 0
  );
}

function Ga4ConnectionCard({
  authMode,
  authSource,
  apiReadable,
  hasData
}: {
  authMode?: string;
  authSource?: string;
  apiReadable: boolean;
  hasData: boolean;
}) {
  const authLabel =
    authMode === "oauth"
      ? authSource === "cookie"
        ? "OAuth 已連接 Cookie"
        : "OAuth 已連接 Env"
      : authMode === "service_account"
        ? "Service Account 已設定"
        : "授權狀態待確認";

  return (
    <div className="data-card rounded-md border border-signal-cyan/20 bg-signal-cyan/[0.035] p-5">
      <p className="font-plex text-xs uppercase tracking-[0.22em] text-signal-cyan/75">GA4 Connection</p>
      <h3 className="mt-3 font-plex text-xl font-medium text-white">GA4 連線狀態</h3>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {[
          ["授權狀態", authLabel],
          ["GA4 API", apiReadable ? "已可讀取" : "尚未連接"],
          ["目前資料狀態", hasData ? "已有資料" : "尚未累積"]
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-white/10 bg-ink-950/35 p-3">
            <p className="text-[11px] text-steel-500">{label}</p>
            <p className="mt-2 text-sm font-medium text-steel-100">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginPanel({
  configured,
  onLogin
}: {
  configured: boolean;
  onLogin: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginAdmin(password);
      onLogin();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登入失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 px-4 py-24 text-white">
      <div className="absolute inset-0 bg-fine-grid opacity-25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(123,200,216,0.18),transparent_32rem)]" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="panel relative mx-auto max-w-md rounded-md p-6 shadow-panel"
      >
        <div className="grid size-12 place-items-center rounded border border-signal-cyan/25 bg-signal-cyan/[0.06] text-signal-cyan">
          <Lock size={20} />
        </div>
        <p className="mt-6 font-plex text-xs uppercase tracking-[0.22em] text-signal-cyan/70">Private Analytics</p>
        <h1 className="mt-3 font-plex text-3xl font-medium text-white">網站數據看板</h1>
        <p className="mt-4 text-sm leading-7 text-steel-400">
          這個頁面僅供管理者查看網站成效資料。請輸入後台密碼後繼續
        </p>

        {!configured ? <div className="mt-5"><StatusNotice message="後台密碼尚未設定" /></div> : null}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="ADMIN_PASSWORD"
            disabled={!configured || loading}
            className="h-12 rounded border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-steel-600 focus:border-signal-cyan/45"
          />
          <button
            type="submit"
            disabled={!configured || loading}
            className="h-12 rounded border border-white/10 bg-white text-sm font-semibold text-ink-950 transition hover:bg-steel-300 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? "登入中" : "登入後台"}
          </button>
        </form>
        {error ? <p className="mt-4 text-sm text-signal-amber">{error}</p> : null}
        <a href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-steel-400 transition hover:text-white">
          <ArrowLeft size={16} />
          回到網站
        </a>
      </motion.div>
    </div>
  );
}

function DashboardContent({
  data,
  refreshing,
  onRefresh,
  onStartOAuth,
  oauthError,
  onLogout
}: {
  data: DashboardData | null;
  refreshing: boolean;
  onRefresh: () => void;
  onStartOAuth: () => void;
  oauthError: string;
  onLogout: () => void;
}) {
  const summary: AnalyticsSummary | undefined = data?.summary;
  const sources: AnalyticsSources | undefined = data?.sources;
  const realtime = data?.realtime;
  const pages: AnalyticsPage[] = data?.pages.items ?? [];
  const events = data?.events.events ?? summary?.events ?? {};
  const connectionStates = useMemo(() => {
    if (!data) return [{ label: "資料狀態", state: { connected: false, message: "資料更新中", status: "loading" } }];

    const states = [
      { label: "總覽", state: summary },
      { label: "熱門頁面", state: data.pages },
      { label: "來源與裝置", state: sources },
      { label: "事件追蹤", state: data.events },
      { label: "即時診斷", state: realtime }
    ].filter(({ state }) => state && !state.connected);

    const seen = new Set<string>();
    return states.filter(({ state }) => {
      const key = `${state?.status || ""}-${state?.message || ""}-${state?.details || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data, realtime, sources, summary]);

  const apiReadable = Boolean(data && summary?.connected && data.pages.connected && sources?.connected && data.events.connected && realtime?.connected);
  const authMode = summary?.authMode || data?.pages.authMode || sources?.authMode || data?.events.authMode || realtime?.authMode;
  const authSource = summary?.authSource || data?.pages.authSource || sources?.authSource || data?.events.authSource || realtime?.authSource;
  const dashboardHasData = Boolean(
    (realtime?.activeUsers ?? 0) > 0 ||
    hasMetricData(summary) ||
      hasListData(pages) ||
      hasListData(sources?.channels) ||
      hasListData(sources?.devices) ||
      hasListData(sources?.deviceModels) ||
      hasListData(sources?.cities) ||
      Object.values(events).some((value) => Number(value) > 0)
  );

  const metrics = useMemo(
    () => [
      { label: "即時活躍訪客", value: formatNumber(realtime?.activeUsers), detail: "GA4 Realtime 最近 30 分鐘" },
      { label: "今日訪客數", value: formatNumber(summary?.todayUsers), detail: "GA4 Active Users Today" },
      { label: "最近 7 天訪客數", value: formatNumber(summary?.sevenDayUsers), detail: "近 7 天活躍使用者" },
      { label: "最近 30 天訪客數", value: formatNumber(summary?.thirtyDayUsers), detail: "近 30 天活躍使用者" },
      { label: "頁面瀏覽量", value: formatNumber(summary?.pageViews), detail: "近 30 天 Page Views" },
      { label: "平均停留時間", value: formatDuration(summary?.averageSessionDuration), detail: "平均工作階段停留時間" },
      { label: "互動率", value: formatPercent(summary?.engagementRate), detail: "GA4 Engagement Rate" },
      { label: "跳出率", value: formatPercent(summary?.bounceRate), detail: "GA4 Bounce Rate" },
      { label: "轉化率", value: formatPercent(summary?.conversionRate), detail: "LINE 聯繫與聯絡點擊 / 30 天訪客" }
    ],
    [realtime?.activeUsers, summary]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      <div className="absolute inset-0 bg-fine-grid opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(123,200,216,0.16),transparent_30rem),radial-gradient(circle_at_10%_40%,rgba(200,163,92,0.09),transparent_28rem)]" />
      <div className="site-shell relative py-8 md:py-12">
        <header className="glass flex flex-col gap-5 rounded-md border border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-plex text-xs uppercase tracking-[0.22em] text-signal-cyan/70">Analytics Command Center</p>
            <h1 className="mt-3 font-plex text-3xl font-medium text-white md:text-5xl">網站數據看板</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-steel-400">
              追蹤訪客數據、熱門頁面、來源渠道與轉化事件，用來判斷個人品牌網站的成效
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-steel-200 transition hover:border-signal-cyan/40 hover:text-white"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              更新資料
            </button>
            <button
              type="button"
              onClick={onStartOAuth}
              className="inline-flex items-center gap-2 rounded border border-signal-cyan/25 bg-signal-cyan/[0.06] px-4 py-2 text-sm text-signal-cyan transition hover:border-signal-cyan/45 hover:bg-signal-cyan/[0.1]"
            >
              GA4 OAuth 授權
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-steel-300"
            >
              <LogOut size={16} />
              登出
            </button>
          </div>
        </header>

        {oauthError ? <div className="mt-6"><StatusNotice message={oauthError} status="oauth_setup" /></div> : null}

        <div className="mt-6 grid gap-3">
          {apiReadable ? (
            <StatusNotice tone="success" message="正常連接 Google Analytics 4 Data API" status="connected" />
          ) : (
            connectionStates.map(({ label, state }) => (
              <StatusNotice
                key={`${label}-${state?.status}-${state?.message}`}
                message={`${label} ${state?.message || emptyDataMessage}`}
                status={state?.status}
                missing={state?.missing}
                details={state?.details}
              />
            ))
          )}
        </div>

        <section className="mt-6">
          <Ga4ConnectionCard authMode={authMode} authSource={authSource} apiReadable={apiReadable} hasData={dashboardHasData} />
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <RankingList
            title="熱門頁面排名"
            valueLabel="views"
            items={pages.map((page) => ({
              label: page.title || page.path,
              sub: page.path,
              value: page.views
            }))}
          />
          <div className="grid gap-5">
            <RankingList
              title="流量來源"
              valueLabel="users"
              items={(sources?.channels ?? []).map((item) => ({ label: item.label, value: item.users }))}
            />
            <RankingList
              title="裝置比例"
              valueLabel="users"
              items={(sources?.devices ?? []).map((item) => ({ label: item.label, value: item.users }))}
            />
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <RankingList
            title="設備型號"
            valueLabel="users"
            items={(sources?.deviceModels ?? []).map((item) => ({ label: item.label, value: item.users }))}
          />
          <RankingList
            title="城市來源"
            valueLabel="users"
            items={(sources?.cities ?? sources?.countries ?? []).map((item) => ({ label: item.label, value: item.users }))}
          />
        </section>

        <section className="mt-6">
          <div className="data-card rounded-md border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded border border-signal-cyan/25 bg-signal-cyan/[0.06] text-signal-cyan">
                <BarChart3 size={18} />
              </span>
              <div>
                <h3 className="font-plex text-lg font-medium text-white">轉化事件追蹤</h3>
                <p className="mt-1 text-xs text-steel-500">近 30 天事件次數</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["LINE 按鈕點擊", "click_line"],
                ["聯絡我點擊", "click_contact"],
                ["預約按鈕點擊", "click_booking"],
                ["市場筆記點擊", "click_market_note"],
                ["停留超過 30 秒", "stay_30_seconds"],
                ["滑動超過 70%", "scroll_70_percent"]
              ].map(([label, key]) => (
                <div key={key} className="rounded border border-white/10 bg-ink-950/45 p-3">
                  <p className="text-xs text-steel-500">{label}</p>
                  <p className="mt-2 font-plex text-xl text-white">{formatNumber(events[key])}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-xs leading-6 text-steel-500 md:flex-row">
          <p>資料來源 Google Analytics 4 Data API</p>
          <p>後台資料僅供 Camille 張若琳 檢視 不公開給一般訪客</p>
        </footer>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [configured, setConfigured] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [oauthError, setOauthError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);

  const loadData = async () => {
    setRefreshing(true);
    try {
      setData(await loadAnalyticsDashboard());
    } catch (error) {
      if (error instanceof Error && error.message === "unauthorized") {
        setAuthenticated(false);
      } else {
        setData({
          summary: { connected: false, message: "資料更新中" },
          pages: { connected: false, items: [] },
          sources: { connected: false, channels: [], devices: [], countries: [] },
          events: { connected: false, events: {} },
          realtime: { connected: false, activeUsers: 0, events: {} }
        });
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminSession()
      .then((session) => {
        setConfigured(session.configured);
        setAuthenticated(session.authenticated);
        if (session.authenticated) {
          void loadData();
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setConfigured(false);
        setAuthenticated(false);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-950 text-sm text-steel-400">
        資料更新中
      </div>
    );
  }

  if (!authenticated) {
    return (
      <LoginPanel
        configured={configured}
        onLogin={() => {
          setAuthenticated(true);
          void loadData();
        }}
      />
    );
  }

  return (
    <DashboardContent
      data={data}
      refreshing={refreshing}
      onRefresh={loadData}
      oauthError={oauthError}
      onStartOAuth={async () => {
        setOauthError("");
        try {
          const response = await getGa4OAuthUrl();
          if (response.authUrl) {
            window.location.href = response.authUrl;
          } else {
            setOauthError(response.message || "GA4 OAuth 尚未設定");
          }
        } catch (error) {
          setOauthError(error instanceof Error ? error.message : "GA4 OAuth 授權連結產生失敗");
        }
      }}
      onLogout={async () => {
        await logoutAdmin().catch(() => undefined);
        setAuthenticated(false);
        setData(null);
      }}
    />
  );
}
