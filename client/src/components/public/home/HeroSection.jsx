import { ArrowDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import PublicButton from "../PublicButton";

const HeroSection = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[calc(100svh-72px)] items-center justify-center overflow-hidden bg-[#f7f7f5] px-5 py-20 text-center sm:px-8 lg:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[44%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(24,24,27,0.075),rgba(24,24,27,0.018)_48%,transparent_72%)] sm:h-[42rem] sm:w-[42rem]" />
        <svg
          className="absolute left-1/2 top-[44%] h-[min(94vw,780px)] w-[min(94vw,780px)] -translate-x-1/2 -translate-y-1/2 text-zinc-900/[0.075]"
          viewBox="0 0 800 800"
          fill="none"
        >
          <circle cx="400" cy="400" r="230" stroke="currentColor" />
          <circle cx="400" cy="400" r="300" stroke="currentColor" strokeDasharray="2 10" />
          <path d="M100 400h600M400 100v600" stroke="currentColor" strokeDasharray="1 9" />
          <circle cx="400" cy="170" r="3" fill="currentColor" />
          <circle cx="610" cy="520" r="3" fill="currentColor" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#f7f7f5] to-transparent" />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55 }}
          className="inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 sm:text-xs"
        >
          <span className="h-px w-7 bg-zinc-400" />
          Glow Ventures · Since 2017
          <span className="h-px w-7 bg-zinc-400" />
        </motion.p>

        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.75, delay: reduceMotion ? 0 : 0.06 }}
         className="mx-auto mt-7 max-w-5xl text-[clamp(2.8rem,7.3vw,6.6rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-zinc-950 sm:mt-6"
        >
          Good ideas,
          <br />
          <span className="bg-gradient-to-r from-zinc-500 via-zinc-900 to-zinc-500 bg-clip-text text-transparent">
            made to move.
          </span>
        </motion.h1>

        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : 0.16 }}
          className="mx-auto mt-7 max-w-xl text-base leading-7 text-zinc-600 sm:mt-9 sm:text-lg sm:leading-8"
        >
          Marketing, public relations, and content-connected around what your
          business wants to do next.
        </motion.p>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.25 }}
          className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row"
        >
          <PublicButton to="/services" variant="primary" className="w-full sm:w-auto">
            Explore our services
          </PublicButton>
          <PublicButton to="/contact" variant="secondary" className="w-full sm:w-auto">
            Start a conversation
          </PublicButton>
        </motion.div>
      </div>

      <a
        href="#what-we-do"
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-zinc-900 sm:flex"
      >
        Discover
        <ArrowDown size={14} aria-hidden="true" />
      </a>
    </section>
  );
};

export default HeroSection;
