import { motion, useReducedMotion } from "framer-motion";

import GradientText from "./GradientText";
import Reveal from "./Reveal";

const PublicHero = ({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  highlight,
  description,
  actions,
  visual,
  meta,
  className = "",
  visualClassName = "",
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className={`relative isolate overflow-hidden bg-white ${className}`}
    >
      {/* =========================================
          AMBIENT BACKGROUND
      ========================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="public-ambient-glow absolute -right-32 -top-32 h-80 w-80 bg-zinc-900/[0.06] sm:h-[30rem] sm:w-[30rem]" />

        <div className="public-ambient-glow absolute -bottom-40 left-1/4 h-80 w-80 bg-zinc-400/[0.05] sm:h-[30rem] sm:w-[30rem]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0)_0%,rgba(255,255,255,0.75)_62%,#fff_100%)]" />
      </div>

      {/* =========================================
          MAIN HERO
      ========================================= */}
      <div className="relative mx-auto flex min-h-[560px] w-full max-w-[1400px] items-center px-3 py-12 sm:px-4 sm:py-12 lg:px-6 lg:py-12">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-20">

          {/* =========================================
              CONTENT
          ========================================= */}
          <div className="mx-auto max-w-4xl text-center lg:mx-0 lg:max-w-3xl lg:text-left">

            {/* Eyebrow */}
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3.5 py-2 text-xs font-bold capitalize tracking-[0.15em] text-zinc-500 shadow-sm backdrop-blur sm:text-sm">
                {EyebrowIcon && <EyebrowIcon size={14} />}
                {eyebrow}
              </div>
            </Reveal>

            {/* Heading */}
            <Reveal delay={0.08}>
              <h1 className="mx-auto mt-6 max-w-4xl text-[clamp(2rem,5.5vw,4.5rem)] font-bold leading-[0.85] tracking-[-0.055em] text-zinc-950 lg:mx-0">
                {title}
                <br />
                <GradientText>{highlight}</GradientText>
              </h1>
            </Reveal>

            {/* Description */}
            <Reveal delay={0.16}>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-500 sm:text-lg sm:leading-8 lg:mx-0">
                {description}
              </p>
            </Reveal>

            {/* Actions */}
            {actions && (
              <Reveal delay={0.24}>
                <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                  {actions}
                </div>
              </Reveal>
            )}

            {/* Meta */}
            {meta && (
              <Reveal delay={0.32}>
                <div className="mt-8 flex justify-center lg:justify-start">
                  {meta}
                </div>
              </Reveal>
            )}
          </div>

          {/* =========================================
              DESKTOP VISUAL ONLY
              
              Hidden below lg.
          ========================================= */}
          {visual && (
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 0,
                      y: 24,
                      scale: 0.97,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.8,
                delay: shouldReduceMotion ? 0 : 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`relative mx-auto hidden w-full max-w-[620px] lg:mx-0 lg:ml-auto lg:block ${visualClassName}`}
            >
              {visual}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PublicHero;