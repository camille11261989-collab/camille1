import crypto from "node:crypto";

const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";

let cachedToken;

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function getPrivateKey() {
  if (process.env.GA4_PRIVATE_KEY_BASE64) {
    return Buffer.from(process.env.GA4_PRIVATE_KEY_BASE64, "base64").toString("utf8");
  }

  return process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

export function isGaConfigured() {
  return Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_CLIENT_EMAIL && getPrivateKey());
}

async function getAccessToken() {
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
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(getPrivateKey(), "base64url");
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
    throw new Error(`GA token request failed ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000
  };

  return cachedToken.accessToken;
}

export async function runReport(body) {
  if (!isGaConfigured()) {
    throw new Error("GA4 is not configured");
  }

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
    throw new Error(`GA Data API failed ${response.status}`);
  }

  return response.json();
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
