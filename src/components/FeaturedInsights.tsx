import { ArrowUpRight, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { insightItems } from "../data/site";
import SectionHeader from "./SectionHeader";

export default function FeaturedInsights() {
  const [activeInsight, setActiveInsight] = useState<(typeof insightItems)[number] | null>(null);

  useEffect(() => {
    if (!activeInsight) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveInsight(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeInsight]);

  return (
    <>
      <section id="insights" className="border-y border-white/[0.08] bg-ink-900 py-16 md:py-24 xl:py-28">
        <div className="site-shell">
          <SectionHeader
            eyebrow="精選觀點"
            title="關於市場運作邏輯的研究筆記"
            body="從資金流向、估值週期到市場機制，整理那些影響價格卻不一定出現在新聞標題上的重要訊號"
          />

          <LayoutGroup>
            <div className="mt-8 divide-y divide-white/10 border-y border-white/10 md:mt-10">
              {insightItems.map((item, index) => (
                <motion.button
                  key={item.title}
                  type="button"
                  layoutId={`insight-${index}`}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  whileHover={{ x: 8 }}
                  whileTap={{ scale: 0.992 }}
                  transition={{ delay: index * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setActiveInsight(item)}
                  className="data-card insight-row group grid w-full gap-4 py-6 text-left md:grid-cols-[0.16fr_1fr_0.22fr] md:items-start md:gap-5 md:py-8"
                >
                  <div>
                    <p className="font-plex text-sm text-steel-500">{String(index + 1).padStart(2, "0")}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-signal-amber md:mt-3">{item.category}</p>
                  </div>
                  <div>
                    <h3 className="max-w-4xl font-plex text-2xl font-medium leading-tight text-white md:text-3xl xl:text-4xl">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-steel-300 md:leading-7 md:text-base">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between md:justify-end md:gap-6">
                    <p className="text-sm text-steel-500">{item.meta}</p>
                    <span className="grid size-11 place-items-center rounded border border-white/10 text-steel-300 transition group-hover:border-signal-cyan/40 group-hover:text-white">
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </LayoutGroup>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeInsight ? (
          <motion.div
            className="fixed inset-0 z-[90] overflow-y-auto bg-ink-950/88 px-4 py-6 backdrop-blur-xl md:py-10"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(22px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={activeInsight.title}
            onClick={() => setActiveInsight(null)}
          >
            <motion.article
              initial={{ opacity: 0, y: 28, scale: 0.982, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
              transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="insight-reader mx-auto max-w-4xl overflow-hidden rounded-md border border-white/10 bg-ink-900/95 shadow-panel"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-ink-900/92 px-5 py-4 backdrop-blur-xl md:px-8">
                <div>
                  <p className="font-plex text-xs uppercase tracking-[0.22em] text-signal-amber">
                    {activeInsight.category}
                  </p>
                  <p className="mt-1 text-xs text-steel-500">{activeInsight.meta}</p>
                </div>
                <button
                  type="button"
                  aria-label="關閉文章"
                  onClick={() => setActiveInsight(null)}
                  className="grid size-10 place-items-center rounded border border-white/10 text-steel-300 transition hover:border-signal-cyan/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 py-8 md:px-10 md:py-10">
                <p className="font-plex text-sm text-steel-500">
                  {String(insightItems.findIndex((item) => item.title === activeInsight.title) + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-5 max-w-4xl font-plex text-3xl font-medium leading-tight text-white md:text-5xl">
                  {activeInsight.title}
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-steel-300 md:text-lg">{activeInsight.description}</p>

                <div className="mt-8 h-px w-full bg-gradient-to-r from-signal-cyan via-white/20 to-transparent" />

                <div className="mx-auto mt-8 max-w-3xl space-y-5 text-base leading-8 text-steel-300 md:space-y-6 md:text-[17px] md:leading-9">
                  {activeInsight.content.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </motion.article>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
