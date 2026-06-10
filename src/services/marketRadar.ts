import { marketRadarItems } from "../data/site";

export type MarketRadarItem = (typeof marketRadarItems)[number];

type MarketRadarResponse = {
  items: MarketRadarItem[];
  updatedAt?: string;
  mode?: "live" | "delayed" | "unavailable";
  sourcePolicy?: string;
};

const defaultResponse: MarketRadarResponse = {
  items: marketRadarItems,
  mode: "unavailable"
};

export async function loadMarketRadar(): Promise<MarketRadarResponse> {
  const endpoint = import.meta.env.VITE_MARKET_RADAR_API_URL;

  if (!endpoint) {
    // No API endpoint means the UI must stay in market-observation mode and avoid implying live data.
    return defaultResponse;
  }

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return defaultResponse;
    }

    const data = (await response.json()) as MarketRadarResponse;
    return {
      items: data.items?.length ? data.items : marketRadarItems,
      updatedAt: data.updatedAt,
      mode: data.mode ?? "delayed",
      sourcePolicy: data.sourcePolicy
    };
  } catch {
    return defaultResponse;
  }
}
