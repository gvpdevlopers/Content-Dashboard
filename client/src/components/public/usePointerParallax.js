import { useEffect, useRef } from "react";

const usePointerParallax = () => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const pointerMedia = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    const motionMedia = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frameId = null;

    const reset = () => {
      element.style.setProperty("--public-parallax-x-strong", "0px");
      element.style.setProperty("--public-parallax-y-strong", "0px");
      element.style.setProperty("--public-parallax-x-medium", "0px");
      element.style.setProperty("--public-parallax-y-medium", "0px");
      element.style.setProperty("--public-parallax-x-subtle", "0px");
      element.style.setProperty("--public-parallax-y-subtle", "0px");
    };

    const handlePointerMove = (event) => {
      if (!pointerMedia.matches || motionMedia.matches || event.pointerType !== "mouse") {
        return;
      }

      const bounds = element.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(() => {
        element.style.setProperty("--public-parallax-x-strong", `${-x * 12}px`);
        element.style.setProperty("--public-parallax-y-strong", `${-y * 12}px`);
        element.style.setProperty("--public-parallax-x-medium", `${x * 7}px`);
        element.style.setProperty("--public-parallax-y-medium", `${y * 7}px`);
        element.style.setProperty("--public-parallax-x-subtle", `${-x * 3}px`);
        element.style.setProperty("--public-parallax-y-subtle", `${-y * 3}px`);
      });
    };

    const handlePointerLeave = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      reset();
    };

    const updateSupport = () => {
      if (!pointerMedia.matches || motionMedia.matches) {
        handlePointerLeave();
      }
    };

    element.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    element.addEventListener("pointerleave", handlePointerLeave, {
      passive: true,
    });
    pointerMedia.addEventListener("change", updateSupport);
    motionMedia.addEventListener("change", updateSupport);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
      pointerMedia.removeEventListener("change", updateSupport);
      motionMedia.removeEventListener("change", updateSupport);
    };
  }, []);

  return ref;
};

export default usePointerParallax;
