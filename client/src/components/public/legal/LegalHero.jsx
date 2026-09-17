import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  ShieldCheck,
} from "lucide-react";

import Reveal from "../Reveal";
import GradientText from "../GradientText";

const LegalHero = ({
  eyebrow,
  title,
  description,
  lastUpdated = "September 2026",
  policyType = "Website & Client Platform",
}) => {
  return (
    <section
      className="
        relative
        isolate
        overflow-hidden
        border-b
        border-zinc-100
        bg-[var(--color-surface-soft)]
      "
    >
      {/* =====================================================
          AMBIENT BACKGROUND
      ====================================================== */}
      <div
        aria-hidden="true"
        className="
          public-ambient-glow
          pointer-events-none
          absolute
          -right-32
          -top-32
          h-64
          w-64
          bg-zinc-900/[0.045]
          sm:h-80
          sm:w-80
          lg:h-96
          lg:w-96
        "
      />

      <div
        aria-hidden="true"
        className="
          public-ambient-glow
          pointer-events-none
          absolute
          -bottom-32
          left-1/4
          h-56
          w-56
          bg-zinc-400/[0.045]
          sm:h-64
          sm:w-64
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          opacity-[0.018]
        "
        style={{
          backgroundImage:
            "linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top,rgba(255,255,255,0)_0%,rgba(255,255,255,0.72)_65%,#fff_100%)]
        "
      />

      {/* =====================================================
          CONTENT
      ====================================================== */}
      <div
        className="
          relative
          mx-auto
          flex
          w-full
          max-w-[1400px]
          items-center
          px-4
          py-9
          sm:px-6
          sm:py-11
          md:py-12
          lg:px-8
          lg:py-14
          xl:py-16
        "
      >
        <div
          className="
            grid
            w-full
            items-center
            gap-7
            md:grid-cols-[1.08fr_0.92fr]
            md:gap-8
            lg:grid-cols-[1.15fr_0.85fr]
            lg:gap-12
            xl:gap-16
          "
        >
          {/* =================================================
              LEFT — HERO CONTENT
          ================================================== */}
          <div className="w-full max-w-4xl">
            <Reveal>
              <div
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-zinc-200/80
                  bg-white/80
                  px-3
                  py-1.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.12em]
                  text-zinc-500
                  shadow-[0_2px_8px_rgba(0,0,0,0.035)]
                  backdrop-blur-md
                  sm:gap-2
                  sm:px-3.5
                  sm:text-xs
                "
              >
                <FileText
                  size={13}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />

                <span>{eyebrow}</span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1
                className="
                  mt-4
                  max-w-4xl
                  text-[clamp(2.2rem,5vw,4.4rem)]
                  font-bold
                  leading-[0.98]
                  tracking-[-0.052em]
                  text-zinc-950
                  sm:mt-5
                  sm:leading-[0.95]
                "
              >
                <span className="block leading-[1.02]">
                  {title}
                </span>

                <span className="mt-0.5 block leading-[1.02]">
                  <GradientText>
                    Glow Ventures.
                  </GradientText>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  leading-6
                  text-zinc-500
                  sm:mt-5
                  sm:text-base
                  sm:leading-7
                  lg:mt-6
                  lg:text-lg
                  lg:leading-8
                "
              >
                {description}
              </p>
            </Reveal>
          </div>

          {/* =================================================
              RIGHT — POLICY INFO CARD
              Visible from tablet (md)
          ================================================== */}
          <Reveal
            delay={0.1}
            className="
              hidden
              w-full
              md:block
            "
          >
            <div
              className="
                group
                relative
                ml-auto
                w-full
                max-w-[400px]
                overflow-hidden
                rounded-[22px]
                border
                border-zinc-200/90
                bg-white/80
                p-4
                shadow-[0_8px_30px_rgba(24,24,27,0.045)]
                backdrop-blur-xl
                transition-all
                duration-500
                ease-[cubic-bezier(0.22,1,0.36,1)]
                hover:-translate-y-1
                hover:border-zinc-300
                hover:shadow-[0_20px_50px_rgba(24,24,27,0.08)]
                sm:p-5
                lg:rounded-[24px]
                lg:p-6
              "
            >
              {/* Card glow */}
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  -right-16
                  -top-16
                  h-36
                  w-36
                  rounded-full
                  bg-zinc-200/60
                  opacity-0
                  blur-3xl
                  transition-opacity
                  duration-700
                  group-hover:opacity-100
                "
              />

              <div className="relative">
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-zinc-200
                      bg-zinc-50
                      text-zinc-600
                      shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                      transition-all
                      duration-500
                      group-hover:border-zinc-950
                      group-hover:bg-zinc-950
                      group-hover:text-white
                      sm:h-11
                      sm:w-11
                      sm:rounded-2xl
                    "
                  >
                    <ShieldCheck
                      size={18}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </div>

                  <span
                    className="
                      rounded-full
                      border
                      border-zinc-200
                      bg-zinc-50
                      px-2.5
                      py-1
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      text-zinc-500
                      sm:px-3
                      sm:py-1.5
                      sm:text-[10px]
                    "
                  >
                    Legal
                  </span>
                </div>

                {/* Card title */}
                <div className="mt-5 sm:mt-6">
                  <p
                    className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-zinc-400
                      sm:text-[10px]
                    "
                  >
                    Policy details
                  </p>

                  <h2
                    className="
                      mt-1.5
                      text-base
                      font-bold
                      tracking-[-0.025em]
                      text-zinc-950
                      sm:mt-2
                      sm:text-lg
                    "
                  >
                    {eyebrow}
                  </h2>
                </div>

                {/* Details */}
                <div
                  className="
                    mt-4
                    border-t
                    border-zinc-100
                    pt-3
                    sm:mt-5
                    sm:pt-4
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                      py-1.5
                      sm:py-2
                    "
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={13}
                        strokeWidth={1.7}
                        className="shrink-0 text-zinc-400"
                        aria-hidden="true"
                      />

                      <span className="text-[11px] text-zinc-500 sm:text-xs">
                        Last updated
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-zinc-800 sm:text-xs">
                      {lastUpdated}
                    </span>
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-3
                      py-1.5
                      sm:py-2
                    "
                  >
                    <div className="flex items-center gap-2">
                      <FileText
                        size={13}
                        strokeWidth={1.7}
                        className="shrink-0 text-zinc-400"
                        aria-hidden="true"
                      />

                      <span className="text-[11px] text-zinc-500 sm:text-xs">
                        Applies to
                      </span>
                    </div>

                    <span className="max-w-[180px] text-right text-[11px] font-semibold text-zinc-800 sm:text-xs">
                      {policyType}
                    </span>
                  </div>
                </div>

                {/* Bottom hint */}
                <div
                  className="
                    mt-3
                    flex
                    items-center
                    gap-2
                    border-t
                    border-zinc-100
                    pt-3
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.1em]
                    text-zinc-400
                    transition-colors
                    duration-300
                    sm:mt-4
                    sm:pt-4
                    sm:text-[10px]
                    group-hover:text-zinc-600
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      shrink-0
                      rounded-full
                      bg-zinc-300
                      transition-all
                      duration-500
                      group-hover:w-4
                      group-hover:bg-zinc-900
                    "
                  />

                  <span>Glow Ventures</span>

                  <ArrowUpRight
                    size={10}
                    strokeWidth={1.8}
                    className="
                      transition-transform
                      duration-300
                      group-hover:-translate-y-0.5
                      group-hover:translate-x-0.5
                    "
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Bottom accent */}
              <div
                aria-hidden="true"
                className="
                  absolute
                  inset-x-5
                  bottom-0
                  h-px
                  origin-left
                  scale-x-0
                  bg-gradient-to-r
                  from-zinc-900
                  via-zinc-500
                  to-transparent
                  transition-transform
                  duration-700
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  group-hover:scale-x-100
                  lg:inset-x-6
                "
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default LegalHero;