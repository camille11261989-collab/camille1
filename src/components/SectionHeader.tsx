import { motion } from "framer-motion";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  body?: string;
};

export default function SectionHeader({ eyebrow, title, body }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-3xl"
    >
      <p className="mb-4 font-plex text-xs uppercase tracking-[0.22em] text-signal-amber">{eyebrow}</p>
      <h2 className="text-balance font-plex text-4xl font-medium leading-tight text-white md:text-5xl xl:text-6xl">
        {title}
      </h2>
      {body ? <p className="mt-5 max-w-2xl text-base leading-8 text-steel-300 md:text-lg">{body}</p> : null}
    </motion.div>
  );
}
