import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const tradingViewSymbols = [
  { proName: "INDEX:TAIEX", title: "台股加權" },
  { proName: "AMEX:SPY", title: "S&P 500 ETF" },
  { proName: "HSI:HSI", title: "恒生指數" },
  { proName: "HSI:HSTECH", title: "恒生科技" },
  { proName: "NASDAQ:QQQ", title: "Nasdaq ETF" },
  { proName: "AMEX:EWJ", title: "日本市場 ETF" },
  { proName: "AMEX:EWY", title: "韓國市場 ETF" }
];

function TradingViewTickerTape() {
  const [hasError, setHasError] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = widgetRef.current;
    if (!target) return undefined;
    if (target.dataset.tvWidgetMounted === "true") return undefined;

    setHasError(false);
    target.dataset.tvWidgetMounted = "true";
    target.innerHTML = '<div class="tradingview-widget-container__widget min-h-[46px]"></div>';

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = JSON.stringify({
      symbols: tradingViewSymbols,
      showSymbolLogo: false,
      isTransparent: false,
      displayMode: "adaptive",
      colorTheme: "dark",
      width: "100%",
      height: 46,
      locale: "zh_TW"
    });
    script.onerror = () => setHasError(true);

    const loadTimer = window.setTimeout(() => {
      if (!target.querySelector("iframe")) {
        setHasError(true);
      }
    }, 12000);

    target.appendChild(script);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, []);

  if (hasError) {
    return (
      <div className="grid min-h-16 place-items-center rounded border border-white/[0.08] bg-ink-950/55 px-4 text-sm text-steel-400">
        市場報價資料更新中
      </div>
    );
  }

  return (
    <div className="market-ticker-scroll">
      <div className="market-widget-shell h-[52px] min-h-[52px] w-full min-w-[1180px] rounded border border-white/[0.08] bg-ink-950/55">
        <div ref={widgetRef} className="tradingview-widget-container min-h-[46px]" />
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
                <p className="text-[7px] uppercase tracking-[0.18em] text-steel-500">TradingView Widget</p>
                <h2 className="mt-0.5 font-plex text-[12px] font-medium text-white md:text-[13px]">跨市場報價觀察</h2>
              </div>
            </div>

            <div>
              <TradingViewTickerTape />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
