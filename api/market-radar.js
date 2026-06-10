const DEFAULT_TIMEOUT_MS = 7000;

const jsonHeaders = {
  "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
  "Content-Type": "application/json; charset=utf-8"
};

function send(res, status, body) {
  res.statusCode = status;
  Object.entries(jsonHeaders).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(body));
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...(options.headers ?? {}) },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function numberFrom(value) {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return "";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatHundredMillionShares(value) {
  if (!Number.isFinite(value)) return "";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value / 100000000).toFixed(2)}億股`;
}

function toneFromNet(value) {
  if (!Number.isFinite(value)) return "blue";
  if (value > 0) return "green";
  if (value < 0) return "yellow";
  return "blue";
}

async function loadUsRisk() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return {
      connected: false,
      item: {
        tone: "blue",
        indicator: "🔵",
        label: "美股風險偏好",
        status: "等待資料",
        value: "",
        source: "需設定 Alpha Vantage 或授權美股行情 API",
        reliability: "未接入"
      }
    };
  }

  const symbols = ["SPY", "QQQ"];
  const quotes = await Promise.all(
    symbols.map((symbol) =>
      fetchJson(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
      )
    )
  );

  const changes = quotes
    .map((data) => data?.["Global Quote"]?.["10. change percent"])
    .map((value) => Number(String(value ?? "").replace("%", "")))
    .filter(Number.isFinite);

  if (changes.length !== symbols.length) {
    throw new Error("Alpha Vantage quote response is incomplete");
  }

  const averageChange = changes.reduce((sum, value) => sum + value, 0) / changes.length;
  const status = averageChange > 0.25 ? "Risk-On" : averageChange < -0.25 ? "Risk-Off" : "中性";
  const tone = averageChange > 0.25 ? "green" : averageChange < -0.25 ? "yellow" : "blue";

  return {
    connected: true,
    item: {
      tone,
      indicator: tone === "green" ? "🟢" : tone === "yellow" ? "🟡" : "🔵",
      label: "美股風險偏好",
      status,
      value: formatPercent(averageChange),
      source: "Alpha Vantage GLOBAL_QUOTE SPY QQQ",
      reliability: "授權行情源 延遲或即時依方案而定"
    }
  };
}

async function loadTaiwanForeignFlow() {
  const endpoint = process.env.TWSE_FOREIGN_FLOW_URL || "https://openapi.twse.com.tw/v1/fund/T86";
  const data = await fetchJson(endpoint);

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("TWSE response is empty");
  }

  const candidateKeys = [
    "外資及陸資買賣超股數(不含外資自營商)",
    "外資及陸資買賣超股數",
    "外資買賣超股數",
    "Foreign_Dealer_Difference"
  ];

  const netShares = data.reduce((sum, row) => {
    const key = candidateKeys.find((field) => row[field] !== undefined);
    const value = key ? numberFrom(row[key]) : undefined;
    return sum + (value ?? 0);
  }, 0);

  const tone = toneFromNet(netShares);
  const status = netShares > 0 ? "外資買超" : netShares < 0 ? "外資賣超" : "中性";

  return {
    connected: true,
    item: {
      tone,
      indicator: tone === "green" ? "🟢" : tone === "yellow" ? "🟡" : "🔵",
      label: "台股外資態度",
      status,
      value: formatHundredMillionShares(netShares),
      source: "TWSE OpenAPI 三大法人買賣超",
      reliability: "官方資料 收盤後更新"
    }
  };
}

async function loadHongKongFlow() {
  const endpoint = process.env.HKEX_STOCK_CONNECT_FLOW_URL;

  if (!endpoint) {
    return {
      connected: false,
      item: {
        tone: "blue",
        indicator: "🔵",
        label: "港股資金流",
        status: "等待授權源",
        value: "",
        source: "需接 HKEX 授權 Stock Connect 或資料商 API",
        reliability: "未接入"
      }
    };
  }

  const data = await fetchJson(endpoint);
  const netFlow = numberFrom(data.netFlowHkd ?? data.netFlow ?? data.value);
  const status = data.status ?? (netFlow > 0 ? "持續流入" : netFlow < 0 ? "資金流出" : "中性");
  const tone = toneFromNet(netFlow);

  return {
    connected: true,
    item: {
      tone,
      indicator: tone === "green" ? "🟢" : tone === "yellow" ? "🟡" : "🔵",
      label: "港股資金流",
      status,
      value: Number.isFinite(netFlow) ? `${netFlow > 0 ? "+" : ""}${(netFlow / 100000000).toFixed(2)}億 HKD` : "",
      source: data.source ?? "HKEX Stock Connect 授權資料源",
      reliability: data.reliability ?? "授權或資料商來源 更新頻率依方案"
    }
  };
}

function buildAiSignal(items) {
  const connectedItems = items.filter((entry) => entry.connected);

  if (connectedItems.length < 2) {
    return {
      tone: "blue",
      indicator: "🔵",
      label: "AI 策略信號",
      status: "等待資料",
      value: "",
      source: "內部量化規則 需至少兩個正式資料源",
      reliability: "規則訊號 非投資建議"
    };
  }

  const greenCount = connectedItems.filter((entry) => entry.item.tone === "green").length;
  const yellowCount = connectedItems.filter((entry) => entry.item.tone === "yellow").length;
  const status = greenCount >= 2 ? "偏多觀察" : yellowCount >= 2 ? "風險升溫" : "觀察中";
  const tone = greenCount >= 2 ? "green" : yellowCount >= 2 ? "yellow" : "blue";

  return {
    tone,
    indicator: tone === "green" ? "🟢" : tone === "yellow" ? "🟡" : "🔵",
    label: "AI 策略信號",
    status,
    value: "",
    source: "內部量化模型與風控規則",
    reliability: "模型訊號 需人工覆核"
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    send(res, 405, { error: "Method Not Allowed" });
    return;
  }

  const updatedAt = new Date().toISOString();
  const results = await Promise.allSettled([loadUsRisk(), loadHongKongFlow(), loadTaiwanForeignFlow()]);

  const normalized = results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    const fallbacks = [
      {
        connected: false,
        item: {
          tone: "blue",
          indicator: "🔵",
          label: "美股風險偏好",
          status: "資料異常",
          value: "",
          source: "行情源回應失敗",
          reliability: "未更新"
        }
      },
      {
        connected: false,
        item: {
          tone: "blue",
          indicator: "🔵",
          label: "港股資金流",
          status: "資料異常",
          value: "",
          source: "資金流來源回應失敗",
          reliability: "未更新"
        }
      },
      {
        connected: false,
        item: {
          tone: "blue",
          indicator: "🔵",
          label: "台股外資態度",
          status: "資料異常",
          value: "",
          source: "TWSE OpenAPI 回應失敗",
          reliability: "未更新"
        }
      }
    ];
    return fallbacks[index];
  });

  const items = [...normalized.map((entry) => entry.item), buildAiSignal(normalized)];
  const connectedCount = normalized.filter((entry) => entry.connected).length;
  const mode = connectedCount >= 3 ? "live" : connectedCount > 0 ? "delayed" : "unavailable";

  send(res, 200, {
    items,
    updatedAt,
    mode,
    // Production policy: never fabricate market numbers. Missing or failed sources are reported as unavailable.
    sourcePolicy: "No mock values. Missing sources are marked as unavailable instead of fabricated."
  });
}
