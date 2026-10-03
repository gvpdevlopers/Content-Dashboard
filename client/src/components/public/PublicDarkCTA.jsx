import { motion, useReducedMotion } from "framer-motion";
import HeadingCursor from "./HeadingCursor";

const PublicDarkCTA = ({ eyebrow, title, highlight, description, children }) => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-zinc-950 px-4 py-20 text-center text-white sm:px-6 sm:py-28 lg:py-36">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.11),transparent_68%)]" />
        <svg className="absolute left-1/2 top-1/2 h-[min(110vw,860px)] w-[min(110vw,860px)] -translate-x-1/2 -translate-y-1/2 text-white/[0.12]" viewBox="0 0 800 800" fill="none">
          <circle cx="400" cy="400" r="240" stroke="currentColor" />
          <circle cx="400" cy="400" r="320" stroke="currentColor" strokeDasharray="2 10" />
        </svg>
      </div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: reduceMotion ? 0 : 0.65 }}
        className="relative mx-auto max-w-4xl"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 sm:text-xs">
          {eyebrow}
        </p>
        <HeadingCursor as="h2" className="mt-6 text-4xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
          {title}
          <br />
          <span className="text-zinc-500">{highlight}</span>
        </HeadingCursor>
        {description && (
          <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">
            {description}
          </p>
        )}
        {children && (
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {children}
          </div>
        )}
      </motion.div>
    </section>
  );
};

export default PublicDarkCTA;
