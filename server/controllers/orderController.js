const Order = require("../models/Order");
const Service = require("../models/Service");
const generateOrderNumber = require("../utils/generateOrderNumber");
const normalizeAdsService = require("../utils/normalizeAdsService");

const ONLINE_GST_RATE = 18;

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

  for (const field of group.fields || []) {
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
  repeatableGroups = [],
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
            groupedQuantities[group] ??
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
      },
    );

  return {
    id: service._id,
    name: service.name,
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

    pricingOptions:
      selectedOptionSnapshots,

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
    switch (service.pricingType) {
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

/* =========================================================
   PROCESS ONE SERVICE ITEM
========================================================= */

const processOrderServiceItem = async ({
  serviceId,
  pricingOptionId,
  quantity = 1,
  formData = {},
}) => {
  const storedService =
    await Service.findOne({
      _id: serviceId,
      isActive: true,
    });

  if (!storedService) {
    return {
      success: false,
      message:
        "Selected service is not available.",
    };
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
    });

  const serviceSnapshot =
    createServiceSnapshot({
      service,
      selectedOptions,
      groupedQuantities,
      repeatableGroups:
        repeatableSnapshot,
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

    amount,
  };

  return {
    success: true,
    item,
    service,
    amount,
  };
};

/* =========================================================
   CREATE ORDER
========================================================= */

const createOrder = async (
  req,
  res,
) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User identity is unavailable.",
      });
    }

    const {
      services,
      serviceId,
      pricingOptionId,
      quantity = 1,
      formData = {},
      additionalRequirements = "",
      paymentMethod,
    } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "Payment method is required.",
      });
    }

    if (
      !["cod", "online"].includes(
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

      const normalizedId =
        String(request.serviceId);

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

    const subtotal =
      roundCurrency(
        items.reduce(
          (total, item) =>
            total +
            Number(item.amount || 0),
          0,
        ),
      );

    /*
    |--------------------------------------------------------------------------
    | GST
    |--------------------------------------------------------------------------
    |
    | Online payment = 18%
    | COD = 0%
    |--------------------------------------------------------------------------
    */

    const gstRate =
      paymentMethod === "online"
        ? ONLINE_GST_RATE
        : 0;

    const gstAmount =
      roundCurrency(
        subtotal *
          (gstRate / 100),
      );

    const totalAmount =
      roundCurrency(
        subtotal +
          gstAmount,
      );

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

      subtotal,

      gstRate,

      gstAmount,

      amount:
        totalAmount,

      paymentMethod,

      paymentStatus:
        "pending",

      orderStatus:
        "pending",
    };

    /*
    |--------------------------------------------------------------------------
    | Create order
    |--------------------------------------------------------------------------
    */

    const order =
      await Order.create(
        orderData,
      );

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
        populatedOrder,
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create order.",
    });
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
  const visibleOrder =
    typeof order?.toObject === "function" ? order.toObject() : { ...order };

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
      orders,
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
      order,
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

    return res.status(200).json({ success: true, orders });
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

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get staff order error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
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

    order.orderStatus =
      status;

    await order.save();

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

    return res.status(500).json({
      success: false,
      message:
        "Unable to update order status.",
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
        order.paymentMethod ===
          "cod" &&
        paymentStatus ===
          "collected"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "COD payment must be completed through COD PIN verification.",
        });
      }

      if (
        order.paymentMethod ===
          "cod" &&
        order.paymentStatus ===
          "collected"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "COD payment has already been collected.",
        });
      }

      order.paymentStatus =
        paymentStatus;

      await order.save();

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
          paymentMethod: "cod",
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
        orders,
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
  createOrder,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  getAdminOrderById,
  getStaffOrders,
  getStaffOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateDeliveryLink,
  updateInvoice,
  updateAdminNotes,
  getAdminCodOrders,
};