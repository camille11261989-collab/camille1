import { requireAdmin } from "../../server/utils/adminAuth.js";
import {
  activeUsersFor,
  eventCounts,
  gaErrorPayload,
  getGaSetupStatus,
  rowMetrics,
  runReport
} from "../../server/utils/ga4.js";
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
    const [todayUsers, sevenDayUsers, thirtyDayReport, events] = await Promise.all([
      activeUsersFor({ startDate: "today", endDate: "today" }),
      activeUsersFor({ startDate: "7daysAgo", endDate: "today" }),
      runReport({
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "engagementRate" }
        ]
      }),
      eventCounts()
    ]);

    const [thirtyDayUsers, pageViews, averageSessionDuration, bounceRate, engagementRate] = rowMetrics(thirtyDayReport);
    const conversionClicks = (events.click_line ?? 0) + (events.click_contact ?? 0) + (events.click_booking ?? 0);
    const conversionRate = thirtyDayUsers > 0 ? conversionClicks / thirtyDayUsers : 0;

    sendJson(
      res,
      200,
      {
        connected: true,
        status: "connected",
        message: "正常連接",
        updatedAt: new Date().toISOString(),
        todayUsers,
        sevenDayUsers,
        thirtyDayUsers,
        pageViews,
        averageSessionDuration,
        bounceRate,
        engagementRate,
        events,
        conversionRate
      },
      { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" }
    );
  } catch (error) {
    console.error("analytics summary failed", error);
    const payload = gaErrorPayload(error);
    analyticsNotConnected(res, payload.message, payload);
  }
}
