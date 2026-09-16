import {
  ArrowRight,
  Compass,
  Rocket,
  Zap,
} from "lucide-react";

import Section from "../Section";
import SectionHeading from "../SectionHeading";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";

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
    <Section className="bg-[var(--color-surface-soft)]">
      <Reveal>
        <SectionHeading
          eyebrow="How we work"
          title="Plan with purpose."
          highlight="Move with intent."
          description="Our approach connects strategy with action and keeps the focus on creating meaningful progress."
        />
      </Reveal>

      <Stagger className="relative mt-10 grid gap-5 lg:grid-cols-3 lg:gap-6">
        {process.map((item, index) => {
          const Icon = item.icon;

          return (
            <StaggerItem key={item.number}>
              <article
                className="
                  group
                  relative
                  h-full
                  overflow-hidden
                  rounded-[26px]
                  border
                  border-zinc-200
                  bg-white
                  p-6
                  shadow-[0_1px_2px_rgba(0,0,0,0.02)]
                  transition-all
                  duration-500
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  hover:-translate-y-1
                  hover:border-zinc-300
                  hover:shadow-[0_20px_50px_rgba(24,24,27,0.09)]
                  sm:p-8
                "
              >
                {/* Subtle hover glow */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -right-16
                    -top-16
                    h-32
                    w-32
                    rounded-full
                    bg-zinc-900/[0.04]
                    blur-3xl
                    opacity-0
                    transition-opacity
                    duration-700
                    group-hover:opacity-100
                  "
                />

                <div className="relative">
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <span
                      className="
                        text-xs
                        font-bold
                        tracking-[0.14em]
                        text-zinc-400
                        transition-colors
                        duration-300
                        group-hover:text-zinc-600
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
                        rounded-xl
                        bg-zinc-100
                        text-zinc-700
                        shadow-sm
                        transition-all
                        duration-500
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        group-hover:bg-zinc-950
                        group-hover:text-white
                        group-hover:shadow-md
                      "
                    >
                      <Icon
                        size={19}
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
                  <div className="mt-8">
                    <h3
                      className="
                        text-xl
                        font-bold
                        tracking-[-0.025em]
                        text-zinc-950
                      "
                    >
                      {item.title}
                    </h3>

                    <p
                      className="
                        mt-3
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
                      mt-8
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-zinc-400
                      transition-colors
                      duration-300
                      group-hover:text-zinc-700
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
                </div>

                {/* Connector */}
                {index < process.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="
                      absolute
                      -bottom-3
                      left-1/2
                      z-10
                      flex
                      -translate-x-1/2
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-zinc-200
                      bg-white
                      p-1.5
                      text-zinc-400
                      shadow-sm
                      transition-all
                      duration-500
                      group-hover:border-zinc-300
                      group-hover:text-zinc-700
                      lg:-right-3
                      lg:bottom-auto
                      lg:left-auto
                      lg:top-1/2
                      lg:translate-x-1/2
                      lg:-translate-y-1/2
                    "
                  >
                    <ArrowRight
                      size={13}
                      className="
                        rotate-90
                        transition-transform
                        duration-500
                        lg:rotate-0
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