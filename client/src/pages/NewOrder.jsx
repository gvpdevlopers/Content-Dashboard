import {
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Info,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";

import OrderSuccess from "../components/OrderSuccess";
import orderService from "../services/orderService";
import serviceService from "../services/serviceService";
import paymentService from "../services/paymentService";
import CustomSelect from "../components/CustomSelect";
import { useEffect, useMemo, useState } from "react";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

const getSortedItems = (items = []) => {
  return [...items].sort(
    (a, b) => Number(a?.order || 0) - Number(b?.order || 0),
  );
};

const getPricingOptions = (service) => {
  if (!Array.isArray(service?.pricingOptions)) {
    return [];
  }

  return getSortedItems(
    service.pricingOptions.filter(
      (option) => option && option.isActive !== false,
    ),
  );
};

const getPricingGroups = (service) => {
  const options = getPricingOptions(service);

  const groups = [];
  const groupMap = new Map();

  options.forEach((option) => {
    const groupName = String(option.group || "").trim();

    /*
     * Options without a group are kept in their own fallback group.
     */
    const key = groupName || "__ungrouped__";

    if (!groupMap.has(key)) {
      const group = {
        key,
        name: groupName,
        options: [],
      };

      groupMap.set(key, group);
      groups.push(group);
    }

    groupMap.get(key).options.push(option);
  });

  return groups;
};

const getQuantityRules = (service, pricingOption) => {
  const minQuantity = Math.max(
    1,
    Number(pricingOption?.minQuantity ?? service?.minQuantity ?? 1),
  );

  const rawMax =
    pricingOption?.maxQuantity ?? service?.maxQuantity ?? undefined;

  const parsedMax =
    rawMax !== undefined && rawMax !== null && rawMax !== ""
      ? Number(rawMax)
      : undefined;

  return {
    minQuantity,
    maxQuantity:
      Number.isFinite(parsedMax) && parsedMax >= minQuantity
        ? parsedMax
        : undefined,
  };
};

const isEmptyValue = (value) => {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === undefined || value === null || String(value).trim() === "";
};

const normalizeFieldType = (field) => {
  if (!field?.type) {
    return "text";
  }

  return String(field.type).toLowerCase();
};

/*
|--------------------------------------------------------------------------
| Selection Field
|--------------------------------------------------------------------------
|
| radio
|   -> exactly one option
|
| checkbox
|   -> zero or more options
|
*/

const SelectionField = ({ field, value, onChange }) => {
  const type = normalizeFieldType(field);
  const options = Array.isArray(field.options) ? field.options : [];

  const isCheckbox = type === "checkbox";

  const selectedValues = isCheckbox
    ? Array.isArray(value)
      ? value
      : value
        ? [value]
        : []
    : value
      ? [value]
      : [];

  const toggleCheckbox = (optionValue) => {
    const currentValues = Array.isArray(value) ? value : value ? [value] : [];

    if (currentValues.includes(optionValue)) {
      onChange(
        field.name,
        currentValues.filter((item) => item !== optionValue),
      );
    } else {
      onChange(field.name, [...currentValues, optionValue]);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-zinc-900">{field.label}</p>

          <span
            className="
              rounded-full
              border
              border-zinc-200
              bg-zinc-50
              px-2
              py-0.5
              text-[10px]
              font-medium
              uppercase
              tracking-wide
              text-zinc-400
            "
          >
            {field.required ? "Required" : "Optional"}
          </span>
        </div>

        <p className="mt-1 text-xs text-zinc-400">
          {isCheckbox ? "Select or deselect" : "Select one"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const selected = selectedValues.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (isCheckbox) {
                  toggleCheckbox(option.value);
                } else {
                  onChange(field.name, option.value);
                }
              }}
              className={`
                relative
                flex
                min-h-[68px]
                items-center
                gap-3
                rounded-2xl
                border
                px-4
                py-3.5
                text-left
                transition-all
                duration-200
                ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 shadow-[0_10px_25px_rgba(0,0,0,0.08)]"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                }
              `}
            >
              <span
                className={`
                  flex
                  h-5
                  w-5
                  shrink-0
                  items-center
                  justify-center
                  border
                  ${isCheckbox ? "rounded-md" : "rounded-full"}
                  ${
                    selected
                      ? "border-white bg-white text-zinc-900"
                      : "border-zinc-300 bg-white"
                  }
                `}
              >
                {selected && <Check size={12} strokeWidth={2.5} />}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={`
                    block
                    text-sm
                    font-medium
                    ${selected ? "text-white" : "text-zinc-900"}
                  `}
                >
                  {option.label}
                </span>

                {Number(option.price || 0) > 0 && (
                  <span
                    className={`
                      mt-0.5
                      block
                      text-xs
                      ${selected ? "text-white/50" : "text-zinc-400"}
                    `}
                  >
                    +{formatCurrency(option.price)}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {field.helpText && (
        <div className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-zinc-400">
          <Info size={13} className="mt-0.5 shrink-0" />

          <span>{field.helpText}</span>
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Dynamic Field
|--------------------------------------------------------------------------
*/

const DynamicField = ({ field, value, onChange }) => {
  const type = normalizeFieldType(field);

  if (type === "radio" || type === "checkbox") {
    return <SelectionField field={field} value={value} onChange={onChange} />;
  }

  if (type === "select") {
    const options = Array.isArray(field.options) ? field.options : [];

    return (
      <div>
        <div className="mb-3">
          <p className="text-sm font-medium text-zinc-900">{field.label}</p>

          <p className="mt-1 text-xs text-zinc-400">
            {field.required ? "Required · Select one" : "Optional · Select one"}
          </p>
        </div>

        <CustomSelect
          value={value || ""}
          onChange={(nextValue) => onChange(field.name, nextValue)}
          options={options}
          placeholder={field.placeholder || "Select an option"}
        />

        {field.helpText && (
          <div className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-zinc-400">
            <Info size={13} className="mt-0.5 shrink-0" />

            <span>{field.helpText}</span>
          </div>
        )}
      </div>
    );
  }

  const commonClassName = `
    w-full
    rounded-xl
    border
    border-zinc-200
    bg-zinc-50
    px-4
    py-3.5
    text-sm
    text-zinc-900
    outline-none
    transition-all
    duration-200
    placeholder:text-zinc-400
    hover:border-zinc-300
    focus:border-zinc-400
    focus:bg-white
    focus:ring-4
    focus:ring-zinc-900/[0.04]
  `;

  const label = (
    <div className="mb-3">
      <p className="text-sm font-medium text-zinc-900">{field.label}</p>

      <p className="mt-1 text-xs text-zinc-400">
        {field.required ? "Required" : "Optional"}
      </p>
    </div>
  );

  const helpText = field.helpText ? (
    <div className="mt-2.5 flex items-start gap-1.5 text-xs leading-5 text-zinc-400">
      <Info size={13} className="mt-0.5 shrink-0" />

      <span>{field.helpText}</span>
    </div>
  ) : null;

  if (type === "textarea") {
    return (
      <div>
        {label}

        <textarea
          value={value ?? ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder || ""}
          rows={4}
          className={`${commonClassName} resize-y leading-6`}
        />

        {helpText}
      </div>
    );
  }

  if (type === "number") {
    return (
      <div>
        {label}

        <input
          type="number"
          value={value ?? ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder || ""}
          min={field.min}
          max={field.max}
          step={field.step}
          className={commonClassName}
        />

        {helpText}
      </div>
    );
  }

  if (type === "date") {
    return (
      <div>
        {label}

        <input
          type="date"
          value={value ?? ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          className={commonClassName}
        />

        {helpText}
      </div>
    );
  }

  if (type === "url") {
    return (
      <div>
        {label}

        <input
          type="url"
          value={value ?? ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder || ""}
          className={commonClassName}
        />

        {helpText}
      </div>
    );
  }

  return (
    <div>
      {label}

      <input
        type="text"
        value={value ?? ""}
        onChange={(event) => onChange(field.name, event.target.value)}
        placeholder={field.placeholder || ""}
        className={commonClassName}
      />

      {helpText}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Quantity Control
|--------------------------------------------------------------------------
*/

const QuantityControl = ({
  quantity,
  minQuantity,
  maxQuantity,
  unit,
  onChange,
}) => {
  const canDecrease = quantity > minQuantity;

  const canIncrease = maxQuantity === undefined || quantity < maxQuantity;

  const decrease = () => {
    if (!canDecrease) {
      return;
    }

    onChange(quantity - 1);
  };

  const increase = () => {
    if (!canIncrease) {
      return;
    }

    onChange(quantity + 1);
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
      <button
        type="button"
        onClick={decrease}
        disabled={!canDecrease}
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          text-zinc-500
          transition-all
          hover:bg-white
          hover:text-zinc-900
          hover:cursor-pointer
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
      >
        <Minus size={16} />
      </button>

      <div className="text-center">
        <p className="text-lg font-semibold text-zinc-900">{quantity}</p>

        {unit && (
          <p className="text-[11px] text-zinc-400">
            {unit}
            {quantity !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={increase}
        disabled={!canIncrease}
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          text-zinc-500
          transition-all
          hover:bg-white
          hover:text-zinc-900
          hover:cursor-pointer
          disabled:cursor-not-allowed
          disabled:opacity-30
        "
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Payment Option
|--------------------------------------------------------------------------
*/

const PaymentOption = ({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        flex
        w-full
        items-start
        gap-3.5
        rounded-2xl
        border
        p-4
        text-left
        transition-all
        duration-300
        sm:p-5
        ${
          selected
            ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_35px_rgba(0,0,0,0.08)]"
            : "border-zinc-200 bg-white hover:cursor-pointer hover:border-zinc-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        }
      `}
    >
      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${
            selected
              ? "bg-white text-zinc-900"
              : "border border-zinc-200 bg-zinc-50 text-zinc-500"
          }
        `}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1 pr-6">
        <p
          className={`
            text-sm
            font-medium
            ${selected ? "text-white" : "text-zinc-900"}
          `}
        >
          {title}
        </p>

        <p
          className={`
            mt-1
            text-xs
            leading-5
            ${selected ? "text-white/50" : "text-zinc-500"}
          `}
        >
          {description}
        </p>
      </div>

      {selected && (
        <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-white text-zinc-900">
          <Check size={12} />
        </div>
      )}
    </button>
  );
};

/*
|--------------------------------------------------------------------------
| New Order
|--------------------------------------------------------------------------
*/

const NewOrder = () => {
  const [services, setServices] = useState([]);

  const [selectedService, setSelectedService] = useState(null);

  /*
   * Normal services with one pricing option.
   */
  const [selectedPricingOption, setSelectedPricingOption] = useState(null);

  /*
   * Grouped pricing.
   *
   * Example:
   *
   * {
   *   shoot: cameraOption,
   *   drone: droneOption,
   *   host: localOption
   * }
   */
  const [selectedPricingOptions, setSelectedPricingOptions] = useState({});

  /*
   * Per-group quantities.
   *
   * Example:
   *
   * {
   *   shoot: 2,
   *   drone: 1,
   *   host: 1
   * }
   */
  const [pricingQuantities, setPricingQuantities] = useState({});

  const [formData, setFormData] = useState({});

  const [additionalRequirements, setAdditionalRequirements] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [loadingServices, setLoadingServices] = useState(true);

  const [loadingService, setLoadingService] = useState(false);

  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Is Grouped Pricing
  |--------------------------------------------------------------------------
  */

  const isGroupedPricing = useMemo(() => {
    const pricingOptions = getPricingOptions(selectedService);

    return pricingOptions.some(
      (option) => String(option?.group || "").trim() !== "",
    );
  }, [selectedService]);

  /*
  |--------------------------------------------------------------------------
  | Load Services
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        setError("");

        const data = await serviceService.getServices();

        const activeServices = Array.isArray(data?.services)
          ? data.services.filter((service) => service?.isActive !== false)
          : [];

        const sortedServices = [...activeServices].sort(
          (a, b) => Number(a?.displayOrder || 0) - Number(b?.displayOrder || 0),
        );

        setServices(sortedServices);

        if (sortedServices.length > 0) {
          const firstService = sortedServices[0];

          setSelectedService(firstService);

          setSelectedPricingOption(null);

          setSelectedPricingOptions({});

          setPricingQuantities({});

          const rules = getQuantityRules(firstService, null);

          const shouldHaveQuantity =
            firstService.pricingType === "per_unit" ||
            firstService.pricingType === "starting_from";

          setFormData(
            shouldHaveQuantity
              ? {
                  quantity: rules.minQuantity,
                }
              : {},
          );
        }
      } catch (error) {
        console.error("Failed to load services:", error);

        setError(error.response?.data?.message || "Unable to load services.");
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Select Service
  |--------------------------------------------------------------------------
  */

  const handleServiceChange = async (serviceId) => {
    try {
      setLoadingService(true);
      setError("");

      const data = await serviceService.getServiceById(serviceId);

      const service = data?.service;

      if (!service) {
        throw new Error("Selected service could not be loaded.");
      }

      setSelectedService(service);

      setSelectedPricingOption(null);

      setSelectedPricingOptions({});

      setPricingQuantities({});

      const rules = getQuantityRules(service, null);

      const shouldHaveQuantity =
        service.pricingType === "per_unit" ||
        service.pricingType === "starting_from";

      setFormData(
        shouldHaveQuantity
          ? {
              quantity: rules.minQuantity,
            }
          : {},
      );

      setAdditionalRequirements("");
    } catch (error) {
      console.error("Failed to load service:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load selected service.",
      );
    } finally {
      setLoadingService(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Select Normal Pricing Option
  |--------------------------------------------------------------------------
  */

  const handlePricingOptionChange = (option) => {
    setSelectedPricingOption(option);

    const rules = getQuantityRules(selectedService, option);

    setFormData((current) => ({
      ...current,
      quantity: rules.minQuantity,
    }));

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Select Grouped Pricing Option
  |--------------------------------------------------------------------------
  */

  const handleGroupedPricingOptionChange = (group, option) => {
    const currentSelected = selectedPricingOptions[group] || null;

    const isDeselecting = currentSelected?._id === option?._id;

    const nextSelected = isDeselecting ? null : option;

    /*
     * Update selected option.
     */
    setSelectedPricingOptions((current) => ({
      ...current,
      [group]: nextSelected,
    }));

    /*
     * Update pricing quantity.
     *
     * If selected:
     *   initialize to minimum.
     *
     * If deselected:
     *   completely remove the quantity.
     */
    setPricingQuantities((current) => {
      const next = {
        ...current,
      };

      if (nextSelected) {
        const rules = getQuantityRules(selectedService, nextSelected);

        next[group] = rules.minQuantity;
      } else {
        delete next[group];
      }

      return next;
    });

    /*
     * Store the selected pricing option ID
     * in formData.
     *
     * This is much safer than converting names
     * like "Founder Faced" into "founder_faced".
     *
     * Backend supports matching by option _id.
     */
    setFormData((current) => {
      const next = {
        ...current,
      };

      if (nextSelected) {
        next[group] = String(nextSelected._id);
      } else {
        delete next[group];
      }

      return next;
    });

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Grouped Quantity
  |--------------------------------------------------------------------------
  */

  const handleGroupedQuantityChange = (group, nextQuantity) => {
    const option = selectedPricingOptions[group];

    if (!option) {
      return;
    }

    const rules = getQuantityRules(selectedService, option);

    let normalized = Number(nextQuantity);

    if (!Number.isFinite(normalized)) {
      normalized = rules.minQuantity;
    }

    normalized = Math.floor(normalized);

    normalized = Math.max(rules.minQuantity, normalized);

    if (rules.maxQuantity !== undefined) {
      normalized = Math.min(rules.maxQuantity, normalized);
    }

    setPricingQuantities((current) => ({
      ...current,
      [group]: normalized,
    }));

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Field Change
  |--------------------------------------------------------------------------
  */

  const handleFieldChange = (fieldName, value) => {
    setFormData((current) => ({
      ...current,
      [fieldName]: value,
    }));

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Quantity Pricing Option
  |--------------------------------------------------------------------------
  */

  const quantityPricingOption = useMemo(() => {
    return isGroupedPricing ? null : selectedPricingOption;
  }, [isGroupedPricing, selectedPricingOption]);

  /*
  |--------------------------------------------------------------------------
  | Quantity Rules
  |--------------------------------------------------------------------------
  */

  const quantityRules = useMemo(() => {
    return getQuantityRules(selectedService, quantityPricingOption);
  }, [selectedService, quantityPricingOption]);

  /*
  |--------------------------------------------------------------------------
  | Has Quantity
  |--------------------------------------------------------------------------
  */

  const hasQuantity = useMemo(() => {
    return Boolean(
      !isGroupedPricing &&
      (quantityPricingOption ||
        selectedService?.pricingType === "per_unit" ||
        selectedService?.pricingType === "starting_from"),
    );
  }, [isGroupedPricing, quantityPricingOption, selectedService]);

  /*
  |--------------------------------------------------------------------------
  | Normal Service Quantity
  |--------------------------------------------------------------------------
  */

  const quantity = useMemo(() => {
    const rawQuantity = Number(formData.quantity || quantityRules.minQuantity);

    if (!Number.isFinite(rawQuantity)) {
      return quantityRules.minQuantity;
    }

    let normalized = Math.floor(rawQuantity);

    normalized = Math.max(quantityRules.minQuantity, normalized);

    if (quantityRules.maxQuantity !== undefined) {
      normalized = Math.min(quantityRules.maxQuantity, normalized);
    }

    return normalized;
  }, [formData.quantity, quantityRules.minQuantity, quantityRules.maxQuantity]);

  /*
  |--------------------------------------------------------------------------
  | Selected Grouped Pricing Options
  |--------------------------------------------------------------------------
  */

  const selectedGroupedPricingOptions = useMemo(() => {
    if (!isGroupedPricing) {
      return [];
    }

    return Object.values(selectedPricingOptions).filter(Boolean);
  }, [isGroupedPricing, selectedPricingOptions]);

  /*
  |--------------------------------------------------------------------------
  | Active Fields
  |--------------------------------------------------------------------------
  |
  | Field ownership:
  |
  | 1. Always include service-level fields.
  |
  | 2. Also include fields from the currently selected
  |    pricing option(s).
  |
  | Normal pricing:
  |    Service fields
  |    +
  |    Selected pricing option fields
  |
  | Grouped pricing:
  |    Service fields
  |    +
  |    Fields from every selected pricing option
  |
  | Example:
  |
  |    Shoot   -> Cinematic
  |    Drone   -> Yes
  |    Host    -> Professional
  |
  | The active fields become:
  |
  |    Service fields
  |    Cinematic-specific fields
  |    Drone-specific fields
  |    Professional-specific fields
  |
  | The field configuration itself is the source of truth.
  | No group names such as "shoot", "drone" or "host" are
  | used to determine which fields are displayed.
  |
  | If the same field name exists in multiple selected
  | locations, the selected pricing-option field takes
  | precedence over the service-level field.
  */

  const activeFields = useMemo(() => {
    if (!selectedService) {
      return [];
    }

    const serviceFields = Array.isArray(selectedService.fields)
      ? selectedService.fields
      : [];

    const selectedOptions = isGroupedPricing
      ? selectedGroupedPricingOptions
      : selectedPricingOption
        ? [selectedPricingOption]
        : [];

    const fieldMap = new Map();

    /*
     * Always include service-level fields first.
     */
    for (const field of serviceFields) {
      if (!field?.name) {
        continue;
      }

      const fieldName = String(field.name).trim();

      if (!fieldName) {
        continue;
      }

      fieldMap.set(fieldName, field);
    }

    /*
     * Add fields from selected pricing option(s).
     *
     * For normal pricing there can be one selected option.
     *
     * For grouped pricing there can be multiple selected
     * options, such as Shoot + Drone + Host.
     *
     * Unselected pricing options are never included here.
     */
    for (const pricingOption of selectedOptions) {
      if (!pricingOption || !Array.isArray(pricingOption.fields)) {
        continue;
      }

      for (const field of pricingOption.fields) {
        if (!field?.name) {
          continue;
        }

        const fieldName = String(field.name).trim();

        if (!fieldName) {
          continue;
        }

        /*
         * Pricing-option-specific fields take precedence over
         * service-level fields with the same name.
         */
        fieldMap.set(fieldName, field);
      }
    }

    return getSortedItems(Array.from(fieldMap.values()));
  }, [
    selectedService,
    selectedPricingOption,
    selectedGroupedPricingOptions,
    isGroupedPricing,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Clean Inactive Dynamic Fields
  |--------------------------------------------------------------------------
  |
  | When a pricing option is deselected, its dynamic fields
  | should no longer remain in formData.
  |
  | Existing values for still-active fields are preserved.
  */

  useEffect(() => {
    if (!selectedService) {
      return;
    }

    const activeFieldNames = new Set(
      activeFields
        .map((field) => String(field?.name || "").trim())
        .filter(Boolean),
    );

    const configuredDynamicFieldNames = new Set();

    const collectFieldNames = (fields) => {
      if (!Array.isArray(fields)) {
        return;
      }

      for (const field of fields) {
        const fieldName = String(field?.name || "").trim();

        if (fieldName) {
          configuredDynamicFieldNames.add(fieldName);
        }
      }
    };

    collectFieldNames(selectedService.fields);

    for (const pricingOption of getPricingOptions(selectedService)) {
      collectFieldNames(pricingOption?.fields);
    }

    setFormData((current) => {
      let changed = false;

      const next = {
        ...current,
      };

      /*
       * Only remove keys that are actually configured
       * as dynamic fields.
       *
       * This prevents deleting unrelated order data such
       * as quantity or pricingQuantities.
       */
      for (const fieldName of configuredDynamicFieldNames) {
        if (!activeFieldNames.has(fieldName) && fieldName in next) {
          delete next[fieldName];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [selectedService, activeFields]);

  /*
  |--------------------------------------------------------------------------
  | Grouped Pricing Total
  |--------------------------------------------------------------------------
  */

  const selectedPricingOptionsPrice = useMemo(() => {
    if (!isGroupedPricing) {
      return Number(selectedPricingOption?.price || 0);
    }

    return selectedGroupedPricingOptions.reduce((total, option) => {
      const group = String(option?.group || "").trim();

      const rules = getQuantityRules(selectedService, option);

      const rawQuantity = pricingQuantities[group];

      const optionQuantity =
        rawQuantity !== undefined && rawQuantity !== null
          ? Number(rawQuantity)
          : rules.minQuantity;

      const safeQuantity = Number.isFinite(optionQuantity)
        ? Math.max(rules.minQuantity, Math.floor(optionQuantity))
        : rules.minQuantity;

      return total + Number(option?.price || 0) * safeQuantity;
    }, 0);
  }, [
    isGroupedPricing,
    selectedPricingOption,
    selectedGroupedPricingOptions,
    pricingQuantities,
    selectedService,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Dynamic Field Add-on Total
  |--------------------------------------------------------------------------
  */

  const selectedFieldsPrice = useMemo(() => {
    if (!activeFields.length) {
      return 0;
    }

    let total = 0;

    for (const field of activeFields) {
      const fieldValue = formData[field.name];

      if (isEmptyValue(fieldValue)) {
        continue;
      }

      const selectedValues = Array.isArray(fieldValue)
        ? fieldValue
        : [fieldValue];

      for (const selectedValue of selectedValues) {
        const selectedOption = (field.options || []).find(
          (option) => String(option.value) === String(selectedValue),
        );

        if (selectedOption) {
          total += Number(selectedOption.price || 0);
        }
      }
    }

    return total;
  }, [activeFields, formData]);

  /*
  |--------------------------------------------------------------------------
  | Estimated Price
  |--------------------------------------------------------------------------
  */

  const estimatedPrice = useMemo(() => {
    if (!selectedService) {
      return 0;
    }

    /*
     * Grouped pricing.
     */
    if (isGroupedPricing) {
      /*
       * If at least one pricing option is selected,
       * the selected options are the actual price.
       *
       * This also correctly supports a selected option
       * whose price is 0.
       */
      if (selectedGroupedPricingOptions.length > 0) {
        return selectedPricingOptionsPrice + selectedFieldsPrice;
      }

      /*
       * No grouped option selected.
       */
      switch (selectedService.pricingType) {
        case "fixed":
          return Number(selectedService.basePrice || 0) + selectedFieldsPrice;

        case "per_unit":
        case "starting_from":
          return (
            Number(selectedService.basePrice || 0) * quantity +
            selectedFieldsPrice
          );

        default:
          return selectedFieldsPrice;
      }
    }

    /*
     * Normal service pricing.
     */
    let basePrice = 0;

    if (selectedPricingOption) {
      basePrice = Number(selectedPricingOption.price || 0) * quantity;
    } else {
      switch (selectedService.pricingType) {
        case "fixed":
          basePrice = Number(selectedService.basePrice || 0);
          break;

        case "per_unit":
          basePrice = Number(selectedService.basePrice || 0) * quantity;
          break;

        case "starting_from":
          basePrice = Number(selectedService.basePrice || 0) * quantity;
          break;

        case "custom":
          basePrice = 0;
          break;

        default:
          basePrice = Number(selectedService.basePrice || 0);
      }
    }

    return basePrice + selectedFieldsPrice;
  }, [
    selectedService,
    selectedPricingOption,
    selectedGroupedPricingOptions,
    selectedPricingOptionsPrice,
    selectedFieldsPrice,
    quantity,
    isGroupedPricing,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Pricing Label
  |--------------------------------------------------------------------------
  */

  const pricingLabel = useMemo(() => {
    if (isGroupedPricing) {
      return "";
    }

    const unit = selectedPricingOption?.unit || selectedService?.unit;

    if (!unit) {
      return "";
    }

    return `per ${unit}`;
  }, [isGroupedPricing, selectedPricingOption, selectedService]);

  /*
  |--------------------------------------------------------------------------
  | Pricing Display
  |--------------------------------------------------------------------------
  */

  const pricingDisplay = useMemo(() => {
    if (!selectedService) {
      return "Custom";
    }

    /*
     * Grouped service with selected option,
     * including a zero-price option.
     */
    if (isGroupedPricing && selectedGroupedPricingOptions.length > 0) {
      return formatCurrency(estimatedPrice);
    }

    if (
      selectedService.pricingType === "custom" &&
      !selectedPricingOption &&
      selectedGroupedPricingOptions.length === 0
    ) {
      return "Custom";
    }

    if (estimatedPrice <= 0) {
      return "Custom";
    }

    return formatCurrency(estimatedPrice);
  }, [
    selectedService,
    selectedPricingOption,
    selectedGroupedPricingOptions,
    estimatedPrice,
    isGroupedPricing,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Validate Dynamic Fields
  |--------------------------------------------------------------------------
  */

  const validateFields = () => {
    const validationErrors = {};

    for (const field of activeFields) {
      const value = formData[field.name];

      const type = normalizeFieldType(field);

      /*
       * Required validation.
       */
      if (field.required && isEmptyValue(value)) {
        validationErrors[field.name] = `${field.label} is required.`;

        continue;
      }

      /*
       * Optional empty field.
       */
      if (isEmptyValue(value)) {
        continue;
      }

      /*
       * Checkbox.
       */
      if (type === "checkbox") {
        const selectedValues = Array.isArray(value) ? value : [value];

        const allowedValues = (field.options || []).map((option) =>
          String(option.value),
        );

        const invalidValue = selectedValues.some(
          (selectedValue) => !allowedValues.includes(String(selectedValue)),
        );

        if (invalidValue) {
          validationErrors[field.name] =
            `${field.label} has an invalid selection.`;
        }

        continue;
      }

      /*
       * Radio / select.
       */
      if (type === "radio" || type === "select") {
        const allowedValues = (field.options || []).map((option) =>
          String(option.value),
        );

        if (!allowedValues.includes(String(value))) {
          validationErrors[field.name] =
            `${field.label} has an invalid selection.`;
        }

        continue;
      }

      /*
       * Number.
       */
      if (type === "number") {
        const numberValue = Number(value);

        if (!Number.isFinite(numberValue)) {
          validationErrors[field.name] =
            `${field.label} must be a valid number.`;

          continue;
        }

        if (field.min !== undefined && numberValue < Number(field.min)) {
          validationErrors[field.name] =
            `${field.label} must be at least ${field.min}.`;
        }

        if (field.max !== undefined && numberValue > Number(field.max)) {
          validationErrors[field.name] =
            `${field.label} must be at most ${field.max}.`;
        }

        if (field.step !== undefined && Number(field.step) > 0) {
          const remainder = numberValue % Number(field.step);

          if (Math.abs(remainder) > 0.000001) {
            validationErrors[field.name] =
              `${field.label} must use increments of ${field.step}.`;
          }
        }

        continue;
      }

      /*
       * URL.
       */
      if (type === "url") {
        try {
          const url = new URL(String(value));

          if (!["http:", "https:"].includes(url.protocol)) {
            validationErrors[field.name] =
              `${field.label} must be a valid URL.`;
          }
        } catch {
          validationErrors[field.name] = `${field.label} must be a valid URL.`;
        }

        continue;
      }

      /*
       * Date.
       */
      if (type === "date") {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          validationErrors[field.name] = `${field.label} must be a valid date.`;
        }
      }
    }

    return validationErrors;
  };

  /*
  |--------------------------------------------------------------------------
  | Validate Grouped Pricing
  |--------------------------------------------------------------------------
  */

  const validateGroupedPricing = () => {
    if (!isGroupedPricing) {
      return "";
    }

    const groups = getPricingGroups(selectedService);

    for (const group of groups) {
      const selectedOption = selectedPricingOptions[group.key];

      // Groups are optional because the current Service schema
      // does not have a group-level "required" property.
      if (!selectedOption) {
        continue;
      }

      const rules = getQuantityRules(selectedService, selectedOption);

      const rawQuantity = pricingQuantities[group.key];

      const selectedQuantity = Number(rawQuantity ?? rules.minQuantity);

      if (!Number.isInteger(selectedQuantity)) {
        return `${group.name || "Option"} quantity must be a whole number.`;
      }

      if (selectedQuantity < rules.minQuantity) {
        return `${selectedOption.name} requires a minimum quantity of ${rules.minQuantity}.`;
      }

      if (
        rules.maxQuantity !== undefined &&
        selectedQuantity > rules.maxQuantity
      ) {
        return `${selectedOption.name} allows a maximum quantity of ${rules.maxQuantity}.`;
      }
    }

    return "";
  };
  /*
  |--------------------------------------------------------------------------
  | Submit Order
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!selectedService) {
      setError("Please select a service.");

      return;
    }

    /*
     * Grouped pricing validation.
     */
    if (isGroupedPricing) {
      const groupedPricingError = validateGroupedPricing();

      if (groupedPricingError) {
        setError(groupedPricingError);

        return;
      }
    } else {
      /*
       * Normal pricing validation.
       */
      const pricingOptions = getPricingOptions(selectedService);

      if (pricingOptions.length > 0 && !selectedPricingOption) {
        setError("Please select a service option.");

        return;
      }
    }

    /*
     * Normal service quantity validation.
     *
     * Grouped services use their own per-group
     * quantities.
     */
    if (hasQuantity) {
      if (quantity < quantityRules.minQuantity) {
        setError(`Minimum quantity is ${quantityRules.minQuantity}.`);

        return;
      }

      if (
        quantityRules.maxQuantity !== undefined &&
        quantity > quantityRules.maxQuantity
      ) {
        setError(`Maximum quantity is ${quantityRules.maxQuantity}.`);

        return;
      }
    }

    /*
     * Dynamic field validation.
     */
    const validationErrors = validateFields();

    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors)[0]);

      return;
    }

    try {
      setSubmitting(true);

      /*
       * Only send currently active configured fields.
       *
       * For normal pricing, this includes service-level
       * fields and fields from the selected pricing option.
       *
       * For grouped pricing, this includes service-level
       * fields and fields from all currently selected
       * pricing options.
       *
       * Inactive/deselected option fields are excluded.
       */
      const cleanFormData = {};

      for (const field of activeFields) {
        const value = formData[field.name];

        if (value !== undefined && value !== null) {
          cleanFormData[field.name] = value;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Grouped pricing payload
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | We send the actual MongoDB pricing option _id
      | for each selected group.
      |
      | Example:
      |
      | shoot: "6a9c0c15c5c693b1f9ec32ec"
      |
      | instead of:
      |
      | shoot: "camera"
      |
      | This avoids problems with names such as:
      |
      | "Founder Faced"
      |
      */

      if (isGroupedPricing) {
        const groupedFormData = {
          ...cleanFormData,
        };

        /*
         * Add selected pricing option IDs.
         */
        for (const [group, option] of Object.entries(selectedPricingOptions)) {
          if (!option) {
            continue;
          }

          groupedFormData[group] = String(option._id);
        }

        /*
         * Optional groups are omitted when not selected.
         */

        /*
         * Send only quantities for currently
         * selected groups.
         */
        const selectedQuantities = {};

        for (const [group, option] of Object.entries(selectedPricingOptions)) {
          if (!option) {
            continue;
          }

          const rules = getQuantityRules(selectedService, option);

          const rawQuantity = pricingQuantities[group];

          selectedQuantities[group] =
            rawQuantity !== undefined && rawQuantity !== null
              ? Number(rawQuantity)
              : rules.minQuantity;
        }

        groupedFormData.pricingQuantities = selectedQuantities;

        /*
         * Replace the normal clean form data
         * with grouped form data.
         */
        Object.keys(cleanFormData).forEach((key) => {
          delete cleanFormData[key];
        });

        Object.assign(cleanFormData, groupedFormData);
      }

      /*
      |--------------------------------------------------------------------------
      | Create order
      |--------------------------------------------------------------------------
      */

      const orderResponse = await orderService.createOrder({
        serviceId: selectedService._id,

        /*
         * Normal services continue using
         * pricingOptionId.
         *
         * Grouped services resolve their pricing
         * options from formData.
         */
        pricingOptionId: !isGroupedPricing
          ? selectedPricingOption?._id || undefined
          : undefined,

        /*
         * Grouped services always use top-level
         * quantity = 1.
         *
         * Their actual quantities are sent through:
         *
         * formData.pricingQuantities
         */
        quantity: isGroupedPricing ? 1 : hasQuantity ? quantity : 1,

        formData: cleanFormData,

        additionalRequirements: additionalRequirements.trim(),

        paymentMethod,
      });

      const createdOrder = orderResponse?.order;

      if (!createdOrder) {
        throw new Error(
          "Order was created but no order details were returned.",
        );
      }

      /*
      |--------------------------------------------------------------------------
      | COD
      |--------------------------------------------------------------------------
      */

      if (paymentMethod === "cod") {
        setOrderSuccess(createdOrder);

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Online Payment
      |--------------------------------------------------------------------------
      */

      if (paymentMethod === "online") {
        const razorpayResponse = await paymentService.createRazorpayOrder(
          createdOrder._id || createdOrder.id,
        );

        const razorpayOrder = razorpayResponse?.razorpayOrder;

        if (!razorpayOrder) {
          throw new Error("Unable to initialize online payment.");
        }

        if (!window.Razorpay) {
          throw new Error("Razorpay Checkout failed to load.");
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,

          amount: razorpayOrder.amount,

          currency: razorpayOrder.currency,

          name: "Glow Ventures",

          description: createdOrder.service?.name
            ? `${createdOrder.service.name} Order`
            : "Content Service Order",

          order_id: razorpayOrder.id,

          handler: async function (response) {
            try {
              setSubmitting(true);
              setError("");

              const verification = await paymentService.verifyRazorpayPayment({
                orderId: createdOrder._id || createdOrder.id,

                razorpay_order_id: response.razorpay_order_id,

                razorpay_payment_id: response.razorpay_payment_id,

                razorpay_signature: response.razorpay_signature,
              });

              if (verification?.success) {
                setOrderSuccess(verification.order);
              } else {
                setError("Payment verification failed.");
              }
            } catch (error) {
              console.error("Payment verification error:", error);

              setError(
                error.response?.data?.message || "Payment verification failed.",
              );
            } finally {
              setSubmitting(false);
            }
          },

          prefill: {
            name: "",
            email: "",
            contact: "",
          },

          theme: {
            color: "#18181b",
          },

          modal: {
            ondismiss: function () {
              setSubmitting(false);

              setError(
                "Payment was cancelled. You can try again from your order.",
              );
            },
          },
        };

        const razorpay = new window.Razorpay(options);

        razorpay.open();
      }
    } catch (error) {
      console.error("Create order/payment error:", error);

      const responseData = error.response?.data;

      if (responseData?.errors) {
        const firstError = Object.values(responseData.errors)[0];

        setError(
          typeof firstError === "string"
            ? firstError
            : "Please check your order details.",
        );
      } else {
        setError(
          responseData?.message ||
            error.message ||
            "Unable to process your order.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Success
  |--------------------------------------------------------------------------
  */

  if (orderSuccess) {
    return <OrderSuccess order={orderSuccess} />;
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loadingServices) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1180px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={22} className="animate-spin text-zinc-400" />

          <p className="text-sm text-zinc-400">Loading services...</p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | No Services
  |--------------------------------------------------------------------------
  */

  if (!selectedService) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1180px] items-center justify-center px-5">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-400">
            <Info size={20} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-zinc-900">
            No services available
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            There are currently no active services available for ordering.
          </p>

          {error && <p className="mt-4 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Steps
  |--------------------------------------------------------------------------
  */

  const pricingOptions = getPricingOptions(selectedService);

  const pricingGroups = getPricingGroups(selectedService);

  const serviceStep = 1;
  const pricingStep = 2;
  const quantityStep = pricingOptions.length ? 3 : 2;
  const detailsStep = quantityStep + 1;
  const paymentStep = detailsStep + 1;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:py-10">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            {/* ==========================================================
                SERVICE
            =========================================================== */}

            <section
              className="
                relative
                z-20
                rounded-[24px]
                border
                border-zinc-200
                bg-white
                p-5
                shadow-[0_10px_35px_rgba(0,0,0,0.04)]
                sm:p-7
              "
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                  Step {serviceStep}
                </p>

                <h2 className="mt-1.5 text-lg font-semibold text-zinc-900">
                  Choose a service
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                  Select the service you would like to order.
                </p>
              </div>

              <div className="mt-5">
                <CustomSelect
                  value={selectedService?._id || ""}
                  onChange={handleServiceChange}
                  options={services.map((service) => ({
                    label: service.name,
                    value: service._id,
                  }))}
                  placeholder="Select a service"
                  disabled={loadingService || submitting}
                />
              </div>

              {selectedService.description && (
                <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3.5">
                  <p className="text-xs leading-5 text-zinc-500">
                    {selectedService.description}
                  </p>
                </div>
              )}
            </section>

            {/* ==========================================================
                PRICING OPTIONS
            =========================================================== */}

            {pricingOptions.length > 0 && (
              <section
                className="
                  rounded-[24px]
                  border
                  border-zinc-200
                  bg-white
                  p-5
                  shadow-[0_10px_35px_rgba(0,0,0,0.04)]
                  animate-fade-up
                  sm:p-7
                "
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                    Step {pricingStep}
                  </p>

                  <h2 className="mt-1.5 text-lg font-semibold text-zinc-900">
                    {isGroupedPricing
                      ? "Configure your content"
                      : "Choose an option"}
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                    {isGroupedPricing
                      ? "Choose the options you need for your project."
                      : "Select the service package that best fits your project."}
                  </p>
                </div>

                {isGroupedPricing ? (
                  <div className="mt-7 space-y-8">
                    {pricingGroups.map((group, groupIndex) => {
                      const groupKey = group.key;

                      const selectedOption = selectedPricingOptions[groupKey];

                      /*
                       * Existing UI behavior is
                       * preserved here.
                       *
                       * These values only control
                       * display labels.
                       */
                      const title = group.name
                        ? group.name.charAt(0).toUpperCase() +
                          group.name.slice(1)
                        : "Options";

                      const helper = "Optional · Select ONE";
                      return (
                        <div
                          key={group.key}
                          className={
                            groupIndex > 0
                              ? "border-t border-zinc-100 pt-7"
                              : ""
                          }
                        >
                          <div className="mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-zinc-900">
                                {title}
                              </p>

                              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                                "Optional"
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-zinc-400">
                              {helper}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {group.options.map((option) => {
                              const selected =
                                selectedOption?._id === option._id;

                              const rules = getQuantityRules(
                                selectedService,
                                option,
                              );

                              const optionQuantity = selected
                                ? Number(
                                    pricingQuantities[groupKey] ??
                                      rules.minQuantity,
                                  )
                                : rules.minQuantity;

                              return (
                                <div
                                  key={option._id}
                                  className={`
                                        relative
                                        rounded-2xl
                                        border
                                        p-4
                                        transition-all
                                        duration-200
                                        ${
                                          selected
                                            ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                                            : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                                        }
                                      `}
                                >
                                  <button
                                    type="button"
                                    disabled={submitting || loadingService}
                                    onClick={() =>
                                      handleGroupedPricingOptionChange(
                                        groupKey,
                                        option,
                                      )
                                    }
                                    className="w-full text-left disabled:cursor-not-allowed"
                                  >
                                    <div className="flex items-start gap-3.5">
                                      <span
                                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                          selected
                                            ? "border-white bg-white text-zinc-900"
                                            : "border-zinc-300 bg-white"
                                        }`}
                                      >
                                        {selected && (
                                          <Check size={12} strokeWidth={2.5} />
                                        )}
                                      </span>

                                      <span className="min-w-0 flex-1 pr-1">
                                        <span
                                          className={`block text-sm font-semibold ${
                                            selected
                                              ? "text-white"
                                              : "text-zinc-900"
                                          }`}
                                        >
                                          {option.name}
                                        </span>

                                        {option.description && (
                                          <span
                                            className={`mt-1 block text-xs leading-5 ${
                                              selected
                                                ? "text-white/50"
                                                : "text-zinc-500"
                                            }`}
                                          >
                                            {option.description}
                                          </span>
                                        )}

                                        <span
                                          className={`mt-1.5 block text-xs font-medium ${
                                            selected
                                              ? "text-white/70"
                                              : "text-zinc-500"
                                          }`}
                                        >
                                          {formatCurrency(option.price)} /{" "}
                                          {option.unit || "unit"}
                                        </span>
                                      </span>
                                    </div>
                                  </button>

                                  {selected && (
                                    <div className="mt-4 border-t border-white/10 pt-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <div>
                                          <p className="text-[11px] font-medium text-white/50">
                                            Quantity
                                          </p>

                                          <p className="mt-0.5 text-[11px] text-white/35">
                                            Minimum: {rules.minQuantity}{" "}
                                            {option.unit || "units"}
                                          </p>

                                          {rules.maxQuantity !== undefined && (
                                            <p className="mt-0.5 text-[11px] text-white/35">
                                              Maximum: {rules.maxQuantity}
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
                                          <button
                                            type="button"
                                            disabled={
                                              submitting ||
                                              optionQuantity <=
                                                rules.minQuantity
                                            }
                                            onClick={() =>
                                              handleGroupedQuantityChange(
                                                groupKey,
                                                optionQuantity - 1,
                                              )
                                            }
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                          >
                                            <Minus size={14} />
                                          </button>

                                          <div className="min-w-[48px] text-center">
                                            <p className="text-sm font-semibold text-white">
                                              {optionQuantity}
                                            </p>
                                          </div>

                                          <button
                                            type="button"
                                            disabled={
                                              submitting ||
                                              (rules.maxQuantity !==
                                                undefined &&
                                                optionQuantity >=
                                                  rules.maxQuantity)
                                            }
                                            onClick={() =>
                                              handleGroupedQuantityChange(
                                                groupKey,
                                                optionQuantity + 1,
                                              )
                                            }
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                          >
                                            <Plus size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {pricingOptions.map((option) => {
                      const selected =
                        selectedPricingOption?._id === option._id;

                      return (
                        <button
                          key={option._id}
                          type="button"
                          onClick={() => handlePricingOptionChange(option)}
                          className={`
                              relative
                              flex
                              w-full
                              items-start
                              gap-4
                              rounded-2xl
                              border
                              p-4
                              text-left
                              transition-all
                              duration-200
                              sm:p-5
                              ${
                                selected
                                  ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                              }
                            `}
                        >
                          <div
                            className={`
                                mt-0.5
                                flex
                                h-5
                                w-5
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                border
                                ${
                                  selected
                                    ? "border-white bg-white text-zinc-900"
                                    : "border-zinc-300 bg-white"
                                }
                              `}
                          >
                            {selected && <Check size={12} strokeWidth={2.5} />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <p
                                className={`
                                    text-sm
                                    font-semibold
                                    ${selected ? "text-white" : "text-zinc-900"}
                                  `}
                              >
                                {option.name}
                              </p>

                              <p
                                className={`
                                    shrink-0
                                    text-sm
                                    font-semibold
                                    ${selected ? "text-white" : "text-zinc-900"}
                                  `}
                              >
                                {formatCurrency(option.price)}
                                {option.unit ? ` / ${option.unit}` : ""}
                              </p>
                            </div>

                            {option.description && (
                              <p
                                className={`
                                    mt-1.5
                                    text-xs
                                    leading-5
                                    ${
                                      selected
                                        ? "text-white/50"
                                        : "text-zinc-500"
                                    }
                                  `}
                              >
                                {option.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ==========================================================
                QUANTITY
            =========================================================== */}

            {hasQuantity && !isGroupedPricing && (
              <section
                className="
                    rounded-[24px]
                    border
                    border-zinc-200
                    bg-white
                    p-5
                    shadow-[0_10px_35px_rgba(0,0,0,0.04)]
                    animate-fade-up
                    sm:p-7
                  "
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                    Step {quantityStep}
                  </p>

                  <h2 className="mt-1.5 text-lg font-semibold text-zinc-900">
                    Quantity
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                    Select how many units you need.
                  </p>
                </div>

                <div className="mt-5">
                  <QuantityControl
                    quantity={quantity}
                    minQuantity={quantityRules.minQuantity}
                    maxQuantity={quantityRules.maxQuantity}
                    unit={quantityPricingOption?.unit || selectedService.unit}
                    onChange={(nextQuantity) =>
                      setFormData((current) => ({
                        ...current,
                        quantity: nextQuantity,
                      }))
                    }
                  />
                </div>
              </section>
            )}

            {/* ==========================================================
                PROJECT CONFIGURATION
            =========================================================== */}

            <section
              className="
                rounded-[24px]
                border
                border-zinc-200
                bg-white
                p-5
                shadow-[0_10px_35px_rgba(0,0,0,0.04)]
                animate-fade-up
                sm:p-7
              "
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                  Step {detailsStep}
                </p>

                <h2 className="mt-1.5 text-lg font-semibold text-zinc-900">
                  Project configuration
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                  Configure the options and provide any additional information
                  for your project.
                </p>
              </div>

              {activeFields.length > 0 ? (
                <div className="mt-7 space-y-7">
                  {activeFields.map((field) => {
                    const type = normalizeFieldType(field);

                    const isSelection = type === "radio" || type === "checkbox";

                    return (
                      <div
                        key={field.name}
                        className={
                          isSelection
                            ? ""
                            : "border-t border-zinc-100 pt-7 first:border-t-0 first:pt-0"
                        }
                      >
                        <DynamicField
                          field={field}
                          value={formData[field.name]}
                          onChange={handleFieldChange}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center">
                  <p className="text-sm text-zinc-500">
                    No additional configuration is required for this service.
                  </p>
                </div>
              )}

              <div className="mt-7 border-t border-zinc-100 pt-7">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Additional requirements
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">Optional</p>
                </div>

                <textarea
                  value={additionalRequirements}
                  onChange={(event) =>
                    setAdditionalRequirements(event.target.value)
                  }
                  rows={4}
                  placeholder="Is there anything else you'd like us to know?"
                  className="
                    mt-3
                    w-full
                    resize-y
                    rounded-xl
                    border
                    border-zinc-200
                    bg-zinc-50
                    px-4
                    py-3.5
                    text-sm
                    leading-6
                    text-zinc-900
                    outline-none
                    transition-all
                    duration-200
                    placeholder:text-zinc-400
                    hover:border-zinc-300
                    focus:border-zinc-400
                    focus:bg-white
                    focus:ring-4
                    focus:ring-zinc-900/[0.04]
                  "
                />

                <p className="mt-2 text-xs text-zinc-400">
                  Mention special instructions, references, deadlines,
                  preferences or anything else relevant to your project.
                </p>
              </div>
            </section>

            {/* ==========================================================
                PAYMENT
            =========================================================== */}

            <section
              className="
                rounded-[24px]
                border
                border-zinc-200
                bg-white
                p-5
                shadow-[0_10px_35px_rgba(0,0,0,0.04)]
                animate-fade-up
                sm:p-7
              "
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                  Step {paymentStep}
                </p>

                <h2 className="mt-1.5 text-lg font-semibold text-zinc-900">
                  Payment method
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                  Choose how you'd like to complete the payment.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <PaymentOption
                  selected={paymentMethod === "cod"}
                  onClick={() => setPaymentMethod("cod")}
                  icon={Banknote}
                  title="Cash on Delivery"
                  description="Pay after your order is processed."
                />

                <PaymentOption
                  selected={paymentMethod === "online"}
                  onClick={() => setPaymentMethod("online")}
                  icon={CreditCard}
                  title="Online Payment"
                  description="Pay securely using Razorpay."
                />
              </div>
            </section>
          </div>

          {/* ============================================================
              ORDER SUMMARY
          ============================================================= */}

          <aside className="min-w-0">
            <div className="sticky top-6">
              <section
                className="
                  overflow-hidden
                  rounded-[24px]
                  border
                  border-zinc-800
                  bg-zinc-950
                  shadow-[0_20px_60px_rgba(0,0,0,0.12)]
                "
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">
                        Order summary
                      </p>

                      <h2 className="mt-1.5 text-lg font-semibold text-white">
                        {selectedService.name}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-white/40">Service</p>

                        <p className="mt-1 text-sm font-medium text-white">
                          {selectedService.name}
                        </p>
                      </div>
                    </div>

                    {/* Grouped pricing summary */}
                    {isGroupedPricing &&
                      selectedGroupedPricingOptions.length > 0 && (
                        <div className="space-y-2 border-t border-white/10 pt-4">
                          {selectedGroupedPricingOptions.map((option) => {
                            const rules = getQuantityRules(
                              selectedService,
                              option,
                            );

                            const optionQuantity = Number(
                              pricingQuantities[option.group] ??
                                rules.minQuantity,
                            );

                            const optionTotal =
                              Number(option.price || 0) * optionQuantity;

                            return (
                              <div
                                key={option._id}
                                className="flex items-start justify-between gap-4"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs text-white/40">
                                    {option.group
                                      ? option.group.charAt(0).toUpperCase() +
                                        option.group.slice(1)
                                      : "Option"}
                                  </p>

                                  <p className="mt-0.5 text-sm text-white/80">
                                    {option.name}
                                  </p>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-medium text-white">
                                    {formatCurrency(optionTotal)}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-white/35">
                                    {optionQuantity} ×{" "}
                                    {formatCurrency(option.price)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    {/* Normal pricing summary */}
                    {!isGroupedPricing && selectedPricingOption && (
                      <div className="border-t border-white/10 pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs text-white/40">Option</p>

                            <p className="mt-1 text-sm text-white/80">
                              {selectedPricingOption.name}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-medium text-white">
                            {formatCurrency(
                              Number(selectedPricingOption.price || 0) *
                                quantity,
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {hasQuantity && (
                      <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
                        <div>
                          <p className="text-xs text-white/40">Quantity</p>

                          <p className="mt-1 text-sm text-white/80">
                            {quantity}
                          </p>
                        </div>

                        {pricingLabel && (
                          <p className="text-xs text-white/40">
                            {pricingLabel}
                          </p>
                        )}
                      </div>
                    )}

                    {selectedFieldsPrice > 0 && (
                      <div className="flex items-start justify-between gap-4 border-t border-white/10 pt-4">
                        <div>
                          <p className="text-xs text-white/40">
                            Additional options
                          </p>

                          <p className="mt-1 text-sm text-white/80">
                            Selected add-ons
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-medium text-white">
                          +{formatCurrency(selectedFieldsPrice)}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-white/10 pt-5">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs text-white/40">
                            Estimated total
                          </p>

                          {selectedService.pricingType === "custom" &&
                            !selectedPricingOption &&
                            selectedGroupedPricingOptions.length === 0 && (
                              <p className="mt-1 text-[11px] text-white/30">
                                Final pricing will be confirmed by our team.
                              </p>
                            )}
                        </div>

                        <p className="shrink-0 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                          {pricingDisplay}
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3">
                      <p className="text-xs leading-5 text-red-300">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      loadingService ||
                      !selectedService ||
                      (isGroupedPricing
                        ? false
                        : pricingOptions.length > 0 && !selectedPricingOption)
                    }
                    className="
                      group
                      mt-6
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-white
                      bg-white
                      px-5
                      py-3.5
                      text-sm
                      font-semibold
                      text-zinc-900
                      shadow-[0_8px_25px_rgba(255,255,255,0.08)]
                      transition-[transform,background-color,box-shadow]
                      duration-300
                      ease-out
                      hover:cursor-pointer
                      hover:bg-zinc-100
                      active:translate-y-0
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="text-zinc-900">
                          {paymentMethod === "online"
                            ? "Continue to payment"
                            : "Place order"}
                        </span>

                        <ArrowRight
                          size={17}
                          className="
                            text-zinc-900
                            transition-transform
                            duration-200
                            group-hover:translate-x-0.5
                          "
                        />
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-[11px] leading-5 text-white/30">
                    Your order details will be reviewed and processed securely.
                  </p>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
