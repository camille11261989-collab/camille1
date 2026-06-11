import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

const tradingViewSymbols = [
  { proName: "TWSE:TAIEX", title: "台股加權" },
  { proName: "TPEX:IX0043", title: "櫃買指數" },
  { proName: "HSI:HSI", title: "恒生指數" },
  { proName: "HSI:HSTECH", title: "恒生科技" },
  { proName: "NASDAQ:IXIC", title: "Nasdaq" },
  { proName: "SP:SPX", title: "S&P 500" },
  { proName: "TVC:DXY", title: "美元指數" },
  { proName: "TVC:US10Y", title: "美債殖利率" },
  { proName: "TVC:VIX", title: "VIX" }
];

const marketGroups = [
  {
    title: "台股配置市場",
    description: "客戶最熟悉的市場，重點觀察加權指數、櫃買與科技權值股的資金集中度",
    items: ["台股加權指數", "櫃買指數"]
  },
  {
    title: "美股全球風向標",
    description: "Nasdaq、S&P 500、美元與美債殖利率，是全球風險偏好與資金成本的核心參考",
    items: ["Nasdaq", "S&P 500", "美元指數", "美債殖利率", "VIX"]
  },
  {
    title: "港股估值修復",
    description: "港股與恒生科技代表低估值市場的修復彈性，觀察資金回流與風險重新定價",
    items: ["恒生指數", "恒生科技指數"]
  }
];

function TradingViewTickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetTarget = document.createElement("div");
    widgetTarget.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.text = JSON.stringify({
      symbols: tradingViewSymbols,
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "zh_TW"
    });

    container.appendChild(widgetTarget);
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container market-widget-shell min-h-[74px] overflow-hidden rounded border border-white/[0.08] bg-ink-950/55"
      aria-label="TradingView 全球市場即時看板"
    />
  );
}

export default function GlobalMarketBoard() {
  return (
    <section id="global-markets" className="relative border-t border-white/[0.08] bg-ink-950 py-14 md:py-16 xl:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(123,200,216,0.13),transparent_30rem),radial-gradient(circle_at_88%_18%,rgba(200,163,92,0.06),transparent_26rem)]" />
      <div className="absolute inset-0 bg-fine-grid opacity-25 [background-size:58px_58px]" />
      <div className="market-board-flow pointer-events-none absolute inset-x-0 top-16 h-40 opacity-70" />

      <div className="site-shell relative">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-end"
        >
          <div>
            <p className="font-plex text-xs uppercase tracking-[0.24em] text-signal-cyan/80">
              Global Market Board
            </p>
            <h2 className="mt-3 font-plex text-3xl font-medium leading-tight text-white md:text-5xl">
              全球市場即時看板
            </h2>
          </div>
          <p className="max-w-3xl text-sm leading-7 text-steel-300 md:text-base md:leading-8">
            美股是全球風向標，港股是估值修復與資金回流機會，台股則是台灣投資人最熟悉的配置市場。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ delay: 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="interactive-surface panel relative mt-8 overflow-hidden rounded-md p-3 shadow-panel md:mt-9 md:p-4"
        >
          <div className="slide-scan absolute inset-x-0 top-0 h-px" />
          <div className="relative">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-steel-500">TradingView Widget</p>
                <h3 className="mt-1.5 font-plex text-xl font-medium text-white">跨市場報價觀察</h3>
              </div>
              <p className="w-fit rounded border border-signal-amber/30 px-3 py-1.5 text-xs text-signal-amber">
                無需前端 API Key
              </p>
            </div>

            <div className="mt-4">
              <TradingViewTickerTape />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {marketGroups.map((group, index) => (
                <motion.article
                  key={group.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-90px" }}
                  transition={{ delay: 0.16 + index * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="data-card group relative min-h-[190px] overflow-hidden rounded border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-signal-cyan/30 hover:bg-white/[0.04]"
                >
                  <div className="pointer-events-none absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-signal-cyan/70" />
                  <p className="font-plex text-xs text-steel-500">{String(index + 1).padStart(2, "0")}</p>
                  <h4 className="mt-3 font-plex text-xl font-medium text-white">{group.title}</h4>
                  <p className="mt-3 text-sm leading-6 text-steel-300">{group.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="rounded border border-white/[0.08] bg-ink-950/50 px-2.5 py-1 text-[11px] leading-4 text-steel-400 transition group-hover:border-signal-cyan/20"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-4 rounded border border-white/[0.06] bg-ink-950/45 px-3 py-2.5 text-xs leading-5 text-steel-500">
              即時報價由 TradingView Widget 提供，實際更新頻率與延遲時間依交易所、資料商與使用者所在地規則而定。
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
