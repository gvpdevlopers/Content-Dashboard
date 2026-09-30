import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import Section from "../Section";
import Reveal from "../Reveal";

const disciplines = [
  {
    number: "01",
    title: "Internet marketing",
    summary: "Reach the people who matter.",
    detail:
      "Build a clearer digital presence, connect your business with the right audiences, and create marketing that builds visibility, trust, and growth.",
  },
  {
    number: "02",
    title: "Public relations",
    summary: "Give your story a wider reach.",
    detail:
      "Shape how your brand is understood, build visibility, and create meaningful conversations around your work.",
  },
  {
    number: "03",
    title: "Content production",
    summary: "Make the story worth stopping for.",
    detail:
      "Bring ideas to life through considered scripting and production designed to capture attention, create impact, and drive meaningful engagement.",
  },
];

const IntroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const activeDiscipline = disciplines[activeIndex];

  return (
    <Section id="what-we-do" className="bg-white !py-20 sm:!py-28 lg:!py-36">
      <Reveal className="mx-auto max-w-4xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
          What we do
        </p>
        <h2 className="mx-auto mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.065em] text-zinc-950 sm:text-6xl lg:text-7xl">
          Different disciplines.
          <br />
          <span className="text-zinc-400">One clear direction.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-500 sm:mt-8 sm:text-base sm:leading-8">
          We bring the right kind of thinking and making together, so every
          part of the work can move toward the same goal.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 max-w-6xl sm:mt-20">
        <div className="grid border-y border-zinc-200 md:grid-cols-3 md:divide-x md:divide-zinc-200">
          {disciplines.map((discipline, index) => (
            <button
              key={discipline.number}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              aria-pressed={activeIndex === index}
              className={`group relative min-h-32 border-b border-zinc-200 py-6 text-left transition-colors last:border-b-0 md:min-h-44 md:border-b-0 md:px-7 md:py-8 ${
                activeIndex === index ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <span className="flex items-center justify-between text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                {discipline.number}
                <span className={`h-px w-8 transition-colors ${activeIndex === index ? "bg-zinc-900" : "bg-zinc-200"}`} />
              </span>
              <span className="mt-5 block text-xl font-semibold tracking-[-0.045em] sm:text-2xl">
                {discipline.title}
              </span>
              <span className="mt-2 block text-sm text-zinc-500">{discipline.summary}</span>
            </button>
          ))}
        </div>

        <div className="relative min-h-52 overflow-hidden bg-zinc-950 px-6 py-8 text-white sm:min-h-60 sm:px-10 sm:py-10 lg:px-14">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-40" aria-hidden="true">
            <svg viewBox="0 0 500 260" className="h-full w-full" fill="none">
              <path d="M80 220C120 80 280 40 470 55" stroke="white" strokeOpacity=".35" />
              <path d="M160 260C200 120 350 80 520 96" stroke="white" strokeOpacity=".2" />
              <circle cx="390" cy="70" r="54" stroke="white" strokeOpacity=".5" />
              <circle cx="390" cy="70" r="82" stroke="white" strokeOpacity=".18" strokeDasharray="2 8" />
            </svg>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeDiscipline.number}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }}
              className="relative max-w-2xl"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                {activeDiscipline.number} / {activeDiscipline.title}
              </p>
              <p className="mt-4 text-xl font-medium leading-relaxed tracking-[-0.025em] text-white sm:text-2xl lg:text-3xl">
                {activeDiscipline.detail}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
};

export default IntroSection;
