import { requireAdmin } from "../../server/utils/adminAuth.js";
import { eventCounts, gaErrorPayload, getGaSetupStatus } from "../../server/utils/ga4.js";
import { analyticsNotConnected, methodNotAllowed, sendJson } from "../../server/utils/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  if (!requireAdmin(req, res)) return;

  const setup = getGaSetupStatus();
  if (!setup.configured) {
    analyticsNotConnected(res, setup.message, setup);
    return;
  }

  try {
    sendJson(
      res,
      200,
      {
        connected: true,
        status: "connected",
        message: "正常連接",
        authMode: setup.authMode,
        updatedAt: new Date().toISOString(),
        events: await eventCounts()
      },
      { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" }
    );
  } catch (error) {
    console.error("analytics events failed", error);
    const payload = gaErrorPayload(error);
    analyticsNotConnected(res, payload.message, payload);
  }
}
