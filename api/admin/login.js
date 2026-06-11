import { createSessionCookie, isAdminConfigured, verifyPassword } from "../../server/utils/adminAuth.js";
import { methodNotAllowed, sendJson } from "../../server/utils/http.js";

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  if (!isAdminConfigured()) {
    sendJson(res, 503, { error: "Admin password is not configured", message: "後台密碼尚未設定" });
    return;
  }

  const body = await readBody(req).catch(() => ({}));
  if (!verifyPassword(body.password || "")) {
    sendJson(res, 401, { error: "Invalid password", message: "密碼不正確" });
    return;
  }

  res.setHeader("Set-Cookie", createSessionCookie(req));
  sendJson(res, 200, { ok: true });
}
