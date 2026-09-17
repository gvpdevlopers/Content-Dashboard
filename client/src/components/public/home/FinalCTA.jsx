import { ArrowUpRight, Sparkles } from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import GradientText from "../GradientText";
import PublicButton from "../PublicButton";

const FinalCTA = () => {
  return (
    <Section className="overflow-hidden bg-white !py-12 sm:!py-14 lg:!py-16">
      <Reveal>
        <div
          className="
            relative
            mx-auto
            max-w-5xl
            overflow-hidden
            rounded-[28px]
            border
            border-zinc-200
            bg-[var(--color-surface-soft)]
            px-5
            py-10
            text-center
            shadow-[0_12px_40px_rgba(24,24,27,0.045)]
            sm:rounded-[32px]
            sm:px-8
            sm:py-12
            lg:px-12
            lg:py-14
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
              left-1/2
              top-1/2
              h-72
              w-72
              -translate-x-1/2
              -translate-y-1/2
              bg-zinc-400/[0.10]
              opacity-100
              blur-[90px]
            "
          />

          {/* Top-right subtle glow */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-48
              w-48
              rounded-full
              bg-zinc-200/60
              blur-3xl
            "
          />

          {/* Bottom-left subtle glow */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -bottom-24
              -left-24
              h-48
              w-48
              rounded-full
              bg-zinc-100
              blur-3xl
            "
          />

          {/* Subtle grid */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-[0.025]
            "
            style={{
              backgroundImage:
                "linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            }}
          />

          {/* =====================================================
              CONTENT
          ====================================================== */}
          <div className="relative">
            {/* Capsule */}
            <div
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-zinc-200/90
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

              <span>Ready when you are</span>
            </div>

            {/* Heading */}
            <h2
              className="
                mx-auto
                mt-5
                max-w-3xl
                text-3xl
                font-bold
                leading-[1.04]
                tracking-[-0.045em]
                text-[var(--color-text-primary)]
                sm:mt-6
                sm:text-4xl
                lg:text-5xl
                xl:text-[3.55rem]
              "
            >
              Let’s create something
              <br className="hidden sm:block" />{" "}
              <GradientText>worth talking about.</GradientText>
            </h2>

            {/* Description */}
            <p
              className="
                mx-auto
                mt-5
                max-w-2xl
                text-sm
                leading-7
                text-[var(--color-text-muted)]
                sm:mt-6
                sm:text-base
                sm:leading-8
              "
            >
              Explore our services or connect with the Glow Ventures
              team to take the next step.
            </p>

            {/* Actions */}
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
              <PublicButton
                to="/services"
                variant="primary"
                className="min-w-[170px]"
              >
                Explore Services
              </PublicButton>

              <PublicButton
                to="/contact"
                variant="secondary"
                className="min-w-[190px]"
              >
                Contact Glow Ventures
              </PublicButton>
            </div>

            {/* Supporting line */}
            <div
              className="
                mt-6
                flex
                items-center
                justify-center
                gap-2
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-zinc-400
                sm:mt-7
                sm:text-[11px]
              "
            >
              <span className="h-px w-6 bg-zinc-200" />

              <span>Strategy · Progress · Growth</span>

              <ArrowUpRight
                size={12}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span className="h-px w-6 bg-zinc-200" />
            </div>
          </div>

          {/* Bottom edge detail */}
          <div
            aria-hidden="true"
            className="
              absolute
              inset-x-10
              bottom-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-zinc-300/70
              to-transparent
            "
          />
        </div>
      </Reveal>
    </Section>
  );
};

export default FinalCTA;