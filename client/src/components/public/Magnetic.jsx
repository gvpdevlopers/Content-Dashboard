import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const Magnetic = ({ children, className = "" }) => {
  const ref = useRef(null);
  const [magneticEnabled, setMagneticEnabled] = useState(false);
  const reduceMotion = useReducedMotion();
  const motionEnabled = useRef(false);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, {
    stiffness: 280,
    damping: 24,
    mass: 0.35,
  });
  const y = useSpring(pointerY, {
    stiffness: 280,
    damping: 24,
    mass: 0.35,
  });

  useEffect(() => {
    const pointerMedia = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const motionMedia = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const updateSupport = () => {
      const enabled = pointerMedia.matches && !motionMedia.matches;
      motionEnabled.current = enabled;
      setMagneticEnabled(enabled);
      pointerX.set(0);
      pointerY.set(0);
    };

    updateSupport();
    pointerMedia.addEventListener("change", updateSupport);
    motionMedia.addEventListener("change", updateSupport);

    return () => {
      pointerMedia.removeEventListener("change", updateSupport);
      motionMedia.removeEventListener("change", updateSupport);
    };
  }, [pointerX, pointerY]);

  const handlePointerMove = (event) => {
    if (
      !motionEnabled.current ||
      reduceMotion ||
      event.pointerType !== "mouse" ||
      !ref.current
    ) {
      return;
    }

    const bounds = ref.current.getBoundingClientRect();
    pointerX.set(
      Math.max(
        -4,
        Math.min(4, ((event.clientX - bounds.left) / bounds.width - 0.5) * 8),
      ),
    );
    pointerY.set(
      Math.max(
        -4,
        Math.min(4, ((event.clientY - bounds.top) / bounds.height - 0.5) * 8),
      ),
    );
  };

  const resetPosition = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.span
      ref={ref}
      className={`inline-flex max-w-full ${className}`}
      style={{ x, y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPosition}
      whileTap={
        magneticEnabled && !reduceMotion ? { scale: 0.985 } : undefined
      }
    >
      {children}
    </motion.span>
  );
};

export default Magnetic;
