import { motion } from "framer-motion";
import portrait from "../assets/camille-portrait-office-optimized.jpg";
import { coverage, metrics } from "../data/site";
import SectionHeader from "./SectionHeader";

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
          </div>
        </div>
      </div>
    </section>
  );
}
