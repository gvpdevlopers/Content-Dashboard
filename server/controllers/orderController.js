const { normalizeServiceId } = require("../utils/serviceIdentity");
const { canClientOrderService } = require("../utils/serviceAccess");
const { changeOrderStatus } = require("../utils/adCreditCancellation");
const { quoteCredit, spendCredit } = require("../utils/adCredit");
const crypto = require("crypto");
const { pinIsLocked } = require("../utils/pinPolicy");
const { acquireLock } = require("../utils/requestLock");
const Order = require("../models/Order");
const { supportsServiceDelivery } = require("../config/serviceDelivery");
const Service = require("../models/Service");
const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const CouponClientUsage = require("../models/CouponClientUsage");
const OrderDraft = require("../models/OrderDraft");
const mongoose = require("mongoose");
const generateOrderNumber = require("../utils/generateOrderNumber");
const normalizeAdsService = require("../utils/normalizeAdsService");
const {
  resolveGridPostPricingMode,
} = require("../utils/gridPostPricing");
const {
  getGstRate,
  getPaymentPricingConfig,
  calculateOrderTotals,
} = require("../utils/orderPricing");

/* =========================================================
   BASIC HELPERS
========================================================= */

const isEmptyValue = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
};

const getPaymentPricing = async (req, res) => {
  return res.status(200).json({
    success: true,
    gstRates: getPaymentPricingConfig(),
    allowMonthEndPayment: req.user?.role === "client" && req.user.allowMonthEndPayment === true,
  });
};

const rejectIneligibleMonthEnd = (req, res) => {
  if (req.body?.paymentMethod !== "month_end") return false;
  if (req.user?.role === "client" && req.user.allowMonthEndPayment === true) return false;
  res.status(403).json({ success: false, code: "MONTH_END_NOT_ALLOWED",
    message: "Pay on Month-End is not enabled for your account. Choose another payment method." });
  return true;
};

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const roundCurrency = (value) => {
  return (
    Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100
  );
};

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};

/* =========================================================
   FIELD VALIDATION
========================================================= */

const validateFieldValue = (field, value) => {
  if (!field) {
    return null;
  }

  if (field.type === "checkbox") {
    if (Array.isArray(value)) {
      if (field.required && value.length === 0) {
        return `${field.label} is required.`;
      }

      const allowedValues = (field.options || []).map(
        (option) => String(option.value),
      );

      const invalidValue = value.some(
        (item) => !allowedValues.includes(String(item)),
      );

      if (invalidValue) {
        return `${field.label} has an invalid selection.`;
      }

      return null;
    }

    if (field.required && value !== true) {
      return `${field.label} is required.`;
    }

    if (value !== true && value !== false) {
      return `${field.label} must be selected or deselected.`;
    }

    return null;
  }

  if (field.required && isEmptyValue(value)) {
    return `${field.label} is required.`;
  }

  if (isEmptyValue(value)) {
    return null;
  }

  switch (field.type) {
    case "number": {
      const numberValue = Number(value);

      if (!Number.isFinite(numberValue)) {
        return `${field.label} must be a valid number.`;
      }

      if (
        field.min !== undefined &&
        field.min !== null &&
        numberValue < Number(field.min)
      ) {
        return `${field.label} must be at least ${field.min}.`;
      }

      if (
        field.max !== undefined &&
        field.max !== null &&
        numberValue > Number(field.max)
      ) {
        return `${field.label} must not exceed ${field.max}.`;
      }

      if (
        field.step !== undefined &&
        field.step !== null &&
        Number(field.step) > 0
      ) {
        const remainder =
          numberValue % Number(field.step);

        if (Math.abs(remainder) > 0.000001) {
          return `${field.label} must use increments of ${field.step}.`;
        }
      }

      break;
    }

    case "select":
    case "radio": {
      const allowedValues = (field.options || []).map(
        (option) => String(option.value),
      );

      if (!allowedValues.includes(String(value))) {
        return `${field.label} has an invalid selection.`;
      }

      break;
    }

    case "url": {
      try {
        const url = new URL(String(value));

        if (!["http:", "https:"].includes(url.protocol)) {
          return `${field.label} must be a valid URL.`;
        }
      } catch {
        return `${field.label} must be a valid URL.`;
      }

      break;
    }

    case "date": {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return `${field.label} must be a valid date.`;
      }

      break;
    }

    default:
      break;
  }

  return null;
};

const validateFormData = (
  serviceFields = [],
  formData = {},
) => {
  const errors = {};

  for (const field of serviceFields) {
    if (!field?.name) {
      continue;
    }

    const error = validateFieldValue(
      field,
      formData[field.name],
    );

    if (error) {
      errors[field.name] = error;
    }
  }

  return errors;
};

/* =========================================================
   PRICING HELPERS
========================================================= */

const getActivePricingOptions = (service) => {
  return Array.isArray(service?.pricingOptions)
    ? service.pricingOptions.filter(
        (option) => option && option.isActive !== false,
      )
    : [];
};

const findPricingOption = (
  service,
  pricingOptionId,
) => {
  if (!pricingOptionId) {
    return null;
  }

  return (
    getActivePricingOptions(service).find(
      (option) =>
        option._id &&
        String(option._id) === String(pricingOptionId),
    ) || null
  );
};

const findPricingOptionByGroupValue = (
  service,
  group,
  value,
) => {
  if (isEmptyValue(group) || isEmptyValue(value)) {
    return null;
  }

  const normalizedGroup =
    normalizeString(group).toLowerCase();

  const normalizedValue =
    normalizeString(value).toLowerCase();

  return (
    getActivePricingOptions(service).find(
      (option) => {
        if (
          normalizeString(option.group).toLowerCase() !==
          normalizedGroup
        ) {
          return false;
        }

        const optionName =
          normalizeString(option.name).toLowerCase();

        const optionId = String(
          option._id || "",
        ).toLowerCase();

        return (
          optionName === normalizedValue ||
          optionId === normalizedValue
        );
      },
    ) || null
  );
};

/* =========================================================
   NORMAL GROUPED PRICING
========================================================= */

const resolveGroupedPricingOptions = (
  service,
  formData = {},
) => {
  const groups = {};
  const selectedOptions = [];

  for (const option of getActivePricingOptions(service)) {
    const group = normalizeString(option.group);

    if (!group) {
      continue;
    }

    if (!groups[group]) {
      groups[group] = [];
    }

    groups[group].push(option);
  }

  for (const [group, options] of Object.entries(groups)) {
    const selectedValue = formData[group];

    if (
      selectedValue === undefined ||
      selectedValue === null ||
      selectedValue === "" ||
      selectedValue === false
    ) {
      continue;
    }

    const values = Array.isArray(selectedValue)
      ? selectedValue
      : [selectedValue];

    for (const value of values) {
      if (isEmptyValue(value)) {
        continue;
      }

      const normalizedValue =
        normalizeString(value).toLowerCase();

      const matchedOption = options.find(
        (option) => {
          const optionName =
            normalizeString(option.name).toLowerCase();

          const optionId =
            String(option._id || "").toLowerCase();

          return (
            optionName === normalizedValue ||
            optionId === normalizedValue
          );
        },
      );

      if (!matchedOption) {
        throw new Error(
          `Invalid pricing option selected for group "${group}".`,
        );
      }

      if (
        !selectedOptions.some(
          (option) =>
            String(option._id) ===
            String(matchedOption._id),
        )
      ) {
        selectedOptions.push(matchedOption);
      }
    }
  }

  return selectedOptions;
};

const resolveGroupedPricingQuantities = (
  selectedOptions,
  formData = {},
) => {
  const source =
    formData.pricingQuantities || {};

  if (!isPlainObject(source)) {
    throw new Error(
      "Pricing quantities must be an object.",
    );
  }

  const resolved = {};

  for (const option of selectedOptions) {
    const group = normalizeString(option.group);

    if (!group) {
      continue;
    }

    const rawQuantity = source[group];

    const quantity =
      rawQuantity === undefined ||
      rawQuantity === null ||
      rawQuantity === ""
        ? Number(option.minQuantity || 1)
        : Number(rawQuantity);

    if (!Number.isInteger(quantity)) {
      throw new Error(
        `Quantity for "${option.name}" must be a whole number.`,
      );
    }

    const minQuantity = Number(
      option.minQuantity || 1,
    );

    const maxQuantity =
      option.maxQuantity !== undefined &&
      option.maxQuantity !== null
        ? Number(option.maxQuantity)
        : undefined;

    if (quantity < minQuantity) {
      throw new Error(
        `"${option.name}" requires a minimum quantity of ${minQuantity}.`,
      );
    }

    if (
      maxQuantity !== undefined &&
      quantity > maxQuantity
    ) {
      throw new Error(
        `"${option.name}" allows a maximum quantity of ${maxQuantity}.`,
      );
    }

    resolved[group] = quantity;
  }

  return resolved;
};

/* =========================================================
   PRICING SELECTION RESOLUTION
========================================================= */

const resolvePricingSelections = ({
  service,
  pricingOptionId,
  formData,
}) => {
  const errors = [];

  if (pricingOptionId) {
    const pricingOption = findPricingOption(
      service,
      pricingOptionId,
    );

    if (!pricingOption) {
      errors.push(
        "Selected pricing option is not available.",
      );

      return {
        errors,
        pricingOption: null,
        selectedOptions: [],
      };
    }

    return {
      errors,
      pricingOption,
      selectedOptions: [pricingOption],
    };
  }

  const hasGroupedPricing =
    getActivePricingOptions(service).some(
      (option) =>
        normalizeString(option.group) !== "",
    );

  if (!hasGroupedPricing) {
    return {
      errors,
      pricingOption: null,
      selectedOptions: [],
    };
  }

  try {
    return {
      errors,
      pricingOption: null,
      selectedOptions:
        resolveGroupedPricingOptions(
          service,
          formData,
        ),
    };
  } catch (error) {
    return {
      errors: [error.message],
      pricingOption: null,
      selectedOptions: [],
    };
  }
};

/* =========================================================
   APPLICABLE FIELDS
========================================================= */

const getApplicableFields = (
  service,
  selectedOptions = [],
) => {
  const fields = new Map();

  for (const field of service.fields || []) {
    if (!field?.name) {
      continue;
    }

    fields.set(
      String(field.name).trim(),
      field,
    );
  }

  for (const option of selectedOptions) {
    for (const field of option.fields || []) {
      if (!field?.name) {
        continue;
      }

      fields.set(
        String(field.name).trim(),
        field,
      );
    }
  }

  return Array.from(fields.values()).sort(
    (a, b) =>
      Number(a.order || 0) -
      Number(b.order || 0),
  );
};

/* =========================================================
   QUANTITY
========================================================= */

const validateQuantity = (quantity) => {
  const parsed = Number(quantity);

  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return null;
  }

  return parsed;
};

const validateQuantityRules = ({
  service,
  selectedOptions,
  quantity,
  groupedQuantities,
  isGroupedPricing,
}) => {
  if (isGroupedPricing) {
    for (const option of selectedOptions) {
      const group = normalizeString(option.group);

      if (!group) {
        continue;
      }

      const optionQuantity =
        groupedQuantities[group];

      if (optionQuantity === undefined) {
        throw new Error(
          `Quantity is missing for pricing option "${option.name}".`,
        );
      }

      const minQuantity = Number(
        option.minQuantity || 1,
      );

      const maxQuantity =
        option.maxQuantity !== undefined &&
        option.maxQuantity !== null
          ? Number(option.maxQuantity)
          : undefined;

      if (!Number.isInteger(optionQuantity)) {
        throw new Error(
          `Quantity for "${option.name}" must be a whole number.`,
        );
      }

      if (optionQuantity < minQuantity) {
        throw new Error(
          `"${option.name}" requires a minimum quantity of ${minQuantity}.`,
        );
      }

      if (
        maxQuantity !== undefined &&
        optionQuantity > maxQuantity
      ) {
        throw new Error(
          `"${option.name}" allows a maximum quantity of ${maxQuantity}.`,
        );
      }
    }

    return;
  }

  const parsedQuantity = Number(quantity);

  if (
    !Number.isInteger(parsedQuantity) ||
    parsedQuantity < 1
  ) {
    throw new Error(
      "Quantity must be a whole number greater than 0.",
    );
  }

  const serviceMin = Number(
    service.minQuantity || 1,
  );

  const serviceMax =
    service.maxQuantity !== undefined &&
    service.maxQuantity !== null
      ? Number(service.maxQuantity)
      : undefined;

  if (parsedQuantity < serviceMin) {
    throw new Error(
      `Minimum quantity for this service is ${serviceMin}.`,
    );
  }

  if (
    serviceMax !== undefined &&
    parsedQuantity > serviceMax
  ) {
    throw new Error(
      `Maximum quantity for this service is ${serviceMax}.`,
    );
  }

  for (const option of selectedOptions) {
    const minQuantity = Number(
      option.minQuantity || 1,
    );

    const maxQuantity =
      option.maxQuantity !== undefined &&
      option.maxQuantity !== null
        ? Number(option.maxQuantity)
        : undefined;

    if (parsedQuantity < minQuantity) {
      throw new Error(
        `"${option.name}" requires a minimum quantity of ${minQuantity}.`,
      );
    }

    if (
      maxQuantity !== undefined &&
      parsedQuantity > maxQuantity
    ) {
      throw new Error(
        `"${option.name}" allows a maximum quantity of ${maxQuantity}.`,
      );
    }
  }
};

/* =========================================================
   FIELD OPTION PRICING
========================================================= */

const calculateFieldOptionPrice = (
  field,
  value,
) => {
  if (
    field?.includeValueInPrice &&
    !isEmptyValue(value)
  ) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue)
      ? numericValue
      : 0;
  }

  if (
    !field ||
    !Array.isArray(field.options) ||
    isEmptyValue(value)
  ) {
    return 0;
  }

  if (Array.isArray(value)) {
    return value.reduce(
      (total, selectedValue) => {
        const option = field.options.find(
          (item) =>
            String(item.value) ===
            String(selectedValue),
        );

        return (
          total +
          Number(option?.price || 0)
        );
      },
      0,
    );
  }

  if (
    field.type === "checkbox" &&
    typeof value === "boolean"
  ) {
    if (!value) {
      return 0;
    }

    const option = field.options.find(
      (item) =>
        String(item.value).toLowerCase() ===
        "true",
    );

    return Number(option?.price || 0);
  }

  const option = field.options.find(
    (item) =>
      String(item.value) ===
      String(value),
  );

  return Number(option?.price || 0);
};

const calculateFieldOptionsAmount = (
  fields,
  formData = {},
) => {
  return (fields || []).reduce(
    (total, field) =>
      total +
      calculateFieldOptionPrice(
        field,
        formData[field.name],
      ),
    0,
  );
};

/* =========================================================
   REPEATABLE GROUP HELPERS
========================================================= */

const getRepeatableGroups = (service) => {
  return Array.isArray(service?.repeatableGroups)
    ? service.repeatableGroups.filter(
        (group) =>
          group &&
          group.isActive !== false,
      )
    : [];
};

const getRepeatableGroup = (
  service,
  groupName,
) => {
  const normalizedName =
    normalizeString(groupName).toLowerCase();

  return (
    getRepeatableGroups(service).find(
      (group) =>
        normalizeString(group.name).toLowerCase() ===
        normalizedName,
    ) || null
  );
};

const getRepeatablePricingSelections = (
  item,
  group,
) => {
  if (!isPlainObject(item)) {
    throw new Error(
      `"${group.label || group.name}" item must be an object.`,
    );
  }

  if (
    item.pricingOptions !== undefined &&
    item.pricingOptions !== null &&
    !isPlainObject(item.pricingOptions)
  ) {
    throw new Error(
      `"${group.label || group.name}" pricingOptions must be an object.`,
    );
  }

  return item.pricingOptions || {};
};

/* =========================================================
   REPEATABLE PRICING RESOLUTION
========================================================= */

const resolveRepeatablePricingOptions = (
  service,
  group,
  item,
) => {
  const selectedPricing =
    getRepeatablePricingSelections(
      item,
      group,
    );

  const selectedOptions = [];
  const errors = [];

  const pricingGroups = Array.isArray(
    group.pricingGroups,
  )
    ? group.pricingGroups
    : [];

  const requiredPricingGroups =
    Array.isArray(group.requiredPricingGroups)
      ? group.requiredPricingGroups
      : [];

  const configuredGroups = new Set(
    pricingGroups
      .map((value) =>
        normalizeString(value).toLowerCase(),
      )
      .filter(Boolean),
  );

  /*
  |--------------------------------------------------------------------------
  | Validate requiredPricingGroups configuration
  |--------------------------------------------------------------------------
  */

  for (const requiredGroupRaw of requiredPricingGroups) {
    const requiredGroup =
      normalizeString(requiredGroupRaw);

    if (!requiredGroup) {
      errors.push(
        `"${group.label || group.name}" contains an empty required pricing group.`,
      );
      continue;
    }

    if (
      !configuredGroups.has(
        requiredGroup.toLowerCase(),
      )
    ) {
      errors.push(
        `"${group.label || group.name}" required pricing group "${requiredGroup}" must also be included in pricingGroups.`,
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Resolve each configured pricing group
  |--------------------------------------------------------------------------
  */

  for (const pricingGroupRaw of pricingGroups) {
    const pricingGroup =
      normalizeString(pricingGroupRaw);

    if (!pricingGroup) {
      continue;
    }

    const normalizedGroup =
      pricingGroup.toLowerCase();

    const selectedValue =
      selectedPricing[pricingGroup] ??
      item[pricingGroup];

    const isRequired =
      requiredPricingGroups.some(
        (requiredGroup) =>
          normalizeString(requiredGroup).toLowerCase() ===
          normalizedGroup,
      );

    /*
    |--------------------------------------------------------------------------
    | Required group missing
    |--------------------------------------------------------------------------
    */

    if (
      selectedValue === undefined ||
      selectedValue === null ||
      selectedValue === "" ||
      selectedValue === false
    ) {
      if (isRequired) {
        errors.push(
          `Pricing selection for required group "${pricingGroup}" is required for ${group.label || group.name}.`,
        );
      }

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Only one pricing option per pricing group
    |--------------------------------------------------------------------------
    */

    if (Array.isArray(selectedValue)) {
      if (selectedValue.length > 1) {
        errors.push(
          `Only one pricing option can be selected for pricing group "${pricingGroup}".`,
        );
        continue;
      }

      if (selectedValue.length === 0) {
        if (isRequired) {
          errors.push(
            `Pricing selection for required group "${pricingGroup}" is required.`,
          );
        }

        continue;
      }
    }

    const value = Array.isArray(selectedValue)
      ? selectedValue[0]
      : selectedValue;

    const option =
      findPricingOptionByGroupValue(
        service,
        pricingGroup,
        value,
      );

    if (!option) {
      errors.push(
        `Invalid pricing option selected for group "${pricingGroup}".`,
      );
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Ensure selected option actually belongs to group
    |--------------------------------------------------------------------------
    */

    if (
      normalizeString(option.group).toLowerCase() !==
      normalizedGroup
    ) {
      errors.push(
        `Selected pricing option does not belong to group "${pricingGroup}".`,
      );
      continue;
    }

    selectedOptions.push(option);
  }

  /*
  |--------------------------------------------------------------------------
  | Final required-group verification
  |--------------------------------------------------------------------------
  */

  for (const requiredGroupRaw of requiredPricingGroups) {
    const requiredGroup =
      normalizeString(requiredGroupRaw);

    if (!requiredGroup) {
      continue;
    }

    const hasSelection =
      selectedOptions.some(
        (option) =>
          normalizeString(option.group).toLowerCase() ===
          requiredGroup.toLowerCase(),
      );

    if (!hasSelection) {
      errors.push(
        `Pricing selection for required group "${requiredGroup}" is required.`,
      );
    }
  }

  return {
    selectedOptions,
    errors,
  };
};

/* =========================================================
   REPEATABLE PRICING QUANTITIES
========================================================= */

const resolveRepeatablePricingQuantities = (
  selectedOptions,
  item,
) => {
  const source =
    item?.pricingQuantities || {};

  if (!isPlainObject(source)) {
    throw new Error(
      "Repeatable pricing quantities must be an object.",
    );
  }

  const resolved = {};

  for (const option of selectedOptions) {
    const group =
      normalizeString(option.group);

    if (!group) {
      continue;
    }

    const rawQuantity =
      source[group];

    const quantity =
      rawQuantity === undefined ||
      rawQuantity === null ||
      rawQuantity === ""
        ? Number(option.minQuantity || 1)
        : Number(rawQuantity);

    if (!Number.isInteger(quantity)) {
      throw new Error(
        `Quantity for "${option.name}" must be a whole number.`,
      );
    }

    const minQuantity = Number(
      option.minQuantity || 1,
    );

    const maxQuantity =
      option.maxQuantity !== undefined &&
      option.maxQuantity !== null
        ? Number(option.maxQuantity)
        : undefined;

    if (quantity < minQuantity) {
      throw new Error(
        `"${option.name}" requires a minimum quantity of ${minQuantity}.`,
      );
    }

    if (
      maxQuantity !== undefined &&
      quantity > maxQuantity
    ) {
      throw new Error(
        `"${option.name}" allows a maximum quantity of ${maxQuantity}.`,
      );
    }

    resolved[group] = quantity;
  }

  return resolved;
};

/* =========================================================
   REPEATABLE ITEM FIELDS
========================================================= */

const getRepeatableItemFields = (
  group,
  selectedOptions = [],
) => {
  const fields = new Map();
  const seenLabels = new Set();

  for (const field of group.fields || []) {
    if (!field?.name) {
      continue;
    }

    const fieldName = String(field.name).trim();

    fields.set(fieldName, field);
    seenLabels.add(
      String(field.label || field.name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ""),
    );
  }

  for (const option of selectedOptions) {
    for (const field of option.fields || []) {
      if (!field?.name) {
        continue;
      }

      const fieldName = String(field.name).trim();
      const normalizedLabel = String(field.label || field.name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      if (fields.has(fieldName) || seenLabels.has(normalizedLabel)) {
        continue;
      }

      fields.set(fieldName, field);
      seenLabels.add(normalizedLabel);
    }
  }

  return Array.from(fields.values()).sort(
    (a, b) =>
      Number(a.order || 0) -
      Number(b.order || 0),
  );
};

/* =========================================================
   REPEATABLE GROUP VALIDATION
========================================================= */

const validateRepeatableGroups = (
  service,
  formData = {},
) => {
  const errors = {};
  const groups = getRepeatableGroups(service);

  for (const group of groups) {
    const groupName =
      normalizeString(group.name);

    if (!groupName) {
      continue;
    }

    const items =
      formData[groupName];

    const minItems = Number(
      group.minItems ?? 0,
    );

    const maxItems =
      group.maxItems !== undefined &&
      group.maxItems !== null
        ? Number(group.maxItems)
        : undefined;

    if (items === undefined) {
      if (minItems > 0) {
        errors[groupName] =
          `${group.label || groupName} requires at least ${minItems} item(s).`;
      }

      continue;
    }

    if (!Array.isArray(items)) {
      errors[groupName] =
        `${group.label || groupName} must be an array.`;
      continue;
    }

    if (items.length < minItems) {
      errors[groupName] =
        `${group.label || groupName} requires at least ${minItems} item(s).`;
      continue;
    }

    if (
      maxItems !== undefined &&
      items.length > maxItems
    ) {
      errors[groupName] =
        `${group.label || groupName} allows a maximum of ${maxItems} item(s).`;
      continue;
    }

    const itemErrors = {};

    for (
      let index = 0;
      index < items.length;
      index += 1
    ) {
      const item = items[index];

      if (!isPlainObject(item)) {
        itemErrors[index] =
          "Repeatable item must be an object.";
        continue;
      }

      let resolved;

      try {
        resolved =
          resolveRepeatablePricingOptions(
            service,
            group,
            item,
          );
      } catch (error) {
        itemErrors[index] =
          error.message;
        continue;
      }

      if (resolved.errors.length > 0) {
        itemErrors[index] =
          resolved.errors.join(" ");
        continue;
      }

      let pricingQuantities;

      try {
        pricingQuantities =
          resolveRepeatablePricingQuantities(
            resolved.selectedOptions,
            item,
          );
      } catch (error) {
        itemErrors[index] =
          error.message;
        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | Validate repeatable fields
      |--------------------------------------------------------------------------
      */

      const sourceFields =
        isPlainObject(item.fields)
          ? item.fields
          : item;

      const applicableFields =
        getRepeatableItemFields(
          group,
          resolved.selectedOptions,
        );

      const fieldErrors =
        validateFormData(
          applicableFields,
          sourceFields,
        );

      if (Object.keys(fieldErrors).length > 0) {
        itemErrors[index] = {
          ...(itemErrors[index] || {}),
          fields: fieldErrors,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | Keep resolved quantities referenced so validation
      | is performed even if no field errors exist.
      |--------------------------------------------------------------------------
      */

      if (
        pricingQuantities &&
        Object.keys(pricingQuantities).length === 0 &&
        resolved.selectedOptions.length > 0
      ) {
        itemErrors[index] =
          itemErrors[index] ||
          "Unable to resolve repeatable pricing quantities.";
      }
    }

    if (Object.keys(itemErrors).length > 0) {
      errors[groupName] = itemErrors;
    }
  }

  return errors;
};

/* =========================================================
   CLEAN NORMAL FORM DATA
========================================================= */

const cleanNormalFormData = (
  fields,
  formData = {},
) => {
  const cleaned = {};

  for (const field of fields || []) {
    if (!field?.name) {
      continue;
    }

    const name =
      String(field.name).trim();

    if (!name) {
      continue;
    }

    const value =
      formData[name];

    if (
      value !== undefined &&
      value !== null
    ) {
      cleaned[name] = value;
    }
  }

  return cleaned;
};

/* =========================================================
   CLEAN REPEATABLE DATA
========================================================= */

const cleanRepeatableGroupData = (
  service,
  formData = {},
) => {
  const cleaned = {};

  for (const group of getRepeatableGroups(service)) {
    const groupName =
      normalizeString(group.name);

    if (!groupName) {
      continue;
    }

    const items =
      formData[groupName];

    if (!Array.isArray(items)) {
      continue;
    }

    cleaned[groupName] =
      items.map((item) => {
        const resolved =
          resolveRepeatablePricingOptions(
            service,
            group,
            item,
          );

        const selectedOptions =
          resolved.selectedOptions;

        const cleanedItem = {};

        /*
        |--------------------------------------------------------------------------
        | Pricing options
        |--------------------------------------------------------------------------
        */

        const pricingOptions = {};

        for (const groupNameRaw of
          group.pricingGroups || []) {
          const pricingGroup =
            normalizeString(groupNameRaw);

          if (!pricingGroup) {
            continue;
          }

          const selectedValue =
            item?.pricingOptions?.[
              pricingGroup
            ] ??
            item?.[
              pricingGroup
            ];

          if (
            selectedValue !== undefined &&
            selectedValue !== null &&
            selectedValue !== ""
          ) {
            pricingOptions[
              pricingGroup
            ] = Array.isArray(
              selectedValue,
            )
              ? selectedValue[0]
              : selectedValue;
          }
        }

        if (
          Object.keys(pricingOptions).length > 0
        ) {
          cleanedItem.pricingOptions =
            pricingOptions;
        }

        /*
        |--------------------------------------------------------------------------
        | Pricing quantities
        |--------------------------------------------------------------------------
        */

        const pricingQuantities =
          resolveRepeatablePricingQuantities(
            selectedOptions,
            item,
          );

        if (
          Object.keys(pricingQuantities).length > 0
        ) {
          cleanedItem.pricingQuantities =
            pricingQuantities;
        }

        /*
        |--------------------------------------------------------------------------
        | Fields
        |--------------------------------------------------------------------------
        */

        const sourceFields =
          isPlainObject(item?.fields)
            ? item.fields
            : item;

        const applicableFields =
          getRepeatableItemFields(
            group,
            selectedOptions,
          );

        const cleanedFields = {};

        for (const field of applicableFields) {
          if (!field?.name) {
            continue;
          }

          const name =
            String(field.name).trim();

          if (
            sourceFields[name] !== undefined &&
            sourceFields[name] !== null
          ) {
            cleanedFields[name] =
              sourceFields[name];
          }
        }

        if (
          Object.keys(cleanedFields).length > 0
        ) {
          cleanedItem.fields =
            cleanedFields;
        }

        return cleanedItem;
      });
  }

  return cleaned;
};

/* =========================================================
   CLEAN COMPLETE FORM DATA
========================================================= */

const cleanFormData = (
  service,
  applicableFields,
  formData = {},
) => {
  const cleaned = cleanNormalFormData(
    applicableFields,
    formData,
  );

  const repeatableData =
    cleanRepeatableGroupData(
      service,
      formData,
    );

  Object.assign(
    cleaned,
    repeatableData,
  );

  return cleaned;
};

/* =========================================================
   REPEATABLE GROUP AMOUNT
========================================================= */

const calculateRepeatableGroupsAmount = (
  service,
  formData = {},
) => {
  let total = 0;

  for (const group of getRepeatableGroups(service)) {
    const groupName =
      normalizeString(group.name);

    const items =
      formData[groupName];

    if (!Array.isArray(items)) {
      continue;
    }

    for (const item of items) {
      const {
        selectedOptions,
        errors,
      } = resolveRepeatablePricingOptions(
        service,
        group,
        item,
      );

      if (errors.length > 0) {
        throw new Error(
          errors.join(" "),
        );
      }

      const pricingQuantities =
        resolveRepeatablePricingQuantities(
          selectedOptions,
          item,
        );

      for (const option of selectedOptions) {
        const pricingGroup =
          normalizeString(option.group);

        const quantity =
          pricingQuantities[
            pricingGroup
          ] ??
          Number(
            option.minQuantity || 1,
          );

        total +=
          Number(option.price || 0) *
          Number(quantity);
      }

      const sourceFields =
        isPlainObject(item.fields)
          ? item.fields
          : item;

      const applicableFields =
        getRepeatableItemFields(
          group,
          selectedOptions,
        );

      total +=
        calculateFieldOptionsAmount(
          applicableFields,
          sourceFields,
        );
    }
  }

  return roundCurrency(total);
};

/* =========================================================
   REPEATABLE SNAPSHOT
========================================================= */

const createRepeatableGroupSnapshot = (
  service,
  formData = {},
) => {
  const snapshots = [];

  for (const group of getRepeatableGroups(service)) {
    const groupName =
      normalizeString(group.name);

    const items =
      formData[groupName];

    if (!Array.isArray(items)) {
      continue;
    }

    const snapshotItems =
      items.map((item) => {
        const {
          selectedOptions,
          errors,
        } =
          resolveRepeatablePricingOptions(
            service,
            group,
            item,
          );

        if (errors.length > 0) {
          throw new Error(
            errors.join(" "),
          );
        }

        const pricingQuantities =
          resolveRepeatablePricingQuantities(
            selectedOptions,
            item,
          );

        const pricingSnapshots = {};

        for (const option of selectedOptions) {
          const pricingGroup =
            normalizeString(
              option.group,
            );

          pricingSnapshots[
            pricingGroup
          ] = {
            id: option._id,
            name: option.name,
            description:
              option.description || "",
            price: Number(
              option.price || 0,
            ),
            unit:
              option.unit || "",
            group:
              option.group || "",
            quantity:
              pricingQuantities[
                pricingGroup
              ] ??
              Number(
                option.minQuantity || 1,
              ),
            minQuantity:
              option.minQuantity,
            maxQuantity:
              option.maxQuantity,
            isActive:
              option.isActive,
          };
        }

        const pricingOptions = {};

        for (const pricingGroupRaw of
          group.pricingGroups || []) {
          const pricingGroup =
            normalizeString(
              pricingGroupRaw,
            );

          if (!pricingGroup) {
            continue;
          }

          const value =
            item?.pricingOptions?.[
              pricingGroup
            ] ??
            item?.[
              pricingGroup
            ];

          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {
            pricingOptions[
              pricingGroup
            ] = Array.isArray(value)
              ? value[0]
              : value;
          }
        }

        const sourceFields =
          isPlainObject(item.fields)
            ? item.fields
            : item;

        const applicableFields =
          getRepeatableItemFields(
            group,
            selectedOptions,
          );

        const fields = {};

        for (const field of applicableFields) {
          if (!field?.name) {
            continue;
          }

          const name =
            String(field.name).trim();

          if (
            sourceFields[name] !== undefined &&
            sourceFields[name] !== null
          ) {
            fields[name] =
              sourceFields[name];
          }
        }

        return {
          pricingOptions,
          pricingQuantities,
          pricingSnapshots,
          fields,
        };
      });

    snapshots.push({
      name: groupName,
      label:
        group.label || groupName,
      description:
        group.description || "",
      minItems:
        Number(group.minItems ?? 0),
      maxItems:
        group.maxItems !== undefined &&
        group.maxItems !== null
          ? Number(group.maxItems)
          : undefined,
      pricingGroups:
        Array.isArray(group.pricingGroups)
          ? [...group.pricingGroups]
          : [],
      requiredPricingGroups:
        Array.isArray(
          group.requiredPricingGroups,
        )
          ? [...group.requiredPricingGroups]
          : [],
      isActive:
        group.isActive !== false,
      order:
        Number(group.order || 0),
      items: snapshotItems,
    });
  }

  return snapshots;
};

/* =========================================================
   SERVICE SNAPSHOT
========================================================= */

const createServiceSnapshot = ({
  service,
  selectedOptions = [],
  groupedQuantities = {},
  quantity = 1,
  repeatableGroups = [],
  selectedPricingMode = null,
}) => {
  const selectedOptionSnapshots =
    selectedOptions.map(
      (option) => {
        const group =
          normalizeString(option.group);

        return {
          id: option._id,
          name: option.name,
          description:
            option.description || "",
          price:
            Number(option.price || 0),
          unit:
            option.unit || "",
          group:
            option.group || "",
          quantity:
            group
              ? groupedQuantities[group] ??
                Number(option.minQuantity || 1)
              : quantity,
          minQuantity:
            option.minQuantity,
          maxQuantity:
            option.maxQuantity,
          isActive:
            option.isActive,
        };
      },
    );

  return {
    serviceId: service._id,
    name: service.name,
    slug: service.slug || "",
    supportsDelivery: supportsServiceDelivery({ slug: service.slug }),
    description:
      service.description || "",
    category:
      service.category || "",
    pricingType:
      service.pricingType,
    basePrice:
      Number(service.basePrice || 0),
    minQuantity:
      service.minQuantity,
    maxQuantity:
      service.maxQuantity,
    unit: service.unit || "",
    selectedOption: selectedOptionSnapshots[0] || null,
    selectedOptions: selectedOptionSnapshots,
    ...(selectedPricingMode
      ? { selectedPricingMode }
      : {}),

    repeatableGroups,
  };
};

/* =========================================================
   NORMAL SERVICE AMOUNT
========================================================= */

const calculateOrderAmount = ({
  service,
  selectedOptions,
  quantity,
  fieldAmount = 0,
  groupedQuantities = {},
  isGroupedPricing = false,
  repeatableAmount = 0,
  selectedPricingMode = null,
}) => {
  let amount = 0;

  if (isGroupedPricing) {
    for (const option of selectedOptions) {
      const group =
        normalizeString(option.group);

      const optionQuantity =
        groupedQuantities[group] ??
        Number(option.minQuantity || 1);

      amount +=
        Number(option.price || 0) *
        Number(optionQuantity);
    }
  } else if (selectedOptions.length > 0) {
    const option =
      selectedOptions[0];

    amount =
      Number(option.price || 0) *
      Number(quantity);
  } else {
    if (selectedPricingMode) {
      amount = Number(selectedPricingMode.unitPrice || 0) * Number(quantity);
    } else switch (service.pricingType) {
      case "per_unit":
        amount =
          Number(service.basePrice || 0) *
          Number(quantity);
        break;

      case "fixed":
      case "starting_from":
      case "custom":
      default:
        amount =
          Number(service.basePrice || 0);
        break;
    }
  }

  amount += Number(fieldAmount || 0);
  amount += Number(repeatableAmount || 0);

  return roundCurrency(amount);
};

const calculateCouponEligibleAmount = ({
  service,
  selectedOptions,
  groupedQuantities,
  quantity,
  isGroupedPricing,
  amount,
}) => {
  if (String(service.slug || "").toLowerCase() !== "ads") {
    return roundCurrency(amount);
  }

  if (isGroupedPricing) {
    return roundCurrency(
      selectedOptions.reduce((total, option) => {
        const group = normalizeString(option.group);
        const optionQuantity =
          groupedQuantities[group] ?? Number(option.minQuantity || 1);
        return total + Number(option.price || 0) * optionQuantity;
      }, 0),
    );
  }

  if (selectedOptions.length > 0) {
    return roundCurrency(
      selectedOptions.reduce(
        (total, option) =>
          total + Number(option.price || 0) * Number(quantity || 1),
        0,
      ),
    );
  }

  return 0;
};

const timeBasedServiceSlugs = new Set([
  "social-media-profile-management",
  "festival-stories-animated-graphics",
  "google-business-profile-seo-reviews",
  "ads",
]);

const getServiceProgressDefinition = (item) => {
  const snapshot = item?.serviceSnapshot || {};
  const slug = normalizeString(
    snapshot.slug || item?.service?.slug || "",
  ).toLowerCase();
  const name = normalizeString(
    snapshot.name || item?.service?.name || "",
  ).toLowerCase();
  const resolvedSlug =
    slug ||
    name
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  if (timeBasedServiceSlugs.has(resolvedSlug)) {
    return { type: "time_based", durationDays: 30 };
  }

  if (
    resolvedSlug === "social-media-grid-posts" ||
    name === "social media grid posts"
  ) {
    const total = Math.max(1, Number(item?.quantity) || 1);
    return {
      type: "quantity_based",
      deliverables: Array.from({ length: total }, (_, index) => ({
        key: String(index + 1),
        name: `Grid ${index + 1}`,
      })),
    };
  }

  if (resolvedSlug === "visual-content-reels" || name === "visual content - reels") {
    const formData =
      item?.formData instanceof Map
        ? Object.fromEntries(item.formData)
        : item?.formData || {};
    const reelGroup = Array.isArray(formData.reels) ? formData.reels : [];
    const snapshotGroup = (snapshot.repeatableGroups || []).find(
      (group) => group.name === "reels",
    );
    const total = Math.max(
      1,
      reelGroup.length || snapshotGroup?.items?.length || 0,
    );

    return {
      type: "quantity_based",
      deliverables: Array.from({ length: total }, (_, index) => ({
        key: String(index + 1),
        name: `Reel ${index + 1}`,
      })),
    };
  }

  return null;
};

const createInitialServiceProgress = (item) => {
  const definition = getServiceProgressDefinition(item);

  if (!definition) {
    return undefined;
  }

  if (definition.type === "time_based") {
    return {
      type: definition.type,
      status: "pending_start",
      startAt: null,
      durationDays: definition.durationDays,
      deliverables: [],
    };
  }

  return {
    type: definition.type,
    status: "pending_start",
    startAt: null,
    durationDays: null,
    deliverables: definition.deliverables.map((deliverable) => ({
      ...deliverable,
      status: "pending",
      completedAt: null,
    })),
  };
};

const getOrderItemServiceProgress = (item) => {
  const initialProgress = createInitialServiceProgress(item);

  if (!initialProgress) {
    return undefined;
  }

  const existingProgress =
    typeof item?.serviceProgress?.toObject === "function"
      ? item.serviceProgress.toObject()
      : item?.serviceProgress;

  if (initialProgress.type === "time_based") {
    return {
      ...initialProgress,
      ...existingProgress,
      type: initialProgress.type,
      durationDays: initialProgress.durationDays,
      deliverables: [],
    };
  }

  const previousDeliverables = new Map(
    (existingProgress?.deliverables || []).map((deliverable) => [
      deliverable.key,
      deliverable,
    ]),
  );

  return {
    ...initialProgress,
    ...existingProgress,
    type: initialProgress.type,
    deliverables: initialProgress.deliverables.map((deliverable) => ({
      ...deliverable,
      ...previousDeliverables.get(deliverable.key),
      key: deliverable.key,
      name: deliverable.name,
    })),
  };
};

const getCalendarDayInKolkata = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
  );
};

const toServiceProgressView = (progress, now = new Date()) => {
  if (!progress) {
    return undefined;
  }

  if (progress.type === "time_based") {
    if (progress.status === "completed") {
      return {
        ...progress,
        displayStatus: "completed",
        elapsedDays: progress.durationDays,
        dayNumber: progress.durationDays,
        remainingDays: 0,
        progressPercent: 100,
      };
    }

    if (!progress.startAt) {
      return {
        ...progress,
        displayStatus: "pending_start",
        elapsedDays: 0,
        dayNumber: 0,
        remainingDays: progress.durationDays,
        progressPercent: 0,
      };
    }

    const elapsedDays = Math.max(
      0,
      Math.floor(
        (getCalendarDayInKolkata(now) -
          getCalendarDayInKolkata(new Date(progress.startAt))) /
          86400000,
      ),
    );
    const periodEnded = elapsedDays >= progress.durationDays;

    return {
      ...progress,
      displayStatus: periodEnded ? "period_ended" : "in_progress",
      elapsedDays,
      dayNumber: Math.min(elapsedDays + 1, progress.durationDays),
      remainingDays: Math.max(
        progress.durationDays - (elapsedDays + 1),
        0,
      ),
      progressPercent: Math.min(
        100,
        ((elapsedDays + 1) / progress.durationDays) * 100,
      ),
    };
  }

  const deliverables = progress.deliverables || [];
  const completedCount = deliverables.filter(
    (deliverable) => deliverable.status === "completed",
  ).length;
  const totalCount = deliverables.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const anyStarted = deliverables.some(
    (deliverable) => deliverable.status !== "pending",
  );

  return {
    ...progress,
    displayStatus: allCompleted
      ? "completed"
      : anyStarted
        ? "in_progress"
        : "pending_start",
    completedCount,
    totalCount,
    progressPercent: totalCount ? (completedCount / totalCount) * 100 : 0,
  };
};

const toOrderWithServiceProgress = (order) => {
  const visibleOrder =
    typeof order?.toObject === "function"
      ? order.toObject({ flattenMaps: true })
      : { ...order };

  if (pinIsLocked(visibleOrder)) visibleOrder.codPinStatus = "locked";

  if (Array.isArray(visibleOrder.items)) {
    visibleOrder.items = visibleOrder.items.map((item) => {
      const progress = getOrderItemServiceProgress(item);

      return {
        ...item,
        supportsDelivery: supportsServiceDelivery(item.serviceSnapshot),
        ...(progress ? { serviceProgress: toServiceProgressView(progress) } : {}),
      };
    });
  }

  if (!visibleOrder.items?.length) {
    const legacyProgress = getOrderItemServiceProgress(visibleOrder);

    if (legacyProgress) {
      visibleOrder.serviceProgress =
        toServiceProgressView(legacyProgress);
    }
  }

  return visibleOrder;
};

/* =========================================================
   PROCESS ONE SERVICE ITEM
========================================================= */

const processOrderServiceItem = async ({
  user,
  serviceId,
  pricingOptionId,
  quantity = 1,
  formData = {},
}) => {
  const normalizedServiceId = normalizeServiceId(serviceId);
  if (!normalizedServiceId) return { success: false, message: "Each service must contain a valid serviceId." };
  const storedService =
    await Service.findOne({
      _id: normalizedServiceId,
    });

  if (!storedService) {
    return {
      success: false,
      message:
        `Selected service (${serviceId}) is not available. Review your configuration.`,
    };
  }

  if (!canClientOrderService(user, storedService)) {
    return { success: false, message: `${storedService.name} is not available for your account. Review your selected services before submitting.` };
  }

  const service = normalizeAdsService(storedService);

  if (!isPlainObject(formData)) {
    return {
      success: false,
      message:
        "Service formData must be an object.",
    };
  }

  const parsedQuantity =
    validateQuantity(quantity);

  if (!parsedQuantity) {
    return {
      success: false,
      message:
        "Quantity must be a whole number greater than 0.",
    };
  }

  const selectedPricingMode = resolveGridPostPricingMode(
    service,
    formData.pricingMode,
  );
  if (
    String(service.slug || "").toLowerCase() === "social-media-grid-posts" &&
    !selectedPricingMode
  ) {
    return {
      success: false,
      message: "Select a valid Grid Posts pricing mode.",
    };
  }

  let pricingSelection;

  try {
    pricingSelection =
      resolvePricingSelections({
        service,
        pricingOptionId,
        formData,
      });
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  if (pricingSelection.errors.length > 0) {
    return {
      success: false,
      message:
        pricingSelection.errors.join(" "),
    };
  }

  const selectedOptions =
    pricingSelection.selectedOptions;

  const isGroupedPricing =
    selectedOptions.some(
      (option) =>
        normalizeString(option.group) !== "",
    );

  let groupedQuantities = {};

  if (isGroupedPricing) {
    try {
      groupedQuantities =
        resolveGroupedPricingQuantities(
          selectedOptions,
          formData,
        );

      validateQuantityRules({
        service,
        selectedOptions,
        quantity: parsedQuantity,
        groupedQuantities,
        isGroupedPricing: true,
      });
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  } else {
    try {
      validateQuantityRules({
        service,
        selectedOptions,
        quantity: parsedQuantity,
        groupedQuantities: {},
        isGroupedPricing: false,
      });
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  const applicableFields =
    getApplicableFields(
      service,
      selectedOptions,
    );

  const normalFieldErrors =
    validateFormData(
      applicableFields,
      formData,
    );

  const repeatableFieldErrors =
    validateRepeatableGroups(
      service,
      formData,
    );

  const allFieldErrors = {
    ...normalFieldErrors,
    ...repeatableFieldErrors,
  };

  if (Object.keys(allFieldErrors).length > 0) {
    return {
      success: false,
      message:
        "Please correct the service details.",
      errors: allFieldErrors,
    };
  }

  let cleanedFormData;

  try {
    cleanedFormData =
      cleanFormData(
        service,
        applicableFields,
        formData,
      );
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  if (selectedPricingMode) {
    cleanedFormData.pricingMode = selectedPricingMode.key;
  }

  const normalFieldAmount =
    calculateFieldOptionsAmount(
      applicableFields,
      cleanedFormData,
    );

  let repeatableAmount = 0;

  try {
    repeatableAmount =
      calculateRepeatableGroupsAmount(
        service,
        cleanedFormData,
      );
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  let repeatableSnapshot = [];

  try {
    repeatableSnapshot =
      createRepeatableGroupSnapshot(
        service,
        cleanedFormData,
      );
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  const fieldAmount =
    roundCurrency(
      normalFieldAmount,
    );

  const amount =
    calculateOrderAmount({
      service,
      selectedOptions,
      quantity: parsedQuantity,
      fieldAmount,
      groupedQuantities,
      isGroupedPricing,
      repeatableAmount,
      selectedPricingMode,
    });

  const couponEligibleAmount = calculateCouponEligibleAmount({
    service,
    selectedOptions,
    groupedQuantities,
    quantity: parsedQuantity,
    isGroupedPricing,
    amount,
  });

  const serviceSnapshot =
    createServiceSnapshot({
      service,
      selectedOptions,
      groupedQuantities,
      quantity: parsedQuantity,
      repeatableGroups:
        repeatableSnapshot,
      selectedPricingMode,
    });

  /*
  |--------------------------------------------------------------------------
  | Important:
  | Repeatable item count is represented inside
  | formData[group.name]. Service quantity remains
  | independent from repeatable item count.
  |--------------------------------------------------------------------------
  */

  const item = {
    service: service._id,
    serviceSnapshot,

    quantity:
      isGroupedPricing
        ? 1
        : parsedQuantity,

    formData:
      cleanedFormData,

    serviceProgress: createInitialServiceProgress({
      serviceSnapshot,
      formData: cleanedFormData,
      quantity: isGroupedPricing ? 1 : parsedQuantity,
    }),

    amount,
  };

  return {
    success: true,
    item,
    service,
    amount,
    couponEligibleAmount,
  };
};

const normalizeCouponCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const couponRequestError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateCouponAvailability = async (coupon, clientId) => {
  if (!coupon || !coupon.isActive) {
    throw couponRequestError("This coupon is invalid or inactive.");
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) <= new Date()) {
    throw couponRequestError("This coupon has expired.");
  }

  if (
    coupon.totalUsageLimit !== null &&
    coupon.totalUsageLimit !== undefined &&
    coupon.usageCount >= coupon.totalUsageLimit
  ) {
    throw couponRequestError("This coupon has reached its usage limit.");
  }

  if (
    clientId &&
    coupon.perClientUsageLimit !== null &&
    coupon.perClientUsageLimit !== undefined
  ) {
    const clientUsage = await CouponClientUsage.findOne({
      coupon: coupon._id,
      client: clientId,
    }).lean();

    if (
      Number(clientUsage?.usageCount || 0) >= coupon.perClientUsageLimit
    ) {
      throw couponRequestError("You have reached this coupon's usage limit.");
    }
  }
};

const calculateCouponQuote = ({
  coupon,
  serviceResults,
  paymentMethod,
  chequeType,
}) => {
  const originalSubtotal = roundCurrency(
    serviceResults.reduce(
      (sum, result) => sum + Number(result.amount || 0),
      0,
    ),
  );

  if (originalSubtotal < Number(coupon.minimumOrderAmount || 0)) {
    throw couponRequestError(
      `This coupon requires a minimum order amount of ₹${Number(
        coupon.minimumOrderAmount,
      ).toLocaleString("en-IN")}.`,
    );
  }

  const discountByService = new Map(
    (coupon.serviceDiscounts || []).map((discount) => [
      String(discount.serviceId),
      Number(discount.discountPercent || 0),
    ]),
  );

  let discountTotal = 0;
  const serviceBreakdown = serviceResults.map((result) => {
    const serviceId = String(result.item.service);
    const discountPercent = discountByService.get(serviceId) || 0;
    const originalAmount = roundCurrency(result.amount || 0);
    const eligibleAmount = Math.min(
      originalAmount,
      roundCurrency(result.couponEligibleAmount || 0),
    );
    const discountAmount = roundCurrency(
      eligibleAmount * (discountPercent / 100),
    );
    const discountedAmount = roundCurrency(originalAmount - discountAmount);

    discountTotal += discountAmount;
    return {
      serviceId: result.item.service,
      serviceName: result.service.name,
      discountPercent,
      originalAmount,
      eligibleAmount,
      discountAmount,
      discountedAmount,
    };
  });

  discountTotal = roundCurrency(discountTotal);
  if (discountTotal <= 0) {
    throw couponRequestError("This coupon does not apply to the selected services.");
  }
  const taxableSubtotal = roundCurrency(originalSubtotal - discountTotal);
  const { gstRate, gstAmount, amount } = calculateOrderTotals(
    taxableSubtotal,
    getGstRate(paymentMethod, chequeType),
  );

  return {
    code: coupon.code,
    serviceBreakdown,
    originalSubtotal,
    discountTotal,
    taxableSubtotal,
    gstRate,
    gstAmount,
    finalTotal: amount,
  };
};

const buildProcessedServiceResults = async (serviceRequests, user) => {
  if (!Array.isArray(serviceRequests) || serviceRequests.length === 0) {
    throw new Error("At least one service is required.");
  }

  if (serviceRequests.length > 50) {
    throw new Error("Too many services in one order.");
  }

  const serviceIds = new Set();
  const results = [];

  for (const request of serviceRequests) {
    if (!request?.serviceId) {
      throw new Error("Each service must contain a serviceId.");
    }

    const serviceId = normalizeServiceId(request.serviceId);
    if (!serviceId) throw new Error("Each service must contain a valid serviceId.");
    if (serviceIds.has(serviceId)) {
      throw new Error(
        "The same service cannot be added more than once to an order.",
      );
    }
    serviceIds.add(serviceId);

    const result = await processOrderServiceItem({
      user,
      serviceId: request.serviceId,
      pricingOptionId: request.pricingOptionId,
      quantity: request.quantity ?? 1,
      formData: request.formData || {},
    });

    if (!result.success) {
      throw new Error(result.message || "Unable to process service.");
    }

    results.push(result);
  }

  return results;
};

const getCouponQuote = async (req, res) => {
  try {
    if (!req.user?._id || req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Only clients can validate checkout coupons.",
      });
    }

    if (rejectIneligibleMonthEnd(req, res)) return;
    const { services, code, paymentMethod, chequeType } = req.body || {};
    if (!["cod", "online", "cheque", "month_end"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid payment method.",
      });
    }
    if (
      paymentMethod === "cheque" &&
      !["with_gst", "direct_collection"].includes(chequeType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid cheque payment type.",
      });
    }
    const serviceResults = await buildProcessedServiceResults(services, req.user);
    const normalizedCode = normalizeCouponCode(code);
    const coupon = await Coupon.findOne({ code: normalizedCode });

    await validateCouponAvailability(coupon, req.user._id);
    const quote = calculateCouponQuote({
      coupon,
      serviceResults,
      paymentMethod,
      chequeType,
    });

    return res.status(200).json({
      success: true,
      quote,
    });
  } catch (error) {
    if (error instanceof mongoose.Error || error.name?.startsWith("Mongo")) {
      console.error("Validate coupon error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to validate coupon right now.",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to validate coupon.",
    });
  }
};

const getOrderQuote = async (req, res) => {
  try {
    if (!req.user?._id || req.user.role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Only clients can request an order quote.",
      });
    }

    if (rejectIneligibleMonthEnd(req, res)) return;
    const { services, couponCode, paymentMethod, chequeType } = req.body || {};
    if (!["cod", "online", "cheque", "month_end"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid payment method.",
      });
    }
    if (
      paymentMethod === "cheque" &&
      !["with_gst", "direct_collection"].includes(chequeType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid cheque payment type.",
      });
    }

    const serviceResults = await buildProcessedServiceResults(services, req.user);
    const originalSubtotal = roundCurrency(
      serviceResults.reduce((sum, result) => sum + result.amount, 0),
    );
    let couponSnapshot;
    let totals = calculateOrderTotals(
      originalSubtotal,
      getGstRate(paymentMethod, chequeType),
    );

    if (String(couponCode || "").trim()) {
      const coupon = await Coupon.findOne({
        code: normalizeCouponCode(couponCode),
      });
      await validateCouponAvailability(coupon, req.user._id);
      couponSnapshot = calculateCouponQuote({
        coupon,
        serviceResults,
        paymentMethod,
        chequeType,
      });
      totals = {
        subtotal: couponSnapshot.taxableSubtotal,
        gstRate: couponSnapshot.gstRate,
        gstAmount: couponSnapshot.gstAmount,
        amount: couponSnapshot.finalTotal,
      };
    }

    const creditQuote = await quoteCredit({ client: req.user._id,
      items: serviceResults.map((result) => result.item), input: req.body.adCredit,
      subtotal: totals.subtotal, gstRate: totals.gstRate });
    const subtotalBeforeAdCredit = totals.subtotal;
    totals = creditQuote.totals;

    const serviceBreakdown = serviceResults.map((result) => {
      const couponLine = couponSnapshot?.serviceBreakdown.find(
        (line) => String(line.serviceId) === String(result.item.service),
      );
      return {
        serviceId: result.item.service,
        serviceName: result.service.name,
        originalAmount: result.amount,
        discountAmount: couponLine?.discountAmount || 0,
        amount: couponLine?.discountedAmount ?? result.amount,
      };
    });

    return res.status(200).json({
      success: true,
      quote: {
        originalSubtotal,
        subtotalBeforeAdCredit,
        adCreditTotal: creditQuote.total,
        adCreditApplied: Object.fromEntries(Object.entries(creditQuote.requested).map(([key, value]) => [key, value / 100])),
        discountTotal: couponSnapshot?.discountTotal || 0,
        taxableSubtotal: totals.subtotal,
        gstRate: totals.gstRate,
        gstAmount: totals.gstAmount,
        amount: totals.amount,
        couponCode: couponSnapshot?.code || "",
        serviceBreakdown,
      },
    });
  } catch (error) {
    if (error instanceof mongoose.Error || error.name?.startsWith("Mongo")) {
      console.error("Create order quote error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to calculate the current order price.",
      });
    }
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Unable to calculate the current order price.",
    });
  }
};

const reserveCouponUsage = async ({
  coupon,
  clientId,
  session,
}) => {
  const now = new Date();
  const couponFilter = {
    _id: coupon._id,
    isActive: true,
    $and: [
      {
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      },
      {
        $expr: {
          $or: [
            {
              $eq: [
                { $ifNull: ["$totalUsageLimit", null] },
                null,
              ],
            },
            { $lt: ["$usageCount", "$totalUsageLimit"] },
          ],
        },
      },
    ],
  };

  const reservedCoupon = await Coupon.findOneAndUpdate(
    couponFilter,
    { $inc: { usageCount: 1 } },
    { new: true, session },
  );

  if (!reservedCoupon) {
    throw couponRequestError("This coupon is no longer available.", 409);
  }

  const clientFilter = {
    coupon: coupon._id,
    client: clientId,
  };
  if (coupon.perClientUsageLimit !== null &&
      coupon.perClientUsageLimit !== undefined) {
    clientFilter.$expr = {
      $lt: ["$usageCount", coupon.perClientUsageLimit],
    };
  }

  try {
    const clientReservation = await CouponClientUsage.findOneAndUpdate(
      clientFilter,
      {
        $inc: { usageCount: 1 },
        $setOnInsert: { coupon: coupon._id, client: clientId },
      },
      {
        new: true,
        upsert: true,
        session,
        setDefaultsOnInsert: false,
      },
    );

    if (!clientReservation) {
      throw couponRequestError(
        "You have reached this coupon's usage limit.",
        409,
      );
    }
  } catch (error) {
    if (error.code === 11000) {
      throw couponRequestError(
        "You have reached this coupon's usage limit.",
        409,
      );
    }
    throw error;
  }
};

/* =========================================================
   CREATE ORDER
========================================================= */

const createOrder = async (
  req,
  res,
) => {
  let releaseSubmission;
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User identity is unavailable.",
      });
    }

    let submissionKey;
    let submissionHash;
    const requestKey = req.get("Idempotency-Key");
    if (requestKey) {
      if (!/^[a-zA-Z0-9_-]{16,100}$/.test(requestKey)) {
        return res.status(400).json({ success: false, message: "Invalid checkout request key." });
      }
      submissionKey = `${req.user._id}:${requestKey}`;
      submissionHash = crypto.createHash("sha256")
        .update(JSON.stringify(req.body)).digest("hex");
      releaseSubmission = await acquireLock(`checkout:${submissionKey}`);
      const existing = await Order.findOne({ submissionKey, client: req.user._id });
      if (existing) {
        if (existing.submissionHash !== submissionHash) {
          return res.status(409).json({ success: false,
            message: "This checkout key was already used for another order." });
        }
        return res.status(200).json({ success: true,
          message: "Order already created.", order: toClientVisibleOrder(existing) });
      }
    }

    const {
      services,
      serviceId,
      pricingOptionId,
      quantity = 1,
      formData = {},
      additionalRequirements = "",
      paymentMethod,
      chequeType,
      couponCode,
      draftId,
      confirmedAmount,
    } = req.body;

    if (rejectIneligibleMonthEnd(req, res)) return;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "Payment method is required.",
      });
    }

    if (
      !["cod", "online", "cheque", "month_end"].includes(
        paymentMethod,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment method.",
      });
    }

    if (
      paymentMethod === "cheque" &&
      !["with_gst", "direct_collection"].includes(chequeType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid cheque payment type.",
      });
    }

    if (paymentMethod !== "cheque" && chequeType !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Cheque type can only be selected for cheque payments.",
      });
    }

    if (draftId && !mongoose.Types.ObjectId.isValid(draftId)) {
      return res.status(400).json({
        success: false,
        message: "Saved draft reference is invalid.",
      });
    }

    if (
      additionalRequirements !== undefined &&
      additionalRequirements !== null &&
      typeof additionalRequirements !==
        "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Additional requirements must be a string.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | New multi-service format
    |--------------------------------------------------------------------------
    */

    let serviceRequests = [];

    if (Array.isArray(services)) {
      serviceRequests = services;
    } else if (serviceId) {
      /*
      |--------------------------------------------------------------------------
      | Legacy single-service compatibility
      |--------------------------------------------------------------------------
      */

      serviceRequests = [
        {
          serviceId,
          pricingOptionId,
          quantity,
          formData,
        },
      ];
    }

    if (serviceRequests.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one service is required.",
      });
    }

    if (serviceRequests.length > 50) {
      return res.status(400).json({
        success: false,
        message:
          "Too many services in one order.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate service IDs
    |--------------------------------------------------------------------------
    */

    const serviceIds = new Set();

    for (const request of serviceRequests) {
      if (!request?.serviceId) {
        return res.status(400).json({
          success: false,
          message:
            "Each service must contain a serviceId.",
        });
      }

      const normalizedId = normalizeServiceId(request.serviceId);
      if (!normalizedId) {
        return res.status(400).json({ success: false, message: "Each service must contain a valid serviceId." });
      }

      if (serviceIds.has(normalizedId)) {
        return res.status(400).json({
          success: false,
          message:
            "The same service cannot be added more than once to an order.",
        });
      }

      serviceIds.add(normalizedId);
    }

    /*
    |--------------------------------------------------------------------------
    | Process all services
    |--------------------------------------------------------------------------
    */

    const items = [];
    const serviceResults = [];

    for (const request of serviceRequests) {
      const result =
        await processOrderServiceItem({
          user: req.user,
          serviceId:
            request.serviceId,
          pricingOptionId:
            request.pricingOptionId,
          quantity:
            request.quantity ?? 1,
          formData:
            request.formData || {},
        });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message:
            result.message ||
            "Unable to process service.",
          errors:
            result.errors || undefined,
        });
      }

      items.push(result.item);

      serviceResults.push(result);
    }

    /*
    |--------------------------------------------------------------------------
    | Calculate subtotal
    |--------------------------------------------------------------------------
    */

    const originalSubtotal = items.reduce(
      (total, item) => total + Number(item.amount || 0),
      0,
    );

    let coupon = null;
    let couponSnapshot;
    let orderTotals = calculateOrderTotals(
      originalSubtotal,
      getGstRate(paymentMethod, chequeType),
    );

    if (couponCode !== undefined && String(couponCode).trim()) {
      coupon = await Coupon.findOne({
        code: normalizeCouponCode(couponCode),
      });

      try {
        await validateCouponAvailability(coupon, req.user._id);
        couponSnapshot = calculateCouponQuote({
          coupon,
          serviceResults,
          paymentMethod,
          chequeType,
        });
      } catch (couponError) {
        return res.status(400).json({
          success: false,
          message: couponError.message,
        });
      }

      orderTotals = {
        subtotal: couponSnapshot.taxableSubtotal,
        gstRate: couponSnapshot.gstRate,
        gstAmount: couponSnapshot.gstAmount,
        amount: couponSnapshot.finalTotal,
      };

      const discountsByService = new Map(
        couponSnapshot.serviceBreakdown.map((line) => [
          String(line.serviceId),
          line,
        ]),
      );

      for (const item of items) {
        const discount = discountsByService.get(String(item.service));
        item.originalAmount = item.amount;
        item.discountAmount = discount?.discountAmount || 0;
        item.couponDiscountPercent = discount?.discountPercent || 0;
        item.amount = discount?.discountedAmount ?? item.amount;
      }
    }

    const subtotalBeforeAdCredit = orderTotals.subtotal;
    const creditQuote = await quoteCredit({ client: req.user._id, items,
      input: req.body.adCredit, subtotal: orderTotals.subtotal, gstRate: orderTotals.gstRate });
    orderTotals = creditQuote.totals;

    const {
      subtotal: roundedSubtotal,
      gstRate,
      gstAmount,
      amount,
    } = orderTotals;

    if (draftId) {
      const confirmedPrice = Number(confirmedAmount);
      if (!Number.isFinite(confirmedPrice)) {
        return res.status(400).json({
          success: false,
          message: "Review and confirm the current draft price before ordering.",
        });
      }

      if (Math.abs(confirmedPrice - amount) > 0.01) {
        return res.status(409).json({
          success: false,
          message:
            "Pricing changed since confirmation. Review the updated total and try again.",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Legacy main service fields
    |--------------------------------------------------------------------------
    |
    | Existing Order schema contains legacy single-service
    | fields. Keep them populated for compatibility.
    |--------------------------------------------------------------------------
    */

    const firstItem =
      items[0];

    const orderNumber =
      await generateOrderNumber();

    const orderData = {
      ...(creditQuote.total > 0 ? {
        adCreditApplied: Object.fromEntries(Object.entries(creditQuote.requested).map(([key, value]) => [key, value / 100])),
        adCreditTotal: creditQuote.total, subtotalBeforeAdCredit,
      } : {}),
      ...(submissionKey ? { submissionKey, submissionHash } : {}),
      client: req.user._id,

      orderNumber,

      service:
        firstItem.service,

      serviceSnapshot:
        firstItem.serviceSnapshot,

      quantity:
        firstItem.quantity,

      formData:
        firstItem.formData,

      items,

      additionalRequirements:
        typeof additionalRequirements ===
        "string"
          ? additionalRequirements.trim()
          : "",

      subtotal: roundedSubtotal,

      ...(couponSnapshot
        ? {
            originalSubtotal: couponSnapshot.originalSubtotal,
            discountTotal: couponSnapshot.discountTotal,
            couponSnapshot,
          }
        : {}),

      gstRate,

      gstAmount,

      amount,

      paymentMethod,

      ...(paymentMethod === "cheque" ? { chequeType } : {}),

      paymentStatus:
        paymentMethod !== "month_end" && amount === 0 && creditQuote.total > 0 ? "paid" : "pending",

      orderStatus:
        "pending",
    };

    /*
    |--------------------------------------------------------------------------
    | Create order
    |--------------------------------------------------------------------------
    */

    let order;
    if ((coupon && couponSnapshot) || draftId || creditQuote.total > 0) {
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          if (draftId) {
            const draft = await OrderDraft.findOne({
              _id: draftId,
              client: req.user._id,
              status: "active",
            }).session(session);

            if (!draft) {
              throw couponRequestError(
                "This saved draft has already been submitted or is unavailable.",
                409,
              );
            }
          }

          if (coupon && couponSnapshot) {
            await reserveCouponUsage({
              coupon,
              clientId: req.user._id,
              session,
            });
          }

          const createdOrder = new Order(orderData);
          await createdOrder.save({ session });
          order = createdOrder;
          if (creditQuote.total > 0) {
            await spendCredit({ client: req.user._id, order: createdOrder._id,
              requested: creditQuote.requested, session, actor: req.user._id });
          }

          if (coupon && couponSnapshot) {
            await CouponUsage.create(
              [
                {
                  coupon: coupon._id,
                  couponCode: coupon.code,
                  client: req.user._id,
                  order: createdOrder._id,
                  serviceBreakdown: couponSnapshot.serviceBreakdown,
                  originalSubtotal: couponSnapshot.originalSubtotal,
                  discountTotal: couponSnapshot.discountTotal,
                  taxableSubtotal: couponSnapshot.taxableSubtotal,
                  gstRate: couponSnapshot.gstRate,
                  gstAmount: couponSnapshot.gstAmount,
                  finalTotal: couponSnapshot.finalTotal,
                },
              ],
              { session },
            );
          }

          if (draftId) {
            const draftUpdate = await OrderDraft.updateOne(
              {
                _id: draftId,
                client: req.user._id,
                status: "active",
              },
              {
                $set: {
                  status: "submitted",
                  submittedOrder: createdOrder._id,
                },
              },
              { session },
            );
            if (draftUpdate.modifiedCount !== 1) {
              throw couponRequestError(
                "This saved draft has already been submitted.",
                409,
              );
            }
          }
        });
      } finally {
        await session.endSession();
      }
    } else {
      order = await Order.create(orderData);
    }

    /*
    |--------------------------------------------------------------------------
    | Return populated order
    |--------------------------------------------------------------------------
    */

    const populatedOrder =
      await Order.findById(
        order._id,
      )
        .populate(
          "client",
          "name email username",
        )
        .populate(
          "service",
          "name category",
        )
        .populate(
          "items.service",
          "name category",
        );

    return res.status(201).json({
      success: true,
      message:
        "Order created successfully.",
      order:
        toClientVisibleOrder(populatedOrder),
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error,
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Unable to create order.",
    });
  } finally {
    if (releaseSubmission) {
      await releaseSubmission().catch((error) => console.error("Checkout lease release failed:", error));
    }
  }
};

/* =========================================================
   USER - GET MY ORDERS
========================================================= */

const getMyOrders = async (
  req,
  res,
) => {
  try {
    const orders =
      await Order.find({
        client: req.user._id,
      })
        .select("-codPin")
        .populate(
          "service",
          "name category",
        )
        .populate(
          "items.service",
          "name category",
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      orders: orders.map(toClientVisibleOrder),
    });
  } catch (error) {
    console.error(
      "Get my orders error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch orders.",
    });
  }
};

const getLatestMyOrder = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User identity is unavailable.",
      });
    }

    const order = await Order.findOne({
      client: req.user._id,
    })
      .select("-codPin")
      .populate("service", "name category")
      .populate("items.service", "name category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      order: order ? toClientVisibleOrder(order) : null,
    });
  } catch (error) {
    console.error("Get latest order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your latest order.",
    });
  }
};

/* =========================================================
   USER - GET SINGLE ORDER
========================================================= */

const getOrderById = async (
  req,
  res,
) => {
  try {
    const order =
      await Order.findOne({
        _id: req.params.id,
        client: req.user._id,
      })
        .select("-codPin")
        .populate(
          "service",
          "name category",
        )
        .populate(
          "items.service",
          "name category",
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order: toClientVisibleOrder(order),
    });
  } catch (error) {
    console.error(
      "Get order error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch order.",
    });
  }
};

const toClientVisibleOrder = (order) => {
  const visibleOrder = toOrderWithServiceProgress(order);
  for (const field of ["monthEndPaymentHistory", "notes", "codPin", "codPinEmployee", "codPinVerifiedBy", "codPinAttempts", "razorpaySignature",
    "submissionKey", "submissionHash"]) delete visibleOrder[field];

  if (visibleOrder.orderStatus !== "completed") {
    delete visibleOrder.deliveryLink;
    delete visibleOrder.invoice;
  }

  return visibleOrder;
};

/* =========================================================
   ADMIN - GET ALL ORDERS
========================================================= */

const getAdminOrders = async (
  req,
  res,
) => {
  try {
    const orders =
      await Order.find({})
        .select("-codPin")
        .populate(
          "client",
          "name email username",
        )
        .populate(
          "service",
          "name category",
        )
        .populate(
          "items.service",
          "name category",
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      orders: orders.map(toOrderWithServiceProgress),
    });
  } catch (error) {
    console.error(
      "Get admin orders error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch orders.",
    });
  }
};

/* =========================================================
   ADMIN - GET SINGLE ORDER
========================================================= */

const getAdminOrderById = async (
  req,
  res,
) => {
  try {
    const order =
      await Order.findById(
        req.params.id,
      )
        .select("-codPin")
        .populate(
          "client",
          "name email username",
        )
        .populate(
          "service",
          "name category",
        )
        .populate(
          "items.service",
          "name category",
        );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order: toOrderWithServiceProgress(order),
    });
  } catch (error) {
    console.error(
      "Get admin order error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch order.",
    });
  }
};

const getStaffOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .select("-codPin -notes")
      .populate("client", "name email username")
      .populate("service", "name category")
      .populate("items.service", "name category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders: orders.map(toOrderWithServiceProgress),
    });
  } catch (error) {
    console.error("Get staff orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
};

const getStaffOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select("-codPin -notes")
      .populate("client", "name email username")
      .populate("service", "name category")
      .populate("items.service", "name category");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order: toOrderWithServiceProgress(order),
    });
  } catch (error) {
    console.error("Get staff order error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
    });
  }
};

const updateServiceProgress = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { action, deliverableKey, status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const item = order.items.id(itemId);
    const legacyOrderItem =
      !item && itemId === "legacy"
        ? {
            serviceSnapshot: order.serviceSnapshot,
            quantity: order.quantity,
            formData: order.formData,
            serviceProgress: order.serviceProgress,
          }
        : null;
    const progressItem = item || legacyOrderItem;

    if (!progressItem) {
      return res.status(404).json({
        success: false,
        message: "Order service was not found.",
      });
    }

    const progress = getOrderItemServiceProgress(progressItem);

    if (!progress) {
      return res.status(400).json({
        success: false,
        message: "Service progress is not supported for this service.",
      });
    }

    if (progress.type === "time_based") {
      if (
        action === "start" &&
        progress.status === "pending_start" &&
        !progress.startAt
      ) {
        progress.startAt = new Date();
        progress.status = "in_progress";
      } else if (
        action === "complete" &&
        progress.status !== "completed" &&
        progress.startAt
      ) {
        progress.status = "completed";
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid service progress action.",
        });
      }
    } else {
      const validStatuses = ["pending", "in_progress", "completed"];
      const deliverable = progress.deliverables.find(
        (entry) => entry.key === deliverableKey,
      );

      if (
        action !== "set_deliverable_status" ||
        !deliverable ||
        !validStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Select a valid deliverable and status.",
        });
      }

      deliverable.status = status;
      deliverable.completedAt =
        status === "completed" ? new Date() : null;
    }

    if (item) {
      item.serviceProgress = progress;
    } else {
      order.serviceProgress = progress;
    }
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .select(req.user?.role === "employee" ? "-codPin -notes" : "-codPin")
      .populate("client", "name email username")
      .populate("service", "name category")
      .populate("items.service", "name category");

    return res.status(200).json({
      success: true,
      message: "Service progress updated successfully.",
      order: toOrderWithServiceProgress(updatedOrder),
    });
  } catch (error) {
    console.error("Update service progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update service progress.",
    });
  }
};

/* =========================================================
   ADMIN - UPDATE ORDER STATUS
========================================================= */

const updateOrderStatus = async (
  req,
  res,
) => {
  try {
    const { status } =
      req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!status) {
      return res.status(400).json({
        success: false,
        message:
          "Order status is required.",
      });
    }

    if (
      !allowedStatuses.includes(
        status,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status.",
      });
    }

    const order =
      await Order.findById(
        req.params.id,
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    await changeOrderStatus(order, status, req.user._id);

    const updatedOrder =
      await Order.findById(
        order._id,
      )
        .select(
          req.user?.role === "employee"
            ? "-codPin -notes"
            : "-codPin",
        )
        .populate(
          "client",
          "name email username",
        )
        .populate(
          "service",
          "name category",
        )
        .populate(
          "items.service",
          "name category",
        );

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully.",
      order:
        updatedOrder,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error,
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode ? error.message : "Unable to update order status.",
    });
  }
};

/* =========================================================
   ADMIN - UPDATE PAYMENT STATUS
========================================================= */

const updatePaymentStatus =
  async (
    req,
    res,
  ) => {
    try {
      const {
        paymentStatus,
      } = req.body;

      const allowedStatuses = [
        "pending",
        "processing",
        "paid",
        "failed",
        "collected",
      ];

      if (
        !paymentStatus ||
        !allowedStatuses.includes(
          paymentStatus,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment status.",
        });
      }

      const order =
        await Order.findById(
          req.params.id,
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      if (
        ["cod", "cheque"].includes(order.paymentMethod) &&
        ["paid", "collected"].includes(paymentStatus)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cash and cheque collection payments must be completed by the owning client through PIN verification.",
        });
      }

      if (
        ["cod", "cheque"].includes(order.paymentMethod) &&
        ["paid", "collected"].includes(order.paymentStatus)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This payment has already been completed.",
        });
      }

      if (order.adCreditReleased) {
        return res.status(409).json({ success: false,
          message: "This order's ad credit was returned. Create a new order instead." });
      }

      if (order.paymentMethod === "month_end") {
        if (!["admin", "employee"].includes(req.user?.role)) {
          return res.status(403).json({ success: false, message: "Order management access required." });
        }
        if (paymentStatus === "collected") {
          return res.status(400).json({ success: false, message: "Use Paid to confirm receipt of a month-end payment." });
        }
        if (paymentStatus !== order.paymentStatus) {
          const updated = await Order.updateOne({ _id: order._id,
            paymentStatus: order.paymentStatus, adCreditReleased: { $ne: true } }, {
            $set: { paymentStatus },
            $push: { monthEndPaymentHistory: { from: order.paymentStatus, to: paymentStatus,
              changedBy: req.user._id, changedAt: new Date() } },
          });
          if (updated.matchedCount !== 1) {
            return res.status(409).json({ success: false, message: "Payment changed. Refresh and try again." });
          }
          order.paymentStatus = paymentStatus;
        }
      } else if (order.adCreditTotal > 0) {
        const paymentUpdate = await Order.updateOne({ _id: order._id,
          adCreditReleased: { $ne: true }, paymentStatus: order.paymentStatus },
        { $set: { paymentStatus } });
        if (paymentUpdate.matchedCount !== 1) {
          return res.status(409).json({ success: false,
            message: "Order payment or ad credit changed. Refresh and try again." });
        }
        order.paymentStatus = paymentStatus;
      } else {
        const paymentUpdate = await Order.updateOne({ _id: order._id,
          paymentStatus: order.paymentStatus, adCreditReleased: { $ne: true } },
        { $set: { paymentStatus } });
        if (paymentUpdate.matchedCount !== 1) return res.status(409).json({ success: false,
          message: "Payment changed. Refresh the order before updating its status." });
        order.paymentStatus = paymentStatus;
      }

      return res.status(200).json({
        success: true,
        message:
          "Payment status updated successfully.",
        order: {
          id: order._id,
          orderNumber:
            order.orderNumber,
          paymentMethod:
            order.paymentMethod,
          paymentStatus:
            order.paymentStatus,
          orderStatus:
            order.orderStatus,
          subtotal:
            order.subtotal,
          gstRate:
            order.gstRate,
          gstAmount:
            order.gstAmount,
          amount:
            order.amount,
        },
      });
    } catch (error) {
      console.error(
        "Update payment status error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update payment status.",
      });
    }
  };

const updateServiceDelivery = async (req, res) => {
  try {
    if (!["admin", "employee"].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Order management access required." });
    }
    const { id, itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid order service reference." });
    }
    const input = req.body?.url;
    if (typeof input !== "string" || input.length > 2048) {
      return res.status(400).json({ success: false, message: "Delivery URL must be a string of at most 2048 characters." });
    }
    const url = input.trim();
    if (url) {
      let parsed;
      try { parsed = new URL(url); } catch { /* Rejected below. */ }
      if (!parsed || !["http:", "https:"].includes(parsed.protocol) ||
          !parsed.hostname || parsed.username || parsed.password || /\s/.test(url)) {
        return res.status(400).json({ success: false, message: "Enter a valid HTTP or HTTPS delivery URL without credentials." });
      }
    }
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    const item = order.items?.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Order service was not found." });
    if (!supportsServiceDelivery(item.serviceSnapshot)) {
      return res.status(400).json({ success: false, message: "Delivery links are not supported for this service." });
    }
    const delivery = { url, updatedAt: new Date(), updatedBy: req.user._id };
    const result = await Order.updateOne({ _id: order._id, "items._id": item._id },
      { $set: { "items.$.delivery": delivery } }, { runValidators: true });
    if (result.matchedCount !== 1) {
      return res.status(409).json({ success: false, message: "Order service changed. Refresh and try again." });
    }
    return res.json({ success: true, message: "Service delivery link saved.", itemId: String(item._id), delivery });
  } catch (error) {
    console.error("Update service delivery error:", error);
    return res.status(500).json({ success: false, message: "Unable to save service delivery link." });
  }
};

const updateDeliveryLink = async (req, res) => {
  try {
    const deliveryLink = String(req.body?.deliveryLink || "").trim();

    if (deliveryLink) {
      let parsedUrl;

      try {
        parsedUrl = new URL(deliveryLink);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Delivery link must be a valid URL.",
        });
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({
          success: false,
          message: "Delivery link must use HTTP or HTTPS.",
        });
      }
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.deliveryLink = deliveryLink;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Delivery link updated successfully.",
      order: {
        _id: order._id,
        deliveryLink: order.deliveryLink,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("Update delivery link error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update delivery link.",
    });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const url = String(req.body?.url || "").trim();
    const name = String(req.body?.name || "").trim();

    if (url) {
      let parsedUrl;

      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invoice link must be a valid URL.",
        });
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({
          success: false,
          message: "Invoice link must use HTTP or HTTPS.",
        });
      }
    }

    if (name.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Invoice name must be 200 characters or fewer.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.invoice = {
      url,
      type: "link",
      name,
      uploadedAt: url ? new Date() : null,
    };
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Invoice link updated successfully.",
      order: {
        _id: order._id,
        invoice: order.invoice,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("Update invoice error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update invoice link.",
    });
  }
};

/* =========================================================
   ADMIN - UPDATE NOTES
========================================================= */

const updateAdminNotes =
  async (
    req,
    res,
  ) => {
    try {
      const {
        notes,
      } = req.body;

      if (
        notes !== undefined &&
        typeof notes !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Notes must be a string.",
        });
      }

      const order =
        await Order.findById(
          req.params.id,
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      order.notes =
        typeof notes === "string"
          ? notes.trim()
          : "";

      await order.save();

      return res.status(200).json({
        success: true,
        message:
          "Admin notes updated successfully.",
        order: {
          id: order._id,
          orderNumber:
            order.orderNumber,
          notes:
            order.notes,
        },
      });
    } catch (error) {
      console.error(
        "Update admin notes error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update admin notes.",
      });
    }
  };

/* =========================================================
   ADMIN - GET COD ORDERS
========================================================= */

const getAdminCodOrders =
  async (
    req,
    res,
  ) => {
    try {
      const orders =
        await Order.find({
          paymentMethod: { $in: ["cod", "cheque"] },
        })
          .select("-codPin")
          .populate(
            "client",
            "name email username",
          )
          .populate(
            "service",
            "name category",
          )
          .populate(
            "items.service",
            "name category",
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        orders: orders.map(toOrderWithServiceProgress),
      });
    } catch (error) {
      console.error(
        "Get admin COD orders error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch COD orders.",
      });
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  updateServiceDelivery,
  getPaymentPricing,
  getCouponQuote,
  getOrderQuote,
  calculateCouponQuote,
  calculateCouponEligibleAmount,
  createOrder,
  getMyOrders,
  getLatestMyOrder,
  getOrderById,
  getAdminOrders,
  getAdminOrderById,
  getStaffOrders,
  getStaffOrderById,
  updateServiceProgress,
  updateOrderStatus,
  updatePaymentStatus,
  updateDeliveryLink,
  updateInvoice,
  updateAdminNotes,
  getAdminCodOrders,
};
