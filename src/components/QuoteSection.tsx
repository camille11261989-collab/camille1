import { motion } from "framer-motion";

export default function QuoteSection() {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-24 md:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(123,200,216,0.14),transparent_32rem)]" />
      <div className="site-shell relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-6xl text-center"
        >
          <p className="font-plex text-5xl font-medium leading-tight text-white md:text-7xl xl:text-8xl">
            我不預測市場
            <span className="block text-steel-300">我研究市場</span>
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-steel-300">
            因為長期能活下來，靠的不是追求確定性，而是理解風險
          </p>
        </motion.div>
      </div>
    </section>
  );
}
