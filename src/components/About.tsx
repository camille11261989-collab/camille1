import { motion } from "framer-motion";
import portrait from "../assets/camille-portrait-office-optimized.jpg";
import { coverage, metrics } from "../data/site";
import SectionHeader from "./SectionHeader";

const philosophyLines = [
  "我不習慣只用單一指標判斷市場",
  "比起預測漲跌，我更重視資金流向、估值位置、風險報酬比與市場情緒是否一致",
  "市場不一定每天都有答案，但每一次價格變化背後，都有資金與人性的痕跡"
];

const philosophyMeta = ["Method", "Risk", "Signal"];

export default function About() {
  return (
    <section id="about" className="relative border-t border-white/[0.08] bg-ink-950 py-14 md:py-16 xl:py-20 2xl:py-24">
      <div className="site-shell">
        <div className="grid gap-8 lg:grid-cols-[minmax(340px,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-7 xl:grid-cols-[minmax(380px,0.78fr)_minmax(0,1.22fr)] xl:gap-8 2xl:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[410px] md:max-w-[380px] md:justify-self-center lg:max-w-[400px] lg:justify-self-end xl:max-w-[420px] 2xl:max-w-[430px]"
          >
            <div className="portrait-frame portrait-shadow aspect-[2/3] w-full overflow-hidden rounded-md border border-white/10 bg-ink-900">
              <img
                src={portrait}
                alt="camille 張若琳高端商務人物視覺"
                width="1023"
                height="1537"
                loading="lazy"
                decoding="async"
                className="portrait-image h-full w-full object-cover"
              />
            </div>
            <div className="glass absolute bottom-4 left-4 right-4 rounded-md p-3.5 md:bottom-5 md:left-5 md:right-5 md:p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-signal-amber">市場觀點</p>
              <p className="mt-2 text-sm leading-6 text-steel-300">
                風險不是績效的限制，而是讓績效能夠長期存在的底層結構
              </p>
            </div>
          </motion.div>

          <div className="max-w-4xl">
            <SectionHeader
              eyebrow="關於我"
              title="理解市場不只看圖表"
              body="我相信市場不是單靠新聞推動，而是資本、心理與風險交互作用後的結果"
            />
            <div className="mt-4 max-w-3xl space-y-2.5 text-base leading-7 text-steel-300 md:mt-5 md:space-y-3 md:text-[17px]">
              <p>
                過去 12 年，我經歷不同市場循環，持續研究機構行為、風險管理框架與量化交易系統
              </p>
              <p className="text-white">我的重點不是預測市場，而是理解市場</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5 md:mt-6 md:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="panel data-card flex min-h-[82px] flex-col justify-center rounded-md p-3 md:min-h-[88px]">
                  <p className="font-plex text-2xl font-medium leading-none text-white md:text-[28px]">{metric.value}</p>
                  <p className="mt-2 text-xs leading-4 text-steel-400 md:text-sm">{metric.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 md:mt-5">
              {coverage.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="data-card flex min-h-10 items-center gap-2.5 rounded border border-white/10 bg-white/[0.025] px-3 py-2"
                  >
                    <Icon size={15} className="text-signal-cyan" />
                    <span className="text-sm leading-5 text-steel-300">{item.label}</span>
                  </div>
                );
              })}
            </div>

            <motion.article
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-90px" }}
              transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
              className="interactive-surface group relative mt-5 overflow-hidden rounded-md border border-white/[0.09] bg-white/[0.025] p-4 shadow-line transition-[border-color,box-shadow,background] duration-300 hover:border-signal-cyan/30 hover:bg-white/[0.035] hover:shadow-[0_20px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] md:mt-6 md:p-5"
            >
              <div className="pointer-events-none absolute inset-0 bg-fine-grid bg-[length:48px_48px] opacity-[0.16]" />
              <div className="pointer-events-none absolute left-0 top-0 h-px w-24 bg-gradient-to-r from-signal-cyan/60 to-transparent opacity-80 transition-all duration-500 group-hover:w-36" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-px w-20 bg-gradient-to-l from-signal-amber/45 to-transparent" />
              <span className="pointer-events-none absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-signal-cyan/70 shadow-[0_0_18px_rgba(123,200,216,0.28)]" />

              <div className="relative">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
                  className="font-plex text-[11px] uppercase tracking-[0.24em] text-signal-cyan/80"
                >
                  Market Philosophy
                </motion.p>
                <motion.h3
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.14, duration: 0.5, ease: "easeOut" }}
                  className="mt-2 font-plex text-xl font-medium text-white md:text-2xl"
                >
                  我如何看市場
                </motion.h3>

                <div className="mt-4 space-y-2.5 border-l border-signal-cyan/20 pl-4 text-sm leading-6 text-steel-300 md:max-w-3xl md:text-[15px] md:leading-7">
                  {philosophyLines.map((line, index) => (
                    <motion.p
                      key={line}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + index * 0.08, duration: 0.5, ease: "easeOut" }}
                      className={index === 0 ? "text-white" : ""}
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {philosophyMeta.map((label) => (
                    <span
                      key={label}
                      className="rounded border border-white/[0.08] bg-ink-900/60 px-2.5 py-1 font-plex text-[10px] uppercase tracking-[0.18em] text-steel-500 transition-colors duration-300 group-hover:border-signal-cyan/20 group-hover:text-steel-300"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </motion.article>
          </div>
        </div>
      </div>
    </section>
  );
}
