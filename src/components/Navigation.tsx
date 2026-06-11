import { Menu, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { navItems } from "../data/site";
import { trackEvent } from "../services/analytics";

export default function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass site-shell flex h-16 items-center justify-between rounded-md px-4 md:px-6"
        aria-label="主要導覽"
      >
        <a
          href="#home"
          className="flex min-w-0 items-center gap-3 font-plex text-sm font-semibold uppercase tracking-[0.18em] text-white md:text-[15px]"
        >
          <span>CAMILLE 張若琳</span>
          <span className="hidden h-4 w-px bg-white/20 lg:block" />
          <span className="hidden text-[11px] font-medium tracking-[0.16em] text-steel-300 lg:inline">
            Risk & Market Research
          </span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => {
                if (item.id === "contact") trackEvent("click_contact", { placement: "desktop_navigation" });
                if (item.id === "insights") trackEvent("click_market_note", { placement: "desktop_navigation" });
              }}
              className="text-sm text-steel-300 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <a
            href="https://line.me/ti/p/abT9W9cEaE"
            onClick={() => trackEvent("click_line", { placement: "desktop_navigation" })}
            className="rounded border border-white/[0.12] bg-white px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-steel-300"
          >
            LINE 聯繫
          </a>
        </div>

        <button
          type="button"
          aria-label="切換導覽選單"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
          className="grid size-10 place-items-center rounded border border-white/10 text-white lg:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </motion.nav>

      {open ? (
        <div id="mobile-navigation" className="site-shell glass mt-2 rounded-md p-4 lg:hidden">
          <div className="grid gap-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => {
                  if (item.id === "contact") trackEvent("click_contact", { placement: "mobile_navigation" });
                  if (item.id === "insights") trackEvent("click_market_note", { placement: "mobile_navigation" });
                  setOpen(false);
                }}
                className="rounded px-3 py-3 text-sm text-steel-300 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <a
              href="https://line.me/ti/p/abT9W9cEaE"
              onClick={() => {
                trackEvent("click_line", { placement: "mobile_navigation" });
                setOpen(false);
              }}
              className="mt-2 rounded border border-white/[0.12] bg-white px-4 py-3 text-center text-sm font-medium text-ink-950"
            >
              LINE 聯繫
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
