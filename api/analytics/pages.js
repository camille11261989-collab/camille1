import { requireAdmin } from "../../server/utils/adminAuth.js";
import { dimensionValue, gaErrorPayload, getGaSetupStatus, metricValue, runReport } from "../../server/utils/ga4.js";
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
    const report = await runReport({
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePathPlusQueryString" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10
    });

    sendJson(
      res,
      200,
      {
        connected: true,
        status: report.rows?.length ? "connected" : "empty_data",
        message: report.rows?.length ? "正常連接" : "GA4 尚未累積足夠資料",
        authMode: setup.authMode,
        updatedAt: new Date().toISOString(),
        items:
          report.rows?.map((row) => ({
            path: dimensionValue(row, 0),
            title: dimensionValue(row, 1),
            views: metricValue(row, 0),
            users: metricValue(row, 1)
          })) ?? []
      },
      { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" }
    );
  } catch (error) {
    console.error("analytics pages failed", error);
    const payload = gaErrorPayload(error);
    analyticsNotConnected(res, payload.message, payload);
  }
}
