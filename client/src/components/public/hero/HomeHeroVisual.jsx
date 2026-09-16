import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const HomeHeroVisual = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      {/* =========================================
          OUTER GLOW
      ========================================= */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -inset-10
          rounded-[3rem]
          bg-gradient-to-br
          from-cyan-400/10
          via-blue-500/10
          to-violet-500/10
          blur-3xl
        "
      />

      {/* =========================================
          MAIN PLATFORM VISUAL
      ========================================= */}
      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                opacity: 0,
                y: 30,
                scale: 0.96,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.9,
          delay: shouldReduceMotion ? 0 : 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative"
      >
        <div
          className="
            public-gradient-border
            relative
            overflow-hidden
            rounded-[28px]
            bg-white/80
            p-2
            shadow-[0_30px_100px_rgba(24,24,27,0.12)]
            backdrop-blur-xl
            sm:rounded-[36px]
            sm:p-3
          "
        >
          <div
            className="
              overflow-hidden
              rounded-[22px]
              border
              border-[var(--color-border-soft)]
              bg-[var(--color-surface-soft)]
              sm:rounded-[28px]
            "
          >
            {/* =========================================
                BROWSER BAR
            ========================================= */}
            <div
              className="
                flex
                h-12
                items-center
                justify-between
                border-b
                border-[var(--color-border-soft)]
                bg-white
                px-4
                sm:h-14
                sm:px-5
              "
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              </div>

              <div className="hidden h-7 w-40 rounded-lg bg-zinc-100 sm:block" />

              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600" />
            </div>

            {/* =========================================
                DASHBOARD
            ========================================= */}
            <div
              className="
                grid
                min-h-[380px]
                grid-cols-[76px_1fr]
                sm:min-h-[460px]
                sm:grid-cols-[104px_1fr]
              "
            >
              {/* Sidebar */}
              <div
                className="
                  border-r
                  border-[var(--color-border-soft)]
                  bg-white
                  p-3
                  sm:p-4
                "
              >
                <div
                  className="
                    mb-8
                    h-8
                    w-8
                    rounded-xl
                    bg-[var(--color-text-primary)]
                    sm:h-9
                    sm:w-9
                  "
                />

                <div className="space-y-3">
                  <div className="h-8 rounded-lg bg-zinc-100" />
                  <div className="h-8 rounded-lg bg-zinc-50" />
                  <div className="h-8 rounded-lg bg-zinc-50" />
                  <div className="h-8 rounded-lg bg-zinc-50" />
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="h-3 w-20 rounded-full bg-zinc-200" />

                    <div
                      className="
                        mt-3
                        h-7
                        w-40
                        rounded-lg
                        bg-zinc-900/90
                        sm:w-52
                      "
                    />
                  </div>

                  <div className="h-9 w-20 rounded-full bg-zinc-900" />
                </div>

                {/* Service cards */}
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    "from-cyan-50 to-white",
                    "from-blue-50 to-white",
                    "from-violet-50 to-white",
                  ].map((gradient) => (
                    <div
                      key={gradient}
                      className={`
                        rounded-2xl
                        border
                        border-zinc-200
                        bg-gradient-to-br
                        ${gradient}
                        p-4
                      `}
                    >
                      <div className="h-7 w-7 rounded-lg bg-white shadow-sm" />

                      <div className="mt-5 h-2.5 w-16 rounded-full bg-zinc-200" />

                      <div className="mt-2 h-2 w-24 rounded-full bg-zinc-100" />
                    </div>
                  ))}
                </div>

                {/* Order panel */}
                <div
                  className="
                    mt-4
                    rounded-2xl
                    border
                    border-zinc-200
                    bg-white
                    p-4
                    shadow-sm
                    sm:p-5
                  "
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-2.5 w-20 rounded-full bg-zinc-200" />

                      <div className="mt-2 h-4 w-32 rounded-md bg-zinc-800" />
                    </div>

                    <div className="rounded-full bg-emerald-50 px-3 py-1.5">
                      <div className="h-2 w-12 rounded-full bg-emerald-400" />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="h-2 rounded-full bg-zinc-100" />

                    <div className="h-2 w-4/5 rounded-full bg-zinc-100" />

                    <div className="h-2 w-3/5 rounded-full bg-zinc-100" />
                  </div>
                </div>

                {/* Small lower cards */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <div className="h-2 w-16 rounded-full bg-zinc-200" />
                    <div className="mt-3 h-3 w-20 rounded-full bg-zinc-100" />
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <div className="h-2 w-16 rounded-full bg-zinc-200" />
                    <div className="mt-3 h-3 w-20 rounded-full bg-zinc-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================
            FLOATING STATUS CARD
        ========================================= */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, -8, 0],
                }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="
            absolute
            -bottom-5
            -left-3
            rounded-2xl
            border
            border-white/80
            bg-white/90
            p-3
            shadow-[0_20px_50px_rgba(24,24,27,0.12)]
            backdrop-blur-xl
            sm:-left-8
            sm:p-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
              "
            >
              <Sparkles size={17} />
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-900">
                Order workflow
              </p>

              <p className="mt-0.5 text-[11px] text-zinc-500">
                Simple. Clear. Centralized.
              </p>
            </div>
          </div>
        </motion.div>

        {/* =========================================
            SMALL FLOATING INDICATOR
        ========================================= */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, -5, 0],
                }
          }
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="
            absolute
            -right-2
            top-[16%]
            hidden
            items-center
            gap-2
            rounded-full
            border
            border-zinc-200
            bg-white/90
            px-3
            py-2
            text-[10px]
            font-semibold
            text-zinc-500
            shadow-[0_15px_40px_rgba(24,24,27,0.08)]
            backdrop-blur-xl
            sm:flex
          "
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Platform ready
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomeHeroVisual;