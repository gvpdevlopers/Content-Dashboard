import {
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Info,
  Loader2,
  Minus,
  Plus,
  X,
} from "lucide-react";

import OrderSuccess from "../components/OrderSuccess";
import orderService from "../services/orderService";
import serviceService from "../services/serviceService";
import paymentService from "../services/paymentService";
import CustomSelect from "../components/CustomSelect";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/*
|--------------------------------------------------------------------------
| Constants / Helpers
|--------------------------------------------------------------------------
*/

const ONLINE_GST_RATE = 18;

const formatCurrency = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
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

const isGroupedService = (service) => {
  return getPricingOptions(service).some(
    (option) => String(option?.group || "").trim() !== "",
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

  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
};

const normalizeFieldType = (field) => {
  if (!field?.type) {
    return "text";
  }

  return String(field.type).toLowerCase();
};

const getRepeatableGroups = (service) => {
  if (!Array.isArray(service?.repeatableGroups)) {
    return [];
  }

  return getSortedItems(
    service.repeatableGroups.filter(
      (group) => group && group.isActive !== false,
    ),
  );
};

const getRepeatableGroupRules = (group) => {
  const rawMin = Number(group?.minItems ?? 1);
  const rawMax = Number(group?.maxItems ?? 10);

  const minItems = Number.isFinite(rawMin) ? Math.max(0, rawMin) : 1;

  const maxItems =
    Number.isFinite(rawMax) && rawMax >= Math.max(1, minItems)
      ? rawMax
      : Math.max(10, minItems);

  return {
    minItems,
    maxItems,
  };
};

/*
|--------------------------------------------------------------------------
| Repeatable Group Pricing Helpers
|--------------------------------------------------------------------------
|
| Repeatable groups (e.g. "reels") may declare their own pricingGroups
| (e.g. ["shoot", "drone", "host"]) which reference the same grouped
| pricing options already available on the service via `option.group`.
| Each repeatable entry keeps its own independent selection/quantity for
| every pricing group it exposes.
|
*/

const getRepeatableGroupPricingGroups = (service, group) => {
  const pricingGroupNames = Array.isArray(group?.pricingGroups)
    ? group.pricingGroups.map((name) => String(name))
    : [];

  if (!pricingGroupNames.length) {
    return [];
  }

  const allowedNames = new Set(pricingGroupNames);

  return getPricingGroups(service).filter((pricingGroup) =>
    allowedNames.has(String(pricingGroup.name)),
  );
};

const isRepeatableOnlyService = (service) => {
  const repeatableGroups = getRepeatableGroups(service);

  if (!repeatableGroups.length) {
    return false;
  }

  const serviceFields = Array.isArray(service?.fields) ? service.fields : [];
  const repeatablePricingGroupNames = new Set(
    repeatableGroups.flatMap((group) =>
      Array.isArray(group.pricingGroups)
        ? group.pricingGroups.map(String)
        : [],
    ),
  );

  return (
    serviceFields.length === 0 &&
    getPricingGroups(service).every((pricingGroup) =>
      repeatablePricingGroupNames.has(pricingGroup.name),
    )
  );
};

const getActiveFieldsForRepeatableEntry = (service, group, entry) => {
  const fieldMap = new Map();

  // 1. Common fields defined on the repeatable group
  const groupFields = Array.isArray(group?.fields) ? group.fields : [];

  for (const field of groupFields) {
    const fieldName = String(field?.name || "").trim();

    if (fieldName) {
      fieldMap.set(fieldName, field);
    }
  }

  // 2. Fields from selected pricing options
  const selectedOptionIds = new Set(
    Object.values(entry?.pricingOptions || {})
      .filter(Boolean)
      .map((id) => String(id)),
  );

  if (selectedOptionIds.size > 0) {
    const pricingGroups = getRepeatableGroupPricingGroups(service, group);

    for (const pricingGroup of pricingGroups) {
      const options = Array.isArray(pricingGroup?.options)
        ? pricingGroup.options
        : [];

      for (const option of options) {
        if (!selectedOptionIds.has(String(option?._id))) {
          continue;
        }

        const optionFields = Array.isArray(option?.fields) ? option.fields : [];

        for (const field of optionFields) {
          const fieldName = String(field?.name || "").trim();

          if (fieldName) {
            fieldMap.set(fieldName, field);
          }
        }
      }
    }
  }

  return getSortedItems(Array.from(fieldMap.values()));
};

const isRequiredRepeatablePricingGroup = (group, pricingGroupName) => {
  const requiredNames = Array.isArray(group?.requiredPricingGroups)
    ? group.requiredPricingGroups.map((name) => String(name))
    : [];

  return requiredNames.includes(String(pricingGroupName));
};

const getRepeatableEntryPricingTotal = (service, group, entry) => {
  const pricingGroups = getRepeatableGroupPricingGroups(service, group);

  if (!pricingGroups.length) {
    return 0;
  }

  let total = 0;

  for (const pricingGroup of pricingGroups) {
    const selectedOptionId = entry?.pricingOptions?.[pricingGroup.name];

    if (!selectedOptionId) {
      continue;
    }

    const option = pricingGroup.options.find(
      (candidate) => String(candidate._id) === String(selectedOptionId),
    );

    if (!option) {
      continue;
    }

    const rules = getQuantityRules(service, option);

    const rawQuantity = entry?.pricingQuantities?.[pricingGroup.name];

    const quantity =
      rawQuantity !== undefined && rawQuantity !== null
        ? Number(rawQuantity)
        : rules.minQuantity;

    total +=
      Number(option.price || 0) *
      (Number.isFinite(quantity) ? quantity : rules.minQuantity);
  }

  return total;
};

const createEmptyRepeatableItem = (group) => {
  const item = {
    pricingOptions: {},
    pricingQuantities: {},
    fields: {},
  };

  if (Array.isArray(group?.fields)) {
    group.fields.forEach((field) => {
      const fieldName = String(field?.name || "").trim();

      if (!fieldName) {
        return;
      }

      if (normalizeFieldType(field) === "checkbox") {
        item.fields[fieldName] = [];
      } else {
        item.fields[fieldName] = "";
      }
    });
  }

  return item;
};

const createInitialRepeatableData = (service) => {
  const data = {};

  getRepeatableGroups(service).forEach((group) => {
    const { minItems } = getRepeatableGroupRules(group);

    if (minItems > 0) {
      data[group.name] = Array.from({ length: minItems }, () =>
        createEmptyRepeatableItem(group),
      );
    }
  });

  return data;
};

const getActiveFieldsForItem = (item) => {
  if (!item?.service) {
    return [];
  }

  const serviceFields = Array.isArray(item.service.fields)
    ? item.service.fields
    : [];

  const selectedOptions = item.isGroupedPricing
    ? Object.values(item.selectedPricingOptions || {}).filter(Boolean)
    : item.selectedPricingOption
      ? [item.selectedPricingOption]
      : [];

  const fieldMap = new Map();

  for (const field of serviceFields) {
    const fieldName = String(field?.name || "").trim();

    if (fieldName) {
      fieldMap.set(fieldName, field);
    }
  }

  for (const pricingOption of selectedOptions) {
    if (!Array.isArray(pricingOption?.fields)) {
      continue;
    }

    for (const field of pricingOption.fields) {
      const fieldName = String(field?.name || "").trim();

      if (fieldName) {
        fieldMap.set(fieldName, field);
      }
    }
  }

  return getSortedItems(Array.from(fieldMap.values()));
};

const getSelectedFieldsPrice = (item) => {
  const activeFields = getActiveFieldsForItem(item);

  if (!activeFields.length) {
    return 0;
  }

  let total = 0;

  for (const field of activeFields) {
    const fieldValue = item.formData?.[field.name];

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
};

const getRepeatableGroupsPrice = (item) => {
  const groups = getRepeatableGroups(item?.service);

  if (!groups.length) {
    return 0;
  }

  let total = 0;

  for (const group of groups) {
    const entries = Array.isArray(item.formData?.[group.name])
      ? item.formData[group.name]
      : [];

    if (!entries.length) {
      continue;
    }

    for (const entry of entries) {
      const activeFields = getActiveFieldsForRepeatableEntry(
        item.service,
        group,
        entry,
      );

      for (const field of activeFields) {
        const fieldName = String(field?.name || "").trim();

        if (!fieldName) {
          continue;
        }

        const value = entry?.fields?.[fieldName];

        if (isEmptyValue(value)) {
          continue;
        }

        const selectedValues = Array.isArray(value) ? value : [value];

        for (const selectedValue of selectedValues) {
          const selectedOption = (field.options || []).find(
            (option) => String(option.value) === String(selectedValue),
          );

          if (selectedOption) {
            total += Number(selectedOption.price || 0);
          }
        }
      }

      total += getRepeatableEntryPricingTotal(item.service, group, entry);
    }
  }

  return total;
};

const getItemQuantity = (item) => {
  const quantityOption = item.isGroupedPricing
    ? null
    : item.selectedPricingOption;

  const rules = getQuantityRules(item.service, quantityOption);

  const rawQuantity = Number(item.formData?.quantity || rules.minQuantity);

  if (!Number.isFinite(rawQuantity)) {
    return rules.minQuantity;
  }

  let normalized = Math.floor(rawQuantity);

  normalized = Math.max(rules.minQuantity, normalized);

  if (rules.maxQuantity !== undefined) {
    normalized = Math.min(rules.maxQuantity, normalized);
  }

  return normalized;
};

const getGroupedOptionQuantity = (item, groupKey, option) => {
  const rules = getQuantityRules(item.service, option);
  const rawQuantity = item.pricingQuantities?.[groupKey];

  const quantity =
    rawQuantity !== undefined && rawQuantity !== null
      ? Number(rawQuantity)
      : rules.minQuantity;

  if (!Number.isFinite(quantity)) {
    return rules.minQuantity;
  }

  let normalized = Math.floor(quantity);

  normalized = Math.max(rules.minQuantity, normalized);

  if (rules.maxQuantity !== undefined) {
    normalized = Math.min(rules.maxQuantity, normalized);
  }

  return normalized;
};

const getItemEstimate = (item) => {
  if (!item?.service) {
    return 0;
  }

  const selectedFieldsPrice = getSelectedFieldsPrice(item);
  const repeatableGroupsPrice = getRepeatableGroupsPrice(item);

  const selectedOptions = Object.values(
    item.selectedPricingOptions || {},
  ).filter(Boolean);

  if (item.isGroupedPricing) {
    if (selectedOptions.length > 0) {
      return (
        selectedOptions.reduce((total, option) => {
          const groupKey = String(option.group || "").trim() || "__ungrouped__";

          const quantity = getGroupedOptionQuantity(item, groupKey, option);

          return total + Number(option.price || 0) * quantity;
        }, 0) +
        selectedFieldsPrice +
        repeatableGroupsPrice
      );
    }

    return selectedFieldsPrice + repeatableGroupsPrice;
  }

  const quantity = getItemQuantity(item);

  let basePrice;

  if (item.selectedPricingOption) {
    basePrice = Number(item.selectedPricingOption.price || 0) * quantity;
  } else {
    switch (item.service.pricingType) {
      case "fixed":
        basePrice = Number(item.service.basePrice || 0);
        break;

      case "per_unit":
      case "starting_from":
        basePrice = Number(item.service.basePrice || 0) * quantity;
        break;

      case "custom":
        basePrice = 0;
        break;

      default:
        basePrice = Number(item.service.basePrice || 0);
        break;
    }
  }

  return basePrice + selectedFieldsPrice + repeatableGroupsPrice;
};

const isCustomUnpricedItem = (item) => {
  if (!item?.service) {
    return false;
  }

  if (item.service.pricingType !== "custom") {
    return false;
  }

  if (item.isGroupedPricing) {
    if (isRepeatableOnlyService(item.service)) {
      return getItemEstimate(item) <= 0;
    }

    return (
      Object.values(item.selectedPricingOptions || {}).filter(Boolean)
        .length === 0
    );
  }

  return !item.selectedPricingOption;
};

const createOrderItem = (service) => {
  const grouped = isGroupedService(service);
  const pricingOptions = getPricingOptions(service);
  const quantityRules = getQuantityRules(service, null);
  const repeatableOnly = isRepeatableOnlyService(service);

  const shouldHaveQuantity =
    !repeatableOnly &&
    (service.pricingType === "per_unit" ||
      service.pricingType === "starting_from" ||
      pricingOptions.length > 0);

  return {
    service,
    isGroupedPricing: grouped,
    selectedPricingOption: null,
    selectedPricingOptions: {},
    pricingQuantities: {},
    formData: {
      ...(shouldHaveQuantity ? { quantity: quantityRules.minQuantity } : {}),
      ...createInitialRepeatableData(service),
    },
  };
};

/*
|--------------------------------------------------------------------------
| Selection Field
|--------------------------------------------------------------------------
*/

const SelectionField = ({ field, value, onChange, compact = false }) => {
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

          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            {field.required ? "Required" : "Optional"}
          </span>
        </div>

        <p className="mt-1 text-xs text-zinc-400">
          {isCheckbox ? "Select one or more" : "Select one"}
        </p>
      </div>

      <div
        className={`grid gap-3 ${
          compact ? "sm:grid-cols-1" : "sm:grid-cols-2"
        }`}
      >
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
                relative flex min-h-[62px] items-center gap-3 rounded-2xl
                border px-4 py-3 text-left transition-all duration-200
                hover:-translate-y-0.5
                ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 shadow-[0_10px_25px_rgba(0,0,0,0.08)]"
                    : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
                }
              `}
            >
              <span
                className={`
                  flex h-5 w-5 shrink-0 items-center justify-center border
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
                  className={`block text-sm font-medium ${
                    selected ? "text-white" : "text-zinc-900"
                  }`}
                >
                  {option.label}
                </span>

                {Number(option.price || 0) > 0 && (
                  <span
                    className={`mt-0.5 block text-xs ${
                      selected ? "text-white/50" : "text-zinc-400"
                    }`}
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

const DynamicField = ({ field, value, onChange, compact = false }) => {
  const type = normalizeFieldType(field);

  if (type === "radio" || type === "checkbox") {
    return (
      <SelectionField
        field={field}
        value={value}
        onChange={onChange}
        compact={compact}
      />
    );
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
    w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5
    text-sm text-zinc-900 outline-none transition-all duration-200
    placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400
    focus:bg-white focus:ring-4 focus:ring-zinc-900/[0.04]
  `;

  const label = (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-zinc-900">{field.label}</p>

        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
          {field.required ? "Required" : "Optional"}
        </span>
      </div>
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
  dark = false,
  className = "",
}) => {
  const canDecrease = quantity > minQuantity;
  const canIncrease = maxQuantity === undefined || quantity < maxQuantity;

  return (
    <div
      className={`${className}
        flex items-center rounded-xl border p-1
        ${dark ? "border-white/10 bg-white/5" : "border-zinc-200 bg-zinc-50"}
      `}
    >
      <button
        type="button"
        onClick={() => canDecrease && onChange(quantity - 1)}
        disabled={!canDecrease}
        className={`
          flex h-8 w-8 items-center justify-center rounded-lg
          transition-all
          ${
            dark
              ? "text-white/60 hover:bg-white/10 hover:text-white"
              : "text-zinc-500 hover:bg-white hover:text-zinc-900"
          }
          disabled:cursor-not-allowed disabled:opacity-30
        `}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>

      <div className="min-w-[52px] px-1 text-center">
        <p
          className={`text-sm font-semibold ${
            dark ? "text-white" : "text-zinc-900"
          }`}
        >
          {quantity}
        </p>

        {unit && (
          <p
            className={`text-[10px] ${
              dark ? "text-white/35" : "text-zinc-400"
            }`}
          >
            {unit}
            {quantity !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => canIncrease && onChange(quantity + 1)}
        disabled={!canIncrease}
        className={`
          flex h-8 w-8 items-center justify-center rounded-lg
          transition-all
          ${
            dark
              ? "text-white/60 hover:bg-white/10 hover:text-white"
              : "text-zinc-500 hover:bg-white hover:text-zinc-900"
          }
          disabled:cursor-not-allowed disabled:opacity-30
        `}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
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
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex w-full items-start gap-3.5 rounded-2xl border p-4
        text-left transition-all duration-300 sm:p-5
        ${
          selected
            ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_35px_rgba(0,0,0,0.08)]"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
        }
        ${disabled ? "cursor-not-allowed opacity-45" : "hover:-translate-y-0.5"}
      `}
    >
      <div
        className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
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
          className={`text-sm font-medium ${
            selected ? "text-white" : "text-zinc-900"
          }`}
        >
          {title}
        </p>

        <p
          className={`mt-1 text-xs leading-5 ${
            selected ? "text-white/50" : "text-zinc-500"
          }`}
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
| Repeatable Group
|--------------------------------------------------------------------------
*/

const RepeatableGroup = ({
  group,
  service,
  entries,
  onAdd,
  onRemove,
  onFieldChange,
  onPricingOptionChange,
  onPricingQuantityChange,
  openOptionalFields,
  toggleOptionalField,
  disabled = false,
}) => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const { minItems, maxItems } = getRepeatableGroupRules(group);

  const pricingGroups = getRepeatableGroupPricingGroups(service, group);

  // Fields that are always part of the repeatable group
  // plus fields belonging to the pricing options selected
  // inside each individual entry.
  const getEntryFields = (entry) =>
    getActiveFieldsForRepeatableEntry(service, group, entry);

  const canRemove = safeEntries.length > minItems;
  const canAdd = safeEntries.length < maxItems;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-3 sm:px-3 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              {group.label || group.name}
            </h3>

            <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              {safeEntries.length} {safeEntries.length === 1 ? "item" : "items"}
            </span>
          </div>

          {group.description && (
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {group.description}
            </p>
          )}

          <p className="mt-1 text-[11px] text-zinc-400">
            Minimum {minItems} · Maximum {maxItems}
          </p>
        </div>

        {canAdd && (
          <button
            type="button"
            disabled={disabled}
            onClick={onAdd}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} />
            Add Another {group.label || "Item"}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {safeEntries.map((entry, entryIndex) => {
          const optionalOpenKey = `${group.name}:${entryIndex}`;

          const fields = getEntryFields(entry);

          const requiredFields = fields.filter((field) => field.required);

          const optionalFields = fields.filter((field) => !field.required);

          return (
            <div
              key={`${group.name}-${entryIndex}`}
              className="rounded-2xl border border-zinc-200 bg-white p-3 sm:px-3 py-4"
            >
              <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    {group.label || "Item"} {entryIndex + 1}
                  </p>
                </div>

                {canRemove && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemove(entryIndex)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove ${
                      group.label || "item"
                    } ${entryIndex + 1}`}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {pricingGroups.length > 0 && (
                <div className="mt-4 space-y-4">
                  {pricingGroups.map((pricingGroup) => {
                    const title = pricingGroup.name
                      ? pricingGroup.name.charAt(0).toUpperCase() +
                        pricingGroup.name.slice(1)
                      : "Options";

                    const required = isRequiredRepeatablePricingGroup(
                      group,
                      pricingGroup.name,
                    );

                    const selectedOptionId =
                      entry?.pricingOptions?.[pricingGroup.name];

                    return (
                      <div key={pricingGroup.key}>
                        <div className="mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-zinc-900">
                              {title}
                            </p>

                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                              {required ? "Required" : "Optional"}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-zinc-400">
                            Select one
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {pricingGroup.options.map((option) => {
                            const optionSelected =
                              String(selectedOptionId) === String(option._id);

                            const rules = getQuantityRules(service, option);

                            const optionQuantity = optionSelected
                              ? Number(
                                  entry?.pricingQuantities?.[
                                    pricingGroup.name
                                  ] ?? rules.minQuantity,
                                )
                              : rules.minQuantity;

                            return (
                              <div
                                key={option._id}
                                className={`
                                  relative rounded-2xl border p-3 sm:p-4
                                  transition-all duration-200
                                  ${
                                    optionSelected
                                      ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                                      : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50"
                                  }
                                `}
                              >
                                <button
                                  type="button"
                                  disabled={disabled}
                                  onClick={() =>
                                    onPricingOptionChange(
                                      entryIndex,
                                      pricingGroup.name,
                                      option,
                                    )
                                  }
                                  className="w-full text-left disabled:cursor-not-allowed"
                                >
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={`
                                        mt-0.5 flex h-5 w-5 shrink-0
                                        items-center justify-center
                                        rounded-full border
                                        ${
                                          optionSelected
                                            ? "border-white bg-white text-zinc-900"
                                            : "border-zinc-300 bg-white"
                                        }
                                      `}
                                    >
                                      {optionSelected && (
                                        <Check size={12} strokeWidth={2.5} />
                                      )}
                                    </span>

                                    <span className="min-w-0 flex-1">
                                      <span
                                        className={`block text-sm font-semibold ${
                                          optionSelected
                                            ? "text-white"
                                            : "text-zinc-900"
                                        }`}
                                      >
                                        {option.name}
                                      </span>

                                      {option.description && (
                                        <span
                                          className={`mt-1 block text-xs leading-5 ${
                                            optionSelected
                                              ? "text-white/50"
                                              : "text-zinc-500"
                                          }`}
                                        >
                                          {option.description}
                                        </span>
                                      )}

                                      <span
                                        className={`mt-1.5 block text-xs font-medium ${
                                          optionSelected
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

                                {optionSelected && (
                                  <div className="mt-3 border-t border-white/10 pt-3">
                                    <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                                      <div className="min-w-0">
                                        <p className="text-[11px] font-medium text-white/50">
                                          Quantity
                                        </p>

                                        <p className="mt-0.5 text-[11px] text-white/35">
                                          Minimum: {rules.minQuantity}
                                        </p>
                                      </div>

                                      <QuantityControl
                                        className="self-start"
                                        quantity={optionQuantity}
                                        minQuantity={rules.minQuantity}
                                        maxQuantity={rules.maxQuantity}
                                        unit={option.unit || "unit"}
                                        dark
                                        onChange={(nextQuantity) =>
                                          onPricingQuantityChange(
                                            entryIndex,
                                            pricingGroup.name,
                                            nextQuantity,
                                          )
                                        }
                                      />
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
              )}

              {requiredFields.length > 0 && (
                <div className="mt-4 space-y-4">
                  {requiredFields.map((field) => (
                    <DynamicField
                      key={field.name}
                      field={field}
                      value={entry?.fields?.[field.name]}
                      onChange={(fieldName, value) =>
                        onFieldChange(entryIndex, fieldName, value)
                      }
                      compact
                    />
                  ))}
                </div>
              )}

              {optionalFields.length > 0 && (
                <div
                  className={`${
                    requiredFields.length > 0
                      ? "mt-6 border-t border-zinc-100 pt-5"
                      : "mt-5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleOptionalField(optionalOpenKey)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-zinc-300 hover:bg-white"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-800">
                        Optional details
                      </p>

                      <p className="mt-0.5 text-xs text-zinc-400">
                        Add any additional information for this{" "}
                        {String(group.label || "item").toLowerCase()}.
                      </p>
                    </div>

                    {openOptionalFields[optionalOpenKey] ? (
                      <ChevronUp size={16} className="shrink-0 text-zinc-400" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="shrink-0 text-zinc-400"
                      />
                    )}
                  </button>

                  {openOptionalFields[optionalOpenKey] && (
                    <div className="mt-4 space-y-4">
                      {optionalFields.map((field) => (
                        <DynamicField
                          key={field.name}
                          field={field}
                          value={entry?.fields?.[field.name]}
                          onChange={(fieldName, value) =>
                            onFieldChange(entryIndex, fieldName, value)
                          }
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| New Order
|--------------------------------------------------------------------------
*/

const NewOrder = () => {
  const [services, setServices] = useState([]);
  const [orderItems, setOrderItems] = useState([]);

  const [activeServiceIndex, setActiveServiceIndex] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [additionalRequirements, setAdditionalRequirements] = useState("");

  const [loadingServices, setLoadingServices] = useState(true);

  const [loadingServiceId, setLoadingServiceId] = useState("");

  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(null);

  const [openOptionalFields, setOpenOptionalFields] = useState({});

  const [openServiceIds, setOpenServiceIds] = useState({});

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
      } catch (loadError) {
        console.error("Failed to load services:", loadError);

        setError(
          loadError.response?.data?.message || "Unable to load services.",
        );
      } finally {
        setLoadingServices(false);
      }
    };

    loadServices();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Item Helpers
  |--------------------------------------------------------------------------
  */

  const updateItem = (index, updater) => {
    setOrderItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return typeof updater === "function"
          ? updater(item)
          : { ...item, ...updater };
      }),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Service Selection
  |--------------------------------------------------------------------------
  */

  const handleToggleService = async (serviceId) => {
    if (!serviceId || submitting || loadingServiceId) {
      return;
    }

    const existingIndex = orderItems.findIndex(
      (item) => String(item?.service?._id) === String(serviceId),
    );

    if (existingIndex >= 0) {
      setOrderItems((current) =>
        current.filter((_, index) => index !== existingIndex),
      );

      setActiveServiceIndex((current) => {
        if (current > existingIndex) {
          return current - 1;
        }

        if (current === existingIndex && current >= orderItems.length - 1) {
          return Math.max(0, current - 1);
        }

        return current;
      });

      setOpenServiceIds((current) => {
        const next = { ...current };
        delete next[serviceId];
        return next;
      });

      setError("");
      return;
    }

    try {
      setLoadingServiceId(serviceId);
      setError("");

      const data = await serviceService.getServiceById(serviceId);

      const service = data?.service;

      if (!service) {
        throw new Error("Selected service could not be loaded.");
      }

      const nextItem = createOrderItem(service);

      setOrderItems((current) => {
        const next = [...current, nextItem];

        setActiveServiceIndex(next.length - 1);

        return next;
      });

      setOpenServiceIds((current) => ({
        ...current,
        [serviceId]: true,
      }));
    } catch (loadError) {
      console.error("Failed to load service:", loadError);

      setError(
        loadError.response?.data?.message ||
          loadError.message ||
          "Unable to load selected service.",
      );
    } finally {
      setLoadingServiceId("");
    }
  };

  const handleServiceNameClick = (serviceId) => {
    const existingIndex = orderItems.findIndex(
      (item) => String(item?.service?._id) === String(serviceId),
    );

    if (existingIndex < 0) {
      return;
    }

    setOpenServiceIds((current) => ({
      ...current,
      [serviceId]: !current[serviceId],
    }));

    setActiveServiceIndex(existingIndex);
  };

  /*
  |--------------------------------------------------------------------------
  | Pricing
  |--------------------------------------------------------------------------
  */

  const handlePricingOptionChange = (itemIndex, option) => {
    updateItem(itemIndex, (current) => {
      const rules = getQuantityRules(current.service, option);

      return {
        ...current,
        selectedPricingOption: option,
        formData: {
          ...(current.formData || {}),
          quantity: rules.minQuantity,
        },
      };
    });

    setError("");
  };

  const handleGroupedPricingOptionChange = (itemIndex, group, option) => {
    updateItem(itemIndex, (current) => {
      const currentSelected = current.selectedPricingOptions?.[group] || null;

      const isDeselecting = currentSelected?._id === option?._id;

      const nextSelected = isDeselecting ? null : option;

      const nextSelectedOptions = {
        ...(current.selectedPricingOptions || {}),
        [group]: nextSelected,
      };

      const nextQuantities = {
        ...(current.pricingQuantities || {}),
      };

      const nextFormData = {
        ...(current.formData || {}),
      };

      if (nextSelected) {
        const rules = getQuantityRules(current.service, nextSelected);

        nextQuantities[group] = rules.minQuantity;
        nextFormData[group] = String(nextSelected._id);
      } else {
        delete nextQuantities[group];
        delete nextFormData[group];
      }

      return {
        ...current,
        selectedPricingOptions: nextSelectedOptions,
        pricingQuantities: nextQuantities,
        formData: nextFormData,
      };
    });

    setError("");
  };

  const handleGroupedQuantityChange = (itemIndex, group, nextQuantity) => {
    updateItem(itemIndex, (current) => {
      const option = current.selectedPricingOptions?.[group];

      if (!option) {
        return current;
      }

      const rules = getQuantityRules(current.service, option);

      let normalized = Number(nextQuantity);

      if (!Number.isFinite(normalized)) {
        normalized = rules.minQuantity;
      }

      normalized = Math.floor(normalized);
      normalized = Math.max(rules.minQuantity, normalized);

      if (rules.maxQuantity !== undefined) {
        normalized = Math.min(rules.maxQuantity, normalized);
      }

      return {
        ...current,
        pricingQuantities: {
          ...(current.pricingQuantities || {}),
          [group]: normalized,
        },
      };
    });

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Normal Field Changes
  |--------------------------------------------------------------------------
  */

  const handleFieldChange = (itemIndex, fieldName, value) => {
    updateItem(itemIndex, (current) => ({
      ...current,
      formData: {
        ...(current.formData || {}),
        [fieldName]: value,
      },
    }));

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Repeatable Groups
  |--------------------------------------------------------------------------
  */

  const handleRepeatableAdd = (itemIndex, group) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const { maxItems } = getRepeatableGroupRules(group);

      if (currentEntries.length >= maxItems) {
        return current;
      }

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: [...currentEntries, createEmptyRepeatableItem(group)],
        },
      };
    });

    setError("");
  };

  const handleRepeatableRemove = (itemIndex, group, entryIndex) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const { minItems } = getRepeatableGroupRules(group);

      if (currentEntries.length <= minItems) {
        return current;
      }

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: currentEntries.filter(
            (_, index) => index !== entryIndex,
          ),
        },
      };
    });

    setError("");
  };

  const handleRepeatableFieldChange = (
    itemIndex,
    group,
    entryIndex,
    fieldName,
    value,
  ) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const nextEntries = currentEntries.map((entry, index) =>
        index === entryIndex
          ? {
              ...(entry || {}),
              fields: {
                ...(entry?.fields || {}),
                [fieldName]: value,
              },
            }
          : entry,
      );

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: nextEntries,
        },
      };
    });

    setError("");
  };

  const handleRepeatableEntryPricingOptionChange = (
    itemIndex,
    group,
    entryIndex,
    pricingGroupName,
    option,
  ) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const existingEntry =
        currentEntries[entryIndex] || createEmptyRepeatableItem(group);

      const currentSelectedId =
        existingEntry?.pricingOptions?.[pricingGroupName];

      const isDeselecting = String(currentSelectedId) === String(option?._id);

      const nextEntry = {
        ...existingEntry,

        pricingOptions: {
          ...(existingEntry.pricingOptions || {}),
        },

        pricingQuantities: {
          ...(existingEntry.pricingQuantities || {}),
        },

        fields: {
          ...(existingEntry.fields || {}),
        },
      };

      if (isDeselecting) {
        delete nextEntry.pricingOptions[pricingGroupName];
        delete nextEntry.pricingQuantities[pricingGroupName];
      } else {
        nextEntry.pricingOptions[pricingGroupName] = String(option._id);

        const rules = getQuantityRules(current.service, option);

        nextEntry.pricingQuantities[pricingGroupName] = rules.minQuantity;
      }

      const activeFields = getActiveFieldsForRepeatableEntry(
        current.service,
        group,
        nextEntry,
      );
      const activeFieldNames = new Set(
        activeFields.map((field) => String(field.name)),
      );

      Object.keys(nextEntry.fields).forEach((fieldName) => {
        if (!activeFieldNames.has(fieldName)) {
          delete nextEntry.fields[fieldName];
        }
      });

      activeFields.forEach((field) => {
        if (!(field.name in nextEntry.fields)) {
          nextEntry.fields[field.name] =
            normalizeFieldType(field) === "checkbox" ? [] : "";
        }
      });

      const nextEntries = currentEntries.map((entry, index) =>
        index === entryIndex ? nextEntry : entry,
      );

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: nextEntries,
        },
      };
    });

    setError("");
  };

  const handleRepeatableEntryPricingQuantityChange = (
    itemIndex,
    group,
    entryIndex,
    pricingGroupName,
    nextQuantity,
  ) => {
    updateItem(itemIndex, (current) => {
      const currentEntries = Array.isArray(current.formData?.[group.name])
        ? current.formData[group.name]
        : [];

      const existingEntry = currentEntries[entryIndex];

      if (!existingEntry) {
        return current;
      }

      const selectedOptionId =
        existingEntry?.pricingOptions?.[pricingGroupName];

      if (!selectedOptionId) {
        return current;
      }

      const pricingGroups = getRepeatableGroupPricingGroups(
        current.service,
        group,
      );

      const pricingGroup = pricingGroups.find(
        (candidate) => candidate.name === pricingGroupName,
      );

      const option = pricingGroup?.options.find(
        (candidate) => String(candidate._id) === String(selectedOptionId),
      );

      if (!option) {
        return current;
      }

      const rules = getQuantityRules(current.service, option);

      let normalized = Number(nextQuantity);

      if (!Number.isFinite(normalized)) {
        normalized = rules.minQuantity;
      }

      normalized = Math.floor(normalized);
      normalized = Math.max(rules.minQuantity, normalized);

      if (rules.maxQuantity !== undefined) {
        normalized = Math.min(rules.maxQuantity, normalized);
      }

      const nextEntry = {
        ...existingEntry,

        pricingOptions: {
          ...(existingEntry.pricingOptions || {}),
        },

        pricingQuantities: {
          ...(existingEntry.pricingQuantities || {}),
          [pricingGroupName]: normalized,
        },

        fields: {
          ...(existingEntry.fields || {}),
        },
      };

      const nextEntries = currentEntries.map((entry, index) =>
        index === entryIndex ? nextEntry : entry,
      );

      return {
        ...current,
        formData: {
          ...(current.formData || {}),
          [group.name]: nextEntries,
        },
      };
    });

    setError("");
  };

  const toggleOptionalField = (key) => {
    setOpenOptionalFields((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Quantity
  |--------------------------------------------------------------------------
  */

  const getQuantityInfo = (item) => {
    if (!item || item.isGroupedPricing) {
      return {
        hasQuantity: false,
        quantity: 1,
        rules: getQuantityRules(item?.service, null),
        unit: item?.service?.unit,
      };
    }

    const selectedPricingOption = item.selectedPricingOption || null;

    const rules = getQuantityRules(item.service, selectedPricingOption);

    const hasQuantity = Boolean(
      selectedPricingOption ||
      item.service?.pricingType === "per_unit" ||
      item.service?.pricingType === "starting_from",
    );

    return {
      hasQuantity,
      quantity: getItemQuantity(item),
      rules,
      unit: selectedPricingOption?.unit || item.service?.unit,
    };
  };

  /*
  |--------------------------------------------------------------------------
  | Active Fields / Cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!orderItems.length) {
      return;
    }

    setOrderItems((current) => {
      let changed = false;

      const nextItems = current.map((item) => {
        const configuredDynamicFieldNames = new Set();

        const collectFieldNames = (fields) => {
          if (!Array.isArray(fields)) {
            return;
          }

          fields.forEach((field) => {
            const fieldName = String(field?.name || "").trim();

            if (fieldName) {
              configuredDynamicFieldNames.add(fieldName);
            }
          });
        };

        collectFieldNames(item.service?.fields);

        getPricingOptions(item.service).forEach((pricingOption) => {
          collectFieldNames(pricingOption?.fields);
        });

        const activeFields = new Set(
          getActiveFieldsForItem(item)
            .map((field) => String(field?.name || "").trim())
            .filter(Boolean),
        );

        const nextFormData = {
          ...(item.formData || {}),
        };

        configuredDynamicFieldNames.forEach((fieldName) => {
          if (!activeFields.has(fieldName) && fieldName in nextFormData) {
            delete nextFormData[fieldName];
            changed = true;
          }
        });

        if (!changed) {
          return item;
        }

        return {
          ...item,
          formData: nextFormData,
        };
      });

      return changed ? nextItems : current;
    });
  }, [orderItems]);

  /*
  |--------------------------------------------------------------------------
  | Totals
  |--------------------------------------------------------------------------
  */

  const itemEstimates = useMemo(
    () => orderItems.map((item) => getItemEstimate(item)),
    [orderItems],
  );

  const subtotal = useMemo(
    () =>
      itemEstimates.reduce((total, amount) => total + Number(amount || 0), 0),
    [itemEstimates],
  );

  const hasCustomUnpricedService = useMemo(
    () => orderItems.some((item) => isCustomUnpricedItem(item)),
    [orderItems],
  );

  const gstAmount = useMemo(() => {
    if (paymentMethod !== "online") {
      return 0;
    }

    return Number(((subtotal * ONLINE_GST_RATE) / 100).toFixed(2));
  }, [paymentMethod, subtotal]);

  const estimatedTotal = subtotal + gstAmount;

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const validateFields = (item) => {
    const validationErrors = {};
    const fields = getActiveFieldsForItem(item);

    for (const field of fields) {
      const value = item.formData?.[field.name];
      const type = normalizeFieldType(field);

      if (field.required && isEmptyValue(value)) {
        validationErrors[field.name] = `${field.label} is required.`;
        continue;
      }

      if (isEmptyValue(value)) {
        continue;
      }

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

      if (type === "number") {
        const numberValue = Number(value);

        if (!Number.isFinite(numberValue)) {
          validationErrors[field.name] =
            `${field.label} must be a valid number.`;
          continue;
        }

        if (
          field.min !== undefined &&
          field.min !== null &&
          numberValue < Number(field.min)
        ) {
          validationErrors[field.name] =
            `${field.label} must be at least ${field.min}.`;
        }

        if (
          field.max !== undefined &&
          field.max !== null &&
          numberValue > Number(field.max)
        ) {
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

      if (type === "date") {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          validationErrors[field.name] = `${field.label} must be a valid date.`;
        }
      }
    }

    return validationErrors;
  };

  const validateRepeatableGroups = (item) => {
    const groups = getRepeatableGroups(item?.service);

    for (const group of groups) {
      const entries = Array.isArray(item.formData?.[group.name])
        ? item.formData[group.name]
        : [];

      const { minItems, maxItems } = getRepeatableGroupRules(group);

      if (entries.length < minItems) {
        return `${group.label || group.name} requires at least ${minItems} ${
          minItems === 1 ? "item" : "items"
        }.`;
      }

      if (entries.length > maxItems) {
        return `${group.label || group.name} allows a maximum of ${maxItems} ${
          maxItems === 1 ? "item" : "items"
        }.`;
      }

      const repeatablePricingGroups = getRepeatableGroupPricingGroups(
        item.service,
        group,
      );

      for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
        const entry = entries[entryIndex] || {};

        for (const pricingGroup of repeatablePricingGroups) {
          const selectedOptionId = entry?.pricingOptions?.[pricingGroup.name];

          const required = isRequiredRepeatablePricingGroup(
            group,
            pricingGroup.name,
          );

          const pricingGroupLabel = pricingGroup.name
            ? pricingGroup.name.charAt(0).toUpperCase() +
              pricingGroup.name.slice(1)
            : "Option";

          if (required && !selectedOptionId) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} is required.`;
          }

          if (!selectedOptionId) {
            continue;
          }

          const option = pricingGroup.options.find(
            (candidate) => String(candidate._id) === String(selectedOptionId),
          );

          if (!option) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} has an invalid selection.`;
          }

          const rules = getQuantityRules(item.service, option);

          const rawQuantity = entry?.pricingQuantities?.[pricingGroup.name];

          const quantity = Number(rawQuantity ?? rules.minQuantity);

          if (!Number.isInteger(quantity)) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} quantity must be a whole number.`;
          }

          if (quantity < rules.minQuantity) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} requires a minimum quantity of ${
              rules.minQuantity
            }.`;
          }

          if (rules.maxQuantity !== undefined && quantity > rules.maxQuantity) {
            return `${group.label || group.name} ${
              entryIndex + 1
            }: ${pricingGroupLabel} allows a maximum quantity of ${
              rules.maxQuantity
            }.`;
          }
        }

        const activeFields = getActiveFieldsForRepeatableEntry(
          item.service,
          group,
          entry,
        );

        for (const field of activeFields) {
          const value = entry?.fields?.[field.name];
          const type = normalizeFieldType(field);

          if (field.required && isEmptyValue(value)) {
            return `${group.label || group.name} ${entryIndex + 1}: ${
              field.label
            } is required.`;
          }

          if (isEmptyValue(value)) {
            continue;
          }

          if (type === "checkbox") {
            const selectedValues = Array.isArray(value) ? value : [value];

            const allowedValues = (field.options || []).map((option) =>
              String(option.value),
            );

            const invalidValue = selectedValues.some(
              (selectedValue) => !allowedValues.includes(String(selectedValue)),
            );

            if (invalidValue) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} has an invalid selection.`;
            }

            continue;
          }

          if (type === "radio" || type === "select") {
            const allowedValues = (field.options || []).map((option) =>
              String(option.value),
            );

            if (!allowedValues.includes(String(value))) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} has an invalid selection.`;
            }

            continue;
          }

          if (type === "number") {
            const numberValue = Number(value);

            if (!Number.isFinite(numberValue)) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be a valid number.`;
            }

            if (
              field.min !== undefined &&
              field.min !== null &&
              numberValue < Number(field.min)
            ) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be at least ${field.min}.`;
            }

            if (
              field.max !== undefined &&
              field.max !== null &&
              numberValue > Number(field.max)
            ) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be at most ${field.max}.`;
            }

            continue;
          }

          if (type === "url") {
            try {
              const url = new URL(String(value));

              if (!["http:", "https:"].includes(url.protocol)) {
                return `${group.label || group.name} ${
                  entryIndex + 1
                }: ${field.label} must be a valid URL.`;
              }
            } catch {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be a valid URL.`;
            }

            continue;
          }

          if (type === "date") {
            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
              return `${group.label || group.name} ${
                entryIndex + 1
              }: ${field.label} must be a valid date.`;
            }
          }
        }
      }
    }

    return "";
  };

  const validateGroupedPricing = (item) => {
    if (!item.isGroupedPricing) {
      return "";
    }

    const groups = getPricingGroups(item.service);

    for (const group of groups) {
      const selectedOption = item.selectedPricingOptions?.[group.key];

      if (!selectedOption) {
        continue;
      }

      const rules = getQuantityRules(item.service, selectedOption);

      const rawQuantity = item.pricingQuantities?.[group.key];

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

  const validateOrderItem = (item) => {
    const itemPricingOptions = getPricingOptions(item.service);
    const repeatableOnly = isRepeatableOnlyService(item.service);

    if (item.isGroupedPricing && !repeatableOnly) {
      const groupedError = validateGroupedPricing(item);

      if (groupedError) {
        return groupedError;
      }
    } else if (
      !repeatableOnly &&
      itemPricingOptions.length > 0 &&
      !item.selectedPricingOption
    ) {
      return "Please select a service option.";
    }

    if (!item.isGroupedPricing) {
      const shouldHaveQuantity = Boolean(
        item.selectedPricingOption ||
        item.service?.pricingType === "per_unit" ||
        item.service?.pricingType === "starting_from",
      );

      if (shouldHaveQuantity) {
        const itemQuantity = getItemQuantity(item);

        const rules = getQuantityRules(
          item.service,
          item.selectedPricingOption,
        );

        if (itemQuantity < rules.minQuantity) {
          return `Minimum quantity is ${rules.minQuantity}.`;
        }

        if (
          rules.maxQuantity !== undefined &&
          itemQuantity > rules.maxQuantity
        ) {
          return `Maximum quantity is ${rules.maxQuantity}.`;
        }
      }
    }

    const repeatableError = validateRepeatableGroups(item);

    if (repeatableError) {
      return repeatableError;
    }

    const validationErrors = validateFields(item);

    if (Object.keys(validationErrors).length > 0) {
      return Object.values(validationErrors)[0];
    }

    return "";
  };

  /*
  |--------------------------------------------------------------------------
  | Backend Payload
  |--------------------------------------------------------------------------
  */

  const buildCleanFormData = (item) => {
    const cleanFormData = {};
    const fields = getActiveFieldsForItem(item);

    for (const field of fields) {
      const value = item.formData?.[field.name];

      if (value !== undefined && value !== null) {
        cleanFormData[field.name] = value;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Repeatable Groups
    |--------------------------------------------------------------------------
    */

    const repeatableGroups = getRepeatableGroups(item.service);

    for (const group of repeatableGroups) {
      const entries = Array.isArray(item.formData?.[group.name])
        ? item.formData[group.name]
        : [];

      if (entries.length > 0) {
        const repeatablePricingGroups = getRepeatableGroupPricingGroups(
          item.service,
          group,
        );

        cleanFormData[group.name] = entries.map((entry) => {
          const cleanEntry = {
            pricingOptions: {},
            pricingQuantities: {},
            fields: {},
          };

          /*
           * Repeatable fields
           */
          const activeFields = getActiveFieldsForRepeatableEntry(
            item.service,
            group,
            entry,
          );

          for (const field of activeFields) {
            const fieldName = String(field?.name || "").trim();

            if (!fieldName) {
              continue;
            }

            const value = entry?.fields?.[fieldName];

            if (value !== undefined && value !== null) {
              cleanEntry.fields[fieldName] = value;
            }
          }

          /*
           * Repeatable pricing selections + quantities
           */
          for (const pricingGroup of repeatablePricingGroups) {
            const selectedOptionId = entry?.pricingOptions?.[pricingGroup.name];

            if (!selectedOptionId) {
              continue;
            }

            cleanEntry.pricingOptions[pricingGroup.name] =
              String(selectedOptionId);

            const option = pricingGroup.options.find(
              (candidate) => String(candidate._id) === String(selectedOptionId),
            );

            const rules = getQuantityRules(item.service, option);

            const rawQuantity = entry?.pricingQuantities?.[pricingGroup.name];

            cleanEntry.pricingQuantities[pricingGroup.name] =
              rawQuantity !== undefined && rawQuantity !== null
                ? Number(rawQuantity)
                : rules.minQuantity;
          }

          return cleanEntry;
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Grouped Pricing
    |--------------------------------------------------------------------------
    */

    if (item.isGroupedPricing && !isRepeatableOnlyService(item.service)) {
      for (const [group, option] of Object.entries(
        item.selectedPricingOptions || {},
      )) {
        if (option) {
          cleanFormData[group] = String(option._id);
        }
      }

      const selectedQuantities = {};

      for (const [group, option] of Object.entries(
        item.selectedPricingOptions || {},
      )) {
        if (!option) {
          continue;
        }

        const rules = getQuantityRules(item.service, option);

        const rawQuantity = item.pricingQuantities?.[group];

        selectedQuantities[group] =
          rawQuantity !== undefined && rawQuantity !== null
            ? Number(rawQuantity)
            : rules.minQuantity;
      }

      cleanFormData.pricingQuantities = selectedQuantities;
    }

    return cleanFormData;
  };

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!orderItems.length) {
      setError("Please select at least one service.");
      return;
    }

    for (let index = 0; index < orderItems.length; index += 1) {
      const itemError = validateOrderItem(orderItems[index]);

      if (itemError) {
        setActiveServiceIndex(index);

        const erroredServiceId = orderItems[index]?.service?._id;

        if (erroredServiceId) {
          setOpenServiceIds((current) => ({
            ...current,
            [erroredServiceId]: true,
          }));
        }

        setError(
          `${orderItems[index].service?.name || "Service"}: ${itemError}`,
        );
        return;
      }
    }

    if (paymentMethod === "online" && estimatedTotal <= 0) {
      setError(
        "Online payment requires a payable order amount. Please select a priced service option or use Cash on Delivery.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const servicesPayload = orderItems.map((item) => ({
        serviceId: item.service._id,

        ...(item.isGroupedPricing
          ? {}
          : {
              pricingOptionId: item.selectedPricingOption?._id || undefined,
            }),

        quantity: item.isGroupedPricing
          ? 1
          : item.selectedPricingOption ||
              item.service?.pricingType === "per_unit" ||
              item.service?.pricingType === "starting_from"
            ? getItemQuantity(item)
            : 1,

        formData: buildCleanFormData(item),
      }));

      const orderResponse = await orderService.createOrder({
        services: servicesPayload,
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
      | Razorpay
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

        const serviceNames =
          Array.isArray(createdOrder.items) && createdOrder.items.length > 0
            ? createdOrder.items
                .map(
                  (item) =>
                    item?.serviceSnapshot?.name ||
                    item?.service?.name ||
                    "Content Service",
                )
                .filter(Boolean)
                .join(", ")
            : orderItems
                .map((item) => item.service?.name)
                .filter(Boolean)
                .join(", ");

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,

          amount: razorpayOrder.amount,

          currency: razorpayOrder.currency,

          name: "Glow Ventures",

          description:
            serviceNames.length > 90
              ? `${serviceNames.slice(0, 87)}...`
              : serviceNames || "Content Service Order",

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
                toast.success("Payment completed successfully.");
              } else {
                setError("Payment verification failed.");
                toast.error("Payment verification failed.");
              }
            } catch (verificationError) {
              console.error("Payment verification error:", verificationError);

              const message =
                verificationError.response?.data?.message ||
                "Payment verification failed.";
              setError(message);
              toast.error(message);
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

              const message =
                "Payment was cancelled. You can try again from your order.";
              setError(message);
              toast.info(message);
            },
          },
        };

        const razorpay = new window.Razorpay(options);

        razorpay.open();
      }
    } catch (submitError) {
      console.error("Create order/payment error:", submitError);

      const responseData = submitError.response?.data;

      if (responseData?.errors) {
        const firstError = Object.values(responseData.errors)[0];

        const message =
          typeof firstError === "string"
            ? firstError
            : "Please check your order details.";
        setError(message);
        toast.error(message);
      } else {
        const message =
          responseData?.message ||
            submitError.message ||
            "Unable to process your order.";
        setError(message);
        toast.error(message);
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
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[1180px] items-center justify-center px-5">
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

  if (!services.length) {
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
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="mx-auto w-full max-w-[1180px] px-2 py-6 sm:px-5 sm:py-10">
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ================================================================
              LEFT COLUMN
          ================================================================= */}

          <div className="min-w-0 space-y-6">
            {/* ==============================================================
                SERVICE CHECKLIST
            ============================================================== */}

            <section className="relative z-30 rounded-[24px] border border-zinc-200 bg-white px-2 py-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:px-5 sm:py-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                  Step 1
                </p>

                <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                      Build your order
                    </h1>

                    <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                      Select one or more services. Each selected service can be
                      configured independently.
                    </p>
                  </div>

                  <div className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-500">
                    {orderItems.length} selected
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {services.map((service) => {
                  const serviceId = String(service._id);

                  const selectedIndex = orderItems.findIndex(
                    (item) => String(item?.service?._id) === serviceId,
                  );

                  const selected = selectedIndex >= 0;

                  const item = selected ? orderItems[selectedIndex] : null;

                  const quantityInfo = item ? getQuantityInfo(item) : null;

                  const pricingOptions = item
                    ? getPricingOptions(item.service)
                    : [];

                  const pricingGroups = item
                    ? getPricingGroups(item.service)
                    : [];

                  const isGroupedPricing = Boolean(item?.isGroupedPricing);
                  const hasServiceLevelPricing = Boolean(
                    item &&
                      pricingOptions.length > 0 &&
                      !isRepeatableOnlyService(item.service),
                  );

                  const activeFields = item ? getActiveFieldsForItem(item) : [];

                  const repeatableGroups = item
                    ? getRepeatableGroups(item.service)
                    : [];

                  const requiredFields = activeFields.filter(
                    (field) => field.required,
                  );

                  const optionalFields = activeFields.filter(
                    (field) => !field.required,
                  );

                  const itemAmount = selected
                    ? itemEstimates[selectedIndex] || 0
                    : 0;

                  return (
                    <div
                      key={serviceId}
                      className={`
                        overflow-hidden rounded-[22px] border
                        transition-all duration-300
                        ${
                          selected
                            ? "border-zinc-900 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.06)]"
                            : "border-zinc-200 bg-white hover:border-zinc-300"
                        }
                      `}
                    >
                      {/* Service header */}

                      <div
                        className={`
                          flex flex-col gap-3 px-4 py-4
                          sm:flex-row sm:items-center sm:justify-between
                          sm:px-3 sm:py-4
                          ${selected ? "bg-zinc-50/70" : ""}
                        `}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <button
                            type="button"
                            disabled={submitting || Boolean(loadingServiceId)}
                            onClick={() => handleToggleService(serviceId)}
                            aria-label={
                              selected
                                ? `Remove ${service.name} from order`
                                : `Add ${service.name} to order`
                            }
                            className={`
                              flex h-6 w-6 shrink-0
                              items-center justify-center
                              rounded-md border
                              transition-all duration-200
                              ${
                                selected
                                  ? "border-zinc-900 bg-zinc-900 text-white"
                                  : "border-zinc-300 bg-white text-transparent"
                              }
                            `}
                          >
                            {loadingServiceId === serviceId ? (
                              <Loader2
                                size={14}
                                className="animate-spin text-zinc-400"
                              />
                            ) : (
                              <Check size={14} strokeWidth={2.5} />
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={!selected}
                            onClick={() => handleServiceNameClick(serviceId)}
                            className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-zinc-900 sm:text-[15px]">
                                {service.name}
                              </span>
                              {/* 
                              {service.description && (
                                <span className="mt-0.5 line-clamp-1 block text-xs text-zinc-400">
                                  {
                                    service.description
                                  }
                                </span>
                              )} */}
                            </span>

                            {selected &&
                              (openServiceIds[serviceId] ? (
                                <ChevronUp
                                  size={16}
                                  className="shrink-0 text-zinc-400"
                                />
                              ) : (
                                <ChevronDown
                                  size={16}
                                  className="shrink-0 text-zinc-400"
                                />
                              ))}
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          {selected && quantityInfo?.hasQuantity && (
                            <div className="flex items-center gap-2">
                              <span className="hidden text-[10px] font-medium uppercase tracking-wide text-zinc-400 sm:block">
                                Qty
                              </span>

                              <QuantityControl
                                quantity={quantityInfo.quantity}
                                minQuantity={quantityInfo.rules.minQuantity}
                                maxQuantity={quantityInfo.rules.maxQuantity}
                                unit={quantityInfo.unit}
                                onChange={(nextQuantity) =>
                                  updateItem(selectedIndex, (current) => ({
                                    ...current,
                                    formData: {
                                      ...(current.formData || {}),
                                      quantity: nextQuantity,
                                    },
                                  }))
                                }
                                dark={false}
                              />
                            </div>
                          )}

                          {selected && (
                            <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-right">
                              <p className="text-[9px] uppercase tracking-wide text-zinc-400">
                                Estimated
                              </p>

                              <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                                {isCustomUnpricedItem(item)
                                  ? "Custom"
                                  : itemAmount > 0
                                    ? formatCurrency(itemAmount)
                                    : "Configure"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ======================================================
                          SELECTED SERVICE CONFIGURATION
                      ======================================================= */}

                      {selected && item && openServiceIds[serviceId] && (
                        <div className="border-t border-zinc-200 p-4 sm:px-4 py-6">
                          {/* Service description */}

                          {service.description && (
                            <div className="mb-6 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3.5">
                              <p className="text-sm leading-6 text-zinc-500">
                                {service.description}
                              </p>
                            </div>
                          )}

                          {/* Pricing */}

                          {hasServiceLevelPricing && (
                            <div>
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                                  Service options
                                </p>

                                <h3 className="mt-1 text-base font-semibold text-zinc-900">
                                  {isGroupedPricing
                                    ? "Configure your content"
                                    : "Choose an option"}
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                  {isGroupedPricing
                                    ? "Choose the options you need for this service."
                                    : "Select the service package that best fits your project."}
                                </p>
                              </div>

                              {isGroupedPricing ? (
                                <div className="mt-5 space-y-6">
                                  {pricingGroups.map((group) => {
                                    const selectedOption =
                                      item.selectedPricingOptions?.[group.key];

                                    const title = group.name
                                      ? group.name.charAt(0).toUpperCase() +
                                        group.name.slice(1)
                                      : "Options";

                                    return (
                                      <div key={group.key}>
                                        <div className="mb-3">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-medium text-zinc-900">
                                              {title}
                                            </p>

                                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                                              Optional
                                            </span>
                                          </div>

                                          <p className="mt-1 text-xs text-zinc-400">
                                            Optional · Select ONE
                                          </p>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                          {group.options.map((option) => {
                                            const optionSelected =
                                              selectedOption?._id ===
                                              option._id;

                                            const rules = getQuantityRules(
                                              service,
                                              option,
                                            );

                                            const optionQuantity =
                                              optionSelected
                                                ? getGroupedOptionQuantity(
                                                    item,
                                                    group.key,
                                                    option,
                                                  )
                                                : rules.minQuantity;

                                            return (
                                              <div
                                                key={option._id}
                                                className={`
                                                      relative rounded-2xl border p-4
                                                      transition-all duration-200
                                                      ${
                                                        optionSelected
                                                          ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                                                          : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50"
                                                      }
                                                    `}
                                              >
                                                <button
                                                  type="button"
                                                  disabled={submitting}
                                                  onClick={() =>
                                                    handleGroupedPricingOptionChange(
                                                      selectedIndex,
                                                      group.key,
                                                      option,
                                                    )
                                                  }
                                                  className="w-full text-left disabled:cursor-not-allowed"
                                                >
                                                  <div className="flex items-start gap-3">
                                                    <span
                                                      className={`
                                                            mt-0.5 flex h-5 w-5 shrink-0
                                                            items-center justify-center
                                                            rounded-full border
                                                            ${
                                                              optionSelected
                                                                ? "border-white bg-white text-zinc-900"
                                                                : "border-zinc-300 bg-white"
                                                            }
                                                          `}
                                                    >
                                                      {optionSelected && (
                                                        <Check
                                                          size={12}
                                                          strokeWidth={2.5}
                                                        />
                                                      )}
                                                    </span>

                                                    <span className="min-w-0 flex-1">
                                                      <span
                                                        className={`block text-sm font-semibold ${
                                                          optionSelected
                                                            ? "text-white"
                                                            : "text-zinc-900"
                                                        }`}
                                                      >
                                                        {option.name}
                                                      </span>

                                                      {option.description && (
                                                        <span
                                                          className={`mt-1 block text-xs leading-5 ${
                                                            optionSelected
                                                              ? "text-white/50"
                                                              : "text-zinc-500"
                                                          }`}
                                                        >
                                                          {option.description}
                                                        </span>
                                                      )}

                                                      <span
                                                        className={`mt-1.5 block text-xs font-medium ${
                                                          optionSelected
                                                            ? "text-white/70"
                                                            : "text-zinc-500"
                                                        }`}
                                                      >
                                                        {formatCurrency(
                                                          option.price,
                                                        )}{" "}
                                                        /{" "}
                                                        {option.unit || "unit"}
                                                      </span>
                                                    </span>
                                                  </div>
                                                </button>

                                                {optionSelected && (
                                                  <div className="mt-4 border-t border-white/10 pt-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <div>
                                                        <p className="text-[11px] font-medium text-white/50">
                                                          Quantity
                                                        </p>

                                                        <p className="mt-0.5 text-[11px] text-white/35">
                                                          Minimum:{" "}
                                                          {rules.minQuantity}
                                                        </p>
                                                      </div>

                                                      <QuantityControl
                                                        quantity={
                                                          optionQuantity
                                                        }
                                                        minQuantity={
                                                          rules.minQuantity
                                                        }
                                                        maxQuantity={
                                                          rules.maxQuantity
                                                        }
                                                        unit={
                                                          option.unit || "unit"
                                                        }
                                                        dark
                                                        onChange={(
                                                          nextQuantity,
                                                        ) =>
                                                          handleGroupedQuantityChange(
                                                            selectedIndex,
                                                            group.key,
                                                            nextQuantity,
                                                          )
                                                        }
                                                      />
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
                                    const optionSelected =
                                      item.selectedPricingOption?._id ===
                                      option._id;

                                    return (
                                      <button
                                        key={option._id}
                                        type="button"
                                        disabled={submitting}
                                        onClick={() =>
                                          handlePricingOptionChange(
                                            selectedIndex,
                                            option,
                                          )
                                        }
                                        className={`
                                            relative flex w-full items-start gap-4 rounded-2xl
                                            border p-4 text-left transition-all duration-200
                                            sm:p-5
                                            ${
                                              optionSelected
                                                ? "border-zinc-900 bg-zinc-900 shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
                                                : "border-zinc-200 bg-white hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-zinc-50"
                                            }
                                          `}
                                      >
                                        <div
                                          className={`
                                              mt-0.5 flex h-5 w-5 shrink-0
                                              items-center justify-center rounded-full border
                                              ${
                                                optionSelected
                                                  ? "border-white bg-white text-zinc-900"
                                                  : "border-zinc-300 bg-white"
                                              }
                                            `}
                                        >
                                          {optionSelected && (
                                            <Check
                                              size={12}
                                              strokeWidth={2.5}
                                            />
                                          )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <p
                                              className={`text-sm font-semibold ${
                                                optionSelected
                                                  ? "text-white"
                                                  : "text-zinc-900"
                                              }`}
                                            >
                                              {option.name}
                                            </p>

                                            <p
                                              className={`shrink-0 text-sm font-semibold ${
                                                optionSelected
                                                  ? "text-white"
                                                  : "text-zinc-900"
                                              }`}
                                            >
                                              {formatCurrency(option.price)}
                                              {option.unit
                                                ? ` / ${option.unit}`
                                                : ""}
                                            </p>
                                          </div>

                                          {option.description && (
                                            <p
                                              className={`mt-1.5 text-xs leading-5 ${
                                                optionSelected
                                                  ? "text-white/50"
                                                  : "text-zinc-500"
                                              }`}
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
                            </div>
                          )}

                          {/* ==================================================
                              REQUIRED FIELDS
                          =================================================== */}

                          {requiredFields.length > 0 && (
                            <div
                              className={`${
                                hasServiceLevelPricing
                                  ? "mt-7 border-t border-zinc-100 pt-7"
                                  : ""
                              }`}
                            >
                              <div>
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                                  Required details
                                </p>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                  Complete these fields before placing the
                                  order.
                                </p>
                              </div>

                              <div className="mt-6 space-y-6">
                                {requiredFields.map((field) => (
                                  <div key={field.name}>
                                    <DynamicField
                                      field={field}
                                      value={item.formData?.[field.name]}
                                      onChange={(fieldName, value) =>
                                        handleFieldChange(
                                          selectedIndex,
                                          fieldName,
                                          value,
                                        )
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ==================================================
                              OPTIONAL FIELDS
                          =================================================== */}

                          {optionalFields.length > 0 && (
                            <div
                              className={`${
                                hasServiceLevelPricing ||
                                requiredFields.length > 0
                                  ? "mt-7 border-t border-zinc-100 pt-7"
                                  : ""
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  toggleOptionalField(`service:${serviceId}`)
                                }
                                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-left transition hover:border-zinc-300 hover:bg-white"
                              >
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-zinc-900">
                                      Optional details
                                    </p>

                                    <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                                      {optionalFields.length} fields
                                    </span>
                                  </div>

                                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                                    These fields are optional and closed by
                                    default.
                                  </p>
                                </div>

                                {openOptionalFields[`service:${serviceId}`] ? (
                                  <ChevronUp
                                    size={17}
                                    className="shrink-0 text-zinc-400"
                                  />
                                ) : (
                                  <ChevronDown
                                    size={17}
                                    className="shrink-0 text-zinc-400"
                                  />
                                )}
                              </button>

                              {openOptionalFields[`service:${serviceId}`] && (
                                <div className="mt-6 space-y-6 rounded-2xl border border-zinc-100 bg-zinc-50/40 p-4 sm:p-5">
                                  {optionalFields.map((field) => (
                                    <div key={field.name}>
                                      <DynamicField
                                        field={field}
                                        value={item.formData?.[field.name]}
                                        onChange={(fieldName, value) =>
                                          handleFieldChange(
                                            selectedIndex,
                                            fieldName,
                                            value,
                                          )
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ==================================================
                              REPEATABLE GROUPS
                          =================================================== */}

                          {repeatableGroups.length > 0 && (
                            <div
                              className={`${
                                hasServiceLevelPricing ||
                                requiredFields.length > 0 ||
                                optionalFields.length > 0
                                  ? "mt-7 border-t border-zinc-100 pt-7"
                                  : ""
                              }`}
                            >
                              {!isRepeatableOnlyService(item.service) && (
                                <div>
                                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                                    Repeated configurations
                                  </p>

                                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    Add multiple independent configurations where
                                    required.
                                  </p>
                                </div>
                              )}

                              <div className="mt-5 space-y-5">
                                {repeatableGroups.map((group) => (
                                  <RepeatableGroup
                                    key={group.name}
                                    group={group}
                                    service={item.service}
                                    entries={item.formData?.[group.name]}
                                    disabled={submitting}
                                    onAdd={() =>
                                      handleRepeatableAdd(selectedIndex, group)
                                    }
                                    onRemove={(entryIndex) =>
                                      handleRepeatableRemove(
                                        selectedIndex,
                                        group,
                                        entryIndex,
                                      )
                                    }
                                    onFieldChange={(
                                      entryIndex,
                                      fieldName,
                                      value,
                                    ) =>
                                      handleRepeatableFieldChange(
                                        selectedIndex,
                                        group,
                                        entryIndex,
                                        fieldName,
                                        value,
                                      )
                                    }
                                    onPricingOptionChange={(
                                      entryIndex,
                                      pricingGroupName,
                                      option,
                                    ) =>
                                      handleRepeatableEntryPricingOptionChange(
                                        selectedIndex,
                                        group,
                                        entryIndex,
                                        pricingGroupName,
                                        option,
                                      )
                                    }
                                    onPricingQuantityChange={(
                                      entryIndex,
                                      pricingGroupName,
                                      nextQuantity,
                                    ) =>
                                      handleRepeatableEntryPricingQuantityChange(
                                        selectedIndex,
                                        group,
                                        entryIndex,
                                        pricingGroupName,
                                        nextQuantity,
                                      )
                                    }
                                    openOptionalFields={openOptionalFields}
                                    toggleOptionalField={toggleOptionalField}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* No configuration */}

                          {!pricingOptions.length &&
                            !requiredFields.length &&
                            !optionalFields.length &&
                            !repeatableGroups.length && (
                              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center">
                                <p className="text-sm text-zinc-500">
                                  No additional configuration is required for
                                  this service.
                                </p>
                              </div>
                            )}

                          {/* Selected service amount */}

                          <div className="mt-7 flex items-center justify-between gap-4 border-t border-zinc-100 pt-5">
                            <div>
                              <p className="text-xs text-zinc-400">
                                Service estimate
                              </p>

                              <p className="mt-1 text-sm text-zinc-500">
                                {isCustomUnpricedItem(item)
                                  ? "Final pricing will be confirmed."
                                  : "Based on your current selections."}
                              </p>
                            </div>

                            <p className="shrink-0 text-lg font-semibold text-zinc-900">
                              {isCustomUnpricedItem(item)
                                ? "Custom"
                                : formatCurrency(itemAmount)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {loadingServiceId && (
                <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 size={13} className="animate-spin" />
                  Loading service configuration...
                </div>
              )}
            </section>

            {/* ==============================================================
                GLOBAL ADDITIONAL REQUIREMENTS
            ============================================================== */}

            {orderItems.length > 0 && (
              <>
                <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                    Step 2
                  </p>

                  <h2 className="mt-1.5 text-lg font-semibold text-zinc-900">
                    Additional requirements
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                    Optional instructions that apply to the complete order.
                  </p>

                  <textarea
                    value={additionalRequirements}
                    onChange={(event) =>
                      setAdditionalRequirements(event.target.value)
                    }
                    rows={5}
                    placeholder="Is there anything else you'd like us to know?"
                    className="mt-5 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm leading-6 text-zinc-900 outline-none transition-all duration-200 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white focus:ring-4 focus:ring-zinc-900/[0.04]"
                  />

                  <p className="mt-2 text-xs text-zinc-400">
                    Mention special instructions, references, deadlines,
                    preferences or anything else relevant to your order.
                  </p>
                </section>

                {/* ==========================================================
                    PAYMENT
                =========================================================== */}

                <section className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,0.04)] sm:p-7">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                    Step 3
                  </p>

                  <h2 className="mt-1.5 text-lg font-semibold text-zinc-900">
                    Payment method
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                    Choose how you'd like to complete the payment.
                  </p>

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
                      description={
                        hasCustomUnpricedService
                          ? "Available when the order has a payable amount."
                          : `Secure Razorpay payment · ${ONLINE_GST_RATE}% GST`
                      }
                      disabled={hasCustomUnpricedService && subtotal <= 0}
                    />
                  </div>

                  {paymentMethod === "online" && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3.5">
                      <Info
                        size={15}
                        className="mt-0.5 shrink-0 text-zinc-400"
                      />

                      <p className="text-xs leading-5 text-zinc-500">
                        Online payments include {ONLINE_GST_RATE}% GST on the
                        order subtotal. Cash on Delivery currently uses 0% GST
                        in the order calculation.
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* ================================================================
              RIGHT SUMMARY
          ================================================================= */}

          <aside className="min-w-0">
            <div className="sticky top-6">
              {orderItems.length === 0 ? (
                <section className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-6 sm:p-7">
                  <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-300">
                      <CreditCard size={20} />
                    </div>

                    <h2 className="mt-4 text-base font-semibold text-zinc-800">
                      Your order summary
                    </h2>

                    <p className="mt-2 max-w-[260px] text-sm leading-6 text-zinc-400">
                      Select one or more services to see your configuration and
                      pricing summary here.
                    </p>
                  </div>
                </section>
              ) : (
                <section className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">
                          Order summary
                        </p>

                        <h2 className="mt-1.5 text-lg font-semibold text-white">
                          {orderItems.length}{" "}
                          {orderItems.length === 1 ? "service" : "services"}
                        </h2>
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60">
                        <CreditCard size={16} />
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {orderItems.map((item, index) => {
                        const itemAmount = itemEstimates[index] || 0;

                        const selectedOptions = item.isGroupedPricing
                          ? Object.values(
                              item.selectedPricingOptions || {},
                            ).filter(Boolean)
                          : item.selectedPricingOption
                            ? [item.selectedPricingOption]
                            : [];

                        const quantityInfo = getQuantityInfo(item);

                        return (
                          <button
                            type="button"
                            key={item.service._id}
                            onClick={() => setActiveServiceIndex(index)}
                            className={`
                                w-full rounded-2xl border p-3.5 text-left
                                transition-all duration-200
                                ${
                                  index === activeServiceIndex
                                    ? "border-white/20 bg-white/10"
                                    : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
                                }
                              `}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wide text-white/35">
                                  Service {index + 1}
                                </p>

                                <p className="mt-1 truncate text-sm font-medium text-white">
                                  {item.service.name}
                                </p>

                                {quantityInfo.hasQuantity && (
                                  <p className="mt-1 text-[10px] text-white/30">
                                    Qty {quantityInfo.quantity}
                                  </p>
                                )}
                              </div>

                              <p className="shrink-0 text-sm font-medium text-white">
                                {isCustomUnpricedItem(item)
                                  ? "Custom"
                                  : formatCurrency(itemAmount)}
                              </p>
                            </div>

                            {selectedOptions.length > 0 && (
                              <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                                {selectedOptions.map((option) => {
                                  const groupKey =
                                    String(option.group || "").trim() ||
                                    "__ungrouped__";

                                  const optionQuantity = item.isGroupedPricing
                                    ? getGroupedOptionQuantity(
                                        item,
                                        groupKey,
                                        option,
                                      )
                                    : getItemQuantity(item);

                                  return (
                                    <div
                                      key={option._id}
                                      className="flex items-center justify-between gap-3"
                                    >
                                      <p className="min-w-0 truncate text-xs text-white/50">
                                        {option.name}
                                      </p>

                                      <p className="shrink-0 text-[11px] text-white/35">
                                        {optionQuantity} ×{" "}
                                        {formatCurrency(option.price)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {getSelectedFieldsPrice(item) > 0 && (
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <p className="text-[11px] text-white/35">
                                  Selected add-ons
                                </p>

                                <p className="text-[11px] text-white/50">
                                  +
                                  {formatCurrency(getSelectedFieldsPrice(item))}
                                </p>
                              </div>
                            )}

                            {getRepeatableGroupsPrice(item) > 0 && (
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <p className="text-[11px] text-white/35">
                                  Repeated add-ons
                                </p>

                                <p className="text-[11px] text-white/50">
                                  +
                                  {formatCurrency(
                                    getRepeatableGroupsPrice(item),
                                  )}
                                </p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs text-white/40">Subtotal</p>

                        <p className="text-sm font-medium text-white">
                          {formatCurrency(subtotal)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs text-white/40">GST</p>

                          <p className="mt-0.5 text-[10px] text-white/25">
                            {paymentMethod === "online"
                              ? `${ONLINE_GST_RATE}% on subtotal`
                              : "0% for COD"}
                          </p>
                        </div>

                        <p className="text-sm font-medium text-white">
                          {formatCurrency(gstAmount)}
                        </p>
                      </div>

                      <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-5">
                        <div>
                          <p className="text-xs text-white/40">
                            Estimated total
                          </p>

                          {hasCustomUnpricedService && (
                            <p className="mt-1 text-[11px] leading-4 text-white/30">
                              Final pricing will be confirmed by our team.
                            </p>
                          )}
                        </div>

                        <p className="shrink-0 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                          {hasCustomUnpricedService
                            ? "Custom"
                            : formatCurrency(estimatedTotal)}
                        </p>
                      </div>
                    </div>

                    {error && (
                      <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3">
                        <p className="text-xs leading-5 text-red-300">
                          {error}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        Boolean(loadingServiceId) ||
                        !orderItems.length ||
                        (paymentMethod === "online" && estimatedTotal <= 0)
                      }
                      className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white bg-white px-5 py-3.5 text-sm font-semibold text-zinc-900 shadow-[0_8px_25px_rgba(255,255,255,0.08)] transition-all duration-300 ease-out hover:bg-zinc-100 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <span>
                            {paymentMethod === "online"
                              ? "Continue to payment"
                              : "Place order"}
                          </span>

                          <ArrowRight
                            size={17}
                            className="transition-transform duration-200 group-hover:translate-x-0.5"
                          />
                        </>
                      )}
                    </button>

                    <p className="mt-3 text-center text-[11px] leading-5 text-white/30">
                      {paymentMethod === "online"
                        ? "You will be redirected to secure Razorpay Checkout."
                        : "Your order details will be reviewed and processed securely."}
                    </p>
                  </div>
                </section>
              )}
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
};

export default NewOrder;
