import { clearSessionCookie } from "../../server/utils/adminAuth.js";
import { methodNotAllowed, sendJson } from "../../server/utils/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  res.setHeader("Set-Cookie", clearSessionCookie());
  sendJson(res, 200, { ok: true });
}
