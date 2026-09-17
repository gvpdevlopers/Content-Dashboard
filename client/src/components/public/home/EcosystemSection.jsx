import {
  ArrowUpRight,
  Megaphone,
  PenTool,
  Sparkles,
  Video,
} from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";
import GradientText from "../GradientText";

const ecosystem = [
  {
    number: "01",
    title: "Internet Marketing",
    description:
      "Digital growth initiatives designed to connect brands with the right audiences.",
    icon: Megaphone,
  },
  {
    number: "02",
    title: "Public Relations",
    description:
      "Build visibility, credibility, and meaningful conversations around your brand.",
    icon: PenTool,
  },
  {
    number: "03",
    title: "Content Production",
    description:
      "From scripting to production, create engaging content designed to capture attention.",
    icon: Video,
  },
];

const EcosystemSection = () => {
  return (
    <Section className="bg-[var(--color-surface-soft)] !py-14 sm:!py-16 lg:!py-20">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-16 xl:gap-20">
        {/* =====================================================
            LEFT CONTENT
        ====================================================== */}
        <Reveal>
          <div className="max-w-xl lg:sticky lg:top-28">
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
              <Sparkles size={13} strokeWidth={1.7} aria-hidden="true" />

              <span>The ecosystem</span>
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
              More than <GradientText>a service.</GradientText>
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
              Glow Ventures brings strategy, growth, communication, and content
              together into one broader ecosystem.
            </p>

            {/* Supporting line */}
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
              <span>Different capabilities. One connected direction.</span>

              <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden="true" />
            </div>

            {/* Small ecosystem indicator */}
            <div className="mt-8 hidden items-center gap-3 lg:flex">
              <div className="flex -space-x-1.5">
                {ecosystem.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.number}
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-full
                        border-2
                        border-[var(--color-surface-soft)]
                        bg-white
                        text-zinc-500
                        shadow-sm
                      "
                    >
                      <Icon size={12} strokeWidth={1.8} />
                    </div>
                  );
                })}
              </div>

              <span className="text-[11px] font-medium text-zinc-400">
                3 connected capabilities
              </span>
            </div>
          </div>
        </Reveal>

        {/* =====================================================
            RIGHT ECOSYSTEM CARDS
        ====================================================== */}
        <Stagger className="grid gap-3.5">
          {ecosystem.map((item) => {
            const Icon = item.icon;

            return (
              <StaggerItem key={item.title}>
                <article
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-[24px]
                    border
                    border-zinc-200/90
                    bg-white
                    p-5
                    shadow-[0_4px_18px_rgba(24,24,27,0.025)]
                    transition-all
                    duration-500
                    ease-[cubic-bezier(0.22,1,0.36,1)]
                    hover:-translate-y-1
                    hover:border-zinc-300
                    hover:shadow-[0_24px_60px_rgba(24,24,27,0.09)]
                    sm:p-6
                    lg:p-7
                  "
                >
                  {/* =================================================
                      AMBIENT HOVER EFFECT
                  ================================================== */}
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      -right-24
                      -top-24
                      h-52
                      w-52
                      rounded-full
                      bg-zinc-100
                      opacity-0
                      blur-3xl
                      transition-opacity
                      duration-500
                      group-hover:opacity-100
                    "
                  />

                  {/* Bottom highlight */}
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-0
                      bottom-0
                      h-px
                      bg-zinc-900
                      opacity-0
                      transition-opacity
                      duration-500
                      group-hover:opacity-10
                    "
                  />

                  {/* =================================================
                      CARD CONTENT
                  ================================================== */}
                  <div className="relative flex items-center gap-5 sm:gap-6">
                    {/* Number */}
                    <div className="hidden shrink-0 sm:block">
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
                    </div>

                    {/* Icon */}
                    <div
                      className="
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-zinc-200
                        bg-zinc-50
                        text-zinc-600
                        shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                        transition-all
                        duration-400
                        group-hover:border-zinc-900
                        group-hover:bg-zinc-900
                        group-hover:text-white
                        group-hover:shadow-[0_8px_22px_rgba(24,24,27,0.14)]
                      "
                    >
                      <Icon size={19} strokeWidth={1.8} />
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3
                          className="
                            text-lg
                            font-bold
                            tracking-[-0.025em]
                            text-zinc-950
                            transition-colors
                            duration-300
                            sm:text-xl
                          "
                        >
                          {item.title}
                        </h3>

                        <span
                          className="
                            rounded-full
                            border
                            border-zinc-200
                            bg-zinc-50
                            px-2
                            py-1
                            text-[8px]
                            font-bold
                            uppercase
                            tracking-[0.12em]
                            text-zinc-400
                            transition-all
                            duration-300
                            group-hover:border-zinc-300
                            group-hover:text-zinc-500
                          "
                        >
                          Capability
                        </span>
                      </div>

                      <p
                        className="
                          mt-2
                          max-w-2xl
                          text-sm
                          leading-6
                          text-zinc-500
                        "
                      >
                        {item.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
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
                      <ArrowUpRight size={15} strokeWidth={1.8} />
                    </div>
                  </div>

                  {/* =================================================
                      PROGRESS LINE
                  ================================================== */}
                  <div className="relative mt-5 h-px overflow-hidden bg-zinc-100">
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

export default EcosystemSection;
