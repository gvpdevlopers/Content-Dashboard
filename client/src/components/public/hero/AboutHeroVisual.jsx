import {
  ArrowUpRight,
  Megaphone,
  PenTool,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const disciplines = [
  {
    number: "01",
    label: "Marketing",
    description: "Create visibility",
    icon: Megaphone,
    position:
      "left-0 top-[18%] lg:left-[2%] lg:top-[18%]",
  },
  {
    number: "02",
    label: "Public Relations",
    description: "Build reputation",
    icon: PenTool,
    position:
      "right-0 top-[18%] lg:right-[2%] lg:top-[18%]",
  },
  {
    number: "03",
    label: "Content",
    description: "Shape the story",
    icon: Video,
    position:
      "bottom-[5%] left-1/2 -translate-x-1/2 lg:bottom-[4%]",
  },
];

const AboutHeroVisual = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[580px]">
      {/* =====================================================
          AMBIENT GLOW
      ===================================================== */}
      <div
        aria-hidden="true"
        className="
          absolute
          left-1/2
          top-1/2
          h-[62%]
          w-[62%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-zinc-900/[0.055]
          blur-[70px]
        "
      />

      {/* =====================================================
          OUTER ORBIT
      ===================================================== */}
      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                rotate: 360,
              }
        }
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[84%]
          w-[84%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          border
          border-zinc-200/70
        "
      >
        {/* Orbit markers */}
        <span className="absolute left-[13%] top-[13%] h-2 w-2 rounded-full bg-zinc-300 shadow-[0_0_12px_rgba(161,161,170,0.3)]" />

        <span className="absolute bottom-[14%] right-[12%] h-1.5 w-1.5 rounded-full bg-zinc-400 shadow-[0_0_10px_rgba(113,113,122,0.25)]" />
      </motion.div>

      {/* =====================================================
          INNER ORBIT
      ===================================================== */}
      <motion.div
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                rotate: -360,
              }
        }
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[62%]
          w-[62%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          border
          border-dashed
          border-zinc-200/70
        "
      />

      {/* =====================================================
          SUBTLE CROSS AXIS
      ===================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          hidden
          h-[72%]
          w-px
          -translate-x-1/2
          -translate-y-1/2
          bg-gradient-to-b
          from-transparent
          via-zinc-200
          to-transparent
          sm:block
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          hidden
          h-px
          w-[72%]
          -translate-x-1/2
          -translate-y-1/2
          bg-gradient-to-r
          from-transparent
          via-zinc-200
          to-transparent
          sm:block
        "
      />

      {/* =====================================================
          CENTRAL GROWTH SYSTEM
      ===================================================== */}
      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: 0,
                scale: 0.88,
              }
        }
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.8,
          delay: shouldReduceMotion ? 0 : 0.25,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          absolute
          left-1/2
          top-1/2
          z-20
          -translate-x-1/2
          -translate-y-1/2
        "
      >
        <div
          className="
            relative
            flex
            h-[150px]
            w-[150px]
            flex-col
            items-center
            justify-center
            rounded-[34px]
            border
            border-zinc-200
            bg-white/95
            text-center
            shadow-[0_25px_70px_rgba(24,24,27,0.11)]
            backdrop-blur-xl
            sm:h-[176px]
            sm:w-[176px]
          "
        >
          {/* Inner border */}
          <div
            aria-hidden="true"
            className="
              absolute
              inset-2
              rounded-[28px]
              border
              border-zinc-100
            "
          />

          {/* Icon */}
          <div
            className="
              relative
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              bg-zinc-950
              text-white
              shadow-[0_8px_20px_rgba(24,24,27,0.15)]
            "
          >
            <Sparkles
              size={20}
              strokeWidth={1.8}
            />
          </div>

          {/* Label */}
          <p
            className="
              relative
              mt-4
              text-[9px]
              font-bold
              uppercase
              tracking-[0.2em]
              text-zinc-400
            "
          >
            Core Focus
          </p>

          {/* Title */}
          <p
            className="
              relative
              mt-1
              text-[15px]
              font-bold
              tracking-[-0.025em]
              text-zinc-950
              sm:text-lg
            "
          >
            Meaningful Growth
          </p>

          {/* Progress indicator */}
          <div className="relative mt-3 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
            <span className="h-px w-5 bg-zinc-200" />
            <TrendingUp
              size={11}
              className="text-zinc-400"
            />
          </div>
        </div>
      </motion.div>

      {/* =====================================================
          CONNECTING LINES
      ===================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          hidden
          sm:block
        "
      >
        {/* Left */}
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1, scaleX: 1 }
              : { opacity: 0, scaleX: 0 }
          }
          animate={{
            opacity: 1,
            scaleX: 1,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.7,
            delay: shouldReduceMotion ? 0 : 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: "right" }}
          className="
            absolute
            left-[20%]
            top-[38%]
            h-px
            w-[30%]
            bg-gradient-to-r
            from-zinc-200
            to-zinc-400
          "
        />

        {/* Right */}
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1, scaleX: 1 }
              : { opacity: 0, scaleX: 0 }
          }
          animate={{
            opacity: 1,
            scaleX: 1,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.7,
            delay: shouldReduceMotion ? 0 : 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: "left" }}
          className="
            absolute
            right-[20%]
            top-[38%]
            h-px
            w-[30%]
            bg-gradient-to-r
            from-zinc-400
            to-zinc-200
          "
        />

        {/* Bottom */}
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1, scaleY: 1 }
              : { opacity: 0, scaleY: 0 }
          }
          animate={{
            opacity: 1,
            scaleY: 1,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.7,
            delay: shouldReduceMotion ? 0 : 0.75,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: "top" }}
          className="
            absolute
            left-1/2
            top-[50%]
            h-[27%]
            w-px
            -translate-x-1/2
            bg-gradient-to-b
            from-zinc-400
            to-zinc-200
          "
        />
      </div>

      {/* =====================================================
          DISCIPLINE CARDS
      ===================================================== */}
      {disciplines.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.number}
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 0,
                    y: 18,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.65,
              delay: shouldReduceMotion
                ? 0
                : 0.6 + index * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`absolute z-30 ${item.position}`}
          >
            <div
              className="
                group
                flex
                items-center
                gap-3
                rounded-[20px]
                border
                border-zinc-200
                bg-white/90
                px-3
                py-3
                shadow-[0_12px_35px_rgba(24,24,27,0.07)]
                backdrop-blur-xl
                transition-all
                duration-500
                ease-[cubic-bezier(0.22,1,0.36,1)]
                hover:-translate-y-1
                hover:border-zinc-300
                hover:shadow-[0_20px_50px_rgba(24,24,27,0.10)]
                sm:min-w-[190px]
                sm:px-4
                sm:py-3.5
              "
            >
              {/* Icon */}
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-zinc-100
                  text-zinc-700
                  transition-all
                  duration-500
                  group-hover:bg-zinc-950
                  group-hover:text-white
                "
              >
                <Icon
                  size={17}
                  strokeWidth={1.8}
                  className="
                    transition-transform
                    duration-500
                    group-hover:scale-105
                    group-hover:-rotate-3
                  "
                />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="
                      text-[9px]
                      font-bold
                      tracking-[0.15em]
                      text-zinc-400
                    "
                  >
                    {item.number}
                  </span>

                  <span className="h-px w-4 bg-zinc-200" />
                </div>

                <p
                  className="
                    mt-1
                    text-xs
                    font-bold
                    tracking-[-0.015em]
                    text-zinc-900
                    sm:text-sm
                  "
                >
                  {item.label}
                </p>

                <p className="mt-0.5 text-[10px] text-zinc-500 sm:text-xs">
                  {item.description}
                </p>
              </div>

              {/* Arrow */}
              <ArrowUpRight
                size={14}
                strokeWidth={1.8}
                className="
                  shrink-0
                  text-zinc-400
                  transition-all
                  duration-500
                  group-hover:-translate-y-0.5
                  group-hover:translate-x-0.5
                  group-hover:text-zinc-900
                "
              />
            </div>
          </motion.div>
        );
      })}

      {/* =====================================================
          BOTTOM STATUS
      ===================================================== */}
      <motion.div
        initial={
          shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : {
                opacity: 0,
                y: 10,
              }
        }
        animate={{
          opacity: 1,
          y: shouldReduceMotion ? 0 : [0, -4, 0],
        }}
        transition={{
          opacity: {
            duration: shouldReduceMotion ? 0 : 0.6,
            delay: shouldReduceMotion ? 0 : 1,
          },
          y: {
            duration: 4.5,
            repeat: shouldReduceMotion ? 0 : Infinity,
            ease: "easeInOut",
          },
        }}
        className="
          absolute
          bottom-[1%]
          right-[2%]
          z-40
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
        Strategy → Progress → Growth
      </motion.div>

      {/* =====================================================
          MOBILE FLOW LABEL
      ===================================================== */}
      <div
        className="
          absolute
          bottom-0
          left-1/2
          z-40
          flex
          -translate-x-1/2
          items-center
          gap-2
          whitespace-nowrap
          text-[9px]
          font-semibold
          uppercase
          tracking-[0.14em]
          text-zinc-400
          sm:hidden
        "
      >
        <span>Strategy</span>
        <span className="text-zinc-300">→</span>
        <span>Progress</span>
        <span className="text-zinc-300">→</span>
        <span>Growth</span>
      </div>
    </div>
  );
};

export default AboutHeroVisual;