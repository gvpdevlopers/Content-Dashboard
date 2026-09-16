import { motion, useReducedMotion } from "framer-motion";

const Stagger = ({
  children,
  className = "",
  delay = 0,
  stagger = 0.08,
  once = true,
  amount = 0.15,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: shouldReduceMotion ? 0 : delay,
        staggerChildren: shouldReduceMotion ? 0 : stagger,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once,
        amount,
      }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({
  children,
  className = "",
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: shouldReduceMotion
      ? {
          opacity: 1,
        }
      : {
          opacity: 0,
          y: 20,
        },

    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.55,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
};

export default Stagger;