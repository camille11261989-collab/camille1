import crypto from "node:crypto";

const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";

const COMMON_REQUIRED_ENV = ["VITE_GA_MEASUREMENT_ID", "GA4_PROPERTY_ID"];
const OAUTH_REQUIRED_ENV = ["GA4_OAUTH_CLIENT_ID", "GA4_OAUTH_CLIENT_SECRET", "GA4_OAUTH_REFRESH_TOKEN"];
const SERVICE_REQUIRED_ENV = ["GA4_CLIENT_EMAIL", "GA4_PRIVATE_KEY_BASE64"];
const OAUTH_COOKIE_NAME = "xq_ga4_refresh_token";
const OAUTH_COOKIE_TTL_SECONDS = 180 * 24 * 60 * 60;

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

function missingKeys(keys) {
  return keys.filter((key) => !process.env[key]);
}

function hasAny(keys) {
  return keys.some((key) => Boolean(process.env[key]));
}

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function parseCookies(req) {
  const header = req?.headers?.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function encryptionKey() {
  const secret = getSecret();
  if (!secret) return undefined;
  return crypto.createHash("sha256").update(secret).digest();
}

function sealRefreshToken(refreshToken) {
  const key = encryptionKey();
  if (!key) return undefined;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(refreshToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function unsealRefreshToken(value) {
  const key = encryptionKey();
  if (!key || !value) return undefined;

  try {
    const [ivValue, tagValue, encryptedValue] = value.split(".");
    if (!ivValue || !tagValue || !encryptedValue) return undefined;

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final()
    ]).toString("utf8");
  } catch {
    return undefined;
  }
}

function getCookieRefreshToken(req) {
  return unsealRefreshToken(parseCookies(req)[OAUTH_COOKIE_NAME]);
}

function getOAuthRefreshToken(req) {
  return getCookieRefreshToken(req) || process.env.GA4_OAUTH_REFRESH_TOKEN;
}

function refreshTokenFingerprint(refreshToken) {
  return crypto.createHash("sha256").update(refreshToken || "").digest("base64url");
}

export function createGa4RefreshTokenCookie(req, refreshToken) {
  const sealed = sealRefreshToken(refreshToken);
  if (!sealed) return undefined;

  const isSecure = req.headers["x-forwarded-proto"] === "https" || req.headers.host?.includes("xqcamille.com");
  return `${OAUTH_COOKIE_NAME}=${encodeURIComponent(sealed)}; Path=/; Max-Age=${OAUTH_COOKIE_TTL_SECONDS}; HttpOnly; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`;
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

function getAuthModeStatus(commonMissing, req) {
  const hasCookieToken = Boolean(getCookieRefreshToken(req));
  const oauthTouched = hasAny(OAUTH_REQUIRED_ENV);
  const oauthMissing = ["GA4_OAUTH_CLIENT_ID", "GA4_OAUTH_CLIENT_SECRET"].filter((key) => !process.env[key]);
  if (!process.env.GA4_OAUTH_REFRESH_TOKEN && !hasCookieToken) {
    oauthMissing.push("GA4_OAUTH_REFRESH_TOKEN");
  }

  if (oauthTouched || hasCookieToken || oauthMissing.length === 0) {
    return {
      authMode: "oauth",
      authSource: hasCookieToken ? "cookie" : "env",
      missing: [...commonMissing, ...oauthMissing],
      configured: commonMissing.length === 0 && oauthMissing.length === 0,
      message:
        commonMissing.length === 0 && oauthMissing.length === 0
          ? "正常連接"
          : `缺少 ${[...commonMissing, ...oauthMissing].join("、")}`
    };
  }

  const serviceMissing = missingKeys(SERVICE_REQUIRED_ENV);
  return {
    authMode: "service_account",
    authSource: "env",
    missing: [...commonMissing, ...serviceMissing],
    configured: commonMissing.length === 0 && serviceMissing.length === 0,
    message:
      commonMissing.length === 0 && serviceMissing.length === 0
        ? "正常連接"
        : `缺少 ${[...commonMissing, ...serviceMissing].join("、")}`
  };
}

export function getGaSetupStatus(req) {
  const commonMissing = missingKeys(COMMON_REQUIRED_ENV);
  const auth = getAuthModeStatus(commonMissing, req);

  if (!auth.configured) {
    return {
      configured: false,
      connected: false,
      authMode: auth.authMode,
      authSource: auth.authSource,
      status: "missing_env",
      missing: auth.missing,
      message: auth.message,
      details:
        auth.authMode === "oauth"
          ? "OAuth 模式需要 GA4_OAUTH_CLIENT_ID、GA4_OAUTH_CLIENT_SECRET、GA4_OAUTH_REFRESH_TOKEN"
          : "Service Account 模式需要 GA4_CLIENT_EMAIL、GA4_PRIVATE_KEY_BASE64"
    };
  }

  if (auth.authMode === "service_account") {
    try {
      decodePrivateKey();
    } catch (error) {
      return {
        configured: false,
        connected: false,
        authMode: auth.authMode,
        status: error.status || "invalid_private_key",
        missing: error.missing || [],
        message: error.message || "GA4 Private Key 設定錯誤",
        details: error.details || ""
      };
    }
  }

  return {
    configured: true,
    connected: true,
    authMode: auth.authMode,
    authSource: auth.authSource,
    status: "ready",
    missing: [],
    message: auth.authMode === "oauth" ? "OAuth 授權已設定" : "Service Account 授權已設定"
  };
}

export function isGaConfigured() {
  return getGaSetupStatus().configured;
}

function assertGaConfigured(req) {
  const setup = getGaSetupStatus(req);
  if (!setup.configured) {
    throw new Ga4SetupError(setup.message, setup);
  }
  return setup;
}

async function readError(response) {
  const text = await response.text().catch(() => "");
  if (!text) return "";

  try {
    const data = JSON.parse(text);
    return data?.error_description || data?.error?.message || data?.message || data?.error || text;
  } catch {
    return text;
  }
}

async function getOAuthAccessToken(req) {
  const refreshToken = getOAuthRefreshToken(req);

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GA4_OAUTH_CLIENT_ID,
      client_secret: process.env.GA4_OAUTH_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    throw new Ga4ApiError("GA4 OAuth refresh token 換取 access token 失敗", {
      statusCode: response.status,
      phase: "oauth_token",
      details: await readError(response)
    });
  }

  return response.json();
}

async function getServiceAccountAccessToken() {
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
      phase: "service_token",
      details: await readError(response)
    });
  }

  return response.json();
}

async function getAccessToken(req) {
  const setup = assertGaConfigured(req);
  const authMode = setup.authMode;
  const tokenFingerprint =
    authMode === "oauth" ? refreshTokenFingerprint(getOAuthRefreshToken(req)) : "service_account";

  if (
    cachedToken &&
    cachedToken.authMode === authMode &&
    cachedToken.tokenFingerprint === tokenFingerprint &&
    cachedToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedToken.accessToken;
  }

  const data = authMode === "oauth" ? await getOAuthAccessToken(req) : await getServiceAccountAccessToken();
  cachedToken = {
    authMode,
    tokenFingerprint,
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000
  };

  return cachedToken.accessToken;
}

export async function runReport(body, req) {
  const token = await getAccessToken(req);
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

export async function runRealtimeReport(body, req) {
  const token = await getAccessToken(req);
  const propertyId = process.env.GA4_PROPERTY_ID;
  const response = await fetch(`${DATA_API_BASE}/properties/${propertyId}:runRealtimeReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Ga4ApiError("GA4 Realtime API 請求失敗", {
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

  if (error?.phase === "oauth_token") {
    return {
      status: "oauth_token_error",
      message: "GA4 OAuth 授權已失效，請按右上方 GA4 OAuth 授權重新連接",
      details
    };
  }

  if (error?.phase === "service_token") {
    return {
      status: "service_account_token_error",
      message: "GA4 Service Account 憑證驗證失敗，請改用 OAuth 或檢查 GA4_CLIENT_EMAIL 與 GA4_PRIVATE_KEY_BASE64",
      details
    };
  }

  if (statusCode === 403 && /has not been used|disabled|not enabled/i.test(details)) {
    return {
      status: "api_not_enabled",
      message: "Google Analytics Data API 尚未啟用",
      details
    };
  }

  if (statusCode === 403) {
    return {
      status: "permission_denied",
      message:
        getGaSetupStatus().authMode === "oauth"
          ? "OAuth 授權的 Google 帳號沒有這個 GA4 Property 權限，請改用有 xqcamille GA4 權限的 Google 帳號重新授權"
          : `Service Account 沒有 GA4 權限，請改用 OAuth 或確認 ${process.env.GA4_CLIENT_EMAIL || "GA4_CLIENT_EMAIL"} 已有 GA4 權限`,
      details
    };
  }

  if (statusCode === 404) {
    return {
      status: "property_not_found",
      message: "GA4 Property ID 找不到，請確認 GA4_PROPERTY_ID 是純數字資源 ID",
      details
    };
  }

  if (statusCode === 400) {
    return {
      status: "bad_request",
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

export async function activeUsersFor(dateRange, req) {
  const report = await runReport({
    dateRanges: [dateRange],
    metrics: [{ name: "activeUsers" }]
  }, req);

  return rowMetrics(report)[0] ?? 0;
}

export async function eventCounts(startDate = "30daysAgo", endDate = "today", req) {
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
  }, req);

  return Object.fromEntries(
    desiredEvents.map((eventName) => {
      const row = report.rows?.find((entry) => dimensionValue(entry, 0) === eventName);
      return [eventName, row ? metricValue(row, 0) : 0];
    })
  );
}
