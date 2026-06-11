import { ArrowRight, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { intelligenceSlides, marketRadarItems } from "../data/site";
import { trackEvent } from "../services/analytics";
import { loadMarketRadar } from "../services/marketRadar";
import MarketFilm from "./MarketFilm";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

export default function Hero() {
  const [radarItems, setRadarItems] = useState(marketRadarItems);
  const [radarMode, setRadarMode] = useState<"live" | "delayed" | "unavailable">("unavailable");
  const [updatedAt, setUpdatedAt] = useState<string>();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    let mounted = true;

    loadMarketRadar().then((data) => {
      if (!mounted) return;
      setRadarItems(data.items);
      setRadarMode(data.mode ?? "unavailable");
      setUpdatedAt(data.updatedAt);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % intelligenceSlides.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, []);

  const modeLabel =
    radarMode === "live" ? "即時資料" : radarMode === "delayed" ? "延遲資料" : "市場觀察";
  const connectionLabel =
    radarMode === "live" ? "資料已更新" : radarMode === "delayed" ? "部分接入" : "市場觀察";
  const slide = intelligenceSlides[activeSlide];

  return (
    <section id="home" className="relative min-h-[92vh] overflow-hidden bg-ink-950 pt-24 xl:pt-[72px] xl:min-h-screen">
      <MarketFilm />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_36%,rgba(79,134,168,0.24),transparent_34rem)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/30 via-ink-950/[0.66] to-ink-950" />
      <div className="absolute inset-0 bg-fine-grid financial-grid opacity-45" />

      <div className="site-shell relative z-10 grid min-h-[calc(92vh-6rem)] items-center gap-10 py-10 md:py-12 lg:grid-cols-[minmax(0,0.94fr)_minmax(430px,1.06fr)] lg:gap-6 lg:py-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(560px,0.92fr)] xl:gap-8 xl:py-4 2xl:grid-cols-[minmax(0,1.12fr)_minmax(620px,0.88fr)] 2xl:gap-10 2xl:py-6">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12 }}
          className="max-w-5xl"
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 font-plex text-xs uppercase tracking-[0.24em] text-signal-amber"
          >
            市場風險 量化系統 全球資本
          </motion.p>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance font-plex text-[2.65rem] font-medium leading-[1.04] text-white sm:text-5xl md:text-7xl lg:text-[4rem] xl:text-[5.15rem] 2xl:text-[5.5rem]"
          >
            市場看的不是價格
            <span className="block text-steel-300">而是人性與風險</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-lg font-medium text-steel-300 md:text-xl"
          >
            市場風險分析經理　全球市場分析師　量化交易研究者
          </motion.p>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-3xl text-base leading-8 text-steel-400 md:text-lg"
          >
            擁有 12 年以上金融市場分析、風險管理與量化交易系統經驗。專注於全球金融市場中的資本流向、
            機構行為與長期市場結構變化
          </motion.p>
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <a
              href="#insights"
              onClick={() => trackEvent("click_market_note", { placement: "hero_primary" })}
              className="inline-flex items-center justify-center gap-3 rounded border border-white/[0.12] bg-white px-5 py-3 text-sm font-semibold text-ink-950 transition hover:bg-steel-300"
            >
              查看精選觀點 <ArrowRight size={17} />
            </a>
            <a
              href="#contact"
              onClick={() => trackEvent("click_contact", { placement: "hero_secondary" })}
              className="inline-flex items-center justify-center gap-3 rounded border border-white/[0.12] bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              聯繫交流 <MessageSquare size={17} />
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="panel interactive-surface relative mt-10 overflow-hidden rounded-md p-3 shadow-panel lg:hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(123,200,216,0.12),transparent_22rem)]" />
            <div className="slide-scan absolute inset-x-0 top-0 h-px" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-steel-500">Market Radar</p>
                  <h2 className="mt-1.5 font-plex text-lg font-medium text-white">今日市場雷達</h2>
                </div>
                <div className="rounded border border-signal-amber/30 px-2.5 py-1.5 text-[10px] text-signal-amber">
                  {connectionLabel}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {radarItems.map((item, index) => {
                  const toneClass =
                    item.tone === "green"
                      ? "border-emerald-300/18 bg-emerald-300/[0.035]"
                      : item.tone === "yellow"
                        ? "border-signal-amber/22 bg-signal-amber/[0.035]"
                        : "border-signal-cyan/20 bg-signal-cyan/[0.035]";
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 + index * 0.06, duration: 0.5 }}
                      className={`data-card market-signal-card flex min-h-[136px] flex-col overflow-hidden rounded border p-3 pb-5 ${toneClass}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-medium leading-5 text-steel-300">{item.label}</p>
                          <p className="mt-1 font-plex text-base font-medium leading-tight text-white">{item.status}</p>
                        </div>
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-cyan/70" />
                      </div>
                      {item.value ? (
                        <p className="mt-2 line-clamp-2 text-[10px] font-medium leading-4 text-signal-amber">
                          {item.value}
                        </p>
                      ) : null}
                      <p className="mt-auto line-clamp-1 border-t border-white/10 pt-2 text-[8px] uppercase leading-3 tracking-[0.08em] text-steel-500">
                        {item.source}
                      </p>
                      <span className="market-signal-line" />
                    </motion.div>
                  );
                })}
              </div>

              <div className="data-card relative mt-3 overflow-hidden rounded border border-white/[0.08] bg-ink-950/55 p-3">
                <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent,rgba(123,200,216,0.08),transparent)] opacity-70" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-plex text-xs text-steel-500">
                          {String(activeSlide + 1).padStart(2, "0")}
                        </span>
                        <p className="truncate text-[10px] uppercase tracking-[0.2em] text-signal-cyan">
                          {slide.label}
                        </p>
                      </div>
                      <motion.h3
                        key={`mobile-${slide.title}`}
                        initial={{ opacity: 0, y: 8, filter: "blur(5px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="mt-3 font-plex text-xl font-medium leading-tight text-white"
                      >
                        {slide.title}
                      </motion.h3>
                    </div>
                    <motion.div
                      key={`mobile-${slide.value}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className="shrink-0 rounded border border-signal-cyan/25 px-3 py-2 text-right"
                    >
                      <p className="text-[10px] text-steel-500">Signal</p>
                      <p className="font-plex text-lg text-signal-cyan">{slide.value}</p>
                    </motion.div>
                  </div>
                  <motion.p
                    key={`mobile-${slide.body}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="mt-3 text-xs leading-6 text-steel-300"
                  >
                    {slide.body}
                  </motion.p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-signal-amber">{slide.signal}</p>
                    <div className="flex shrink-0 gap-2">
                      {intelligenceSlides.map((item, index) => (
                        <button
                          key={item.label}
                          type="button"
                          aria-label={`切換至 ${item.title}`}
                          onClick={() => setActiveSlide(index)}
                          className={`h-1.5 w-7 rounded-full transition ${
                            index === activeSlide ? "bg-signal-cyan" : "bg-white/15 hover:bg-white/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <motion.div
                    key={`mobile-progress-${activeSlide}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 4.6, ease: "linear" }}
                    className="mt-3 h-px origin-left bg-gradient-to-r from-signal-cyan via-steel-300 to-transparent"
                  />
                </div>
              </div>

              <div className="mt-3 rounded border border-white/[0.06] bg-ink-950/40 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-steel-400">資訊來源</p>
                    <p className="mt-1 text-[10px] leading-5 text-steel-500">
                      {radarMode === "unavailable"
                        ? "參考 S&P 500、Nasdaq、VIX、TWSE 外資資料、Southbound Stock Connect、HSI Valuation 與多因子模型。僅供市場觀察，非投資建議"
                        : "資料由後端代理提供，保留來源、更新時間與資料等級；缺少官方或授權來源時不生成替代數字"}
                    </p>
                  </div>
                  <p className="shrink-0 rounded border border-white/10 px-2 py-1 text-[10px] text-signal-amber">
                    {modeLabel}
                  </p>
                </div>
                {updatedAt ? <p className="mt-1 text-[10px] text-steel-500">更新時間：{updatedAt}</p> : null}
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="panel interactive-surface relative hidden w-full overflow-hidden rounded-md p-2.5 shadow-panel lg:block xl:justify-self-end"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(123,200,216,0.12),transparent_28rem)]" />
          <div className="slide-scan absolute inset-x-0 top-0 h-px" />
          <div className="relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-steel-500">Market Radar</p>
                <h2 className="mt-1.5 font-plex text-xl font-medium text-white">今日市場雷達</h2>
              </div>
              <div className="rounded border border-signal-amber/30 px-3 py-1.5 text-xs text-signal-amber">
                {connectionLabel}
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {radarItems.map((item, index) => {
                const toneClass =
                  item.tone === "green"
                    ? "border-emerald-300/18 bg-emerald-300/[0.035]"
                    : item.tone === "yellow"
                      ? "border-signal-amber/22 bg-signal-amber/[0.035]"
                      : "border-signal-cyan/20 bg-signal-cyan/[0.035]";
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 + index * 0.08, duration: 0.55 }}
                    className={`data-card market-signal-card flex h-[188px] flex-col overflow-hidden rounded border p-2.5 pb-5 xl:h-[176px] ${toneClass}`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium leading-5 text-steel-300">{item.label}</p>
                        <p className="mt-1 font-plex text-[17px] font-medium leading-tight text-white">{item.status}</p>
                      </div>
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-signal-cyan/70" />
                    </div>
                    {item.value ? <p className="text-[11px] font-medium leading-4 text-signal-amber">{item.value}</p> : null}
                    {"description" in item && item.description ? (
                      <p className="mt-1.5 flex-1 text-[10px] leading-[1.48] text-steel-300">{item.description}</p>
                    ) : null}
                    <p className="mt-2 border-t border-white/10 pt-1.5 text-[8px] uppercase leading-[1.35] tracking-[0.08em] text-steel-500">
                      {item.source}
                    </p>
                    <span className="market-signal-line" />
                  </motion.div>
                );
              })}
            </div>

            <div className="data-card relative mt-2.5 overflow-hidden rounded border border-white/[0.08] bg-ink-950/55 p-2.5">
              <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent,rgba(123,200,216,0.08),transparent)] opacity-70" />
              <div className="relative">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-plex text-xs text-steel-500">{String(activeSlide + 1).padStart(2, "0")}</span>
                      <p className="text-xs uppercase tracking-[0.22em] text-signal-cyan">{slide.label}</p>
                    </div>
                    <motion.h3
                      key={slide.title}
                      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-2 font-plex text-[17px] font-medium leading-tight text-white"
                    >
                      {slide.title}
                    </motion.h3>
                  </div>
                  <motion.div
                    key={slide.value}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45 }}
                    className="rounded border border-signal-cyan/25 px-2.5 py-1.5 text-right"
                  >
                    <p className="text-xs text-steel-500">Signal</p>
                    <p className="font-plex text-lg text-signal-cyan">{slide.value}</p>
                  </motion.div>
                </div>
                <motion.p
                  key={slide.body}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.05 }}
                  className="mt-2 max-w-3xl text-[11px] leading-[1.55] text-steel-300"
                >
                  {slide.body}
                </motion.p>
                <div className="mt-2.5 flex items-center justify-between gap-4">
                  <p className="text-[11px] text-signal-amber">{slide.signal}</p>
                  <div className="flex gap-2">
                    {intelligenceSlides.map((item, index) => (
                      <button
                        key={item.label}
                        type="button"
                        aria-label={`切換至 ${item.title}`}
                        onClick={() => setActiveSlide(index)}
                        className={`h-1.5 w-8 rounded-full transition ${
                          index === activeSlide ? "bg-signal-cyan" : "bg-white/15 hover:bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <motion.div
                  key={activeSlide}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 4.6, ease: "linear" }}
                  className="mt-2 h-px origin-left bg-gradient-to-r from-signal-cyan via-steel-300 to-transparent"
                />
              </div>
            </div>

            <div className="mt-2.5 rounded border border-white/[0.06] bg-ink-950/40 px-2.5 py-1.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-steel-400">資訊來源</p>
                  <p className="mt-1 text-[9px] leading-4 text-steel-500">
                    {radarMode === "unavailable"
                      ? "參考 S&P 500、Nasdaq、VIX、TWSE 外資資料、Southbound Stock Connect、HSI Valuation 與多因子模型。僅供市場觀察，非投資建議"
                      : "資料由後端代理提供，保留來源、更新時間與資料等級；缺少官方或授權來源時不生成替代數字"}
                  </p>
                </div>
                <p className="shrink-0 rounded border border-white/10 px-2 py-1 text-[10px] text-signal-amber">
                  {modeLabel}
                </p>
              </div>
              {updatedAt ? <p className="mt-1 text-[10px] text-steel-500">更新時間：{updatedAt}</p> : null}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
