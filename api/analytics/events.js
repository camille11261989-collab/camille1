import { requireAdmin } from "../../server/utils/adminAuth.js";
import { eventCounts, isGaConfigured } from "../../server/utils/ga4.js";
import { analyticsNotConnected, methodNotAllowed, sendJson } from "../../server/utils/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  if (!requireAdmin(req, res)) return;

  if (!isGaConfigured()) {
    analyticsNotConnected(res);
    return;
  }

  try {
    sendJson(
      res,
      200,
      {
        connected: true,
        updatedAt: new Date().toISOString(),
        events: await eventCounts()
      },
      { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" }
    );
  } catch (error) {
    console.error("analytics events failed", error);
    analyticsNotConnected(res, "資料更新中");
  }
}
