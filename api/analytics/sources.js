import { requireAdmin } from "../../server/utils/adminAuth.js";
import { dimensionValue, gaErrorPayload, getGaSetupStatus, metricValue, runReport } from "../../server/utils/ga4.js";
import { analyticsNotConnected, methodNotAllowed, sendJson } from "../../server/utils/http.js";

async function breakdown(dimensionName, limit = 8, req) {
  const report = await runReport({
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: dimensionName }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit
  }, req);

  return (
    report.rows?.map((row) => ({
      label: dimensionValue(row, 0) || "其他",
      users: metricValue(row, 0)
    })) ?? []
  );
}

async function cityBreakdown(limit = 10, req) {
  const report = await runReport({
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "country" }, { name: "city" }],
    metrics: [{ name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit
  }, req);

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

async function deviceModelBreakdown(limit = 10, req) {
  const candidates = [
    { dimension: "mobileDeviceModel", note: "GA4 Mobile Device Model" },
    { dimension: "mobileDeviceBranding", note: "GA4 Mobile Device Branding" },
    { dimension: "operatingSystemWithVersion", note: "GA4 Operating System Version" },
    { dimension: "deviceCategory", note: "GA4 Device Category" }
  ];

  let lastError;
  for (const candidate of candidates) {
    try {
      const items = await breakdown(candidate.dimension, limit, req);
      return { items, dimension: candidate.dimension, note: candidate.note };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

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
    const [channels, devices, deviceModelData, cities] = await Promise.all([
      breakdown("sessionDefaultChannelGroup", 8, req),
      breakdown("deviceCategory", 4, req),
      deviceModelBreakdown(10, req),
      cityBreakdown(10, req)
    ]);

    const deviceModels = deviceModelData.items;
    const hasData = channels.length > 0 || devices.length > 0 || deviceModels.length > 0 || cities.length > 0;

    sendJson(
      res,
      200,
      {
        connected: true,
        status: hasData ? "connected" : "empty_data",
        message: hasData ? "正常連接" : "GA4 尚未累積足夠資料",
        authMode: setup.authMode,
        authSource: setup.authSource,
        updatedAt: new Date().toISOString(),
        channels,
        devices,
        deviceModels,
        deviceModelDimension: deviceModelData.dimension,
        deviceModelNote: deviceModelData.note,
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
