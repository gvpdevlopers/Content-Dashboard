import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { getSelectPlacement, findEnabledOption, findTypeaheadOption } from "../utils/selectNavigation";

const CustomSelect = ({
  value, onChange, options = [], placeholder = "Select an option", disabled = false,
  id, name, required = false, label, compact = false, className = "",
  "aria-label": ariaLabel, "aria-labelledby": labelledBy, "aria-describedby": describedBy,
  "aria-invalid": invalid,
}) => {
  const generatedId = useId();
  const triggerId = id || generatedId;
  const menuId = `${triggerId}-options`;
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState(null);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex];

  const measure = () => getSelectPlacement(triggerRef.current.getBoundingClientRect(), window.innerWidth, window.innerHeight);
  const show = (direction = 1) => {
    if (disabled) return;
    setPlacement(measure());
    setActiveIndex(selectedIndex >= 0 && !selectedOption.disabled
      ? selectedIndex : findEnabledOption(options, direction > 0 ? -1 : options.length, direction));
    setOpen(true);
  };
  const choose = (index) => {
    const option = options[index];
    if (disabled || !option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const reposition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) setOpen(false);
      else setPlacement(getSelectPlacement(rect, window.innerWidth, window.innerHeight));
    };
    const escape = (event) => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) menuRef.current?.querySelector(`[data-option-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  useEffect(() => {
    // A permission/loading change must dismiss a popup whose trigger becomes disabled.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (disabled) setOpen(false);
  }, [disabled]);

  const handleKeyDown = (event) => {
    const { key } = event;
    if (["ArrowDown", "ArrowUp"].includes(key)) {
      event.preventDefault();
      const direction = key === "ArrowDown" ? 1 : -1;
      if (!open) show(direction);
      else setActiveIndex(findEnabledOption(options, activeIndex, direction));
    } else if (key === "Home" || key === "End") {
      event.preventDefault();
      if (!open) { setPlacement(measure()); setOpen(true); }
      setActiveIndex(findEnabledOption(options, key === "Home" ? -1 : options.length, key === "Home" ? 1 : -1));
    } else if (key === "Enter" || key === " ") {
      event.preventDefault();
      if (open) choose(activeIndex); else show();
    } else if (key === "Escape" || key === "Tab") {
      if (key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); }
      setOpen(false);
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const search = searchRef.current;
      search.text = now - search.time < 600 ? search.text + key.toLowerCase() : key.toLowerCase();
      search.time = now;
      const repeated = [...search.text].every((letter) => letter === search.text[0]);
      const query = repeated ? key.toLowerCase() : search.text;
      const start = open ? activeIndex : selectedIndex;
      const next = findTypeaheadOption(options, start, query);
      if (next >= 0) {
        event.preventDefault();
        if (!open) { setPlacement(measure()); setOpen(true); }
        setActiveIndex(next);
      }
    }
  };

  return (
    <div className={`relative min-w-0 w-full ${className}`}>
      {label && <label htmlFor={triggerId} className="mb-2 block text-sm font-medium text-zinc-600">{label}</label>}
      {(name || required) && <input className="sr-only" tabIndex={-1} aria-hidden="true" name={name}
        value={value ?? ""} onChange={() => {}} required={required} disabled={disabled}
        onInvalid={(event) => { event.preventDefault(); triggerRef.current?.focus(); }} />}
      <button ref={triggerRef} id={triggerId} type="button" role="combobox" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={open && !disabled} aria-controls={open ? menuId : undefined}
        aria-activedescendant={open && options[activeIndex] ? `${menuId}-${activeIndex}` : undefined}
        aria-label={ariaLabel || (labelledBy || label ? undefined : placeholder)} aria-labelledby={labelledBy}
        aria-describedby={describedBy} aria-invalid={invalid} aria-required={required || undefined}
        onClick={(event) => { event.stopPropagation(); if (open) setOpen(false); else show(); }} onKeyDown={handleKeyDown}
        className={`custom-select-trigger flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-left text-sm text-zinc-700 transition-colors duration-150 hover:border-zinc-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "min-h-10 py-2" : "min-h-12 py-3"} ${open ? "border-slate-400 bg-white" : ""}`}>
        <span className={`min-w-0 break-words ${selectedOption ? "text-zinc-900" : "text-zinc-400"}`}>{selectedOption?.label ?? placeholder}</span>
        <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-slate-400 motion-safe:transition-transform motion-safe:duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && placement && createPortal(
        <div ref={menuRef} id={menuId} role="listbox" aria-label={ariaLabel || label || placeholder} aria-labelledby={labelledBy}
          className="custom-select-menu fixed z-[10000] overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-1.5 text-sm shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
          onClick={(event) => event.stopPropagation()}
          style={{ left: placement.left, top: placement.top, bottom: placement.bottom, width: placement.width, maxHeight: placement.maxHeight }}>
          {options.length ? options.map((option, index) => (
            <div key={option.value} id={`${menuId}-${index}`} role="option" aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined} data-option-index={index}
              onPointerMove={() => { if (!option.disabled) setActiveIndex(index); }}
              onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}
              className={`flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ${option.disabled ? "cursor-not-allowed text-zinc-400" : "cursor-pointer text-zinc-700"} ${activeIndex === index ? "bg-slate-100" : ""} ${option.value === value ? "font-medium text-slate-900" : ""}`}>
              <span className="min-w-0 break-words">{option.label}</span>
              {option.value === value && <Check size={14} className="shrink-0 text-slate-600" aria-hidden="true" />}
            </div>
          )) : <p className="px-3 py-4 text-center text-xs text-zinc-400">No options available.</p>}
        </div>, document.body,
      )}
    </div>
  );
};
export default CustomSelect;
