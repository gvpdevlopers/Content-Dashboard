import OrbitalArtwork from "./OrbitalArtwork";
import { Children } from "react";
import { motion, useReducedMotion } from "framer-motion";
import HeadingCursor from "./HeadingCursor";
import usePointerParallax from "./usePointerParallax";

const PublicDarkCTA = ({ eyebrow, title, highlight, description, children }) => {
  const reduceMotion = useReducedMotion();
  const parallaxRef = usePointerParallax();

  return (
    <section
      ref={parallaxRef}
      className="glow-dark-cta relative isolate overflow-hidden bg-zinc-950 px-4 py-20 text-center text-white sm:px-6 sm:py-28 lg:py-36"
    >
      <OrbitalArtwork variant="cta" />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18, filter: "blur(2px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{
          duration: reduceMotion ? 0 : 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative mx-auto max-w-4xl"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 sm:text-xs">
          {eyebrow}
        </p>
        <HeadingCursor as="h2" className="mt-6 text-4xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
          {title}
          <br />
          <span className="text-zinc-500">{highlight}</span>
        </HeadingCursor>
        {description && (
          <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base sm:leading-8">
            {description}
          </p>
        )}
        {children && (
          <motion.div
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: reduceMotion ? 0 : 0.08,
                  delayChildren: reduceMotion ? 0 : 0.08,
                },
              },
            }}
          >
            {Children.map(children, (child) => (
              <motion.div
                className="w-full sm:w-auto"
                variants={{
                  hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: reduceMotion ? 0 : 0.35 }}
              >
                {child}
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default PublicDarkCTA;
