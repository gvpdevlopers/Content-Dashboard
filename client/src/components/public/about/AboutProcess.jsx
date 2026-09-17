import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Rocket,
  Sparkles,
  Zap,
} from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";
import GradientText from "../GradientText";

const process = [
  {
    number: "01",
    title: "Strategize Plan",
    description:
      "Understand the opportunity, define the direction, and establish a clear plan.",
    icon: Compass,
  },
  {
    number: "02",
    title: "Spark Progress",
    description:
      "Put the plan into motion through focused marketing, communication, and content.",
    icon: Zap,
  },
  {
    number: "03",
    title: "Drive Growth",
    description:
      "Build momentum by continuing to refine the work around the business objective.",
    icon: Rocket,
  },
];

const AboutProcess = () => {
  return (
    <Section className="bg-[var(--color-surface-soft)] !py-14 sm:!py-16 lg:!py-20">
      {/* =====================================================
          SECTION INTRO
      ====================================================== */}
      <div className="grid items-end gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <Reveal>
          <div className="max-w-3xl">
            {/* Capsule */}
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
                text-[11px]
                font-semibold
                tracking-[0.11em]
                text-zinc-500
                shadow-[0_2px_8px_rgba(0,0,0,0.035)]
                backdrop-blur-md
                sm:gap-2
                sm:px-3.5
                sm:text-xs
              "
            >
              <Sparkles
                size={13}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <span>How we work</span>
            </div>

            <h2
              className="
                mt-5
                max-w-3xl
                text-3xl
                font-bold
                leading-[1.02]
                tracking-[-0.045em]
                text-zinc-950
                sm:mt-6
                sm:text-4xl
                lg:text-5xl
                xl:text-[3.5rem]
              "
            >
              Plan with purpose.{" "}
              <GradientText>Move with intent.</GradientText>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="max-w-xl lg:ml-auto">
            <p
              className="
                text-base
                leading-7
                text-zinc-500
                sm:text-lg
                sm:leading-8
                lg:text-[1.05rem]
              "
            >
              Our approach connects strategy with action and keeps
              the focus on creating meaningful progress around your
              business objectives.
            </p>

            <div
              className="
                mt-5
                flex
                items-center
                gap-2
                text-xs
                font-semibold
                tracking-[-0.01em]
                text-zinc-700
                sm:text-sm
              "
            >
              <span>
                Clear direction. Focused action. Continued growth.
              </span>

              <ArrowUpRight
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>
          </div>
        </Reveal>
      </div>

      {/* =====================================================
          PROCESS CARDS
      ====================================================== */}
      <Stagger
        className="
          relative
          mt-9
          grid
          gap-4
          sm:mt-10
          lg:mt-12
          lg:grid-cols-3
          lg:gap-5
        "
      >
        {process.map((item, index) => {
          const Icon = item.icon;

          return (
            <StaggerItem key={item.number}>
              <article
                className="
                  group
                  relative
                  flex
                  h-full
                  min-h-[260px]
                  flex-col
                  overflow-hidden
                  rounded-[26px]
                  border
                  border-zinc-200/90
                  bg-white
                  p-5
                  shadow-[0_4px_18px_rgba(24,24,27,0.025)]
                  transition-all
                  duration-500
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  hover:-translate-y-2
                  hover:border-zinc-300
                  hover:shadow-[0_24px_60px_rgba(24,24,27,0.09)]
                  sm:p-6
                  lg:p-7
                "
              >
                {/* =================================================
                    AMBIENT HOVER GLOW
                ================================================== */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -right-20
                    -top-20
                    h-48
                    w-48
                    rounded-full
                    bg-zinc-200/60
                    opacity-0
                    blur-3xl
                    transition-opacity
                    duration-700
                    group-hover:opacity-100
                  "
                />

                {/* Bottom gradient */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    bottom-0
                    h-28
                    bg-gradient-to-t
                    from-zinc-50
                    to-transparent
                    opacity-0
                    transition-opacity
                    duration-500
                    group-hover:opacity-100
                  "
                />

                <div className="relative flex h-full flex-col">
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <span
                      className="
                        text-[10px]
                        font-bold
                        tracking-[0.16em]
                        text-zinc-300
                        transition-colors
                        duration-300
                        group-hover:text-zinc-500
                      "
                    >
                      {item.number}
                    </span>

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-zinc-200
                        bg-zinc-50
                        text-zinc-600
                        shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                        transition-all
                        duration-500
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        group-hover:border-zinc-950
                        group-hover:bg-zinc-950
                        group-hover:text-white
                        group-hover:shadow-[0_10px_24px_rgba(24,24,27,0.15)]
                      "
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                        className="
                          transition-transform
                          duration-500
                          ease-[cubic-bezier(0.22,1,0.36,1)]
                          group-hover:scale-105
                          group-hover:-rotate-3
                        "
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative mt-7">
                    <div className="flex items-center gap-2">
                      <h3
                        className="
                          text-xl
                          font-bold
                          tracking-[-0.03em]
                          text-zinc-950
                        "
                      >
                        {item.title}
                      </h3>

                      <ArrowUpRight
                        size={14}
                        strokeWidth={1.8}
                        className="
                          text-zinc-300
                          opacity-0
                          transition-all
                          duration-500
                          group-hover:translate-x-0.5
                          group-hover:-translate-y-0.5
                          group-hover:text-zinc-700
                          group-hover:opacity-100
                        "
                        aria-hidden="true"
                      />
                    </div>

                    <p
                      className="
                        mt-3
                        max-w-md
                        text-sm
                        leading-6
                        text-zinc-500
                      "
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom indicator */}
                  <div
                    className="
                      relative
                      mt-auto
                      flex
                      items-center
                      justify-between
                      gap-3
                      pt-7
                    "
                  >
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.14em]
                        text-zinc-400
                        transition-colors
                        duration-300
                        group-hover:text-zinc-600
                      "
                    >
                      <span>Step {item.number}</span>

                      <span
                        aria-hidden="true"
                        className="
                          h-px
                          w-6
                          bg-zinc-200
                          transition-all
                          duration-500
                          group-hover:w-10
                          group-hover:bg-zinc-400
                        "
                      />
                    </div>

                    <span
                      className="
                        flex
                        h-7
                        w-7
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-zinc-200
                        bg-white
                        text-zinc-400
                        transition-all
                        duration-500
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        group-hover:border-zinc-900
                        group-hover:bg-zinc-900
                        group-hover:text-white
                      "
                    >
                      <ArrowUpRight
                        size={13}
                        strokeWidth={1.9}
                      />
                    </span>
                  </div>
                </div>

                {/* Bottom progress line */}
                <div
                  aria-hidden="true"
                  className="
                    absolute
                    inset-x-6
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
                    sm:inset-x-7
                  "
                />

                {/* Desktop connector */}
                {index < process.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="
                      absolute
                      -right-3
                      top-1/2
                      z-20
                      hidden
                      h-7
                      w-7
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-zinc-200
                      bg-white
                      text-zinc-400
                      shadow-[0_4px_12px_rgba(24,24,27,0.05)]
                      transition-all
                      duration-300
                      group-hover:border-zinc-300
                      group-hover:text-zinc-700
                      lg:flex
                    "
                  >
                    <ArrowRight
                      size={13}
                      strokeWidth={1.8}
                      className="
                        transition-transform
                        duration-300
                        group-hover:translate-x-0.5
                      "
                    />
                  </div>
                )}
              </article>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
};

export default AboutProcess;