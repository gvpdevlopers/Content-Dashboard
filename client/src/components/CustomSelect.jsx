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

  const selectedOption = options.find((option) => option.value === value);

  /* =====================================================
     CLOSE WHEN CLICKING OUTSIDE
  ====================================================== */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* =====================================================
     CLOSE WITH ESCAPE
  ====================================================== */

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

  /* =====================================================
     SELECT OPTION
  ====================================================== */

  const handleSelect = (option) => {
    if (disabled) {
      return;
    }

    onChange(option.value);
    setOpen(false);
  };

  /* =====================================================
     TOGGLE DROPDOWN
  ====================================================== */

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    setOpen((current) => !current);
  };

  return (
    <div ref={selectRef} className="relative w-full">
      {/* =================================================
          SELECT BUTTON
      ================================================== */}

      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          group
          flex
          min-h-12
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
                ring-4
                ring-zinc-900/[0.04]
              `
              : `
                border-zinc-200
                bg-zinc-50
                hover:border-zinc-300
                hover:bg-white
              `
          }

          disabled:cursor-not-allowed
          disabled:opacity-50
        `}
      >
        <span className={selectedOption ? "text-zinc-900" : "text-zinc-400"}>
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={17}
          strokeWidth={1.8}
          className={`
            shrink-0
            text-zinc-400
            transition-transform
            duration-200
            ${open ? "rotate-180 text-zinc-700" : ""}
          `}
        />
      </button>

      {/* =================================================
          DROPDOWN
      ================================================== */}

      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]
            z-[9999]
            overflow-hidden
            rounded-2xl
            border
            border-zinc-200
            bg-white
            p-1.5
            shadow-[0_20px_50px_rgba(0,0,0,0.12)]
          "
          role="listbox"
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
        >
          <div className="max-h-64 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSelect(option);
                    }}
                    className={`
                      flex
                      min-h-11
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
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-zinc-900
                          text-white
                        "
                      >
                        <Check size={12} strokeWidth={2} />
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div
                className="
                  px-3
                  py-4
                  text-center
                  text-xs
                  text-zinc-400
                "
              >
                No options available.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
