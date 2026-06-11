import crypto from "node:crypto";

const COOKIE_NAME = "xq_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
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

function constantEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && getSecret());
}

export function verifyPassword(password) {
  if (!isAdminConfigured()) return false;
  return constantEqual(password, process.env.ADMIN_PASSWORD);
}

export function createSessionCookie(req) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = String(expiresAt);
  const token = `${payload}.${sign(payload)}`;
  const isSecure = req.headers["x-forwarded-proto"] === "https" || req.headers.host?.includes("xqcamille.com");

  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Lax${
    isSecure ? "; Secure" : ""
  }`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}

export function isAuthenticated(req) {
  if (!isAdminConfigured()) return false;

  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;

  return constantEqual(signature, sign(expiresAt));
}

export function requireAdmin(req, res) {
  if (isAuthenticated(req)) return true;
  res.statusCode = 401;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify({ error: "Unauthorized", message: "請先登入後台" }));
  return false;
}
