import { requireAdmin } from "../../server/utils/adminAuth.js";
import { dimensionValue, gaErrorPayload, getGaSetupStatus, metricValue, runReport } from "../../server/utils/ga4.js";
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

async function cityBreakdown(limit = 10) {
  const report = await runReport({
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "country" }, { name: "city" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit
  });

  return (
    report.rows?.map((row) => {
      const country = dimensionValue(row, 0) || "未識別國家";
      const city = dimensionValue(row, 1);
      const normalizedCity = city && city !== "(not set)" ? city : "";

      return {
        label: normalizedCity ? `${country} ${normalizedCity}` : country,
        users: metricValue(row, 0)
      };
    }) ?? []
  );
}

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
    const [channels, devices, deviceModels, cities] = await Promise.all([
      breakdown("sessionDefaultChannelGroup", 8),
      breakdown("deviceCategory", 4),
      breakdown("mobileDeviceModel", 10),
      cityBreakdown(10)
    ]);

    const hasData = channels.length > 0 || devices.length > 0 || deviceModels.length > 0 || cities.length > 0;

    sendJson(
      res,
      200,
      {
        connected: true,
        status: hasData ? "connected" : "no_data",
        message: hasData ? "正常連接" : "GA4 查無資料",
        updatedAt: new Date().toISOString(),
        channels,
        devices,
        deviceModels,
        cities,
        countries: cities
      },
      { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" }
    );
  } catch (error) {
    console.error("analytics sources failed", error);
    const payload = gaErrorPayload(error);
    analyticsNotConnected(res, payload.message, payload);
  }
}
