import { motion, useReducedMotion } from "framer-motion";

const Reveal = ({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  y = 24,
  amount = 0.2,
  once = true,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        shouldReduceMotion
          ? { opacity: 1 }
          : {
              opacity: 0,
              y,
            }
      }
      whileInView={
        shouldReduceMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              y: 0,
            }
      }
      viewport={{
        once,
        amount,
      }}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;