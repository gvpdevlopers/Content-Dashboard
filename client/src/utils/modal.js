const scrollLocks = new WeakMap();

// Dropdowns must stay within a native dialog's top layer to remain interactive.
export const getSelectPortalTarget = (trigger, fallback) => trigger?.closest("dialog[open]") || fallback;

export function lockBodyScroll(body) {
  const lock = scrollLocks.get(body) || { count: 0, overflow: body.style.overflow };
  lock.count += 1;
  scrollLocks.set(body, lock);
  body.style.overflow = "hidden";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lock.count -= 1;
    if (!lock.count) {
      body.style.overflow = lock.overflow;
      scrollLocks.delete(body);
    }
  };
}

export function getModalViewport(viewport, fallbackHeight) {
  return {
    height: viewport?.height > 0 ? viewport.height : fallbackHeight,
    top: Math.max(0, viewport?.offsetTop || 0),
  };
}
