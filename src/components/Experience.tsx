import { motion } from "framer-motion";
import { experienceItems } from "../data/site";
import SectionHeader from "./SectionHeader";

export default function Experience() {
  return (
    <section id="experience" className="relative overflow-hidden bg-ink-900 py-24 md:py-32">
      <div className="absolute inset-0 bg-fine-grid opacity-25 [background-size:72px_72px]" />
      <div className="site-shell relative">
        <SectionHeader
          eyebrow="經歷"
          title="用風險視角穿透市場循環 交易系統與全球資本"
          body="工作橫跨市場研究、交易基礎設施與資本流向解讀，也包含在不確定性中維持判斷紀律的能力"
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {experienceItems.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.05, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="panel data-card group relative overflow-hidden rounded-md p-6 md:p-8"
            >
              <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-signal-amber via-signal-cyan to-transparent opacity-55" />
              <div className="flex gap-5">
                <div className="mt-1 font-plex text-sm text-steel-500">{String(index + 1).padStart(2, "0")}</div>
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-signal-amber">{item.kicker}</p>
                  <h3 className="font-plex text-2xl font-medium text-white">{item.title}</h3>
                  <p className="mt-4 max-w-2xl leading-7 text-steel-300">{item.description}</p>
                  <div className="mt-6 h-14 overflow-hidden rounded border border-white/[0.08] bg-ink-950/60">
                    <div className="flex h-full items-end gap-1 px-3 pb-3">
                      {Array.from({ length: 28 }).map((_, barIndex) => (
                        <span
                          key={barIndex}
                          className="w-full rounded-t bg-steel-500/25 transition-colors group-hover:bg-signal-cyan/[0.45]"
                          style={{ height: `${18 + ((barIndex * (index + 5)) % 38)}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
