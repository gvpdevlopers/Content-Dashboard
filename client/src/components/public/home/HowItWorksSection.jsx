import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardList,
  CreditCard,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";
import GradientText from "../GradientText";

const steps = [
  {
    number: "01",
    title: "Explore",
    description:
      "Browse the services available through the Glow Ventures platform.",
    icon: Search,
  },
  {
    number: "02",
    title: "Configure",
    description:
      "Choose the right options and provide the requirements for your project.",
    icon: Settings2,
  },
  {
    number: "03",
    title: "Place your order",
    description:
      "Review your selections, confirm the order, and complete the payment.",
    icon: ClipboardList,
  },
  {
    number: "04",
    title: "Track",
    description:
      "Keep everything organized and follow your orders from one place.",
    icon: CreditCard,
  },
];

const HowItWorksSection = () => {
  return (
    <Section className="bg-white !py-14 sm:!py-16 lg:!py-20">
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

              <span>Simple by design</span>
            </div>

            {/* Heading */}
            <h2
              className="
                mt-5
                max-w-3xl
                text-3xl
                font-bold
                leading-[1.02]
                tracking-[-0.045em]
                text-[var(--color-text-primary)]
                sm:mt-6
                sm:text-4xl
                lg:text-5xl
                xl:text-[3.5rem]
              "
            >
              From brief to{" "}
              <GradientText>delivery.</GradientText>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="max-w-xl lg:ml-auto">
            <p
              className="
                text-base
                leading-7
                text-[var(--color-text-muted)]
                sm:text-lg
                sm:leading-8
                lg:text-[1.05rem]
              "
            >
              From finding the right service to tracking your order,
              every step is designed to keep the process clear,
              structured, and easy to manage.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold tracking-[-0.01em] text-zinc-700 sm:text-sm">
              <span>One connected journey from start to finish.</span>

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
          PROCESS
      ====================================================== */}
      <Stagger className="mt-9 grid gap-4 sm:mt-10 md:grid-cols-2 lg:mt-12 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <StaggerItem key={step.number}>
              <div
                className="
                  group
                  relative
                  flex
                  h-full
                  min-h-[245px]
                  flex-col
                  overflow-visible
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
                {/* =================================================
                    HOVER GLOW
                ================================================== */}
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

                {/* Bottom subtle gradient */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    bottom-0
                    h-24
                    bg-gradient-to-t
                    from-zinc-100/60
                    to-transparent
                    opacity-0
                    transition-opacity
                    duration-500
                    group-hover:opacity-100
                  "
                />

                {/* =================================================
                    TOP ROW
                ================================================== */}
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
                    {step.number}
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

                {/* =================================================
                    CONTENT
                ================================================== */}
                <div className="relative mt-7">
                  <h3
                    className="
                      text-xl
                      font-bold
                      tracking-[-0.03em]
                      text-zinc-950
                    "
                  >
                    {step.title}
                  </h3>

                  <p
                    className="
                      mt-2.5
                      text-sm
                      leading-6
                      text-zinc-500
                    "
                  >
                    {step.description}
                  </p>
                </div>

                {/* =================================================
                    STEP FOOTER
                ================================================== */}
                <div className="relative mt-auto flex items-center justify-between pt-6">
                  <div
                    className="
                      flex
                      items-center
                      gap-1.5
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-zinc-400
                      transition-colors
                      duration-300
                      group-hover:text-zinc-600
                    "
                  >
                    <Check
                      size={12}
                      strokeWidth={2}
                    />
                    <span>Step {step.number}</span>
                  </div>

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
                      group-hover:border-zinc-900
                      group-hover:bg-zinc-900
                      group-hover:text-white
                      group-hover:translate-x-0.5
                    "
                  >
                    <ArrowUpRight
                      size={13}
                      strokeWidth={1.9}
                    />
                  </div>
                </div>

                {/* =================================================
                    CONNECTOR
                ================================================== */}
                {index < steps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="
                      absolute
                      -right-3
                      top-1/2
                      z-20
                      hidden
                      -translate-y-1/2
                      lg:flex
                      h-7
                      w-7
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
                    "
                  >
                    <ArrowRight
                      size={13}
                      strokeWidth={1.8}
                    />
                  </div>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
};

export default HowItWorksSection;