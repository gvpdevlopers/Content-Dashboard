import { createElement, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";

const supportsHeadingCursor = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const HeadingCursor = ({
  as: Heading = "h1",
  className = "",
  children,
  ...props
}) => {
  const [enabled, setEnabled] = useState(supportsHeadingCursor);
  const [active, setActive] = useState(false);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, {
    stiffness: 520,
    damping: 42,
    mass: 0.35,
  });
  const y = useSpring(pointerY, {
    stiffness: 520,
    damping: 42,
    mass: 0.35,
  });

  useEffect(() => {
    const hoverMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionMedia = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const updateSupport = () => {
      setEnabled(hoverMedia.matches && !motionMedia.matches);
      setActive(false);
    };

    hoverMedia.addEventListener("change", updateSupport);
    motionMedia.addEventListener("change", updateSupport);

    return () => {
      hoverMedia.removeEventListener("change", updateSupport);
      motionMedia.removeEventListener("change", updateSupport);
    };
  }, []);

  const handlePointerEnter = (event) => {
    if (!enabled || event.pointerType !== "mouse") {
      return;
    }

    pointerX.set(event.clientX);
    pointerY.set(event.clientY);
    setActive(true);
  };

  const handlePointerMove = (event) => {
    if (!enabled || event.pointerType !== "mouse") {
      return;
    }

    pointerX.set(event.clientX);
    pointerY.set(event.clientY);
  };

  const handlePointerLeave = () => {
    setActive(false);
  };

  return (
    <>
      {createElement(
        Heading,
        {
          ...props,
          className: `heading-cursor-target${enabled ? " heading-cursor-enabled" : ""} ${className}`.trim(),
          onPointerEnter: handlePointerEnter,
          onPointerMove: handlePointerMove,
          onPointerLeave: handlePointerLeave,
        },
        children,
      )}

      {enabled &&
        createPortal(
          <motion.span
            aria-hidden="true"
            className="heading-cursor"
            style={{ x, y }}
            animate={{
              opacity: active ? 1 : 0,
              scale: active ? 1 : 0.88,
            }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <span className="heading-cursor__surface" />
          </motion.span>,
          document.body,
        )}
    </>
  );
};

export default HeadingCursor;
