import { requireAdmin } from "../../server/utils/adminAuth.js";
import {
  dimensionValue,
  gaErrorPayload,
  getGaSetupStatus,
  metricValue,
  rowMetrics,
  runRealtimeReport
} from "../../server/utils/ga4.js";
import { analyticsNotConnected, methodNotAllowed, sendJson } from "../../server/utils/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  if (!requireAdmin(req, res)) return;

  const setup = getGaSetupStatus(req);
  if (!setup.configured) {
    analyticsNotConnected(res, setup.message, setup);
    return;
  }

  try {
    const desiredEvents = [
      "click_line",
      "click_contact",
      "click_booking",
      "click_market_note",
      "stay_30_seconds",
      "scroll_70_percent"
    ];

    const [activeReport, eventsReport] = await Promise.all([
      runRealtimeReport({ metrics: [{ name: "activeUsers" }] }, req),
      runRealtimeReport(
        {
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: {
            filter: {
              fieldName: "eventName",
              inListFilter: { values: desiredEvents }
            }
          }
        },
        req
      )
    ]);

    const activeUsers = rowMetrics(activeReport)[0] ?? 0;
    const events = Object.fromEntries(
      desiredEvents.map((eventName) => {
        const row = eventsReport.rows?.find((entry) => dimensionValue(entry, 0) === eventName);
        return [eventName, row ? metricValue(row, 0) : 0];
      })
    );

    sendJson(
      res,
      200,
      {
        connected: true,
        status: "connected",
        message: "正常連接",
        authMode: setup.authMode,
        authSource: setup.authSource,
        updatedAt: new Date().toISOString(),
        activeUsers,
        events
      },
      { "Cache-Control": "s-maxage=15, stale-while-revalidate=60" }
    );
  } catch (error) {
    console.error("analytics realtime failed", error);
    const payload = gaErrorPayload(error);
    analyticsNotConnected(res, payload.message, payload);
  }
}
