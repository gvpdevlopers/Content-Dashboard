import { ArrowUpRight, Sparkles, Target } from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import GradientText from "../GradientText";

const AboutStory = () => {
  return (
    <Section className="bg-[var(--color-surface-soft)] !py-14 sm:!py-16 lg:!py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
        {/* =====================================================
            LEFT
        ====================================================== */}
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
              <Target
                size={13}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <span>Who we are</span>
            </div>

            <h2
              className="
                mt-5
                max-w-xl
                text-3xl
                font-bold
                leading-[1.02]
                tracking-[-0.045em]
                text-zinc-950
                sm:mt-6
                sm:text-4xl
                lg:text-5xl
                xl:text-[3.45rem]
              "
            >
              Growth starts with{" "}
              <GradientText>clarity.</GradientText>
            </h2>

            <p
              className="
                mt-5
                max-w-lg
                text-base
                leading-7
                text-zinc-500
                sm:mt-6
                sm:text-lg
                sm:leading-8
              "
            >
              We bring strategy, creativity, and execution together
              so businesses can turn good ideas into meaningful
              progress.
            </p>
          </div>
        </Reveal>

        {/* =====================================================
            RIGHT
        ====================================================== */}
        <Reveal delay={0.1}>
          <div className="max-w-2xl lg:ml-auto">
            <p
              className="
                text-lg
                font-medium
                leading-8
                tracking-[-0.015em]
                text-zinc-800
                sm:text-xl
                sm:leading-9
                lg:text-[1.35rem]
                lg:leading-9
              "
            >
              Glow Ventures is a marketing, public relations, and
              content production company built to help businesses
              move forward with greater clarity and consistency.
            </p>

            <p
              className="
                mt-5
                text-base
                leading-7
                text-zinc-500
                sm:mt-6
                sm:text-lg
                sm:leading-8
              "
            >
              Since 2017, we have brought different growth
              disciplines together under one connected approach.
              Instead of treating marketing, PR, and content as
              separate activities, we create a clearer path from
              strategy to execution and from execution to growth.
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
                  text-zinc-500
                  shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                "
              >
                <Sparkles
                  size={12}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
              </span>

              <span>Strategy, progress, growth.</span>

              <ArrowUpRight
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
};

export default AboutStory;