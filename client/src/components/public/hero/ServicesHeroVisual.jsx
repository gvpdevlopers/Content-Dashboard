import {
  ArrowUpRight,
  Megaphone,
  PenTool,
  Video,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const services = [
  {
    number: "01",
    title: "Internet Marketing",
    description: "Meta · Google · Advertising",
    icon: Megaphone,
    position: "lg:translate-x-5",
  },
  {
    number: "02",
    title: "Public Relations",
    description: "Media · Communications · Outreach",
    icon: PenTool,
    position: "lg:-translate-x-5",
  },
  {
    number: "03",
    title: "Content Production",
    description: "Strategy · Production · Content",
    icon: Video,
    position: "lg:translate-x-5",
  },
];

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.96,
  },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      delay: index * 0.12,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const ServicesHeroVisual = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[580px]">
      {/* Ambient visual glow */}
      <div
        aria-hidden="true"
        className="
          absolute
          left-1/2
          top-1/2
          h-72
          w-72
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-zinc-900/[0.06]
          blur-3xl
          sm:h-96
          sm:w-96
        "
      />

      {/* Decorative orbital rings */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[88%]
          w-[88%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          border
          border-zinc-200/70
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[66%]
          w-[66%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          border
          border-dashed
          border-zinc-200/60
        "
      />

      {/* Central connection point */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.6,
          delay: shouldReduceMotion ? 0 : 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          absolute
          left-1/2
          top-1/2
          z-10
          hidden
          -translate-x-1/2
          -translate-y-1/2
          sm:block
        "
      >
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-zinc-200 bg-white/90 shadow-[0_20px_60px_rgba(24,24,27,0.10)] backdrop-blur-xl">
          <div className="absolute inset-2 rounded-full border border-zinc-100" />

          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white">
            <span className="h-2 w-2 rounded-full bg-white" />
          </div>
        </div>
      </motion.div>

      {/* Connecting lines */}
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
        {/* Top connection */}
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1, scaleY: 1 }
              : { opacity: 0, scaleY: 0 }
          }
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.7,
            delay: shouldReduceMotion ? 0 : 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: "bottom" }}
          className="
            absolute
            left-1/2
            top-[21%]
            h-[29%]
            w-px
            -translate-x-1/2
            bg-gradient-to-b
            from-transparent
            via-zinc-300
            to-zinc-400
          "
        />

        {/* Bottom connection */}
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1, scaleY: 1 }
              : { opacity: 0, scaleY: 0 }
          }
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.7,
            delay: shouldReduceMotion ? 0 : 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: "top" }}
          className="
            absolute
            bottom-[21%]
            left-1/2
            h-[29%]
            w-px
            -translate-x-1/2
            bg-gradient-to-b
            from-zinc-400
            via-zinc-300
            to-transparent
          "
        />
      </div>

      {/* Service Cards */}
      <div className="relative z-20 flex flex-col gap-4 py-6 sm:gap-5 sm:py-8">
        {services.map((service, index) => {
          const Icon = service.icon;

          return (
            <motion.article
              key={service.number}
              custom={index}
              variants={cardVariants}
              initial={shouldReduceMotion ? false : "hidden"}
              animate="visible"
              className={`group relative ${service.position}`}
            >
              {/* Card */}
              <div
                className="
                  relative
                  overflow-hidden
                  rounded-[22px]
                  border
                  border-zinc-200
                  bg-white/90
                  p-4
                  shadow-[0_12px_35px_rgba(24,24,27,0.06)]
                  backdrop-blur-xl
                  transition-all
                  duration-500
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  group-hover:-translate-y-1
                  group-hover:border-zinc-300
                  group-hover:shadow-[0_22px_55px_rgba(24,24,27,0.10)]
                  sm:p-5
                "
              >
                {/* Hover glow */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -right-12
                    -top-12
                    h-28
                    w-28
                    rounded-full
                    bg-zinc-900/[0.04]
                    blur-2xl
                    opacity-0
                    transition-opacity
                    duration-700
                    group-hover:opacity-100
                  "
                />

                <div className="relative flex items-center gap-4">
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
                      bg-zinc-100
                      text-zinc-800
                      shadow-sm
                      transition-all
                      duration-500
                      ease-[cubic-bezier(0.22,1,0.36,1)]
                      group-hover:bg-zinc-950
                      group-hover:text-white
                      group-hover:shadow-md
                    "
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.8}
                      className="
                        transition-transform
                        duration-500
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        group-hover:scale-105
                        group-hover:-rotate-3
                      "
                    />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-[0.16em] text-zinc-400">
                        {service.number}
                      </span>

                      <span className="h-px w-4 bg-zinc-200 transition-all duration-500 group-hover:w-6 group-hover:bg-zinc-400" />
                    </div>

                    <h3 className="mt-1.5 text-sm font-bold tracking-[-0.015em] text-zinc-950 sm:text-base">
                      {service.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {service.description}
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
                      text-zinc-400
                      transition-all
                      duration-500
                      ease-[cubic-bezier(0.22,1,0.36,1)]
                      group-hover:border-zinc-300
                      group-hover:bg-zinc-950
                      group-hover:text-white
                    "
                  >
                    <ArrowUpRight
                      size={15}
                      strokeWidth={1.8}
                      className="
                        transition-transform
                        duration-500
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        group-hover:-translate-y-0.5
                        group-hover:translate-x-0.5
                      "
                    />
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* Floating status badge */}
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
        }}
        className="
          absolute
          -bottom-1
          right-2
          z-30
          hidden
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
          sm:block
          sm:px-4
        "
      >
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Built around your goals
      </motion.div>

      {/* Small decorative dots */}
      <motion.span
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                opacity: [0.35, 0.8, 0.35],
                scale: [1, 1.15, 1],
              }
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-0 top-1/4 h-2 w-2 rounded-full bg-zinc-300"
      />

      <motion.span
        aria-hidden="true"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                opacity: [0.25, 0.7, 0.25],
                scale: [1, 1.1, 1],
              }
        }
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute right-0 top-2/3 h-1.5 w-1.5 rounded-full bg-zinc-400"
      />
    </div>
  );
};

export default ServicesHeroVisual;