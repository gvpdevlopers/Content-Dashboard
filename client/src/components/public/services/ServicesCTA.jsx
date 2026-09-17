import {
  ArrowUpRight,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import GradientText from "../GradientText";
import PublicButton from "../PublicButton";

const ServicesCTA = () => {
  return (
    <Section className="bg-[var(--color-surface-soft)] !py-12 sm:!py-14 lg:!py-16">
      <Reveal>
        <div
          className="
            group
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-zinc-800
            bg-zinc-950
            px-5
            py-10
            text-white
            shadow-[0_30px_80px_rgba(24,24,27,0.14)]
            sm:rounded-[32px]
            sm:px-8
            sm:py-12
            lg:px-14
            lg:py-14
            xl:px-16
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
              -right-24
              -top-32
              h-80
              w-80
              bg-white/[0.08]
              opacity-100
              blur-[90px]
              transition-transform
              duration-[1200ms]
              ease-[cubic-bezier(0.22,1,0.36,1)]
              group-hover:translate-x-4
              group-hover:-translate-y-2
            "
          />

          <div
            aria-hidden="true"
            className="
              public-ambient-glow
              pointer-events-none
              absolute
              -bottom-48
              left-1/3
              h-[28rem]
              w-[28rem]
              bg-zinc-400/[0.08]
              opacity-100
              blur-[100px]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -left-32
              top-1/2
              h-64
              w-64
              -translate-y-1/2
              rounded-full
              bg-zinc-800/40
              blur-[80px]
            "
          />

          {/* Subtle grid */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              opacity-[0.035]
            "
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "52px 52px",
            }}
          />

          {/* Center vignette */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,0.28)_100%)]
            "
          />

          {/* =====================================================
              CONTENT
          ====================================================== */}
          <div
            className="
              relative
              grid
              items-center
              gap-9
              lg:grid-cols-[1fr_auto]
              lg:gap-12
            "
          >
            <div className="max-w-3xl">
              {/* Capsule */}
              <div
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.06]
                  px-3
                  py-1.5
                  text-[11px]
                  font-semibold
                  tracking-[0.11em]
                  text-zinc-300
                  shadow-[0_4px_18px_rgba(0,0,0,0.12)]
                  backdrop-blur-md
                  sm:gap-2
                  sm:px-3.5
                  sm:text-xs
                "
              >
                <LayoutDashboard
                  size={13}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />

                <span>Ready to get started?</span>
              </div>

              {/* Heading */}
              <h2
                className="
                  mt-5
                  max-w-3xl
                  text-3xl
                  font-bold
                  leading-[1.04]
                  tracking-[-0.045em]
                  text-white
                  sm:mt-6
                  sm:text-4xl
                  lg:text-5xl
                  xl:text-[3.55rem]
                "
              >
                Choose your service.
                <br className="hidden sm:block" />{" "}
                <GradientText variant="light">
                  Build your order.
                </GradientText>
              </h2>

              {/* Description */}
              <p
                className="
                  mt-5
                  max-w-2xl
                  text-sm
                  leading-7
                  text-zinc-400
                  sm:mt-6
                  sm:text-base
                  sm:leading-8
                "
              >
                Sign in to access the client platform and configure
                the service that fits your requirements.
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
                  text-zinc-300
                  sm:mt-7
                  sm:text-sm
                "
              >
                <span
                  className="
                    flex
                    h-6
                    w-6
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/10
                    bg-white/[0.06]
                  "
                >
                  <Sparkles
                    size={11}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Configure. Order. Track.
                </span>

                <ArrowUpRight
                  size={13}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="lg:pr-1">
              <PublicButton
                to="/login"
                variant="secondary"
                className="
                  min-w-[190px]
                  shadow-[0_12px_30px_rgba(0,0,0,0.18)]
                "
              >
                Enter Client Platform
              </PublicButton>

              <div
                className="
                  mt-3
                  flex
                  items-center
                  justify-center
                  gap-1.5
                  text-[10px]
                  font-medium
                  text-zinc-500
                  lg:justify-end
                "
              >
                <span>Ready to start?</span>

                <ArrowUpRight
                  size={11}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Bottom edge */}
          <div
            aria-hidden="true"
            className="
              absolute
              inset-x-8
              bottom-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-white/10
              to-transparent
            "
          />
        </div>
      </Reveal>
    </Section>
  );
};

export default ServicesCTA;