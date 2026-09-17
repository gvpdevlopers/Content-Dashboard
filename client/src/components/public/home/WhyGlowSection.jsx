import {
  ArrowUpRight,
  Check,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";
import GradientText from "../GradientText";

const benefits = [
  {
    number: "01",
    icon: Layers3,
    title: "One connected experience",
    description:
      "Keep services, requirements, orders, and account activity connected in one platform.",
  },
  {
    number: "02",
    icon: Gauge,
    title: "Built for clarity",
    description:
      "Structured service options make it easier to understand what you are ordering before you commit.",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Reliable workflow",
    description:
      "Your order information and selected requirements stay organized throughout the process.",
  },
  {
    number: "04",
    icon: Sparkles,
    title: "Designed around you",
    description:
      "A modern client experience designed to reduce friction from discovery to delivery.",
  },
];

const WhyGlowSection = () => {
  return (
    <Section className="bg-white !py-14 sm:!py-16 lg:!py-20">
      <div className="grid items-start gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 xl:gap-20">
        {/* =====================================================
            LEFT COLUMN
            STAYS STICKY ON DESKTOP
        ====================================================== */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal>
            <div className="max-w-xl">
              {/* Capsule */}
              <div
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-zinc-200/80
                  bg-zinc-50/80
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

                <span>Why Glow</span>
              </div>

              {/* Heading */}
              <h2
                className="
                  mt-5
                  max-w-xl
                  text-3xl
                  font-bold
                  leading-[1.02]
                  tracking-[-0.045em]
                  text-[var(--color-text-primary)]
                  sm:mt-6
                  sm:text-4xl
                  lg:text-5xl
                  xl:text-[3.45rem]
                "
              >
                A better way to{" "}
                <GradientText>work together.</GradientText>
              </h2>

              {/* Description */}
              <p
                className="
                  mt-5
                  max-w-lg
                  text-base
                  leading-7
                  text-[var(--color-text-muted)]
                  sm:mt-6
                  sm:text-lg
                  sm:leading-8
                "
              >
                The platform brings the client side of the Glow Ventures
                experience into one focused workspace.
              </p>

              {/* Supporting statement */}
              <div
                className="
                  mt-6
                  flex
                  items-center
                  gap-2
                  text-xs
                  font-semibold
                  tracking-[-0.01em]
                  text-zinc-700
                  sm:mt-7
                  sm:text-sm
                "
              >
                <span>Built for a smoother client journey.</span>

                <ArrowUpRight
                  size={15}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>

              {/* Small trust indicator */}
              <div className="mt-8 hidden items-center gap-3 lg:flex">
                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-zinc-200
                    bg-white
                    text-zinc-700
                    shadow-[0_2px_8px_rgba(0,0,0,0.04)]
                  "
                >
                  <Check
                    size={15}
                    strokeWidth={2}
                  />
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-zinc-700">
                    Focused client experience
                  </p>

                  <p className="mt-0.5 text-[10px] text-zinc-400">
                    From discovery to delivery
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* =====================================================
            RIGHT COLUMN
            NORMAL DOCUMENT SCROLL
        ====================================================== */}
        <Stagger className="grid gap-3.5 sm:grid-cols-2">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <StaggerItem key={benefit.title}>
                <article
                  className="
                    group
                    relative
                    flex
                    h-full
                    min-h-[235px]
                    flex-col
                    overflow-hidden
                    rounded-[24px]
                    border
                    border-zinc-200/90
                    bg-[var(--color-surface-soft)]
                    p-5
                    shadow-[0_4px_18px_rgba(24,24,27,0.025)]
                    transition-all
                    duration-500
                    ease-[cubic-bezier(0.22,1,0.36,1)]
                    hover:-translate-y-1.5
                    hover:border-zinc-300
                    hover:bg-white
                    hover:shadow-[0_24px_60px_rgba(24,24,27,0.09)]
                    sm:p-6
                  "
                >
                  {/* Hover glow */}
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
                      bg-zinc-200/50
                      opacity-0
                      blur-3xl
                      transition-opacity
                      duration-500
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
                      h-24
                      bg-gradient-to-t
                      from-zinc-100/70
                      to-transparent
                      opacity-0
                      transition-opacity
                      duration-500
                      group-hover:opacity-100
                    "
                  />

                  {/* Top row */}
                  <div className="relative flex items-center justify-between">
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
                      {benefit.number}
                    </span>

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-zinc-200
                        bg-white
                        text-zinc-600
                        shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                        transition-all
                        duration-400
                        group-hover:border-zinc-900
                        group-hover:bg-zinc-900
                        group-hover:text-white
                        group-hover:shadow-[0_8px_20px_rgba(24,24,27,0.14)]
                      "
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.8}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative mt-7">
                    <h3
                      className="
                        max-w-xs
                        text-lg
                        font-bold
                        tracking-[-0.025em]
                        text-zinc-950
                        sm:text-xl
                      "
                    >
                      {benefit.title}
                    </h3>

                    <p
                      className="
                        mt-2.5
                        text-sm
                        leading-6
                        text-zinc-500
                      "
                    >
                      {benefit.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="relative mt-auto flex items-center justify-between pt-6">
                    <span
                      className="
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-zinc-400
                        transition-colors
                        duration-300
                        group-hover:text-zinc-600
                      "
                    >
                      Client benefit
                    </span>

                    <div
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
                        duration-400
                        group-hover:translate-x-0.5
                        group-hover:border-zinc-900
                        group-hover:bg-zinc-900
                        group-hover:text-white
                      "
                    >
                      <ArrowUpRight
                        size={13}
                        strokeWidth={1.9}
                      />
                    </div>
                  </div>

                  {/* Progress line */}
                  <div className="relative mt-5 h-px overflow-hidden bg-zinc-200/70">
                    <div
                      className="
                        absolute
                        inset-y-0
                        left-0
                        w-0
                        bg-zinc-900
                        transition-all
                        duration-700
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        group-hover:w-full
                      "
                    />
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </Section>
  );
};

export default WhyGlowSection;