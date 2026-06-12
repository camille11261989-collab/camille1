import crypto from "node:crypto";
import { isAuthenticated } from "../../../server/utils/adminAuth.js";
import { methodNotAllowed, sendJson } from "../../../server/utils/http.js";

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function signState(state) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
  return crypto.createHmac("sha256", secret).update(state).digest("base64url");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  if (!isAuthenticated(req)) {
    sendJson(res, 401, { error: "Unauthorized", message: "請先登入後台" });
    return;
  }

  const missing = ["GA4_OAUTH_CLIENT_ID", "GA4_OAUTH_CLIENT_SECRET"].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    sendJson(res, 200, {
      configured: false,
      status: "missing_env",
      message: `缺少 ${missing.join("、")}`,
      missing
    });
    return;
  }

  const redirectUri = process.env.GA4_OAUTH_REDIRECT_URI || `${getOrigin(req)}/api/admin/ga4/oauth-callback`;
  const payload = `${Date.now()}.${crypto.randomBytes(16).toString("base64url")}`;
  const state = `${payload}.${signState(payload)}`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GA4_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);

  res.setHeader("Set-Cookie", `xq_ga4_oauth_state=${encodeURIComponent(state)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax; Secure`);
  sendJson(res, 200, {
    configured: true,
    authUrl: url.toString(),
    redirectUri,
    scope: SCOPE
  });
}
