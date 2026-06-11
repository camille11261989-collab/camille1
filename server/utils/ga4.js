import crypto from "node:crypto";

const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";

const REQUIRED_ENV = [
  "VITE_GA_MEASUREMENT_ID",
  "GA4_PROPERTY_ID",
  "GA4_CLIENT_EMAIL",
  "GA4_PRIVATE_KEY_BASE64"
];

let cachedToken;

class Ga4SetupError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "Ga4SetupError";
    this.status = options.status || "ga4_setup_error";
    this.missing = options.missing || [];
    this.details = options.details || "";
  }
}

class Ga4ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "Ga4ApiError";
    this.statusCode = options.statusCode || 500;
    this.phase = options.phase || "data_api";
    this.details = options.details || "";
  }
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function decodePrivateKey() {
  const encoded = process.env.GA4_PRIVATE_KEY_BASE64?.trim();

  if (!encoded) {
    throw new Ga4SetupError("缺少 GA4_PRIVATE_KEY_BASE64", {
      status: "missing_env",
      missing: ["GA4_PRIVATE_KEY_BASE64"]
    });
  }

  if (!/^[A-Za-z0-9+/=\s]+$/.test(encoded)) {
    throw new Ga4SetupError("GA4_PRIVATE_KEY_BASE64 格式錯誤，請確認是 private_key 的 base64 字串", {
      status: "invalid_private_key",
      details: "Base64 字串含有不支援的字元"
    });
  }

  const privateKey = Buffer.from(encoded, "base64").toString("utf8");
  if (!privateKey.includes("BEGIN PRIVATE KEY") || !privateKey.includes("END PRIVATE KEY")) {
    throw new Ga4SetupError("GA4_PRIVATE_KEY_BASE64 格式錯誤，還原後不是有效的 service account private_key", {
      status: "invalid_private_key",
      details: "請只轉換 service-account.json 裡的 private_key 欄位，不要轉整份 JSON"
    });
  }

  return privateKey;
}

export function getGaSetupStatus() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      configured: false,
      connected: false,
      status: "missing_env",
      missing,
      message: `缺少 ${missing.join("、")}`
    };
  }

  try {
    decodePrivateKey();
  } catch (error) {
    return {
      configured: false,
      connected: false,
      status: error.status || "invalid_private_key",
      missing: error.missing || [],
      message: error.message || "GA4 Private Key 設定錯誤",
      details: error.details || ""
    };
  }

  return {
    configured: true,
    connected: true,
    status: "ready",
    missing: [],
    message: "正常連接"
  };
}

export function isGaConfigured() {
  return getGaSetupStatus().configured;
}

function assertGaConfigured() {
  const setup = getGaSetupStatus();
  if (!setup.configured) {
    throw new Ga4SetupError(setup.message, setup);
  }
}

async function readError(response) {
  const text = await response.text().catch(() => "");
  if (!text) return "";

  try {
    const data = JSON.parse(text);
    return data?.error?.message || data?.message || text;
  } catch {
    return text;
  }
}

async function getAccessToken() {
  assertGaConfigured();

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: process.env.GA4_CLIENT_EMAIL,
    scope: GA_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600
  };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(decodePrivateKey(), "base64url");
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    throw new Ga4ApiError("GA4 Service Account 憑證驗證失敗", {
      statusCode: response.status,
      phase: "token",
      details: await readError(response)
    });
  }

  const data = await response.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000
  };

  return cachedToken.accessToken;
}

export async function runReport(body) {
  const token = await getAccessToken();
  const propertyId = process.env.GA4_PROPERTY_ID;
  const response = await fetch(`${DATA_API_BASE}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Ga4ApiError("GA4 Data API 請求失敗", {
      statusCode: response.status,
      phase: "data_api",
      details: await readError(response)
    });
  }

  return response.json();
}

export function gaErrorPayload(error) {
  if (error instanceof Ga4SetupError || error?.name === "Ga4SetupError") {
    return {
      status: error.status || "ga4_setup_error",
      message: error.message || "GA4 設定尚未完成",
      missing: error.missing || [],
      details: error.details || ""
    };
  }

  const details = error?.details || error?.message || "";
  const statusCode = error?.statusCode;

  if (error?.phase === "token") {
    return {
      status: "ga4_credentials_error",
      message: "GA4 Service Account 憑證驗證失敗，請檢查 GA4_CLIENT_EMAIL 與 GA4_PRIVATE_KEY_BASE64",
      details
    };
  }

  if (statusCode === 403 && /has not been used|disabled|not enabled/i.test(details)) {
    return {
      status: "ga4_api_not_enabled",
      message: "Google Analytics Data API 尚未啟用",
      details
    };
  }

  if (statusCode === 403) {
    return {
      status: "ga4_permission_denied",
      message: "Service Account 沒有 GA4 權限，請到 GA4 Property Access Management 加入 GA4_CLIENT_EMAIL",
      details
    };
  }

  if (statusCode === 404) {
    return {
      status: "ga4_property_not_found",
      message: "GA4 Property ID 找不到，請確認 GA4_PROPERTY_ID 是純數字資源 ID",
      details
    };
  }

  if (statusCode === 400) {
    return {
      status: "ga4_bad_request",
      message: "GA4 查詢欄位不支援或 Property ID 格式錯誤",
      details
    };
  }

  return {
    status: "request_failed",
    message: "API 請求失敗",
    details
  };
}

export function metricValue(row, index) {
  const value = row?.metricValues?.[index]?.value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function dimensionValue(row, index) {
  return row?.dimensionValues?.[index]?.value || "";
}

export function rowMetrics(report) {
  return report?.rows?.[0]?.metricValues?.map((item) => Number(item.value) || 0) ?? [];
}

export async function activeUsersFor(dateRange) {
  const report = await runReport({
    dateRanges: [dateRange],
    metrics: [{ name: "activeUsers" }]
  });

  return rowMetrics(report)[0] ?? 0;
}

export async function eventCounts(startDate = "30daysAgo", endDate = "today") {
  const desiredEvents = [
    "click_line",
    "click_contact",
    "click_booking",
    "click_market_note",
    "stay_30_seconds",
    "scroll_70_percent"
  ];

  const report = await runReport({
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: desiredEvents }
      }
    }
  });

  return Object.fromEntries(
    desiredEvents.map((eventName) => {
      const row = report.rows?.find((entry) => dimensionValue(entry, 0) === eventName);
      return [eventName, row ? metricValue(row, 0) : 0];
    })
  );
}
