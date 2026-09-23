import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Copy,
  GripVertical,
  Hash,
  Layers3,
  Link as LinkIcon,
  Loader2,
  Radio,
  Save,
  Settings2,
  TextCursorInput,
  Trash2,
  Type,
  X,
  Plus,
} from "lucide-react";

import serviceService from "../../services/serviceService";

// ============================================================
// CONSTANTS
// ============================================================

const FIELD_TYPES = [
  {
    value: "text",
    label: "Text",
    icon: Type,
  },
  {
    value: "textarea",
    label: "Textarea",
    icon: TextCursorInput,
  },
  {
    value: "number",
    label: "Number",
    icon: Hash,
  },
  {
    value: "select",
    label: "Select",
    icon: ChevronDown,
  },
  {
    value: "radio",
    label: "Radio",
    icon: Radio,
  },
  {
    value: "checkbox",
    label: "Checkbox",
    icon: Check,
  },
  {
    value: "date",
    label: "Date",
    icon: CalendarDays,
  },
  {
    value: "url",
    label: "URL",
    icon: LinkIcon,
  },
];

const PRICING_TYPES = [
  {
    value: "fixed",
    label: "Fixed",
    description: "A fixed service price.",
  },
  {
    value: "per_unit",
    label: "Per Unit",
    description: "Price is calculated based on quantity.",
  },
  {
    value: "starting_from",
    label: "Starting From",
    description: "Display the base price as a starting price.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Pricing is customized for the service.",
  },
];

const OPTION_FIELD_TYPES = ["select", "radio", "checkbox"];

// ============================================================
// HELPERS
// ============================================================

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createFieldOption = () => ({
  _uiId: createId(),
  label: "",
  value: "",
  price: 0,
});

const createField = (order = 0) => ({
  _uiId: createId(),
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
});

const createPricingOption = (order = 0) => ({
  _uiId: createId(),
  name: "",
  description: "",
  price: 0,
  unit: "",
  group: "",
  minQuantity: 1,
  maxQuantity: "",
  isActive: true,
  fields: [],
  order,
});

const isOptionFieldType = (type) => OPTION_FIELD_TYPES.includes(type);

const getFieldTypeLabel = (type) => {
  return (
    FIELD_TYPES.find((fieldType) => fieldType.value === type)?.label || "Text"
  );
};

// ============================================================
// API ERROR HELPERS
// ============================================================

const getApiErrorMessage = (error) => {
  if (!error) {
    return "Unable to create service.";
  }

  const responseData = error?.response?.data;

  if (
    typeof responseData?.message === "string" &&
    responseData.message.trim()
  ) {
    return responseData.message.trim();
  }

  if (typeof responseData?.error === "string" && responseData.error.trim()) {
    return responseData.error.trim();
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    if (error.message.toLowerCase().includes("network error")) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    return error.message.trim();
  }

  if (error?.request && !error?.response) {
    return "The server did not respond. Please try again.";
  }

  return "Unable to create service. Please try again.";
};

const getValidationSummary = (errors) => {
  return Object.values(errors || {}).filter(Boolean);
};

// ============================================================
// CUSTOM SELECT
// ============================================================

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

  const handleSelect = (option) => {
    if (disabled) {
      return;
    }

    onChange(option.value);
    setOpen(false);
  };

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    setOpen((current) => !current);
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
          min-h-11
          w-full
          items-center
          justify-between
          rounded-xl
          border
          px-3
          py-0
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

// ============================================================
// SMALL UI COMPONENTS
// ============================================================

const SectionHeader = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={19} />
        </div>

        <div>
          <h2 className="text-base font-bold text-zinc-900">{title}</h2>

          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-5 text-zinc-500">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
};

const FieldLabel = ({ children, required = false }) => {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
      {children}

      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
};

const Input = ({ label, required = false, error, ...props }) => {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}

      <input
        {...props}
        className={`
          h-11
          w-full
          rounded-xl
          border
          bg-white
          px-3.5
          text-sm
          text-zinc-900
          outline-none
          transition
          placeholder:text-zinc-400
          ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
              : "border-zinc-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          }
          ${props.className || ""}
        `}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
};

const Textarea = ({ label, required = false, error, ...props }) => {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}

      <textarea
        {...props}
        className={`
          min-h-[110px]
          w-full
          resize-y
          rounded-xl
          border
          bg-white
          px-3.5
          py-3
          text-sm
          leading-6
          text-zinc-900
          outline-none
          transition
          placeholder:text-zinc-400
          ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-50"
              : "border-zinc-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          }
          ${props.className || ""}
        `}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
};

const Select = ({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  error,
  disabled = false,
}) => {
  return (
    <div>
      {label && <FieldLabel required={required}>{label}</FieldLabel>}

      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
};

const Toggle = ({ checked, onChange, label, description }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="
        flex
        w-full
        items-center
        justify-between
        gap-4
        rounded-xl
        border
        border-zinc-200
        bg-white
        px-4
        py-3
        text-left
        transition
        hover:border-zinc-300
      "
    >
      <div>
        <p className="text-sm font-semibold text-zinc-800">{label}</p>

        {description && (
          <p className="mt-0.5 text-xs leading-5 text-zinc-500">
            {description}
          </p>
        )}
      </div>

      <span
        className={`
          relative
          h-6
          w-11
          shrink-0
          rounded-full
          transition
          ${checked ? "bg-blue-600" : "bg-zinc-300"}
        `}
      >
        <span
          className={`
            absolute
            top-1
            h-4
            w-4
            rounded-full
            bg-white
            shadow-sm
            transition
            ${checked ? "left-6" : "left-1"}
          `}
        />
      </span>
    </button>
  );
};

const ErrorText = ({ children }) => {
  if (!children) {
    return null;
  }

  return <p className="mt-1.5 text-xs font-medium text-red-600">{children}</p>;
};

// ============================================================
// FIELD OPTIONS EDITOR
// ============================================================

const FieldOptionsEditor = ({
  options,
  onChange,
  errors = {},
  errorPrefix,
}) => {
  const addOption = () => {
    onChange([...options, createFieldOption()]);
  };

  const updateOption = (index, key, value) => {
    const next = [...options];

    next[index] = {
      ...next[index],
      [key]: value,
    };

    onChange(next);
  };

  const removeOption = (index) => {
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  };

  const moveOption = (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= options.length) {
      return;
    }

    const next = [...options];

    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

    onChange(next);
  };

  const optionsError = errors[`${errorPrefix}-options`];

  return (
    <div
      className={`
        mt-4
        rounded-2xl
        border
        bg-blue-50/40
        p-4
        ${optionsError ? "border-red-200" : "border-blue-100"}
      `}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-zinc-800">Field Options</p>

          <p className="mt-0.5 text-xs text-zinc-500">
            Add the selectable values for this field.
          </p>
        </div>

        <button
          type="button"
          onClick={addOption}
          className="
            inline-flex
            h-9
            items-center
            justify-center
            gap-1.5
            rounded-lg
            border
            border-blue-200
            bg-white
            px-3
            text-xs
            font-semibold
            text-blue-700
            transition
            hover:bg-blue-50
          "
        >
          <Plus size={15} />
          Add Option
        </button>
      </div>

      {optionsError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
          {optionsError}
        </div>
      )}

      {options.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-blue-200 bg-white px-4 py-5 text-center">
          <p className="text-sm font-medium text-zinc-500">
            No options added yet.
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Add at least one option before creating this service.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {options.map((option, index) => {
            const optionPrefix = `${errorPrefix}-option-${index}`;

            return (
              <div
                key={option._uiId}
                className="rounded-xl border border-zinc-200 bg-white p-3"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <div className="flex h-10 w-8 shrink-0 items-center justify-center text-zinc-400">
                    <GripVertical size={17} />
                  </div>

                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Input
                      label="Label"
                      required
                      value={option.label}
                      error={errors[`${optionPrefix}-label`]}
                      onChange={(event) =>
                        updateOption(index, "label", event.target.value)
                      }
                      placeholder="e.g. iPhone"
                    />

                    <Input
                      label="Value"
                      required
                      value={option.value}
                      error={errors[`${optionPrefix}-value`]}
                      onChange={(event) =>
                        updateOption(index, "value", event.target.value)
                      }
                      placeholder="e.g. iphone"
                    />

                    <Input
                      label="Price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={option.price}
                      error={errors[`${optionPrefix}-price`]}
                      onChange={(event) =>
                        updateOption(index, "price", event.target.value)
                      }
                      placeholder="0"
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveOption(index, "up")}
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-zinc-200
                        text-zinc-500
                        transition
                        hover:bg-zinc-50
                        disabled:cursor-not-allowed
                        disabled:opacity-30
                      "
                      title="Move up"
                    >
                      <ArrowUp size={15} />
                    </button>

                    <button
                      type="button"
                      disabled={index === options.length - 1}
                      onClick={() => moveOption(index, "down")}
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-zinc-200
                        text-zinc-500
                        transition
                        hover:bg-zinc-50
                        disabled:cursor-not-allowed
                        disabled:opacity-30
                      "
                      title="Move down"
                    >
                      <ArrowDown size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-red-200
                        bg-red-50
                        text-red-500
                        transition
                        hover:bg-red-100
                      "
                      title="Remove option"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {errors[`${errorPrefix}-options`] && options.length > 1 && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    Check the option values above for duplicates.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// FIELD EDITOR
// ============================================================

const FieldEditor = ({
  field,
  index,
  onChange,
  onRemove,
  onMove,
  errors = {},
  errorPrefix,
}) => {
  const updateField = (key, value) => {
    onChange({
      ...field,
      [key]: value,
    });
  };

  const handleTypeChange = (type) => {
    onChange({
      ...field,
      type,
      options: isOptionFieldType(type)
        ? field.options?.length
          ? field.options
          : [createFieldOption()]
        : [],
      min: type === "number" ? field.min : "",
      max: type === "number" ? field.max : "",
      step: type === "number" ? field.step : "",
    });
  };

  const fieldTypeInfo =
    FIELD_TYPES.find((item) => item.value === field.type) || FIELD_TYPES[0];

  const FieldIcon = fieldTypeInfo.icon;

  return (
    <div
      className={`
        rounded-[20px]
        border
        bg-zinc-50/60
        p-4
        sm:p-5
        ${
          Object.keys(errors).some((key) => key.startsWith(errorPrefix))
            ? "border-red-200"
            : "border-zinc-200"
        }
      `}
    >
      {/* FIELD HEADER */}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <FieldIcon size={18} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900">Field {index + 1}</p>

            <p className="mt-0.5 text-xs text-zinc-500">
              {getFieldTypeLabel(field.type)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, "up")}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-zinc-200
              bg-white
              text-zinc-500
              transition
              hover:bg-zinc-50
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
            title="Move up"
          >
            <ArrowUp size={14} />
          </button>

          <button
            type="button"
            onClick={() => onMove(index, "down")}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-zinc-200
              bg-white
              text-zinc-500
              transition
              hover:bg-zinc-50
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
            title="Move down"
          >
            <ArrowDown size={14} />
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-red-200
              bg-red-50
              text-red-500
              transition
              hover:bg-red-100
            "
            title="Remove field"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* BASIC FIELD CONFIGURATION */}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Field Name"
          required
          value={field.name}
          error={errors[`${errorPrefix}-name`]}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="e.g. shootLocation"
        />

        <Input
          label="Label"
          required
          value={field.label}
          error={errors[`${errorPrefix}-label`]}
          onChange={(event) => updateField("label", event.target.value)}
          placeholder="e.g. Shoot Location"
        />

        <Select
          label="Field Type"
          value={field.type}
          onChange={handleTypeChange}
          options={FIELD_TYPES.map((fieldType) => ({
            value: fieldType.value,
            label: fieldType.label,
          }))}
        />

        <Input
          label="Placeholder"
          value={field.placeholder}
          onChange={(event) => updateField("placeholder", event.target.value)}
          placeholder="Optional placeholder"
        />

        <div className="md:col-span-2">
          <Input
            label="Help Text"
            value={field.helpText}
            onChange={(event) => updateField("helpText", event.target.value)}
            placeholder="Optional guidance shown below the field"
          />
        </div>
      </div>

      {/* NUMBER CONFIGURATION */}

      {field.type === "number" && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Minimum"
            type="number"
            value={field.min}
            onChange={(event) => updateField("min", event.target.value)}
            placeholder="Optional"
          />

          <Input
            label="Maximum"
            type="number"
            value={field.max}
            onChange={(event) => updateField("max", event.target.value)}
            placeholder="Optional"
          />

          <Input
            label="Step"
            type="number"
            min="0"
            step="any"
            value={field.step}
            error={errors[`${errorPrefix}-number`]}
            onChange={(event) => updateField("step", event.target.value)}
            placeholder="Optional"
          />
        </div>
      )}

      {/* REQUIRED */}

      <div className="mt-4">
        <Toggle
          checked={field.required}
          onChange={(value) => updateField("required", value)}
          label="Required field"
          description="The customer must provide a value before submitting the order."
        />
      </div>

      {/* SELECTABLE OPTIONS */}

      {isOptionFieldType(field.type) && (
        <FieldOptionsEditor
          options={field.options || []}
          onChange={(options) => updateField("options", options)}
          errors={errors}
          errorPrefix={errorPrefix}
        />
      )}
    </div>
  );
};

// ============================================================
// FIELDS COLLECTION EDITOR
// ============================================================

const FieldsCollection = ({
  title,
  description,
  fields,
  onChange,
  errors = {},
  prefix = "field",
}) => {
  const addField = () => {
    onChange([...fields, createField(fields.length)]);
  };

  const updateField = (index, field) => {
    const next = [...fields];

    next[index] = field;

    onChange(next);
  };

  const removeField = (index) => {
    onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
  };

  const moveField = (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= fields.length) {
      return;
    }

    const next = [...fields];

    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

    onChange(next);
  };

  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
      <SectionHeader
        icon={Settings2}
        title={title}
        description={description}
        action={
          <button
            type="button"
            onClick={addField}
            className="
              inline-flex
              h-10
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-zinc-900
              px-4
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-zinc-800
            "
          >
            <Plus size={17} />
            Add Field
          </button>
        }
      />

      {fields.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-5 py-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-400 shadow-sm">
            <Settings2 size={19} />
          </div>

          <p className="mt-3 text-sm font-semibold text-zinc-700">
            No fields added
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-500">
            Add dynamic fields that customers will complete when placing an
            order.
          </p>

          <button
            type="button"
            onClick={addField}
            className="
              mt-4
              inline-flex
              h-9
              items-center
              justify-center
              gap-1.5
              rounded-lg
              border
              border-zinc-200
              bg-white
              px-3
              text-xs
              font-semibold
              text-zinc-700
              transition
              hover:bg-zinc-50
            "
          >
            <Plus size={15} />
            Add First Field
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {fields.map((field, index) => (
            <FieldEditor
              key={field._uiId}
              field={field}
              index={index}
              errors={errors}
              errorPrefix={`${prefix}-${index}`}
              onChange={(updatedField) => updateField(index, updatedField)}
              onRemove={() => removeField(index)}
              onMove={moveField}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// PRICING OPTION EDITOR
// ============================================================

const PricingOptionEditor = ({
  option,
  index,
  isLast,
  onChange,
  onRemove,
  onMove,
  errors = {},
}) => {
  const [expanded, setExpanded] = useState(true);

  const updateOption = (key, value) => {
    onChange({
      ...option,
      [key]: value,
    });
  };

  const addField = () => {
    updateOption("fields", [
      ...(option.fields || []),
      createField(option.fields?.length || 0),
    ]);
  };

  const updateField = (fieldIndex, field) => {
    const next = [...(option.fields || [])];

    next[fieldIndex] = field;

    updateOption("fields", next);
  };

  const removeField = (fieldIndex) => {
    updateOption(
      "fields",
      (option.fields || []).filter(
        (_, currentIndex) => currentIndex !== fieldIndex,
      ),
    );
  };

  const moveField = (fieldIndex, direction) => {
    const targetIndex = direction === "up" ? fieldIndex - 1 : fieldIndex + 1;

    const currentFields = [...(option.fields || [])];

    if (targetIndex < 0 || targetIndex >= currentFields.length) {
      return;
    }

    [currentFields[fieldIndex], currentFields[targetIndex]] = [
      currentFields[targetIndex],
      currentFields[fieldIndex],
    ];

    updateOption("fields", currentFields);
  };

  const optionPrefix = `pricing-${index}`;

  return (
    <div
      className={`
        rounded-[22px]
        border
        bg-zinc-50/60
        p-4
        sm:p-5
        ${
          Object.keys(errors).some((key) => key.startsWith(optionPrefix))
            ? "border-red-200"
            : "border-zinc-200"
        }
      `}
    >
      {/* OPTION HEADER */}

      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Layers3 size={18} />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900">
              {option.name || `Pricing Option ${index + 1}`}
            </p>

            <p className="mt-0.5 text-xs text-zinc-500">
              {option.price !== ""
                ? `₹${Number(option.price || 0).toLocaleString("en-IN")}`
                : "No price set"}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(index, "up")}
            className="
              hidden
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-zinc-200
              bg-white
              text-zinc-500
              transition
              hover:bg-zinc-50
              disabled:cursor-not-allowed
              disabled:opacity-30
              sm:flex
            "
            title="Move up"
          >
            <ArrowUp size={14} />
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={() => onMove(index, "down")}
            className="
              hidden
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-zinc-200
              bg-white
              text-zinc-500
              transition
              hover:bg-zinc-50
              disabled:cursor-not-allowed
              disabled:opacity-30
              sm:flex
            "
            title="Move down"
          >
            <ArrowDown size={14} />
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-red-200
              bg-red-50
              text-red-500
              transition
              hover:bg-red-100
            "
            title="Remove pricing option"
          >
            <Trash2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              border
              border-zinc-200
              bg-white
              text-zinc-500
            "
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* PRICING OPTION CONFIGURATION */}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Option Name"
              required
              value={option.name}
              error={errors[`${optionPrefix}-name`]}
              onChange={(event) => updateOption("name", event.target.value)}
              placeholder="e.g. iPhone Shoot"
            />

            <Input
              label="Price"
              required
              type="number"
              min="0"
              step="0.01"
              value={option.price}
              error={errors[`${optionPrefix}-price`]}
              onChange={(event) => updateOption("price", event.target.value)}
              placeholder="0"
            />

            <Input
              label="Unit"
              required
              value={option.unit}
              error={errors[`${optionPrefix}-unit`]}
              onChange={(event) => updateOption("unit", event.target.value)}
              placeholder="e.g. shoot, video, post"
            />

            <Input
              label="Group"
              value={option.group}
              onChange={(event) => updateOption("group", event.target.value)}
              placeholder="Optional group name"
            />

            <Input
              label="Minimum Quantity"
              required
              type="number"
              min="1"
              step="1"
              value={option.minQuantity}
              error={errors[`${optionPrefix}-quantity`]}
              onChange={(event) =>
                updateOption("minQuantity", event.target.value)
              }
            />

            <Input
              label="Maximum Quantity"
              type="number"
              min="1"
              step="1"
              value={option.maxQuantity}
              onChange={(event) =>
                updateOption("maxQuantity", event.target.value)
              }
              placeholder="Optional"
            />

            <div className="md:col-span-2">
              <Textarea
                label="Description"
                value={option.description}
                onChange={(event) =>
                  updateOption("description", event.target.value)
                }
                placeholder="Describe what this pricing option includes..."
              />
            </div>
          </div>

          {/* ACTIVE */}

          <div className="mt-4">
            <Toggle
              checked={option.isActive}
              onChange={(value) => updateOption("isActive", value)}
              label="Active pricing option"
              description="Inactive options will not be available for selection."
            />
          </div>

          {/* OPTION FIELDS */}

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-800">Option Fields</p>

                <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                  Add fields that apply specifically to this pricing option.
                </p>
              </div>

              <button
                type="button"
                onClick={addField}
                className="
                  inline-flex
                  h-9
                  items-center
                  justify-center
                  gap-1.5
                  rounded-lg
                  border
                  border-zinc-200
                  bg-white
                  px-3
                  text-xs
                  font-semibold
                  text-zinc-700
                  transition
                  hover:bg-zinc-50
                "
              >
                <Plus size={15} />
                Add Field
              </button>
            </div>

            {option.fields?.length > 0 ? (
              <div className="mt-4 space-y-4">
                {option.fields.map((field, fieldIndex) => (
                  <FieldEditor
                    key={field._uiId}
                    field={field}
                    index={fieldIndex}
                    errors={errors}
                    errorPrefix={`${optionPrefix}-field-${fieldIndex}`}
                    onChange={(updatedField) =>
                      updateField(fieldIndex, updatedField)
                    }
                    onRemove={() => removeField(fieldIndex)}
                    onMove={moveField}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-center">
                <p className="text-xs font-medium text-zinc-500">
                  No option-specific fields.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// PRICING OPTIONS COLLECTION
// ============================================================

const PricingOptionsEditor = ({ options, onChange, errors = {} }) => {
  const addOption = () => {
    onChange([...options, createPricingOption(options.length)]);
  };

  const updateOption = (index, option) => {
    const next = [...options];

    next[index] = option;

    onChange(next);
  };

  const removeOption = (index) => {
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  };

  const moveOption = (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= options.length) {
      return;
    }

    const next = [...options];

    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];

    onChange(next);
  };

  return (
    <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
      <SectionHeader
        icon={Layers3}
        title="Pricing Options"
        description="Create selectable pricing configurations. Each option can have its own fields."
        action={
          <button
            type="button"
            onClick={addOption}
            className="
              inline-flex
              h-10
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-zinc-900
              px-4
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-zinc-800
            "
          >
            <Plus size={17} />
            Add Pricing Option
          </button>
        }
      />

      {options.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/70 px-5 py-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-400 shadow-sm">
            <Layers3 size={19} />
          </div>

          <p className="mt-3 text-sm font-semibold text-zinc-700">
            No pricing options
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-500">
            Pricing options are useful when a service has different packages,
            formats, or selectable configurations.
          </p>

          <button
            type="button"
            onClick={addOption}
            className="
              mt-4
              inline-flex
              h-9
              items-center
              justify-center
              gap-1.5
              rounded-lg
              border
              border-zinc-200
              bg-white
              px-3
              text-xs
              font-semibold
              text-zinc-700
              transition
              hover:bg-zinc-50
            "
          >
            <Plus size={15} />
            Add Pricing Option
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {options.map((option, index) => (
            <PricingOptionEditor
              key={option._uiId}
              option={option}
              index={index}
              isLast={index === options.length - 1}
              errors={errors}
              onChange={(updatedOption) => updateOption(index, updatedOption)}
              onRemove={() => removeOption(index)}
              onMove={moveOption}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AdminCreateService = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    category: "",
    description: "",
    pricingType: "fixed",
    basePrice: 0,
    unit: "",
    minQuantity: 1,
    maxQuantity: "",
    pricingOptions: [],
    fields: [],
    isActive: true,
    displayOrder: 0,
  });

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [errors, setErrors] = useState({});

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary = useMemo(() => {
    const serviceFields = formData.fields.length;

    const pricingOptions = formData.pricingOptions.length;

    const optionFields = formData.pricingOptions.reduce(
      (total, option) => total + (option.fields?.length || 0),
      0,
    );

    return {
      serviceFields,
      pricingOptions,
      optionFields,
    };
  }, [formData.fields, formData.pricingOptions]);

  const validationSummary = useMemo(
    () => getValidationSummary(errors),
    [errors],
  );

  // ==========================================================
  // UPDATE FORM
  // ==========================================================

  const updateForm = (key, value) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => {
      const next = {
        ...current,
      };

      delete next[key];

      return next;
    });

    setError("");
  };

  // ==========================================================
  // SLUG GENERATOR
  // ==========================================================

  const generateSlug = () => {
    const slug = formData.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    updateForm("slug", slug);
  };

  // ==========================================================
  // CLIENT VALIDATION
  // ==========================================================

  const validateForm = () => {
    const nextErrors = {};

    // --------------------------------------------------------
    // BASIC INFORMATION
    // --------------------------------------------------------

    if (!formData.name.trim()) {
      nextErrors.name = "Service name is required.";
    }

    if (!formData.slug.trim()) {
      nextErrors.slug = "Slug is required.";
    }

    if (!formData.category.trim()) {
      nextErrors.category = "Category is required.";
    }

    // --------------------------------------------------------
    // BASE PRICE
    // --------------------------------------------------------

    if (
      formData.basePrice === "" ||
      Number(formData.basePrice) < 0 ||
      !Number.isFinite(Number(formData.basePrice))
    ) {
      nextErrors.basePrice = "Enter a valid non-negative base price.";
    }

    // --------------------------------------------------------
    // SERVICE QUANTITY
    // --------------------------------------------------------

    if (
      !Number.isInteger(Number(formData.minQuantity)) ||
      Number(formData.minQuantity) < 1
    ) {
      nextErrors.minQuantity = "Minimum quantity must be at least 1.";
    }

    if (
      formData.maxQuantity !== "" &&
      formData.maxQuantity !== null &&
      formData.maxQuantity !== undefined
    ) {
      if (
        !Number.isInteger(Number(formData.maxQuantity)) ||
        Number(formData.maxQuantity) < 1
      ) {
        nextErrors.maxQuantity = "Maximum quantity must be at least 1.";
      } else if (Number(formData.minQuantity) > Number(formData.maxQuantity)) {
        nextErrors.maxQuantity =
          "Maximum quantity cannot be lower than minimum quantity.";
      }
    }

    // --------------------------------------------------------
    // SERVICE FIELDS
    // --------------------------------------------------------

    const fieldNames = new Set();

    formData.fields.forEach((field, index) => {
      const fieldPrefix = `field-${index}`;

      if (!field.name.trim()) {
        nextErrors[`${fieldPrefix}-name`] = "Field name is required.";
      }

      if (!field.label.trim()) {
        nextErrors[`${fieldPrefix}-label`] = "Field label is required.";
      }

      const normalizedName = field.name.trim().toLowerCase();

      if (normalizedName && fieldNames.has(normalizedName)) {
        nextErrors[`${fieldPrefix}-name`] = "Field names must be unique.";
      }

      if (normalizedName) {
        fieldNames.add(normalizedName);
      }

      // SELECT / RADIO / CHECKBOX
      if (isOptionFieldType(field.type)) {
        if (!field.options || field.options.length === 0) {
          nextErrors[`${fieldPrefix}-options`] = "Add at least one option.";
        }

        const optionValues = new Set();

        field.options?.forEach((option, optionIndex) => {
          const optionPrefix = `${fieldPrefix}-option-${optionIndex}`;

          if (!option.label.trim()) {
            nextErrors[`${optionPrefix}-label`] = "Option label is required.";
          }

          if (!option.value.trim()) {
            nextErrors[`${optionPrefix}-value`] = "Option value is required.";
          }

          const normalizedValue = option.value.trim().toLowerCase();

          if (normalizedValue && optionValues.has(normalizedValue)) {
            nextErrors[`${fieldPrefix}-options`] =
              "Option values must be unique.";
          }

          if (normalizedValue) {
            optionValues.add(normalizedValue);
          }

          if (
            option.price === "" ||
            Number(option.price) < 0 ||
            !Number.isFinite(Number(option.price))
          ) {
            nextErrors[`${optionPrefix}-price`] =
              "Option price must be a valid non-negative number.";
          }
        });
      }

      // NUMBER
      if (field.type === "number") {
        if (
          field.min !== "" &&
          field.max !== "" &&
          Number(field.min) > Number(field.max)
        ) {
          nextErrors[`${fieldPrefix}-number`] =
            "Minimum cannot be greater than maximum.";
        }

        if (field.step !== "" && Number(field.step) <= 0) {
          nextErrors[`${fieldPrefix}-number`] = "Step must be greater than 0.";
        }
      }
    });

    // --------------------------------------------------------
    // PRICING OPTIONS
    // --------------------------------------------------------

    const pricingOptionNames = new Set();

    formData.pricingOptions.forEach((option, index) => {
      const optionPrefix = `pricing-${index}`;

      if (!option.name.trim()) {
        nextErrors[`${optionPrefix}-name`] = "Pricing option name is required.";
      }

      if (!option.unit.trim()) {
        nextErrors[`${optionPrefix}-unit`] = "Pricing option unit is required.";
      }

      if (
        option.price === "" ||
        Number(option.price) < 0 ||
        !Number.isFinite(Number(option.price))
      ) {
        nextErrors[`${optionPrefix}-price`] =
          "Enter a valid non-negative price.";
      }

      const normalizedName = option.name.trim().toLowerCase();

      if (normalizedName && pricingOptionNames.has(normalizedName)) {
        nextErrors[`${optionPrefix}-name`] =
          "Pricing option names must be unique.";
      }

      if (normalizedName) {
        pricingOptionNames.add(normalizedName);
      }

      if (
        !Number.isInteger(Number(option.minQuantity)) ||
        Number(option.minQuantity) < 1
      ) {
        nextErrors[`${optionPrefix}-quantity`] =
          "Minimum quantity must be at least 1.";
      }

      if (
        option.maxQuantity !== "" &&
        option.maxQuantity !== null &&
        option.maxQuantity !== undefined
      ) {
        if (
          !Number.isInteger(Number(option.maxQuantity)) ||
          Number(option.maxQuantity) < 1
        ) {
          nextErrors[`${optionPrefix}-quantity`] =
            "Maximum quantity must be at least 1.";
        } else if (Number(option.minQuantity) > Number(option.maxQuantity)) {
          nextErrors[`${optionPrefix}-quantity`] =
            "Maximum quantity cannot be lower than minimum quantity.";
        }
      }

      // ------------------------------------------------------
      // NESTED OPTION FIELDS
      // ------------------------------------------------------

      const nestedNames = new Set();

      option.fields?.forEach((field, fieldIndex) => {
        const fieldPrefix = `${optionPrefix}-field-${fieldIndex}`;

        if (!field.name.trim()) {
          nextErrors[`${fieldPrefix}-name`] = "Field name is required.";
        }

        if (!field.label.trim()) {
          nextErrors[`${fieldPrefix}-label`] = "Field label is required.";
        }

        const normalizedFieldName = field.name.trim().toLowerCase();

        if (normalizedFieldName && nestedNames.has(normalizedFieldName)) {
          nextErrors[`${fieldPrefix}-name`] = "Field names must be unique.";
        }

        if (normalizedFieldName) {
          nestedNames.add(normalizedFieldName);
        }

        if (isOptionFieldType(field.type)) {
          if (!field.options || field.options.length === 0) {
            nextErrors[`${fieldPrefix}-options`] = "Add at least one option.";
          }

          const optionValues = new Set();

          field.options?.forEach((fieldOption, fieldOptionIndex) => {
            const optionPrefix = `${fieldPrefix}-option-${fieldOptionIndex}`;

            if (!fieldOption.label.trim()) {
              nextErrors[`${optionPrefix}-label`] = "Option label is required.";
            }

            if (!fieldOption.value.trim()) {
              nextErrors[`${optionPrefix}-value`] = "Option value is required.";
            }

            const value = fieldOption.value.trim().toLowerCase();

            if (value && optionValues.has(value)) {
              nextErrors[`${fieldPrefix}-options`] =
                "Option values must be unique.";
            }

            if (value) {
              optionValues.add(value);
            }

            if (
              fieldOption.price === "" ||
              Number(fieldOption.price) < 0 ||
              !Number.isFinite(Number(fieldOption.price))
            ) {
              nextErrors[`${optionPrefix}-price`] =
                "Option price must be a valid non-negative number.";
            }
          });
        }

        if (field.type === "number") {
          if (
            field.min !== "" &&
            field.max !== "" &&
            Number(field.min) > Number(field.max)
          ) {
            nextErrors[`${fieldPrefix}-number`] =
              "Minimum cannot be greater than maximum.";
          }

          if (field.step !== "" && Number(field.step) <= 0) {
            nextErrors[`${fieldPrefix}-number`] =
              "Step must be greater than 0.";
          }
        }
      });
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // ==========================================================
  // BUILD API PAYLOAD
  // ==========================================================

  const buildPayload = () => {
    const cleanField = (field) => {
      const payload = {
        name: field.name.trim(),
        label: field.label.trim(),
        type: field.type,
        placeholder: field.placeholder?.trim() || "",
        helpText: field.helpText?.trim() || "",
        required: Boolean(field.required),
        order: Number(field.order || 0),
      };

      if (field.type === "number") {
        payload.min = field.min === "" ? undefined : Number(field.min);

        payload.max = field.max === "" ? undefined : Number(field.max);

        payload.step = field.step === "" ? undefined : Number(field.step);
      }

      if (isOptionFieldType(field.type)) {
        payload.options = (field.options || []).map((option) => ({
          label: option.label.trim(),
          value: option.value.trim(),
          price: Number(option.price || 0),
        }));
      } else {
        payload.options = [];
      }

      return payload;
    };

    const cleanPricingOption = (option) => {
      const payload = {
        name: option.name.trim(),
        description: option.description?.trim() || "",
        price: Number(option.price || 0),
        unit: option.unit.trim(),
        group: option.group?.trim() || "",
        minQuantity: Number(option.minQuantity || 1),
        isActive: Boolean(option.isActive),
        fields: (option.fields || []).map(cleanField),
        order: Number(option.order || 0),
      };

      if (
        option.maxQuantity !== "" &&
        option.maxQuantity !== null &&
        option.maxQuantity !== undefined
      ) {
        payload.maxQuantity = Number(option.maxQuantity);
      }

      return payload;
    };

    return {
      name: formData.name.trim(),

      slug: formData.slug.trim().toLowerCase(),

      category: formData.category.trim(),

      description: formData.description.trim(),

      pricingType: formData.pricingType,

      basePrice: Number(formData.basePrice || 0),

      unit: formData.unit.trim(),

      minQuantity: Number(formData.minQuantity || 1),

      ...(formData.maxQuantity !== "" &&
      formData.maxQuantity !== null &&
      formData.maxQuantity !== undefined
        ? {
            maxQuantity: Number(formData.maxQuantity),
          }
        : {}),

      pricingOptions: formData.pricingOptions.map(cleanPricingOption),

      fields: formData.fields.map(cleanField),

      isActive: Boolean(formData.isActive),

      displayOrder: Number(formData.displayOrder || 0),
    };
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const isValid = validateForm();

    if (!isValid) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setSubmitting(true);

      const payload = buildPayload();

      await serviceService.createService(payload);

      navigate("/admin/services", {
        replace: true,
        state: {
          success: "Service created successfully.",
        },
      });
    } catch (err) {
      console.error("Create service error:", err);

      const message = getApiErrorMessage(err);

      setError(message);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="mx-auto w-full max-w-[1500px] animate-fade-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ====================================================
            HEADER
        ===================================================== */}

        <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-100/50 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <button
                type="button"
                onClick={() => navigate("/admin/services")}
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-zinc-200
                  bg-white
                  text-zinc-600
                  transition
                  hover:bg-zinc-50
                "
                aria-label="Back to services"
              >
                <ArrowLeft size={19} />
              </button>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Layers3 size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Service Management
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Create Service
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                  Configure the service, pricing, customer fields and pricing
                  options.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/admin/services")}
                disabled={submitting}
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-zinc-200
                  bg-white
                  px-4
                  text-sm
                  font-semibold
                  text-zinc-700
                  transition
                  hover:bg-zinc-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="
                  inline-flex
                  h-10
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-zinc-900
                  px-4
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-zinc-800
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {submitting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {submitting ? "Creating..." : "Create Service"}
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            API ERROR
        ===================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Unable to create service</p>

                  <p className="mt-0.5 leading-5 text-red-600">{error}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="
                    flex
                    h-7
                    w-7
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    text-red-500
                    transition
                    hover:bg-red-100
                  "
                  aria-label="Dismiss error"
                >
                  <X size={15} />
                </button>
              </div>

              {error.toLowerCase().includes("already exists") && (
                <p className="mt-2 text-xs text-red-600">
                  Please use a different slug and try again.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            CLIENT VALIDATION SUMMARY
        ===================================================== */}

        {validationSummary.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div className="min-w-0">
                <p className="text-sm font-bold text-amber-900">
                  Please fix the following errors
                </p>

                <ul className="mt-2 space-y-1.5 text-xs leading-5 text-amber-800">
                  {validationSummary.slice(0, 12).map((message, index) => (
                    <li key={`${message}-${index}`} className="flex gap-2">
                      <span>•</span>
                      <span>{message}</span>
                    </li>
                  ))}
                </ul>

                {validationSummary.length > 12 && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    +{validationSummary.length - 12} more validation errors.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            BASIC INFORMATION
        ===================================================== */}

        <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
          <SectionHeader
            icon={Layers3}
            title="Basic Information"
            description="Define the identity and general information of the service."
          />

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Service Name"
              required
              value={formData.name}
              error={errors.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="e.g. Social Media Video Shoot"
            />

            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Slug"
                    required
                    value={formData.slug}
                    error={errors.slug}
                    onChange={(event) => updateForm("slug", event.target.value)}
                    placeholder="social-media-video-shoot"
                  />
                </div>

                <button
                  type="button"
                  onClick={generateSlug}
                  className="
                    mb-0
                    flex
                    h-11
                    shrink-0
                    items-center
                    gap-1.5
                    rounded-xl
                    border
                    border-zinc-200
                    bg-zinc-50
                    px-3
                    text-xs
                    font-semibold
                    text-zinc-600
                    transition
                    hover:bg-zinc-100
                  "
                >
                  <Copy size={14} />
                  Generate
                </button>
              </div>
            </div>

            <Input
              label="Category"
              required
              value={formData.category}
              error={errors.category}
              onChange={(event) => updateForm("category", event.target.value)}
              placeholder="e.g. Content Creation"
            />

            <Input
              label="Display Order"
              type="number"
              min="0"
              step="1"
              value={formData.displayOrder}
              onChange={(event) =>
                updateForm("displayOrder", event.target.value)
              }
              placeholder="0"
            />

            <div className="md:col-span-2">
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Describe this service..."
              />
            </div>
          </div>

          <div className="mt-5">
            <Toggle
              checked={formData.isActive}
              onChange={(value) => updateForm("isActive", value)}
              label="Service is active"
              description="Active services are available to customers."
            />
          </div>
        </div>

        {/* ====================================================
            PRICING
        ===================================================== */}

        <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
          <SectionHeader
            icon={Hash}
            title="Pricing"
            description="Configure the base pricing model and service quantity limits."
          />

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Pricing Type"
              value={formData.pricingType}
              onChange={(value) => updateForm("pricingType", value)}
              options={PRICING_TYPES.map((pricingType) => ({
                value: pricingType.value,
                label: pricingType.label,
              }))}
            />

            <Input
              label="Base Price"
              required
              type="number"
              min="0"
              step="0.01"
              value={formData.basePrice}
              error={errors.basePrice}
              onChange={(event) => updateForm("basePrice", event.target.value)}
              placeholder="0"
            />

            <Input
              label="Unit"
              value={formData.unit}
              onChange={(event) => updateForm("unit", event.target.value)}
              placeholder="e.g. shoot, post, video"
            />

            <Input
              label="Display Order"
              type="number"
              min="0"
              step="1"
              value={formData.displayOrder}
              onChange={(event) =>
                updateForm("displayOrder", event.target.value)
              }
              placeholder="0"
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Minimum Quantity"
              required
              type="number"
              min="1"
              step="1"
              value={formData.minQuantity}
              error={errors.minQuantity}
              onChange={(event) =>
                updateForm("minQuantity", event.target.value)
              }
            />

            <Input
              label="Maximum Quantity"
              type="number"
              min="1"
              step="1"
              value={formData.maxQuantity}
              error={errors.maxQuantity}
              onChange={(event) =>
                updateForm("maxQuantity", event.target.value)
              }
              placeholder="Leave empty for no maximum"
            />
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3.5">
            <CircleHelp size={17} className="mt-0.5 shrink-0 text-blue-600" />

            <div>
              <p className="text-xs font-bold text-blue-800">
                {
                  PRICING_TYPES.find(
                    (item) => item.value === formData.pricingType,
                  )?.label
                }
              </p>

              <p className="mt-0.5 text-xs leading-5 text-blue-700">
                {
                  PRICING_TYPES.find(
                    (item) => item.value === formData.pricingType,
                  )?.description
                }
              </p>
            </div>
          </div>
        </div>

        {/* ====================================================
            SERVICE FIELDS
        ===================================================== */}

        <FieldsCollection
          title="Service Fields"
          description="These fields are available at the service level when customers place an order."
          fields={formData.fields}
          errors={errors}
          prefix="field"
          onChange={(fields) => updateForm("fields", fields)}
        />

        {/* ====================================================
            PRICING OPTIONS
        ===================================================== */}

        <PricingOptionsEditor
          options={formData.pricingOptions}
          errors={errors}
          onChange={(options) => updateForm("pricingOptions", options)}
        />

        {/* ====================================================
            SUMMARY
        ===================================================== */}

        <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
          <SectionHeader
            icon={CircleHelp}
            title="Configuration Summary"
            description="Review the service configuration before creating it."
          />

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Service Fields
              </p>

              <p className="mt-1 text-xl font-bold text-zinc-900">
                {summary.serviceFields}
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Pricing Options
              </p>

              <p className="mt-1 text-xl font-bold text-zinc-900">
                {summary.pricingOptions}
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Option Fields
              </p>

              <p className="mt-1 text-xl font-bold text-zinc-900">
                {summary.optionFields}
              </p>
            </div>
          </div>
        </div>

        {/* ====================================================
            BOTTOM ACTIONS
        ===================================================== */}

        <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/admin/services")}
            disabled={submitting}
            className="
              inline-flex
              h-11
              items-center
              justify-center
              rounded-xl
              border
              border-zinc-200
              bg-white
              px-5
              text-sm
              font-semibold
              text-zinc-700
              transition
              hover:bg-zinc-50
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="
              inline-flex
              h-11
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-zinc-900
              px-6
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-zinc-800
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}

            {submitting ? "Creating Service..." : "Create Service"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateService;
