import { requireAdmin } from "../../server/utils/adminAuth.js";
import { dimensionValue, isGaConfigured, metricValue, runReport } from "../../server/utils/ga4.js";
import { analyticsNotConnected, methodNotAllowed, sendJson } from "../../server/utils/http.js";

async function breakdown(dimensionName, limit = 8) {
  const report = await runReport({
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: dimensionName }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit
  });

  return (
    report.rows?.map((row) => ({
      label: dimensionValue(row, 0) || "其他",
      users: metricValue(row, 0)
    })) ?? []
  );
}

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
    const [channels, devices, countries] = await Promise.all([
      breakdown("sessionDefaultChannelGroup", 8),
      breakdown("deviceCategory", 4),
      breakdown("country", 8)
    ]);

    sendJson(
      res,
      200,
      {
        connected: true,
        updatedAt: new Date().toISOString(),
        channels,
        devices,
        countries
      },
      { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" }
    );
  } catch (error) {
    console.error("analytics sources failed", error);
    analyticsNotConnected(res, "資料更新中");
  }
}
