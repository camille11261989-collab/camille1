import { ArrowUpRight, Mail } from "lucide-react";
import { motion } from "framer-motion";

const contactActions = [
  {
    label: "LINE 傳送訊息",
    description: "掃描行動碼加入 LINE，適合快速開啟對話",
    icon: LineIcon,
    href: "https://line.me/ti/p/abT9W9cEaE"
  },
  {
    label: "電子郵件",
    description: "寄送合作、訪談或專業交流邀約",
    icon: Mail,
    href: "mailto:Camille11261989@gmail.com"
  }
];

function LineIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M16 5.2c-6.3 0-11.4 4.2-11.4 9.3 0 4.6 4.1 8.4 9.7 9.2.4.1.9.3 1 .6.1.3.1.8 0 1.1l-.2 1.1c-.1.3-.3 1.2 1 .6 1.3-.5 7.1-4.1 9.7-7.1 1.8-1.9 1.6-4.4 1.6-5.5 0-5.1-5.1-9.3-11.4-9.3Z"
      />
      <path
        fill="#05070b"
        d="M10.5 17.7h2.9v-1h-1.8v-4.1h-1.1v5.1Zm4.1 0h1.1v-5.1h-1.1v5.1Zm2.5 0h1.1v-3.1l2.3 3.1h1v-5.1h-1.1v3.1l-2.3-3.1h-1v5.1Zm5.7 0h3.1v-1h-2v-1.1h1.8v-1h-1.8v-1h2v-1h-3.1v5.1Z"
      />
    </svg>
  );
}

export default function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden bg-ink-900 py-16 md:py-24 xl:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(79,134,168,0.2),transparent_28rem),radial-gradient(circle_at_84%_70%,rgba(200,163,92,0.12),transparent_30rem)]" />
      <div className="absolute inset-0 bg-fine-grid opacity-25 [background-size:58px_58px]" />
      <div className="site-shell relative">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-end"
        >
          <div>
            <p className="mb-4 font-plex text-xs uppercase tracking-[0.22em] text-signal-amber">聯繫</p>
            <h2 className="font-plex text-5xl font-medium leading-tight text-white md:text-6xl">
              歡迎交流
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-steel-300 md:mt-6 md:text-lg">
              不論是金融市場、量化交易、金融科技創新或策略合作，我都樂於展開有深度、有方向的對話
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {contactActions.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className="data-card group flex min-h-32 flex-col justify-between rounded-md border border-white/10 bg-white/[0.035] p-5 text-white transition hover:border-signal-cyan/40 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-5">
                    <span className="grid size-11 place-items-center rounded border border-white/10 bg-white/[0.04] text-signal-cyan">
                      <Icon className="size-5" />
                    </span>
                    <ArrowUpRight size={18} className="text-steel-500 transition group-hover:text-signal-cyan" />
                  </div>
                  <div>
                    <h3 className="font-plex text-xl font-medium text-white">{action.label}</h3>
                    <p className="mt-3 text-sm leading-6 text-steel-400">{action.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </motion.div>

        <footer className="mt-14 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-sm text-steel-500 md:flex-row">
          <p>© 2026 camille 張若琳 市場風險 全球市場 FinTech</p>
          <p>Less But Better</p>
        </footer>
      </div>
    </section>
  );
}
