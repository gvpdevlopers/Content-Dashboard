import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  ArrowUpRight,
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
| Option Selection Field
|--------------------------------------------------------------------------
|
| radio    -> exactly one option
| checkbox -> zero or more options
|
| The selected values are stored directly in formData:
|
| radio:
| {
|   shoot: "camera"
| }
|
| checkbox:
| {
|   drone: ["drone"]
| }
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

    const exists = currentValues.includes(optionValue);

    if (exists) {
      onChange(
        field.name,
        currentValues.filter((item) => item !== optionValue),
      );
    } else {
      onChange(field.name, [...currentValues, optionValue]);
    }
  };

  const selectRadio = (optionValue) => {
    onChange(field.name, optionValue);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-900">{field.label}</p>

          <p className="mt-1 text-xs text-zinc-400">
            {field.required
              ? "Required · Select one"
              : isCheckbox
                ? "Optional · Select/deselect"
                : "Optional · Select one"}
          </p>
        </div>
      </div>

      {options.length > 0 ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {options.map((option) => {
            const selected = selectedValues.includes(option.value);
            const price = Number(option.price || 0);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  isCheckbox
                    ? toggleCheckbox(option.value)
                    : selectRadio(option.value)
                }
                className={`
                  group
                  relative
                  flex
                  min-h-[58px]
                  w-full
                  items-center
                  justify-between
                  gap-3
                  rounded-xl
                  border
                  px-4
                  py-3
                  text-left
                  transition-all
                  duration-200
                  ${
                    selected
                      ? `
                        border-zinc-900
                        bg-zinc-900
                        shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                      `
                      : `
                        border-zinc-200
                        bg-white
                        hover:border-zinc-300
                        hover:bg-zinc-50
                      `
                  }
                `}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`
                      flex
                      h-5
                      w-5
                      shrink-0
                      items-center
                      justify-center
                      border
                      transition-all
                      ${isCheckbox ? "rounded-md" : "rounded-full"}
                      ${
                        selected
                          ? "border-white bg-white text-zinc-900"
                          : "border-zinc-300 bg-white text-transparent"
                      }
                    `}
                  >
                    {selected && <Check size={12} strokeWidth={2.5} />}
                  </span>

                  <span
                    className={`
                      truncate
                      text-sm
                      font-medium
                      ${selected ? "text-white" : "text-zinc-700"}
                    `}
                  >
                    {option.label}
                  </span>
                </div>

                {price > 0 && (
                  <span
                    className={`
                      shrink-0
                      text-xs
                      font-medium
                      ${selected ? "text-white/60" : "text-zinc-400"}
                    `}
                  >
                    +{formatCurrency(price)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-400">
          No options available.
        </div>
      )}

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

  /*
   * Radio / checkbox
   */

  if (type === "radio" || type === "checkbox") {
    return <SelectionField field={field} value={value} onChange={onChange} />;
  }

  /*
   * Select
   */

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

  /*
   * Common input classes
   */

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

  /*
   * Textarea
   */

  if (type === "textarea") {
    return (
      <div>
        {label}

        <textarea
          value={value ?? ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder || ""}
          rows={5}
          className={commonClassName}
        />

        {helpText}
      </div>
    );
  }

  /*
   * Number
   */

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
          step={field.step || "any"}
          className={commonClassName}
        />

        {helpText}
      </div>
    );
  }

  /*
   * Date
   */

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

  /*
   * URL
   */

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

  /*
   * Text
   */

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
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-900">Quantity</p>

        <p className="mt-1 text-xs text-zinc-400">
          {minQuantity > 1
            ? `Minimum ${minQuantity} ${unit || "units"}`
            : `Select the number of ${unit || "units"} you need.`}
        </p>
      </div>

      <div className="flex items-center gap-3">
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
            border
            border-zinc-200
            bg-white
            text-zinc-500
            transition-all
            hover:border-zinc-300
            hover:bg-zinc-100
            hover:text-zinc-900
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          <Minus size={16} />
        </button>

        <div className="min-w-[90px] text-center">
          <p className="text-lg font-semibold text-zinc-900">{quantity}</p>

          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
            {unit || "unit"}
            {quantity !== 1 ? "s" : ""}
          </p>
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
            hover:bg-zinc-100
            hover:text-zinc-900
            disabled:cursor-not-allowed
            disabled:opacity-30
          "
        >
          <Plus size={16} />
        </button>
      </div>
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
            : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
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
  const [selectedPricingOption, setSelectedPricingOption] = useState(null);

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

          /*
           * Do not automatically select a pricing option.
           */

          setSelectedPricingOption(null);

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
  | Select Pricing Option
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
  | Quantity Rules
  |--------------------------------------------------------------------------
  */

  const quantityRules = useMemo(() => {
    return getQuantityRules(selectedService, selectedPricingOption);
  }, [selectedService, selectedPricingOption]);

  /*
  |--------------------------------------------------------------------------
  | Has Quantity
  |--------------------------------------------------------------------------
  */

  const hasQuantity = useMemo(() => {
    return Boolean(
      selectedPricingOption ||
      selectedService?.pricingType === "per_unit" ||
      selectedService?.pricingType === "starting_from",
    );
  }, [selectedService, selectedPricingOption]);

  /*
  |--------------------------------------------------------------------------
  | Quantity
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
  | Active Fields
  |--------------------------------------------------------------------------
  */

  const activeFields = useMemo(() => {
    if (!selectedService) {
      return [];
    }

    const serviceFields = Array.isArray(selectedService.fields)
      ? selectedService.fields
      : [];

    const optionFields =
      selectedPricingOption && Array.isArray(selectedPricingOption.fields)
        ? selectedPricingOption.fields
        : [];

    const fieldMap = new Map();

    for (const field of serviceFields) {
      if (field?.name) {
        fieldMap.set(field.name, field);
      }
    }

    for (const field of optionFields) {
      if (field?.name) {
        fieldMap.set(field.name, field);
      }
    }

    return getSortedItems(Array.from(fieldMap.values()));
  }, [selectedService, selectedPricingOption]);

  /*
  |--------------------------------------------------------------------------
  | Option Add-ons Total
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
          (option) => option.value === selectedValue,
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
  }, [selectedService, selectedPricingOption, quantity, selectedFieldsPrice]);

  /*
  |--------------------------------------------------------------------------
  | Pricing Label
  |--------------------------------------------------------------------------
  */

  const pricingLabel = useMemo(() => {
    const unit = selectedPricingOption?.unit || selectedService?.unit;

    if (!unit) {
      return "";
    }

    return `per ${unit}`;
  }, [selectedService, selectedPricingOption]);

  /*
  |--------------------------------------------------------------------------
  | Pricing Display
  |--------------------------------------------------------------------------
  */

  const pricingDisplay = useMemo(() => {
    if (!selectedService) {
      return "Custom";
    }

    if (selectedService.pricingType === "custom" && !selectedPricingOption) {
      return "Custom";
    }

    if (estimatedPrice <= 0) {
      return "Custom";
    }

    return formatCurrency(estimatedPrice);
  }, [selectedService, selectedPricingOption, estimatedPrice]);

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
       * Required validation
       */

      if (field.required && isEmptyValue(value)) {
        validationErrors[field.name] = `${field.label} is required.`;

        continue;
      }

      /*
       * Skip optional empty fields.
       */

      if (isEmptyValue(value)) {
        continue;
      }

      /*
       * Checkbox validation
       */

      if (type === "checkbox") {
        const selectedValues = Array.isArray(value) ? value : [value];

        const allowedValues = (field.options || []).map(
          (option) => option.value,
        );

        const invalidValue = selectedValues.some(
          (selectedValue) => !allowedValues.includes(selectedValue),
        );

        if (invalidValue) {
          validationErrors[field.name] =
            `${field.label} has an invalid selection.`;
        }

        continue;
      }

      /*
       * Radio validation
       */

      if (type === "radio" || type === "select") {
        const allowedValues = (field.options || []).map(
          (option) => option.value,
        );

        if (!allowedValues.includes(value)) {
          validationErrors[field.name] =
            `${field.label} has an invalid selection.`;
        }

        continue;
      }

      /*
       * Number validation
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
      }

      /*
       * URL validation
       */

      if (type === "url") {
        try {
          new URL(value);
        } catch {
          validationErrors[field.name] = `${field.label} must be a valid URL.`;
        }
      }
    }

    return validationErrors;
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
     * Pricing option validation
     */

    const pricingOptions = getPricingOptions(selectedService);

    if (pricingOptions.length > 0 && !selectedPricingOption) {
      setError("Please select a service option.");
      return;
    }

    /*
     * Quantity validation
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
     * Dynamic field validation
     */

    const validationErrors = validateFields();

    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors)[0]);
      return;
    }

    try {
      setSubmitting(true);

      /*
       * Only send active fields.
       */

      const cleanFormData = {};

      for (const field of activeFields) {
        const value = formData[field.name];

        if (value !== undefined && value !== null) {
          cleanFormData[field.name] = value;
        }
      }

      /*
       * Create internal order
       */

      const orderResponse = await orderService.createOrder({
        serviceId: selectedService._id,

        pricingOptionId: selectedPricingOption?._id || undefined,

        quantity: hasQuantity ? quantity : 1,

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
       * COD
       */

      if (paymentMethod === "cod") {
        setOrderSuccess(createdOrder);
        return;
      }

      /*
       * Online payment
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

  const serviceStep = 1;
  const pricingStep = 2;
  const quantityStep = pricingOptions.length ? 3 : 2;
  const detailsStep = quantityStep + 1;
  const paymentStep = detailsStep + 1;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto w-full max-w-[1180px] animate-fade-up">
      {/* ================================================================
          HEADER
      ================================================================= */}

      <div className="mb-7 sm:mb-9">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm">
            <ArrowUpRight size={18} strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
              New order
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Start a new project
            </h1>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
          Choose a service, configure your project, and review your estimated
          order total before placing your request.
        </p>
      </div>

      {/* ================================================================
          ERROR
      ================================================================= */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 animate-fade-up">
          <Info size={17} className="mt-0.5 shrink-0" />

          <p className="leading-6">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ============================================================
              MAIN FORM
          ============================================================= */}

          <div className="min-w-0 space-y-6">
            {/* ==========================================================
                SERVICE
            =========================================================== */}

            <section
              className="
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
                  Select the service you want our team to work on.
                </p>
              </div>

              <div className="mt-5">
                <CustomSelect
                  value={selectedService?._id || ""}
                  onChange={handleServiceChange}
                  options={services.map((service) => ({
                    value: service._id,
                    label: service.name,
                  }))}
                  placeholder="Select a service"
                  disabled={loadingService}
                />
              </div>

              {selectedService.description && (
                <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3.5">
                  <p className="text-xs leading-5 text-zinc-500">
                    {selectedService.description}
                  </p>
                </div>
              )}
            </section>

            {/* ==========================================================
                PRICING OPTION
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
                    Choose an option
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                    Select the service package that best fits your project.
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {pricingOptions.map((option) => {
                    const selected = selectedPricingOption?._id === option._id;

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
                                ${selected ? "text-white/50" : "text-zinc-500"}
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
              </section>
            )}

            {/* ==========================================================
                QUANTITY
            =========================================================== */}

            {hasQuantity && (
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
                    unit={selectedPricingOption?.unit || selectedService.unit}
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

              {/* Additional requirements */}

              <div className="mt-7 border-t border-zinc-100 pt-7">
                <label className="mb-3 block">
                  <span className="text-sm font-medium text-zinc-700">
                    Additional requirements
                  </span>

                  <span className="ml-2 text-xs font-normal text-zinc-400">
                    Optional
                  </span>
                </label>

                <textarea
                  value={additionalRequirements}
                  onChange={(event) =>
                    setAdditionalRequirements(event.target.value)
                  }
                  rows={4}
                  placeholder="Is there anything else you'd like us to know?"
                  className="
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

                  {/* Service */}

                  <div className="mt-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-white/40">Service</p>

                        <p className="mt-1 text-sm font-medium text-white">
                          {selectedService.name}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-medium text-white">
                        {formatCurrency(
                          selectedPricingOption
                            ? selectedPricingOption.price
                            : selectedService.basePrice,
                        )}
                      </p>
                    </div>

                    {/* Pricing option */}

                    {selectedPricingOption && (
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs text-white/40">Package</p>

                          <p className="mt-1 text-sm text-white/75">
                            {selectedPricingOption.name}
                          </p>
                        </div>

                        <p className="shrink-0 text-xs text-white/40">
                          {selectedPricingOption.unit
                            ? `per ${selectedPricingOption.unit}`
                            : ""}
                        </p>
                      </div>
                    )}

                    {/* Selected configuration */}

                    {activeFields.some(
                      (field) => !isEmptyValue(formData[field.name]),
                    ) && (
                      <div className="border-t border-white/10 pt-4">
                        <p className="mb-3 text-xs text-white/40">
                          Selected options
                        </p>

                        <div className="space-y-2.5">
                          {activeFields.map((field) => {
                            const value = formData[field.name];

                            if (isEmptyValue(value)) {
                              return null;
                            }

                            const values = Array.isArray(value)
                              ? value
                              : [value];

                            const labels = values.map(
                              (selectedValue) =>
                                field.options?.find(
                                  (option) => option.value === selectedValue,
                                )?.label || selectedValue,
                            );

                            return (
                              <div
                                key={field.name}
                                className="flex items-start justify-between gap-4"
                              >
                                <span className="text-xs text-white/45">
                                  {field.label}
                                </span>

                                <span className="max-w-[60%] text-right text-xs text-white/75">
                                  {labels.join(", ")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quantity */}

                    {hasQuantity && (
                      <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="text-xs text-white/45">Quantity</span>

                        <span className="text-sm font-medium text-white">
                          {quantity}{" "}
                          {selectedPricingOption?.unit ||
                            selectedService.unit ||
                            "unit"}
                          {quantity !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}

                    {/* Payment */}

                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-xs text-white/45">Payment</span>

                      <span className="text-sm font-medium text-white">
                        {paymentMethod === "cod"
                          ? "Cash on Delivery"
                          : "Online Payment"}
                      </span>
                    </div>

                    {/* Price */}

                    <div className="border-t border-white/10 pt-5">
                      <div className="flex items-end justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs text-white/40">
                            Estimated total
                          </p>

                          {selectedFieldsPrice > 0 && (
                            <p className="mt-1 text-[11px] text-white/30">
                              Includes {formatCurrency(selectedFieldsPrice)} in
                              selected options
                            </p>
                          )}

                          {pricingLabel && estimatedPrice > 0 && (
                            <p className="mt-1 text-[11px] text-white/30">
                              {formatCurrency(
                                selectedPricingOption?.price ||
                                  selectedService.basePrice,
                              )}{" "}
                              {pricingLabel}
                            </p>
                          )}

                          {selectedService.pricingType === "custom" &&
                            !selectedPricingOption && (
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

                  {/* Submit */}

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      loadingService ||
                      !selectedService ||
                      (pricingOptions.length > 0 && !selectedPricingOption)
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
                      transition-all
                      duration-200
                      hover:-translate-y-0.5
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
