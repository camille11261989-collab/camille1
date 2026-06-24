import { useEffect } from "react";

type AnalyticsParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __xqGaInitialized?: boolean;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let initialized = false;
let trackedStay = false;
let trackedScroll = false;

export function initAnalytics() {
  if (!measurementId || initialized || typeof window === "undefined") return;

  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onerror = () => console.warn("GA4 script failed to load");
    document.head.appendChild(script);
  }

  try {
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      page_title: document.title,
      page_location: window.location.href
    });
  } catch (error) {
    console.warn("GA4 initialization failed", error);
  }
}

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!measurementId || typeof window === "undefined") return;
  initAnalytics();
  try {
    window.gtag?.("event", name, {
      send_to: measurementId,
      event_category: "site_engagement",
      page_path: window.location.pathname + window.location.hash,
      ...params
    });
  } catch (error) {
    console.warn("GA4 event tracking failed", error);
  }
}

export function useEngagementTracking(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    initAnalytics();

    const stayTimer = window.setTimeout(() => {
      if (!trackedStay) {
        trackedStay = true;
        trackEvent("stay_30_seconds");
      }
    }, 30_000);

    const handleScroll = () => {
      if (trackedScroll) return;

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = window.scrollY / scrollable;
      if (progress >= 0.7) {
        trackedScroll = true;
        trackEvent("scroll_70_percent");
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.clearTimeout(stayTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [enabled]);
}
