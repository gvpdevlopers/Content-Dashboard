import { useEffect, useRef, useState } from "react";

import { Check, ChevronDown } from "lucide-react";

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  /* Close when clicking outside */
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* Close with Escape */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div ref={selectRef} className="relative">
      {/* SELECT BUTTON */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          group
          flex
          w-full
          items-center
          justify-between
          rounded-xl
          border
          px-4
          py-3.5
          text-left
          text-sm
          outline-none
          transition-all
          duration-200
          ${
            open
              ? `
                border-zinc-300
                bg-white
                ring-2
                ring-zinc-900/5
                shadow-sm
              `
              : `
                border-zinc-200
                bg-white
                hover:border-zinc-300
                hover:bg-zinc-50
                hover:shadow-sm
              `
          }
          disabled:cursor-not-allowed
          disabled:opacity-50
        `}
      >
        <span
          className={
            selectedOption
              ? "text-zinc-900"
              : "text-zinc-400"
          }
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`
            shrink-0
            text-zinc-400
            transition-all
            duration-200
            ${
              open
                ? "rotate-180 text-zinc-700"
                : "group-hover:text-zinc-600"
            }
          `}
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]
            z-50
            overflow-hidden
            rounded-2xl
            border
            border-zinc-200
            bg-white
            p-1.5
            shadow-[0_20px_50px_rgba(0,0,0,0.12)]
            animate-fade-up
          "
          role="listbox"
        >
          {/* Top subtle highlight */}
          <div
            className="
              pointer-events-none
              absolute
              -right-10
              -top-10
              h-24
              w-24
              rounded-full
              bg-zinc-100
              blur-2xl
            "
          />

          <div className="custom-select-scroll relative max-h-64 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option)}
                  className={`
                    group
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-xl
                    px-3
                    py-3
                    text-left
                    text-sm
                    transition-all
                    duration-150
                    ${
                      isSelected
                        ? `
                          bg-zinc-100
                          text-zinc-900
                        `
                        : `
                          text-zinc-600
                          hover:bg-zinc-50
                          hover:text-zinc-900
                        `
                    }
                  `}
                >
                  <span>{option.label}</span>

                  {isSelected && (
                    <span
                      className="
                        flex
                        h-5
                        w-5
                        items-center
                        justify-center
                        rounded-full
                        bg-zinc-900
                        text-white
                      "
                    >
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;