import { motion } from "framer-motion";
import { expertiseItems, experienceItems } from "../data/site";
import SectionHeader from "./SectionHeader";

export default function Expertise() {
  return (
    <section id="expertise" className="bg-ink-950 py-16 md:py-24 xl:py-28">
      <div className="site-shell">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeader
            eyebrow="專業"
            title="核心專業"
            body="以風險管理作為核心，串接市場研究、量化系統、資本流向與 AI 金融應用"
          />
          <p className="max-w-md text-sm leading-7 text-steel-400">
            我重視的不是資訊量，而是判斷品質。工具可以提高效率，真正決定長期結果的是風險紀律
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:mt-10 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
          {expertiseItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                whileHover={{ y: -6 }}
                transition={{ delay: index * 0.04, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="panel data-card group rounded-md p-4 md:min-h-52 md:p-5"
              >
                <div className="mb-5 flex items-center justify-between md:mb-8">
                  <div className="grid size-10 place-items-center rounded border border-white/10 bg-white/[0.035]">
                    <Icon size={20} className="text-signal-cyan" />
                  </div>
                  <span className="font-plex text-sm text-steel-500">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="font-plex text-xl font-medium text-white">{item.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-steel-300 md:mt-4 md:line-clamp-none md:leading-7">
                  {item.description}
                </p>
                <div className="mt-5 h-px w-10 bg-signal-amber/60 transition-all duration-300 group-hover:w-20 md:mt-6" />
              </motion.article>
            );
          })}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 md:mt-10 md:pt-7">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-plex text-xs uppercase tracking-[0.2em] text-signal-amber">Selected Track Record</p>
              <h3 className="mt-2 font-plex text-2xl font-medium text-white">專業軌跡</h3>
            </div>
            <p className="max-w-lg text-sm leading-7 text-steel-500">
              保留最能代表定位的三個面向，讓訪客快速理解專業深度與實務場景
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {experienceItems.slice(0, 3).map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-90px" }}
                whileHover={{ y: -4 }}
                transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="data-card rounded border border-white/[0.08] bg-white/[0.025] p-4 md:min-h-40"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="font-plex text-xs text-steel-500">{String(index + 1).padStart(2, "0")}</p>
                    <h4 className="mt-3 font-plex text-lg font-medium text-white md:mt-4">{item.title}</h4>
                  </div>
                  <span className="mt-1 h-2 w-2 rounded-full bg-signal-cyan/80" />
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-steel-400 md:line-clamp-none md:leading-7">
                  {item.kicker}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
