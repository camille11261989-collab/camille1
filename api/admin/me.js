import { isAdminConfigured, isAuthenticated } from "../../server/utils/adminAuth.js";
import { methodNotAllowed, sendJson } from "../../server/utils/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  sendJson(
    res,
    200,
    {
      configured: isAdminConfigured(),
      authenticated: isAuthenticated(req)
    },
    { "Cache-Control": "no-store" }
  );
}
