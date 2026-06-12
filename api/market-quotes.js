const DEFAULT_TIMEOUT_MS = 7000;

const quoteSources = [
  { symbol: "^TWII", title: "台股加權", source: "Yahoo Finance TAI" },
  { symbol: "^TWOII", title: "櫃買指數", source: "Yahoo Finance TWO" },
  { symbol: "^HSI", title: "恒生指數", source: "Yahoo Finance HKG" },
  { symbol: "HSTECH.HK", title: "恒生科技", source: "Yahoo Finance HKG" },
  { symbol: "^IXIC", title: "Nasdaq", source: "Yahoo Finance NIM" },
  { symbol: "^GSPC", title: "S&P 500", source: "Yahoo Finance SNP" },
  { symbol: "^N225", title: "日經225", source: "Yahoo Finance OSA" },
  { symbol: "^KS11", title: "韓國KOSPI", source: "Yahoo Finance KSC" }
];

const headers = {
  "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
  "Content-Type": "application/json; charset=utf-8"
};

function send(res, status, body) {
  res.statusCode = status;
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(body));
}

function finiteNumber(value) {
  return Number.isFinite(value) ? value : undefined;
}

async function fetchQuote(source) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(source.symbol)}?range=1d&interval=1d`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        signal: controller.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance ${source.symbol} HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta ?? {};
    const price = finiteNumber(meta.regularMarketPrice);
    const previousClose = finiteNumber(meta.chartPreviousClose ?? meta.previousClose);

    if (!Number.isFinite(price) || !Number.isFinite(previousClose)) {
      throw new Error(`Yahoo Finance ${source.symbol} missing price`);
    }

    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      title: source.title,
      symbol: source.symbol,
      price,
      change,
      changePercent,
      exchange: meta.exchangeName ?? "",
      marketState: meta.marketState ?? "",
      timezone: meta.timezone ?? "",
      source: source.source
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    send(res, 405, { error: "Method Not Allowed" });
    return;
  }

  const settled = await Promise.allSettled(quoteSources.map(fetchQuote));
  const items = settled
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  send(res, 200, {
    connected: items.length >= 6,
    status: items.length >= 6 ? "connected" : "partial",
    message: items.length >= 6 ? "正常連接" : "市場報價資料更新中",
    updatedAt: new Date().toISOString(),
    sourcePolicy: "Yahoo Finance chart API 延遲指數資料 僅供市場觀察",
    items
  });
}
