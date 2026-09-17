import { ArrowUpRight, Sparkles } from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import GradientText from "../GradientText";

const IntroSection = () => {
  return (
    <Section className="bg-white !py-14 sm:!py-16 lg:!py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
        {/* =========================================
            LEFT — INTRO
        ========================================= */}
        <Reveal>
          <div className="max-w-xl">
            {/* Eyebrow */}
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

              <span>The Glow Experience</span>
            </div>

            {/* Heading */}
            <h2
              className="
                mt-5
                max-w-xl
                text-3xl
                font-bold
                leading-[0.98]
                tracking-[-0.045em]
                text-[var(--color-text-primary)]
                sm:mt-6
                sm:text-4xl
                lg:text-5xl
                xl:text-[3.35rem]
              "
            >
              We ignite growth
              <br />
              <GradientText>
                around your ideas.
              </GradientText>
            </h2>
          </div>
        </Reveal>

        {/* =========================================
            RIGHT — EXPERIENCE
        ========================================= */}
        <Reveal delay={0.1}>
          <div className="max-w-2xl lg:ml-auto">
            <p
              className="
                text-lg
                font-medium
                leading-8
                tracking-[-0.015em]
                text-[var(--color-text-secondary)]
                sm:text-xl
                sm:leading-9
                lg:text-[1.35rem]
                lg:leading-9
              "
            >
              Growing a business is hard. Glow Ventures brings marketing,
              public relations, and content production together to make the
              journey clearer, more focused, and easier to move forward.
            </p>

            {/* Experience statement */}
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <span>One connected experience from strategy to execution</span>

              <ArrowUpRight
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>

            {/* Process */}
            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "Strategize Plan",
                "Spark Progress",
                "Drive Growth",
              ].map((item, index) => (
                <div
                  key={item}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-zinc-200
                    bg-white
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-zinc-600
                    shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                  "
                >
                  <span className="text-[9px] font-bold tracking-[0.1em] text-zinc-400">
                    0{index + 1}
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
};

export default IntroSection;