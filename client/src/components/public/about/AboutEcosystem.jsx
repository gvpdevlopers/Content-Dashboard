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
      "Digital marketing across channels such as Meta, Google, and native advertising.",
    icon: Megaphone,
  },
  {
    number: "02",
    title: "Public Relations",
    description:
      "Build awareness through media coverage, communications, and influencer outreach.",
    icon: PenTool,
  },
  {
    number: "03",
    title: "Content Production",
    description:
      "Develop engaging content from scripting through production.",
    icon: Video,
  },
];

const AboutEcosystem = () => {
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

              <span>Our ecosystem</span>
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
              Different disciplines.{" "}
              <GradientText>One direction.</GradientText>
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
              Glow Ventures brings multiple areas of marketing and
              communication together as part of a broader growth
              ecosystem.
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
                Different capabilities. One connected approach.
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
          ECOSYSTEM CARDS
      ====================================================== */}
      <Stagger
        className="
          mt-9
          grid
          gap-4
          sm:mt-10
          md:grid-cols-3
          lg:mt-12
        "
      >
        {ecosystem.map((item) => {
          const Icon = item.icon;

          return (
            <StaggerItem key={item.title}>
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
                  bg-[var(--color-surface-soft)]
                  p-5
                  shadow-[0_4px_18px_rgba(24,24,27,0.025)]
                  transition-all
                  duration-500
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  hover:-translate-y-2
                  hover:border-zinc-300
                  hover:bg-white
                  hover:shadow-[0_24px_60px_rgba(24,24,27,0.09)]
                  sm:p-6
                  lg:p-7
                "
              >
                {/* Hover glow */}
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

                {/* Top */}
                <div className="relative flex items-start justify-between">
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
                      bg-white
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
                    />
                  </div>

                  <div className="flex items-center gap-2">
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

                    <ArrowUpRight
                      size={16}
                      strokeWidth={1.8}
                      className="
                        text-zinc-300
                        transition-all
                        duration-500
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        group-hover:-translate-y-0.5
                        group-hover:translate-x-0.5
                        group-hover:text-zinc-900
                      "
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="relative mt-7">
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

                {/* Bottom detail */}
                <div className="relative mt-auto flex items-center gap-2 pt-7">
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-zinc-300
                      transition-all
                      duration-500
                      group-hover:w-5
                      group-hover:bg-zinc-900
                    "
                  />

                  <span
                    className="
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
                    Growth capability
                  </span>
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
              </article>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
};

export default AboutEcosystem;