import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Layers3,
  Loader2,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import serviceService from "../../services/serviceService";

/* =========================================================
   Constants
========================================================= */

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
];

const PRICING_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "per_unit", label: "Per Unit" },
  { value: "starting_from", label: "Starting From" },
  { value: "custom", label: "Custom" },
];

/* =========================================================
   Helpers
========================================================= */

const createUiId = (prefix = "item") => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const createEmptyFieldOption = () => ({
  label: "",
  value: "",
  price: 0,
  _uiId: createUiId("field-option"),
});

const createEmptyField = (order = 0) => ({
  name: "",
  label: "",
  type: "text",
  placeholder: "",
  helpText: "",
  required: false,
  options: [],
  min: "",
  max: "",
  step: "",
  order,
  _uiId: createUiId("field"),
});

const createEmptyPricingOption = (order = 0) => ({
  name: "",
  description: "",
  price: "",
  unit: "",
  group: "",
  minQuantity: 1,
  maxQuantity: "",
  isActive: true,
  fields: [],
  order,
  _uiId: createUiId("pricing-option"),
});

const emptyService = {
  name: "",
  slug: "",
  category: "",
  description: "",
  pricingType: "fixed",
  basePrice: "",
  unit: "",
  minQuantity: 1,
  maxQuantity: "",
  pricingOptions: [],
  fields: [],
  isActive: true,
  displayOrder: 0,
};

const isOptionFieldType = (type) =>
  ["select", "radio", "checkbox"].includes(type);

const isNumberFieldType = (type) => type === "number";

const toInputValue = (value, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }

  return value;
};

/* =========================================================
   Hydration
========================================================= */

const hydrateField = (field = {}, index = 0) => ({
  name: toInputValue(field.name),
  label: toInputValue(field.label),
  type: toInputValue(field.type, "text"),
  placeholder: toInputValue(field.placeholder),
  helpText: toInputValue(field.helpText),
  required: Boolean(field.required),

  options: Array.isArray(field.options)
    ? field.options.map((option) => ({
        label: toInputValue(option.label),
        value: toInputValue(option.value),
        price:
          option.price === null || option.price === undefined
            ? 0
            : option.price,
        _uiId: createUiId("field-option"),
      }))
    : [],

  min: field.min === null || field.min === undefined ? "" : field.min,

  max: field.max === null || field.max === undefined ? "" : field.max,

  step: field.step === null || field.step === undefined ? "" : field.step,

  order:
    field.order === null || field.order === undefined ? index : field.order,

  _uiId: createUiId("field"),
});

const hydratePricingOption = (option = {}, index = 0) => ({
  /*
   * IMPORTANT:
   * Preserve the existing MongoDB _id.
   */
  _id: option._id,

  name: toInputValue(option.name),
  description: toInputValue(option.description),

  price:
    option.price === null || option.price === undefined ? "" : option.price,

  unit: toInputValue(option.unit),
  group: toInputValue(option.group),

  minQuantity:
    option.minQuantity === null || option.minQuantity === undefined
      ? 1
      : option.minQuantity,

  maxQuantity:
    option.maxQuantity === null || option.maxQuantity === undefined
      ? ""
      : option.maxQuantity,

  isActive: option.isActive === undefined ? true : Boolean(option.isActive),

  /*
   * IMPORTANT:
   * Preserve nested pricing-option fields.
   */
  fields: Array.isArray(option.fields)
    ? option.fields.map((field, fieldIndex) => hydrateField(field, fieldIndex))
    : [],

  order:
    option.order === null || option.order === undefined ? index : option.order,

  _uiId: createUiId("pricing-option"),
});

const hydrateService = (service) => ({
  name: toInputValue(service.name),
  slug: toInputValue(service.slug),
  category: toInputValue(service.category),
  description: toInputValue(service.description),

  pricingType: toInputValue(service.pricingType, "fixed"),

  basePrice:
    service.basePrice === null || service.basePrice === undefined
      ? ""
      : service.basePrice,

  unit: toInputValue(service.unit),

  minQuantity:
    service.minQuantity === null || service.minQuantity === undefined
      ? 1
      : service.minQuantity,

  maxQuantity:
    service.maxQuantity === null || service.maxQuantity === undefined
      ? ""
      : service.maxQuantity,

  pricingOptions: Array.isArray(service.pricingOptions)
    ? service.pricingOptions.map((option, index) =>
        hydratePricingOption(option, index),
      )
    : [],

  fields: Array.isArray(service.fields)
    ? service.fields.map((field, index) => hydrateField(field, index))
    : [],

  isActive: service.isActive === undefined ? true : Boolean(service.isActive),

  displayOrder:
    service.displayOrder === null || service.displayOrder === undefined
      ? 0
      : service.displayOrder,
});

/* =========================================================
   Custom Select
========================================================= */

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

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    setOpen((current) => !current);
  };

  const handleSelect = (option) => {
    if (disabled) {
      return;
    }

    onChange(option.value);
    setOpen(false);
  };

  return (
    <div ref={selectRef} className="relative w-full">
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
          hover:cursor-pointer
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
                      hover:cursor-pointer
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

/* =========================================================
   Payload Helpers
========================================================= */

const cleanFieldForPayload = (field, index = 0) => {
  const cleaned = {
    name: String(field.name || "").trim(),

    label: String(field.label || "").trim(),

    type: field.type || "text",

    placeholder: String(field.placeholder || "").trim(),

    helpText: String(field.helpText || "").trim(),

    required: Boolean(field.required),

    order: Number.isFinite(Number(field.order)) ? Number(field.order) : index,
  };

  if (isOptionFieldType(cleaned.type)) {
    cleaned.options = Array.isArray(field.options)
      ? field.options.map((option) => ({
          label: String(option.label || "").trim(),

          value: String(option.value || "").trim(),

          price:
            option.price === "" ||
            option.price === null ||
            option.price === undefined
              ? 0
              : Number(option.price),
        }))
      : [];
  } else {
    cleaned.options = [];
  }

  if (isNumberFieldType(cleaned.type)) {
    if (field.min !== "" && field.min !== null && field.min !== undefined) {
      cleaned.min = Number(field.min);
    }

    if (field.max !== "" && field.max !== null && field.max !== undefined) {
      cleaned.max = Number(field.max);
    }

    if (field.step !== "" && field.step !== null && field.step !== undefined) {
      cleaned.step = Number(field.step);
    }
  }

  return cleaned;
};

const cleanPricingOptionForPayload = (option, index = 0) => {
  const cleaned = {
    name: String(option.name || "").trim(),

    description: String(option.description || "").trim(),

    price:
      option.price === "" || option.price === null || option.price === undefined
        ? 0
        : Number(option.price),

    unit: String(option.unit || "").trim(),

    group: String(option.group || "").trim(),

    minQuantity:
      option.minQuantity === "" ||
      option.minQuantity === null ||
      option.minQuantity === undefined
        ? 1
        : Number(option.minQuantity),

    isActive: Boolean(option.isActive),

    /*
     * IMPORTANT:
     * Nested option-specific fields are preserved.
     */
    fields: Array.isArray(option.fields)
      ? option.fields.map((field, fieldIndex) =>
          cleanFieldForPayload(field, fieldIndex),
        )
      : [],

    order:
      option.order === "" || option.order === null || option.order === undefined
        ? index
        : Number(option.order),
  };

  if (
    option.maxQuantity !== "" &&
    option.maxQuantity !== null &&
    option.maxQuantity !== undefined
  ) {
    cleaned.maxQuantity = Number(option.maxQuantity);
  }

  /*
   * Existing option:
   * preserve MongoDB _id.
   *
   * Newly duplicated option:
   * no _id => backend creates a new subdocument.
   */
  if (option._id) {
    cleaned._id = option._id;
  }

  return cleaned;
};

const buildPayload = (form) => ({
  name: String(form.name || "").trim(),

  slug: String(form.slug || "")
    .trim()
    .toLowerCase(),

  category: String(form.category || "").trim(),

  description: String(form.description || "").trim(),

  pricingType: form.pricingType || "fixed",

  basePrice:
    form.basePrice === "" ||
    form.basePrice === null ||
    form.basePrice === undefined
      ? 0
      : Number(form.basePrice),

  unit: String(form.unit || "").trim(),

  minQuantity:
    form.minQuantity === "" ||
    form.minQuantity === null ||
    form.minQuantity === undefined
      ? 1
      : Number(form.minQuantity),

  ...(form.maxQuantity !== "" &&
  form.maxQuantity !== null &&
  form.maxQuantity !== undefined
    ? {
        maxQuantity: Number(form.maxQuantity),
      }
    : {}),

  pricingOptions: Array.isArray(form.pricingOptions)
    ? form.pricingOptions.map((option, index) =>
        cleanPricingOptionForPayload(option, index),
      )
    : [],

  fields: Array.isArray(form.fields)
    ? form.fields.map((field, index) => cleanFieldForPayload(field, index))
    : [],

  isActive: Boolean(form.isActive),

  displayOrder:
    form.displayOrder === "" ||
    form.displayOrder === null ||
    form.displayOrder === undefined
      ? 0
      : Number(form.displayOrder),
});

/* =========================================================
   Validation
========================================================= */

const validateField = (field, location = "Field") => {
  if (!String(field.name || "").trim()) {
    return `${location} name is required.`;
  }

  if (!String(field.label || "").trim()) {
    return `${location} label is required.`;
  }

  if (isNumberFieldType(field.type)) {
    if (
      field.min !== "" &&
      field.min !== null &&
      field.min !== undefined &&
      !Number.isFinite(Number(field.min))
    ) {
      return `${location} minimum must be a valid number.`;
    }

    if (
      field.max !== "" &&
      field.max !== null &&
      field.max !== undefined &&
      !Number.isFinite(Number(field.max))
    ) {
      return `${location} maximum must be a valid number.`;
    }

    if (
      field.min !== "" &&
      field.max !== "" &&
      Number(field.min) > Number(field.max)
    ) {
      return `${location} minimum cannot be greater than maximum.`;
    }

    if (
      field.step !== "" &&
      field.step !== null &&
      field.step !== undefined &&
      (!Number.isFinite(Number(field.step)) || Number(field.step) <= 0)
    ) {
      return `${location} step must be greater than 0.`;
    }
  }

  if (isOptionFieldType(field.type)) {
    if (!Array.isArray(field.options) || field.options.length === 0) {
      return `${location} requires at least one option.`;
    }

    const values = new Set();

    for (let index = 0; index < field.options.length; index += 1) {
      const option = field.options[index];

      if (!String(option.label || "").trim()) {
        return `${location} option ${index + 1} label is required.`;
      }

      if (!String(option.value || "").trim()) {
        return `${location} option ${index + 1} value is required.`;
      }

      const normalizedValue = String(option.value || "")
        .trim()
        .toLowerCase();

      if (values.has(normalizedValue)) {
        return `${location} option values must be unique.`;
      }

      values.add(normalizedValue);

      if (
        option.price !== "" &&
        option.price !== null &&
        option.price !== undefined &&
        (!Number.isFinite(Number(option.price)) || Number(option.price) < 0)
      ) {
        return `${location} option ${
          index + 1
        } price must be a valid non-negative number.`;
      }
    }
  }

  return null;
};

const validateForm = (form) => {
  if (!String(form.name || "").trim()) {
    return "Service name is required.";
  }

  if (!String(form.slug || "").trim()) {
    return "Service slug is required.";
  }

  if (!String(form.category || "").trim()) {
    return "Service category is required.";
  }

  if (
    form.basePrice === "" ||
    form.basePrice === null ||
    form.basePrice === undefined ||
    !Number.isFinite(Number(form.basePrice)) ||
    Number(form.basePrice) < 0
  ) {
    return "Base price must be a valid non-negative number.";
  }

  if (
    form.minQuantity === "" ||
    form.minQuantity === null ||
    form.minQuantity === undefined ||
    !Number.isFinite(Number(form.minQuantity)) ||
    !Number.isInteger(Number(form.minQuantity)) ||
    Number(form.minQuantity) < 1
  ) {
    return "Minimum quantity must be a positive integer.";
  }

  if (
    form.maxQuantity !== "" &&
    form.maxQuantity !== null &&
    form.maxQuantity !== undefined
  ) {
    if (
      !Number.isFinite(Number(form.maxQuantity)) ||
      !Number.isInteger(Number(form.maxQuantity)) ||
      Number(form.maxQuantity) < 1
    ) {
      return "Maximum quantity must be a positive integer.";
    }

    if (Number(form.maxQuantity) < Number(form.minQuantity)) {
      return "Maximum quantity cannot be less than minimum quantity.";
    }
  }

  if (
    form.displayOrder !== "" &&
    form.displayOrder !== null &&
    form.displayOrder !== undefined &&
    (!Number.isFinite(Number(form.displayOrder)) ||
      !Number.isInteger(Number(form.displayOrder)) ||
      Number(form.displayOrder) < 0)
  ) {
    return "Display order must be a non-negative integer.";
  }

  /* -------------------------------------------------------
     Service fields
  ------------------------------------------------------- */

  for (let index = 0; index < form.fields.length; index += 1) {
    const error = validateField(
      form.fields[index],
      `Service field ${index + 1}`,
    );

    if (error) {
      return error;
    }
  }

  /* -------------------------------------------------------
     Pricing options
  ------------------------------------------------------- */

  for (let index = 0; index < form.pricingOptions.length; index += 1) {
    const option = form.pricingOptions[index];

    if (!String(option.name || "").trim()) {
      return `Pricing option ${index + 1} name is required.`;
    }

    if (
      option.price === "" ||
      option.price === null ||
      option.price === undefined ||
      !Number.isFinite(Number(option.price)) ||
      Number(option.price) < 0
    ) {
      return `Pricing option ${
        index + 1
      } price must be a valid non-negative number.`;
    }

    if (
      option.minQuantity === "" ||
      option.minQuantity === null ||
      option.minQuantity === undefined ||
      !Number.isFinite(Number(option.minQuantity)) ||
      !Number.isInteger(Number(option.minQuantity)) ||
      Number(option.minQuantity) < 1
    ) {
      return `Pricing option ${
        index + 1
      } minimum quantity must be a positive integer.`;
    }

    if (
      option.maxQuantity !== "" &&
      option.maxQuantity !== null &&
      option.maxQuantity !== undefined
    ) {
      if (
        !Number.isFinite(Number(option.maxQuantity)) ||
        !Number.isInteger(Number(option.maxQuantity)) ||
        Number(option.maxQuantity) < 1
      ) {
        return `Pricing option ${
          index + 1
        } maximum quantity must be a positive integer.`;
      }

      if (Number(option.maxQuantity) < Number(option.minQuantity)) {
        return `Pricing option ${
          index + 1
        } maximum quantity cannot be less than minimum quantity.`;
      }
    }

    /*
     * IMPORTANT:
     * Validate nested pricing-option fields.
     */
    for (
      let fieldIndex = 0;
      fieldIndex < option.fields.length;
      fieldIndex += 1
    ) {
      const error = validateField(
        option.fields[fieldIndex],
        `Pricing option ${index + 1}, field ${fieldIndex + 1}`,
      );

      if (error) {
        return error;
      }
    }
  }

  return null;
};

/* =========================================================
   Reusable UI
========================================================= */

const SectionHeader = ({ icon: Icon, eyebrow, title, description }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
      <Icon size={18} strokeWidth={2} />
    </div>

    <div className="min-w-0">
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
          {eyebrow}
        </p>
      )}

      <h2 className="mt-0.5 text-lg font-semibold text-zinc-900">{title}</h2>

      {description && (
        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
      )}
    </div>
  </div>
);

const Input = ({
  label,
  required = false,
  hint,
  error,
  className = "",
  ...props
}) => (
  <label className="block">
    {label && (
      <span className="mb-2 block text-sm font-medium text-zinc-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
    )}

    <input
      {...props}
      className={[
        "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition",
        "placeholder:text-zinc-400",
        "focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100",
        error
          ? "border-red-300 focus:border-red-400 focus:ring-red-50"
          : "border-zinc-200",
        className,
      ].join(" ")}
    />

    {hint && !error && (
      <span className="mt-1.5 block text-xs leading-5 text-zinc-400">
        {hint}
      </span>
    )}

    {error && (
      <span className="mt-1.5 block text-xs leading-5 text-red-500">
        {error}
      </span>
    )}
  </label>
);

const Textarea = ({
  label,
  required = false,
  hint,
  className = "",
  ...props
}) => (
  <label className="block">
    {label && (
      <span className="mb-2 block text-sm font-medium text-zinc-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
    )}

    <textarea
      {...props}
      className={[
        "min-h-[120px] w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition",
        "placeholder:text-zinc-400",
        "focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100",
        className,
      ].join(" ")}
    />

    {hint && (
      <span className="mt-1.5 block text-xs leading-5 text-zinc-400">
        {hint}
      </span>
    )}
  </label>
);

const Select = ({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
}) => (
  <div>
    {label && (
      <span className="mb-2 block text-sm font-medium text-zinc-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
    )}

    <CustomSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
    />
  </div>
);

const Toggle = ({ checked, onChange, label, description }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-300"
  >
    <div className="min-w-0">
      <p className="text-sm font-medium text-zinc-800">{label}</p>

      {description && (
        <p className="mt-1 text-xs leading-5 text-zinc-400">{description}</p>
      )}
    </div>

    <span
      className={[
        "relative h-6 w-11 shrink-0 rounded-full transition",
        checked ? "bg-zinc-900" : "bg-zinc-200",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
          checked ? "left-6" : "left-1",
        ].join(" ")}
      />
    </span>
  </button>
);

/* =========================================================
   Field Option Editor
========================================================= */

const FieldOptionEditor = ({
  option,
  index,
  onChange,
  onRemove,
  onMove,
  isFirst,
  isLast,
}) => (
  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
        Option {index + 1}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onMove(index, -1)}
          disabled={isFirst}
          className="rounded-xl p-2 text-zinc-500 transition hover:bg-white hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUp size={15} />
        </button>

        <button
          type="button"
          onClick={() => onMove(index, 1)}
          disabled={isLast}
          className="rounded-xl p-2 text-zinc-500 transition hover:bg-white hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowDown size={15} />
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl p-2 text-red-500 transition hover:bg-red-50"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>

    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <Input
        label="Label"
        required
        value={option.label}
        onChange={(event) =>
          onChange({
            ...option,
            label: event.target.value,
          })
        }
        placeholder="e.g. iPhone"
      />

      <Input
        label="Value"
        required
        value={option.value}
        onChange={(event) =>
          onChange({
            ...option,
            value: event.target.value,
          })
        }
        placeholder="e.g. iphone"
      />

      <Input
        label="Additional Price"
        type="number"
        min="0"
        step="0.01"
        value={option.price}
        onChange={(event) =>
          onChange({
            ...option,
            price: event.target.value,
          })
        }
        placeholder="0"
      />
    </div>
  </div>
);

/* =========================================================
   Field Editor
========================================================= */

const FieldEditor = ({
  field,
  index,
  total,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
}) => {
  const hasOptions = isOptionFieldType(field.type);

  const hasNumberSettings = isNumberFieldType(field.type);

  const updateOption = (optionIndex, updatedOption) => {
    const options = [...field.options];

    options[optionIndex] = updatedOption;

    onChange({
      ...field,
      options,
    });
  };

  const addOption = () => {
    onChange({
      ...field,
      options: [...(field.options || []), createEmptyFieldOption()],
    });
  };

  const removeOption = (optionIndex) => {
    onChange({
      ...field,
      options: field.options.filter(
        (_, currentIndex) => currentIndex !== optionIndex,
      ),
    });
  };

  const moveOption = (optionIndex, direction) => {
    const newIndex = optionIndex + direction;

    if (newIndex < 0 || newIndex >= field.options.length) {
      return;
    }

    const options = [...field.options];

    [options[optionIndex], options[newIndex]] = [
      options[newIndex],
      options[optionIndex],
    ];

    onChange({
      ...field,
      options,
    });
  };

  return (
    <div className="rounded-[22px] border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-600">
            {index + 1}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Service field
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-zinc-900">
              {field.label || field.name || "Untitled field"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={index === 0}
            className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp size={15} />
          </button>

          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1}
            className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowDown size={15} />
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Copy size={15} />
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl p-2 text-red-500 transition hover:bg-red-50"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Input
          label="Field Name"
          required
          value={field.name}
          onChange={(event) =>
            onChange({
              ...field,
              name: event.target.value,
            })
          }
          placeholder="e.g. shootLocation"
          hint="Used internally when storing the submitted value."
        />

        <Input
          label="Label"
          required
          value={field.label}
          onChange={(event) =>
            onChange({
              ...field,
              label: event.target.value,
            })
          }
          placeholder="e.g. Shoot Location"
        />

        <Select
          label="Field Type"
          value={field.type}
          onChange={(value) =>
            onChange({
              ...field,
              type: value,
              options: isOptionFieldType(value)
                ? field.options?.length
                  ? field.options
                  : [createEmptyFieldOption()]
                : [],
            })
          }
          options={FIELD_TYPES}
        />

        <Input
          label="Placeholder"
          value={field.placeholder}
          onChange={(event) =>
            onChange({
              ...field,
              placeholder: event.target.value,
            })
          }
          placeholder="Optional placeholder"
        />

        <div className="md:col-span-2">
          <Input
            label="Help Text"
            value={field.helpText}
            onChange={(event) =>
              onChange({
                ...field,
                helpText: event.target.value,
              })
            }
            placeholder="Optional instruction shown below the field"
          />
        </div>
      </div>

      <div className="mt-5">
        <Toggle
          checked={field.required}
          onChange={(checked) =>
            onChange({
              ...field,
              required: checked,
            })
          }
          label="Required field"
          description="Customers must provide a value before submitting the order."
        />
      </div>

      {hasNumberSettings && (
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
          <p className="text-sm font-semibold text-zinc-800">Number settings</p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Input
              label="Minimum"
              type="number"
              value={field.min}
              onChange={(event) =>
                onChange({
                  ...field,
                  min: event.target.value,
                })
              }
              placeholder="Optional"
            />

            <Input
              label="Maximum"
              type="number"
              value={field.max}
              onChange={(event) =>
                onChange({
                  ...field,
                  max: event.target.value,
                })
              }
              placeholder="Optional"
            />

            <Input
              label="Step"
              type="number"
              min="0"
              step="any"
              value={field.step}
              onChange={(event) =>
                onChange({
                  ...field,
                  step: event.target.value,
                })
              }
              placeholder="Optional"
            />
          </div>
        </div>
      )}

      {hasOptions && (
        <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-800">
                Field options
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Configure the values available to the customer.
              </p>
            </div>

            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
            >
              <Plus size={14} />
              Add option
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {field.options.map((option, optionIndex) => (
              <FieldOptionEditor
                key={option._uiId}
                option={option}
                index={optionIndex}
                isFirst={optionIndex === 0}
                isLast={optionIndex === field.options.length - 1}
                onChange={(updatedOption) =>
                  updateOption(optionIndex, updatedOption)
                }
                onRemove={() => removeOption(optionIndex)}
                onMove={moveOption}
              />
            ))}
          </div>

          {field.options.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-5 text-center">
              <p className="text-sm font-medium text-zinc-600">
                No options configured.
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                Add at least one option for this field type.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   Pricing Option Editor
========================================================= */

const PricingOptionEditor = ({
  option,
  index,
  total,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
}) => {
  const updateField = (fieldIndex, updatedField) => {
    const fields = [...option.fields];

    fields[fieldIndex] = updatedField;

    onChange({
      ...option,
      fields,
    });
  };

  const addField = () => {
    onChange({
      ...option,
      fields: [
        ...(option.fields || []),
        createEmptyField(option.fields?.length || 0),
      ],
    });
  };

  const removeField = (fieldIndex) => {
    onChange({
      ...option,
      fields: option.fields.filter(
        (_, currentIndex) => currentIndex !== fieldIndex,
      ),
    });
  };

  const duplicateField = (fieldIndex) => {
    const source = option.fields[fieldIndex];

    const duplicate = {
      ...source,
      _uiId: createUiId("field"),

      name: source.name ? `${source.name}_copy` : "",

      label: source.label ? `${source.label} Copy` : "",

      options: Array.isArray(source.options)
        ? source.options.map((item) => ({
            ...item,
            _uiId: createUiId("field-option"),
          }))
        : [],
    };

    const fields = [...option.fields];

    fields.splice(fieldIndex + 1, 0, duplicate);

    onChange({
      ...option,
      fields,
    });
  };

  const moveField = (fieldIndex, direction) => {
    const newIndex = fieldIndex + direction;

    if (newIndex < 0 || newIndex >= option.fields.length) {
      return;
    }

    const fields = [...option.fields];

    [fields[fieldIndex], fields[newIndex]] = [
      fields[newIndex],
      fields[fieldIndex],
    ];

    onChange({
      ...option,
      fields,
    });
  };

  return (
    <div className="rounded-[22px] border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
      <div className="border-b border-zinc-100 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
              {index + 1}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                Pricing option
              </p>

              <p className="mt-1 truncate text-base font-semibold text-zinc-900">
                {option.name || "Untitled pricing option"}
              </p>

              {option._id && (
                <p className="mt-1 truncate text-[11px] text-zinc-400">
                  Existing option
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp size={15} />
            </button>

            <button
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={index === total - 1}
              className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowDown size={15} />
            </button>

            <button
              type="button"
              onClick={onDuplicate}
              className="rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Copy size={15} />
            </button>

            <button
              type="button"
              onClick={onRemove}
              className="rounded-xl p-2 text-red-500 transition hover:bg-red-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Input
            label="Name"
            required
            value={option.name}
            onChange={(event) =>
              onChange({
                ...option,
                name: event.target.value,
              })
            }
            placeholder="e.g. iPhone"
          />

          <Input
            label="Group"
            value={option.group}
            onChange={(event) =>
              onChange({
                ...option,
                group: event.target.value,
              })
            }
            placeholder="e.g. shoot"
            hint="Useful when multiple pricing options belong to the same selection group."
          />

          <Input
            label="Price"
            required
            type="number"
            min="0"
            step="0.01"
            value={option.price}
            onChange={(event) =>
              onChange({
                ...option,
                price: event.target.value,
              })
            }
            placeholder="0"
          />

          <Input
            label="Unit"
            required
            value={option.unit}
            onChange={(event) =>
              onChange({
                ...option,
                unit: event.target.value,
              })
            }
            placeholder="e.g. project, hour, reel"
          />

          <div className="md:col-span-2">
            <Textarea
              label="Description"
              value={option.description}
              onChange={(event) =>
                onChange({
                  ...option,
                  description: event.target.value,
                })
              }
              placeholder="Describe what this pricing option includes."
            />
          </div>

          <Input
            label="Minimum Quantity"
            required
            type="number"
            min="1"
            step="1"
            value={option.minQuantity}
            onChange={(event) =>
              onChange({
                ...option,
                minQuantity: event.target.value,
              })
            }
          />

          <Input
            label="Maximum Quantity"
            type="number"
            min="1"
            step="1"
            value={option.maxQuantity}
            onChange={(event) =>
              onChange({
                ...option,
                maxQuantity: event.target.value,
              })
            }
            placeholder="No maximum"
          />
        </div>

        <div className="mt-5">
          <Toggle
            checked={option.isActive}
            onChange={(checked) =>
              onChange({
                ...option,
                isActive: checked,
              })
            }
            label="Pricing option active"
            description="Inactive options remain configured but should not be offered to customers."
          />
        </div>
      </div>

      {/* =====================================================
          NESTED OPTION FIELDS
      ====================================================== */}

      <div className="bg-zinc-50/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              Pricing option fields
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-400">
              These fields are shown when this pricing option is selected.
            </p>
          </div>

          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            <Plus size={14} />
            Add field
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {option.fields.map((field, fieldIndex) => (
            <FieldEditor
              key={field._uiId}
              field={field}
              index={fieldIndex}
              total={option.fields.length}
              onChange={(updatedField) => updateField(fieldIndex, updatedField)}
              onRemove={() => removeField(fieldIndex)}
              onDuplicate={() => duplicateField(fieldIndex)}
              onMove={moveField}
            />
          ))}
        </div>

        {option.fields.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-white p-7 text-center">
            <Settings2 size={22} className="mx-auto text-zinc-300" />

            <p className="mt-3 text-sm font-medium text-zinc-600">
              No option-specific fields
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Add fields if this pricing option needs additional customer input.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   Main Component
========================================================= */

const AdminEditService = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [form, setForm] = useState(emptyService);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [serviceNotFound, setServiceNotFound] = useState(false);

  /* -------------------------------------------------------
     Load service
  ------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    const loadService = async () => {
      if (!id) {
        if (mounted) {
          setError("Service ID is missing.");
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccess("");
        setServiceNotFound(false);

        const response = await serviceService.getAdminServiceById(id);

        if (!mounted) {
          return;
        }

        if (!response?.success || !response?.service) {
          setError(response?.message || "Unable to load the service.");
          setLoading(false);
          return;
        }

        /*
         * hydrateService recursively preserves:
         *
         * service.fields
         *
         * pricingOptions[]
         *   └── fields[]
         *       └── options[]
         */
        setForm(hydrateService(response.service));
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        const status = requestError?.response?.status;

        if (status === 404) {
          setServiceNotFound(true);

          setError(
            requestError?.response?.data?.message || "Service not found.",
          );
        } else {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Unable to load the service.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadService();

    return () => {
      mounted = false;
    };
  }, [id]);

  /* -------------------------------------------------------
     Derived values
  ------------------------------------------------------- */

  const serviceFieldCount = form.fields.length;

  const pricingOptionFieldCount = useMemo(
    () =>
      form.pricingOptions.reduce(
        (total, option) => total + (option.fields?.length || 0),
        0,
      ),
    [form.pricingOptions],
  );

  /* -------------------------------------------------------
     Basic form updates
  ------------------------------------------------------- */

  const updateForm = (updates) => {
    setForm((current) => ({
      ...current,
      ...updates,
    }));
  };

  /* -------------------------------------------------------
     Service fields
  ------------------------------------------------------- */

  const addServiceField = () => {
    setForm((current) => ({
      ...current,
      fields: [...current.fields, createEmptyField(current.fields.length)],
    }));
  };

  const updateServiceField = (index, updatedField) => {
    setForm((current) => {
      const fields = [...current.fields];

      fields[index] = updatedField;

      return {
        ...current,
        fields,
      };
    });
  };

  const removeServiceField = (index) => {
    setForm((current) => ({
      ...current,
      fields: current.fields.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  };

  const duplicateServiceField = (index) => {
    setForm((current) => {
      const source = current.fields[index];

      const duplicate = {
        ...source,
        _uiId: createUiId("field"),

        name: source.name ? `${source.name}_copy` : "",

        label: source.label ? `${source.label} Copy` : "",

        options: Array.isArray(source.options)
          ? source.options.map((option) => ({
              ...option,
              _uiId: createUiId("field-option"),
            }))
          : [],
      };

      const fields = [...current.fields];

      fields.splice(index + 1, 0, duplicate);

      return {
        ...current,
        fields,
      };
    });
  };

  const moveServiceField = (index, direction) => {
    setForm((current) => {
      const newIndex = index + direction;

      if (newIndex < 0 || newIndex >= current.fields.length) {
        return current;
      }

      const fields = [...current.fields];

      [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];

      return {
        ...current,
        fields,
      };
    });
  };

  /* -------------------------------------------------------
     Pricing options
  ------------------------------------------------------- */

  const addPricingOption = () => {
    setForm((current) => ({
      ...current,
      pricingOptions: [
        ...current.pricingOptions,
        createEmptyPricingOption(current.pricingOptions.length),
      ],
    }));
  };

  const updatePricingOption = (index, updatedOption) => {
    setForm((current) => {
      const pricingOptions = [...current.pricingOptions];

      pricingOptions[index] = updatedOption;

      return {
        ...current,
        pricingOptions,
      };
    });
  };

  const removePricingOption = (index) => {
    setForm((current) => ({
      ...current,
      pricingOptions: current.pricingOptions.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  };

  const duplicatePricingOption = (index) => {
    setForm((current) => {
      const source = current.pricingOptions[index];

      /*
       * IMPORTANT:
       * Do NOT preserve _id when duplicating.
       * This creates a new pricing option.
       */
      const duplicate = {
        ...source,

        _id: undefined,

        _uiId: createUiId("pricing-option"),

        name: source.name ? `${source.name} Copy` : "",

        /*
         * Preserve every nested field
         * while generating fresh UI IDs.
         */
        fields: Array.isArray(source.fields)
          ? source.fields.map((field) => ({
              ...field,

              _uiId: createUiId("field"),

              options: Array.isArray(field.options)
                ? field.options.map((option) => ({
                    ...option,
                    _uiId: createUiId("field-option"),
                  }))
                : [],
            }))
          : [],
      };

      const pricingOptions = [...current.pricingOptions];

      pricingOptions.splice(index + 1, 0, duplicate);

      return {
        ...current,
        pricingOptions,
      };
    });
  };

  const movePricingOption = (index, direction) => {
    setForm((current) => {
      const newIndex = index + direction;

      if (newIndex < 0 || newIndex >= current.pricingOptions.length) {
        return current;
      }

      const pricingOptions = [...current.pricingOptions];

      [pricingOptions[index], pricingOptions[newIndex]] = [
        pricingOptions[newIndex],
        pricingOptions[index],
      ];

      return {
        ...current,
        pricingOptions,
      };
    });
  };

  /* -------------------------------------------------------
     Submit
  ------------------------------------------------------- */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const payload = buildPayload(form);

    try {
      setSaving(true);

      const response = await serviceService.updateService(id, payload);

      if (!response?.success) {
        throw new Error(response?.message || "Unable to update service.");
      }

      setSuccess(response.message || "Service updated successfully.");

      /*
       * Reload the exact server response.
       *
       * This is important because it guarantees that
       * nested option fields remain synchronized with
       * the backend-normalized document.
       */
      if (response.service) {
        setForm(hydrateService(response.service));
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      window.setTimeout(() => {
        navigate("/admin/services");
      }, 900);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to update service.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------
     Loading state
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] animate-fade-up">
        <div className="flex min-h-[60vh] items-center justify-center rounded-[28px] border border-zinc-200 bg-white shadow-[0_15px_50px_rgba(0,0,0,0.04)]">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
              <Loader2 size={22} className="animate-spin text-zinc-700" />
            </div>

            <p className="mt-4 text-sm font-semibold text-zinc-800">
              Loading service
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Fetching the current service configuration...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     Not found
  ------------------------------------------------------- */

  if (serviceNotFound) {
    return (
      <div className="mx-auto max-w-[1500px] animate-fade-up">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-[0_15px_50px_rgba(0,0,0,0.04)] sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <X size={24} />
          </div>

          <h1 className="mt-5 text-xl font-semibold text-zinc-900">
            Service not found
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            The service you are trying to edit does not exist or is no longer
            available.
          </p>

          <Link
            to="/admin/services"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            <ArrowLeft size={16} />
            Back to Services
          </Link>
        </div>
      </div>
    );
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-up">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_15px_50px_rgba(0,0,0,0.04)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-100/40 blur-3xl" />

        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Link
                to="/admin/services"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"
                aria-label="Back to services"
              >
                <ArrowLeft size={18} />
              </Link>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    <Layers3 size={12} />
                    Service Management
                  </span>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      form.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500",
                    ].join(" ")}
                  >
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <h1 className="mt-3 truncate text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                  Edit Service
                </h1>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-zinc-500">
                  Update the service configuration, pricing, fields, and pricing
                  options.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                to="/admin/services"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                <X size={16} />
                Cancel
              </Link>

              <button
                type="submit"
                form="edit-service-form"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-red-500">
              <X size={16} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">
                Unable to update service
              </p>

              <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
              <Check size={16} />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Changes saved
              </p>

              <p className="mt-1 text-sm text-emerald-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          FORM
      ====================================================== */}

      <form
        id="edit-service-form"
        onSubmit={handleSubmit}
        className="mt-5 space-y-5"
      >
        {/* ===================================================
            BASIC INFORMATION
        ==================================================== */}

        <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-7">
          <SectionHeader
            icon={Layers3}
            eyebrow="Step 1"
            title="Basic Information"
            description="Update the service identity and general configuration."
          />

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Input
              label="Service Name"
              required
              value={form.name}
              onChange={(event) =>
                updateForm({
                  name: event.target.value,
                })
              }
              placeholder="e.g. Social Media Management"
            />

            <Input
              label="Slug"
              required
              value={form.slug}
              onChange={(event) =>
                updateForm({
                  slug: event.target.value.toLowerCase().replace(/\s+/g, "-"),
                })
              }
              placeholder="e.g. social-media-management"
              hint="Used by the service URL/reference. Keep it lowercase and stable."
            />

            <Input
              label="Category"
              required
              value={form.category}
              onChange={(event) =>
                updateForm({
                  category: event.target.value,
                })
              }
              placeholder="e.g. Social Media"
            />

            <Input
              label="Display Order"
              type="number"
              min="0"
              step="1"
              value={form.displayOrder}
              onChange={(event) =>
                updateForm({
                  displayOrder: event.target.value,
                })
              }
              hint="Lower values are displayed first."
            />

            <div className="md:col-span-2">
              <Textarea
                label="Description"
                value={form.description}
                onChange={(event) =>
                  updateForm({
                    description: event.target.value,
                  })
                }
                placeholder="Describe this service..."
              />
            </div>
          </div>

          <div className="mt-5">
            <Toggle
              checked={form.isActive}
              onChange={(checked) =>
                updateForm({
                  isActive: checked,
                })
              }
              label="Service active"
              description="Inactive services are not available for normal customer ordering."
            />
          </div>
        </section>

        {/* ===================================================
            PRICING
        ==================================================== */}

        <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-7">
          <SectionHeader
            icon={Settings2}
            eyebrow="Step 2"
            title="Pricing"
            description="Update the base pricing configuration for this service."
          />

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Select
              label="Pricing Type"
              value={form.pricingType}
              onChange={(value) =>
                updateForm({
                  pricingType: value,
                })
              }
              options={PRICING_TYPES}
            />

            <Input
              label="Base Price"
              required
              type="number"
              min="0"
              step="0.01"
              value={form.basePrice}
              onChange={(event) =>
                updateForm({
                  basePrice: event.target.value,
                })
              }
              placeholder="0"
            />

            <Input
              label="Unit"
              value={form.unit}
              onChange={(event) =>
                updateForm({
                  unit: event.target.value,
                })
              }
              placeholder="e.g. project, reel, hour"
            />

            <Input
              label="Minimum Quantity"
              required
              type="number"
              min="1"
              step="1"
              value={form.minQuantity}
              onChange={(event) =>
                updateForm({
                  minQuantity: event.target.value,
                })
              }
            />

            <Input
              label="Maximum Quantity"
              type="number"
              min="1"
              step="1"
              value={form.maxQuantity}
              onChange={(event) =>
                updateForm({
                  maxQuantity: event.target.value,
                })
              }
              placeholder="No maximum"
            />
          </div>
        </section>

        {/* ===================================================
            SERVICE FIELDS
        ==================================================== */}

        <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeader
              icon={Settings2}
              eyebrow="Step 3"
              title="Service Fields"
              description="These are the fields customers complete when ordering this service."
            />

            <button
              type="button"
              onClick={addServiceField}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus size={16} />
              Add Field
            </button>
          </div>

          {serviceFieldCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                {serviceFieldCount}{" "}
                {serviceFieldCount === 1 ? "field" : "fields"}
              </span>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {form.fields.map((field, index) => (
              <FieldEditor
                key={field._uiId}
                field={field}
                index={index}
                total={form.fields.length}
                onChange={(updatedField) =>
                  updateServiceField(index, updatedField)
                }
                onRemove={() => removeServiceField(index)}
                onDuplicate={() => duplicateServiceField(index)}
                onMove={moveServiceField}
              />
            ))}
          </div>

          {form.fields.length === 0 && (
            <div className="mt-6 rounded-[22px] border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center">
              <Settings2 size={25} className="mx-auto text-zinc-300" />

              <p className="mt-3 text-sm font-semibold text-zinc-700">
                No service fields
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-400">
                Add fields when customers need to provide additional information
                while placing an order.
              </p>

              <button
                type="button"
                onClick={addServiceField}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                <Plus size={14} />
                Add First Field
              </button>
            </div>
          )}
        </section>

        {/* ===================================================
            PRICING OPTIONS
        ==================================================== */}

        <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeader
              icon={Settings2}
              eyebrow="Step 4"
              title="Pricing Options"
              description="Configure selectable pricing options and their option-specific fields."
            />

            <button
              type="button"
              onClick={addPricingOption}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus size={16} />
              Add Pricing Option
            </button>
          </div>

          {form.pricingOptions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                {form.pricingOptions.length}{" "}
                {form.pricingOptions.length === 1
                  ? "pricing option"
                  : "pricing options"}
              </span>

              {pricingOptionFieldCount > 0 && (
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                  {pricingOptionFieldCount} nested{" "}
                  {pricingOptionFieldCount === 1 ? "field" : "fields"}
                </span>
              )}
            </div>
          )}

          <div className="mt-6 space-y-5">
            {form.pricingOptions.map((option, index) => (
              <PricingOptionEditor
                key={option._uiId}
                option={option}
                index={index}
                total={form.pricingOptions.length}
                onChange={(updatedOption) =>
                  updatePricingOption(index, updatedOption)
                }
                onRemove={() => removePricingOption(index)}
                onDuplicate={() => duplicatePricingOption(index)}
                onMove={movePricingOption}
              />
            ))}
          </div>

          {form.pricingOptions.length === 0 && (
            <div className="mt-6 rounded-[22px] border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center">
              <Layers3 size={25} className="mx-auto text-zinc-300" />

              <p className="mt-3 text-sm font-semibold text-zinc-700">
                No pricing options
              </p>

              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-400">
                Add pricing options when customers need to choose between
                different service configurations.
              </p>

              <button
                type="button"
                onClick={addPricingOption}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                <Plus size={14} />
                Add First Pricing Option
              </button>
            </div>
          )}
        </section>

        {/* ===================================================
            BOTTOM ACTIONS
        ==================================================== */}

        <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/admin/services"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            <ArrowLeft size={16} />
            Back to Services
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}

            {saving ? "Saving Changes..." : "Update Service"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminEditService;
