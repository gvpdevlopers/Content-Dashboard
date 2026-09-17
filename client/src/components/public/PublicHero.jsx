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
        {/* Top-right ambient glow */}
        <div className="public-ambient-glow absolute -right-32 -top-32 h-72 w-72 bg-zinc-900/[0.055] sm:h-[28rem] sm:w-[28rem]" />

        {/* Bottom ambient glow */}
        <div className="public-ambient-glow absolute -bottom-40 left-1/4 h-72 w-72 bg-zinc-400/[0.045] sm:h-[28rem] sm:w-[28rem]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.016]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Soft fade */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0)_0%,rgba(255,255,255,0.72)_62%,#fff_100%)]" />
      </div>

      {/* =========================================
          MAIN HERO
      ========================================= */}
      <div className="relative mx-auto flex min-h-[480px] w-full max-w-[1400px] items-center px-4 py-8 sm:min-h-[500px] sm:px-6 sm:py-10 lg:px-8 lg:py-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-20">
          {/* =========================================
              CONTENT
          ========================================= */}
          <div className="mx-auto w-full max-w-4xl text-center lg:mx-0 lg:max-w-3xl lg:text-left">
            {/* Eyebrow */}
            <Reveal>
              <div
                className="
      inline-flex
      items-center
      gap-1.5
      rounded-full
      border
      border-zinc-200/75
      bg-white/70
      px-3
      py-1.5
      text-[11px]
      font-semibold
      capitalize
      tracking-[0.11em]
      text-zinc-500
      shadow-[0_2px_8px_rgba(0,0,0,0.035)]
      backdrop-blur-md
      sm:gap-2
      sm:px-3.5
      sm:py-1.5
      sm:text-xs
    "
              >
                {EyebrowIcon && (
                  <EyebrowIcon size={13} strokeWidth={1.7} aria-hidden="true" />
                )}

                {eyebrow}
              </div>
            </Reveal>

            {/* Heading */}
            <Reveal delay={0.08}>
              <h1
                className="
    mx-auto
    mt-5
    max-w-4xl
    text-[clamp(2.35rem,5.2vw,4.35rem)]
    font-bold
    leading-[0.96]
    tracking-[-0.052em]
    text-zinc-950
    sm:mt-6
    sm:leading-[0.94]
    lg:mx-0
    lg:leading-[0.93]
  "
              >
                <span className="block leading-[1.02]">{title}</span>

                <span className="mt-1 block leading-[1.12] sm:mt-0.5">
                  <GradientText>{highlight}</GradientText>
                </span>
              </h1>
            </Reveal>

            {/* Description */}
            <Reveal delay={0.16}>
              <p className="mx-auto mt-6 max-w-2xl text-[0.95rem] leading-7 text-zinc-500 sm:mt-7 sm:text-lg sm:leading-8 lg:mx-0">
                {description}
              </p>
            </Reveal>

            {/* Actions */}
            {actions && (
              <Reveal delay={0.24}>
                <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center lg:justify-start">
                  {actions}
                </div>
              </Reveal>
            )}

            {/* Meta */}
            {meta && (
              <Reveal delay={0.32}>
                <div className="mt-7 flex justify-center lg:justify-start">
                  {meta}
                </div>
              </Reveal>
            )}
          </div>

          {/* =========================================
              DESKTOP VISUAL ONLY
              Hidden below lg
          ========================================= */}
          {visual && (
            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : {
                      opacity: 0,
                      y: 20,
                      scale: 0.98,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.75,
                delay: shouldReduceMotion ? 0 : 0.1,
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
