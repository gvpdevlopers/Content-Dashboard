import { motion, useReducedMotion } from "framer-motion";

import GradientText from "./GradientText";
import HeadingCursor from "./HeadingCursor";

const PublicHero = ({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  highlight,
  description,
  actions,
  meta,
  className = "",
}) => {
  const reduceMotion = useReducedMotion();
  const enter = (delay = 0, y = 14, duration = 0.6) => ({
    initial: reduceMotion ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0 : duration,
      delay: reduceMotion ? 0 : delay,
      ease: [0.22, 1, 0.36, 1],
    },
  });

  return (
    <section
      className={`relative isolate flex min-h-[calc(100svh-72px)] items-center justify-center overflow-hidden bg-[#f7f7f5] px-5 py-20 text-center sm:px-8 lg:py-24 ${className}`}
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[44%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(24,24,27,0.075),rgba(24,24,27,0.018)_48%,transparent_72%)] sm:h-[42rem] sm:w-[42rem]" />

        <svg
          className="absolute left-1/2 top-[44%] h-[min(94vw,780px)] w-[min(94vw,780px)] -translate-x-1/2 -translate-y-1/2 text-zinc-900/[0.075]"
          viewBox="0 0 800 800"
          fill="none"
        >
          <circle
            cx="400"
            cy="400"
            r="230"
            stroke="currentColor"
          />

          <circle
            cx="400"
            cy="400"
            r="300"
            stroke="currentColor"
            strokeDasharray="2 10"
          />

          <path
            d="M100 400h600M400 100v600"
            stroke="currentColor"
            strokeDasharray="1 9"
          />

          <circle
            cx="400"
            cy="170"
            r="3"
            fill="currentColor"
          />

          <circle
            cx="610"
            cy="520"
            r="3"
            fill="currentColor"
          />
        </svg>

        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#f7f7f5] to-transparent" />
      </div>

      {/* Content */}
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center">
        {/* Eyebrow */}
        {eyebrow && (
          <motion.p
            {...enter(0, 10, 0.55)}
            className="inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 sm:text-xs"
          >
            <span className="h-px w-7 bg-zinc-400" />
            {EyebrowIcon && (
              <EyebrowIcon
                size={13}
                strokeWidth={1.6}
                aria-hidden="true"
              />
            )}
            <span>{eyebrow}</span>
            <span className="h-px w-7 bg-zinc-400" />
          </motion.p>
        )}

        {/* Heading */}
        <HeadingCursor
          as={motion.h1}
          {...enter(0.06, 22, 0.75)}
          className="mx-auto mt-7 max-w-5xl text-[clamp(2.8rem,7vw,6.6rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-zinc-950 sm:mt-6"
        >
            <span className="block leading-[0.94]">
              {title}
            </span>

            {highlight && (
              <span className="mt-1 block leading-[0.94] text-zinc-400">
                <GradientText>{highlight}</GradientText>
              </span>
            )}
        </HeadingCursor>

        {/* Description */}
        {description && (
          <motion.p
            {...enter(0.16, 16, 0.65)}
            className="mx-auto mt-7 max-w-xl text-base leading-7 text-zinc-600 sm:mt-9 sm:text-lg sm:leading-8"
          >
              {description}
          </motion.p>
        )}

        {/* Actions */}
        {actions && (
          <motion.div
            {...enter(0.25, 12, 0.6)}
            className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row"
          >
              {actions}
          </motion.div>
        )}

        {/* Meta */}
        {meta && (
          <motion.div
            {...enter(0.32, 10, 0.55)}
            className="mt-7 flex justify-center"
          >
              {meta}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PublicHero;