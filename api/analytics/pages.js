import { requireAdmin } from "../../server/utils/adminAuth.js";
import { dimensionValue, isGaConfigured, metricValue, runReport } from "../../server/utils/ga4.js";
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
    const report = await runReport({
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePathPlusQueryString" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 8
    });

    sendJson(
      res,
      200,
      {
        connected: true,
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
    analyticsNotConnected(res, "資料更新中");
  }
}
