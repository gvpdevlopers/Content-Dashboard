import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getModalViewport, lockBodyScroll } from "../utils/modal";

function ModalSurface({ children, titleId, descriptionId, onClose, busy, initialFocusRef, className = "", alert = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const unlock = lockBodyScroll(document.body);
    const viewport = window.visualViewport;
    let frame;
    const position = () => {
      const { height, top } = getModalViewport(viewport, window.innerHeight);
      dialog.style.setProperty("--dialog-viewport-height", `${height}px`);
      dialog.style.setProperty("--dialog-viewport-top", `${top}px`);
    };
    const resize = () => {
      position();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const focused = document.activeElement;
        if (dialog.contains(focused)) focused.scrollIntoView({ block: "nearest" });
      });
    };
    position();
    dialog.showModal();
    (initialFocusRef?.current || dialog.querySelector("[data-modal-initial-focus]") || dialog).focus();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", position);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", position);
      window.removeEventListener("resize", resize);
      dialog.close();
      unlock();
      if (trigger?.isConnected) trigger.focus();
    };
  }, [initialFocusRef]);

  return createPortal(
    <dialog ref={ref} tabIndex={-1} role={alert ? "alertdialog" : "dialog"} aria-modal="true" aria-busy={busy || undefined}
      aria-labelledby={titleId} aria-describedby={descriptionId}
      className={`app-modal dashboard-ui w-[calc(100%_-_2rem)] rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl sm:p-6 ${className}`}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}>
      {children}
    </dialog>, document.body,
  );
}

export default function Modal({ open = true, ...props }) {
  return open ? <ModalSurface {...props} /> : null;
}
