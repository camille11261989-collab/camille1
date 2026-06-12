import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type MarketQuote = {
  title: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  source?: string;
};

type MarketQuotesResponse = {
  connected: boolean;
  status: string;
  message?: string;
  updatedAt?: string;
  sourcePolicy?: string;
  items?: MarketQuote[];
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: value >= 1000 ? 2 : 3
  }).format(value);
}

function formatChange(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function MarketQuoteTape() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [sourcePolicy, setSourcePolicy] = useState("");
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setHasError(false);

    async function loadQuotes() {
      try {
        const response = await fetch(import.meta.env.VITE_MARKET_QUOTES_API_URL || "/api/market-quotes", {
          headers: { Accept: "application/json" }
        });

        if (!response.ok) throw new Error("market_quotes_failed");

        const data = (await response.json()) as MarketQuotesResponse;
        if (!mountedRef.current) return;

        if (!data.items?.length) {
          setHasError(true);
          return;
        }

        setQuotes(data.items);
        setSourcePolicy(data.sourcePolicy ?? "");
      } catch {
        if (!mountedRef.current) return;
        setHasError(true);
      }
    }

    void loadQuotes();
    const interval = window.setInterval(loadQuotes, 60_000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, []);

  if (hasError || quotes.length === 0) {
    return (
      <div className="grid min-h-16 place-items-center rounded border border-white/[0.08] bg-ink-950/55 px-4 text-sm text-steel-400">
        市場報價資料更新中
      </div>
    );
  }

  const tapeItems = [...quotes, ...quotes];

  return (
    <div className="market-ticker-scroll">
      <div
        className="market-widget-shell h-[52px] min-h-[52px] w-full min-w-[1180px] overflow-hidden rounded border border-white/[0.08] bg-ink-950/55"
        aria-label={sourcePolicy || "跨市場報價資料"}
      >
        <div className="market-quote-track">
          {tapeItems.map((quote, index) => {
            const isPositive = quote.change > 0;
            const isNegative = quote.change < 0;
            const toneClass = isPositive ? "text-emerald-300" : isNegative ? "text-rose-300" : "text-steel-300";

            return (
              <div key={`${quote.symbol}-${index}`} className="market-quote-item">
                <span className="font-plex text-sm font-semibold text-steel-100">{quote.title}</span>
                <span className="font-plex text-sm text-steel-300">{formatPrice(quote.price)}</span>
                <span className={`font-plex text-sm ${toneClass}`}>
                  {formatChange(quote.change)} ({formatPercent(quote.changePercent)})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MarketTicker() {
  return (
    <section id="global-markets" className="relative scroll-mt-28 border-t border-white/[0.08] bg-ink-950 py-2.5 md:py-3">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(123,200,216,0.1),transparent_28rem)]" />
      <div className="absolute inset-0 bg-fine-grid opacity-20 [background-size:58px_58px]" />
      <div className="market-board-flow pointer-events-none absolute inset-x-0 top-4 h-12 opacity-20" />

      <div className="site-shell relative">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="interactive-surface panel relative rounded-md p-2 shadow-panel"
        >
          <div className="slide-scan absolute inset-x-0 top-0 h-px" />
          <div className="relative">
            <div className="mb-1.5 grid gap-1.5 border-b border-white/10 pb-1.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="max-w-4xl">
                <p className="font-plex text-[7px] uppercase tracking-[0.18em] text-signal-cyan/65">
                  Market Framework
                </p>
                <p className="mt-0.5 text-balance font-plex text-[12px] font-medium leading-5 text-steel-200 md:text-[13px]">
                  透過不同市場之間的變化 觀察資金流向估值位置與市場情緒
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-[7px] uppercase tracking-[0.18em] text-steel-500">Index Data Feed</p>
                <h2 className="mt-0.5 font-plex text-[12px] font-medium text-white md:text-[13px]">跨市場報價觀察</h2>
              </div>
            </div>

            <div>
              <MarketQuoteTape />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
