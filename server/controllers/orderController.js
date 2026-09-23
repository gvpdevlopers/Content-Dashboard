const Order = require("../models/Order");
const Service = require("../models/Service");
const generateOrderNumber = require("../utils/generateOrderNumber");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Check whether a value should be treated as empty.
 */
const isEmptyValue = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
};

/**
 * Convert a value to a string safely.
 */
const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

/**
 * Validate one dynamic service field.
 */
const validateFieldValue = (field, value) => {
  /*
   * Checkbox fields can legitimately be false.
   */
  if (field.type === "checkbox") {
    /*
     * Support both:
     *
     * true / false
     *
     * and arrays for future multi-select checkbox fields.
     */
    if (Array.isArray(value)) {
      if (field.required && value.length === 0) {
        return `${field.label} is required.`;
      }

      const allowedValues = (field.options || []).map((option) =>
        String(option.value),
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

  /*
   * Optional empty field is valid.
   */
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
        numberValue < field.min
      ) {
        return `${field.label} must be at least ${field.min}.`;
      }

      if (
        field.max !== undefined &&
        field.max !== null &&
        numberValue > field.max
      ) {
        return `${field.label} must not exceed ${field.max}.`;
      }

      if (field.step !== undefined && field.step !== null && field.step > 0) {
        const remainder = numberValue % field.step;

        if (Math.abs(remainder) > 0.000001) {
          return `${field.label} must use increments of ${field.step}.`;
        }
      }

      break;
    }

    case "select":
    case "radio": {
      const allowedValues = (field.options || []).map((option) =>
        String(option.value),
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

/**
 * Validate dynamic fields.
 */
const validateFormData = (serviceFields = [], formData = {}) => {
  const errors = {};

  for (const field of serviceFields) {
    const value = formData[field.name];

    const error = validateFieldValue(field, value);

    if (error) {
      errors[field.name] = error;
    }
  }

  return errors;
};

/**
 * Keep only fields configured by the service.
 */
const cleanFormData = (serviceFields = [], formData = {}) => {
  const cleaned = {};

  for (const field of serviceFields) {
    if (formData[field.name] !== undefined && formData[field.name] !== null) {
      cleaned[field.name] = formData[field.name];
    }
  }

  return cleaned;
};

/**
 * Merge fields from:
 *
 * 1. Service
 * 2. All selected pricing options
 *
 * If the same field name exists in multiple places,
 * the later pricing-option field takes precedence.
 */
/**
 * Merge fields from:
 *
 * 1. Service
 * 2. Selected pricing options
 *
 * Pricing-option fields are included only for the pricing options
 * that were actually selected for the order.
 *
 * This works for both:
 *
 * - Normal pricing:
 *     Service
 *       └── Selected Pricing Option
 *             └── Option-specific fields
 *
 * - Grouped pricing:
 *     Service
 *       ├── Shoot
 *       │     └── Selected Shoot Option
 *       │           └── Option-specific fields
 *       ├── Drone
 *       │     └── Selected Drone Option
 *       │           └── Option-specific fields
 *       └── Host
 *             └── Selected Host Option
 *                   └── Option-specific fields
 *
 * Only fields belonging to selected pricing options are included.
 *
 * If the same field name exists in multiple places, the selected
 * pricing-option field takes precedence over the service-level field.
 */
const getApplicableFields = (
  service,
  pricingOptions = [],
  isGroupedPricing = false,
) => {
  const fields = new Map();

  // ---------------------------------------------------------
  // SERVICE-LEVEL FIELDS
  // ---------------------------------------------------------
  //
  // These are common fields for the entire service and should
  // always be available.
  //
  // Example:
  // - Shoot Location
  // - Preferred Shoot Date
  // - Reference / Inspiration Link
  //
  for (const field of service.fields || []) {
    if (!field?.name) continue;

    const fieldName = String(field.name).trim();

    if (!fieldName) continue;

    fields.set(fieldName, field);
  }

  // ---------------------------------------------------------
  // SELECTED PRICING-OPTION FIELDS
  // ---------------------------------------------------------
  //
  // pricingOptions contains ONLY the pricing options that were
  // selected for this order.
  //
  // For normal pricing this is normally one selected option.
  //
  // For grouped pricing this can contain multiple selected
  // options, for example:
  //
  // - Shoot
  // - Drone
  // - Host
  //
  // Therefore grouped pricing must also include fields from
  // each selected option.
  //
  // The isGroupedPricing argument is intentionally retained for
  // compatibility with the existing callers. It no longer
  // changes field resolution because selected pricing options
  // should work consistently in both pricing modes.
  //
  for (const pricingOption of pricingOptions || []) {
    if (!pricingOption) continue;

    for (const field of pricingOption.fields || []) {
      if (!field?.name) continue;

      const fieldName = String(field.name).trim();

      if (!fieldName) continue;

      // Pricing-option-specific fields override a service-level
      // field with the same name.
      fields.set(fieldName, field);
    }
  }

  return Array.from(fields.values()).sort(
    (a, b) => Number(a.order || 0) - Number(b.order || 0),
  );
};

/**
 * Validate and normalize quantity.
 */
const validateQuantity = (quantity) => {
  const parsedQuantity = Number(quantity);

  if (
    !Number.isFinite(parsedQuantity) ||
    !Number.isInteger(parsedQuantity) ||
    parsedQuantity < 1
  ) {
    return null;
  }

  return parsedQuantity;
};

/*
|--------------------------------------------------------------------------
| Pricing Option Helpers
|--------------------------------------------------------------------------
*/

/**
 * Find an active pricing option by ID.
 */
const findPricingOption = (service, pricingOptionId) => {
  if (!pricingOptionId) {
    return null;
  }

  if (!Array.isArray(service.pricingOptions)) {
    return null;
  }

  return (
    service.pricingOptions.find(
      (option) =>
        option._id &&
        option._id.toString() === pricingOptionId.toString() &&
        option.isActive,
    ) || null
  );
};

/**
 * Find an active pricing option by group and submitted value.
 *
 * Pricing options currently have:
 *
 * - name
 * - group
 *
 * They do not have a separate "value" property.
 *
 * Therefore the submitted value can match:
 *
 * - option name
 * - option _id
 */
const findPricingOptionByGroupValue = (service, group, value) => {
  if (isEmptyValue(group) || isEmptyValue(value)) {
    return null;
  }

  if (!Array.isArray(service.pricingOptions)) {
    return null;
  }

  const normalizedGroup = normalizeString(group).toLowerCase();
  const normalizedValue = normalizeString(value).toLowerCase();

  return (
    service.pricingOptions.find((option) => {
      if (!option.isActive) {
        return false;
      }

      if (normalizeString(option.group).toLowerCase() !== normalizedGroup) {
        return false;
      }

      const optionName = normalizeString(option.name).toLowerCase();

      const optionId = option._id?.toString().toLowerCase();

      return optionName === normalizedValue || optionId === normalizedValue;
    }) || null
  );
};

/**
 * Get all active pricing groups.
 */
const getPricingGroups = (service) => {
  const groups = new Map();

  for (const option of service.pricingOptions || []) {
    if (!option.isActive) {
      continue;
    }

    const group = normalizeString(option.group);

    if (!group) {
      continue;
    }

    if (!groups.has(group)) {
      groups.set(group, []);
    }

    groups.get(group).push(option);
  }

  return groups;
};

/**
 * Resolve grouped pricing selections from formData.
 *
 * Generic supported examples:
 *
 * {
 *   shoot: "iPhone Shoot",
 *   drone: true,
 *   host: "Exclusive Host"
 * }
 *
 * or:
 *
 * {
 *   camera: "Professional",
 *   extras: ["Drone", "Lighting"]
 * }
 *
 * Boolean groups:
 *
 * true  -> first active option in that group
 * false -> no option selected
 *
 * String groups:
 *
 * value is matched against pricing option name or id.
 *
 * Array groups:
 *
 * every value is resolved to an active pricing option.
 */

const getPricingOptions = (service) => {
  return Array.isArray(service.pricingOptions)
    ? service.pricingOptions.filter((option) => option.isActive)
    : [];
};

const resolveGroupedPricingOptions = (service, formData = {}) => {
  const activeOptions = getPricingOptions(service);

  const groupedOptions = activeOptions.reduce((groups, option) => {
    const group = normalizeString(option.group);

    if (!group) {
      return groups;
    }

    if (!groups[group]) {
      groups[group] = [];
    }

    groups[group].push(option);

    return groups;
  }, {});

  const selectedOptions = [];

  Object.entries(groupedOptions).forEach(([group, options]) => {
    const selectedValue = formData[group];

    // Optional group not selected.
    if (
      selectedValue === undefined ||
      selectedValue === null ||
      selectedValue === "" ||
      selectedValue === false
    ) {
      return;
    }

    // Multiple selections are supported for checkbox-style payloads.
    const values = Array.isArray(selectedValue)
      ? selectedValue
      : [selectedValue];

    values.forEach((value) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      const normalizedValue = normalizeString(value).toLowerCase();

      const matchedOption = options.find((option) => {
        const optionName = normalizeString(option.name).toLowerCase();

        const optionId = String(option._id);

        return optionName === normalizedValue || optionId === String(value);
      });

      if (!matchedOption) {
        throw new Error(
          `Invalid pricing option selected for group "${group}".`,
        );
      }

      const alreadySelected = selectedOptions.some(
        (option) => String(option._id) === String(matchedOption._id),
      );

      if (!alreadySelected) {
        selectedOptions.push(matchedOption);
      }
    });
  });

  return selectedOptions;
};

const resolveGroupedPricingQuantities = (selectedOptions, formData = {}) => {
  const pricingQuantities = formData.pricingQuantities || {};

  if (pricingQuantities !== null && typeof pricingQuantities !== "object") {
    throw new Error("Pricing quantities must be an object.");
  }

  const resolved = {};

  selectedOptions.forEach((option) => {
    const group = normalizeString(option.group);

    if (!group) {
      return;
    }

    const rawQuantity = pricingQuantities[group];

    // If no quantity was supplied, use the option's minimum quantity.
    const quantity =
      rawQuantity === undefined || rawQuantity === null || rawQuantity === ""
        ? Number(option.minQuantity || 1)
        : Number(rawQuantity);

    if (!Number.isInteger(quantity)) {
      throw new Error(`Quantity for "${option.name}" must be a whole number.`);
    }

    const minQuantity = Number(option.minQuantity || 1);

    const maxQuantity =
      option.maxQuantity !== undefined && option.maxQuantity !== null
        ? Number(option.maxQuantity)
        : undefined;

    if (quantity < minQuantity) {
      throw new Error(
        `"${option.name}" requires a minimum quantity of ${minQuantity}.`,
      );
    }

    if (maxQuantity !== undefined && quantity > maxQuantity) {
      throw new Error(
        `"${option.name}" allows a maximum quantity of ${maxQuantity}.`,
      );
    }

    resolved[group] = quantity;
  });

  return resolved;
};

/**
 * Resolve all pricing selections.
 *
 * There are two supported modes:
 *
 * 1. Explicit pricingOptionId
 *    - Existing single pricing-option flow.
 *
 * 2. Grouped pricing
 *    - Pricing options have group values.
 *    - Selections come from formData.
 */
const resolvePricingSelections = ({ service, pricingOptionId, formData }) => {
  const errors = [];

  /*
  |--------------------------------------------------------------------------
  | Explicit single pricing option
  |--------------------------------------------------------------------------
  */

  if (pricingOptionId) {
    const pricingOption = findPricingOption(service, pricingOptionId);

    if (!pricingOption) {
      errors.push("Selected pricing option is not available.");

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

  /*
  |--------------------------------------------------------------------------
  | Grouped pricing
  |--------------------------------------------------------------------------
  */

  const hasGroupedPricing =
    Array.isArray(service.pricingOptions) &&
    service.pricingOptions.some(
      (option) => option.isActive && normalizeString(option.group) !== "",
    );

  if (hasGroupedPricing) {
    try {
      const selectedOptions = resolveGroupedPricingOptions(service, formData);

      return {
        errors,
        pricingOption: null,
        selectedOptions,
      };
    } catch (error) {
      return {
        errors: [error.message],
        pricingOption: null,
        selectedOptions: [],
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | No pricing option
  |--------------------------------------------------------------------------
  */

  return {
    errors,
    pricingOption: null,
    selectedOptions: [],
  };
};

/*
|--------------------------------------------------------------------------
| Quantity Rules
|--------------------------------------------------------------------------
*/

/**
 * Validate service/pricing option quantity rules.
 *
 * For multiple pricing options, every selected option's
 * quantity rules are checked.
 */
const validateQuantityRules = ({
  service,
  pricingOptions,
  quantity,
  groupedQuantities = {},
  isGroupedPricing = false,
}) => {
  if (isGroupedPricing) {
    for (const option of pricingOptions) {
      const group = normalizeString(option.group);

      if (!group) {
        continue;
      }

      const optionQuantity = groupedQuantities[group];

      // Selected options should always have a resolved quantity.
      if (optionQuantity === undefined) {
        throw new Error(
          `Quantity is missing for pricing option "${option.name}".`,
        );
      }

      const minQuantity = Number(option.minQuantity || 1);

      const maxQuantity =
        option.maxQuantity !== undefined && option.maxQuantity !== null
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

      if (maxQuantity !== undefined && optionQuantity > maxQuantity) {
        throw new Error(
          `"${option.name}" allows a maximum quantity of ${maxQuantity}.`,
        );
      }
    }

    return;
  }

  // Existing normal-service quantity validation.
  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
    throw new Error("Quantity must be a whole number greater than 0.");
  }

  const serviceMin = Number(service.minQuantity || 1);

  const serviceMax =
    service.maxQuantity !== undefined && service.maxQuantity !== null
      ? Number(service.maxQuantity)
      : undefined;

  if (parsedQuantity < serviceMin) {
    throw new Error(`Minimum quantity for this service is ${serviceMin}.`);
  }

  if (serviceMax !== undefined && parsedQuantity > serviceMax) {
    throw new Error(`Maximum quantity for this service is ${serviceMax}.`);
  }

  for (const option of pricingOptions) {
    const minQuantity = Number(option.minQuantity || 1);

    const maxQuantity =
      option.maxQuantity !== undefined && option.maxQuantity !== null
        ? Number(option.maxQuantity)
        : undefined;

    if (parsedQuantity < minQuantity) {
      throw new Error(
        `"${option.name}" requires a minimum quantity of ${minQuantity}.`,
      );
    }

    if (maxQuantity !== undefined && parsedQuantity > maxQuantity) {
      throw new Error(
        `"${option.name}" allows a maximum quantity of ${maxQuantity}.`,
      );
    }
  }
};

/*
|--------------------------------------------------------------------------
| Dynamic Field Pricing
|--------------------------------------------------------------------------
*/

/**
 * Get the price contributed by one field value.
 *
 * Pricing is configured on:
 *
 * field.options[].price
 */
const calculateFieldOptionPrice = (field, value) => {
  if (!field || !Array.isArray(field.options)) {
    return 0;
  }

  if (isEmptyValue(value)) {
    return 0;
  }

  /*
   * Checkbox multiple selection.
   */
  if (Array.isArray(value)) {
    return value.reduce((total, selectedValue) => {
      const option = field.options.find(
        (item) => String(item.value) === String(selectedValue),
      );

      return total + Number(option?.price || 0);
    }, 0);
  }

  /*
   * Boolean checkbox.
   *
   * If true, use the matching true option when
   * one exists.
   */
  if (field.type === "checkbox" && typeof value === "boolean") {
    if (!value) {
      return 0;
    }

    const trueOption = field.options.find(
      (option) => String(option.value).toLowerCase() === "true",
    );

    return Number(trueOption?.price || 0);
  }

  /*
   * Select / radio / other single selection.
   */
  const option = field.options.find(
    (item) => String(item.value) === String(value),
  );

  return Number(option?.price || 0);
};

/**
 * Calculate all dynamic field option pricing.
 */
const calculateFieldOptionsAmount = (applicableFields, formData) => {
  return applicableFields.reduce((total, field) => {
    return total + calculateFieldOptionPrice(field, formData[field.name]);
  }, 0);
};

/*
|--------------------------------------------------------------------------
| Order Amount
|--------------------------------------------------------------------------
*/

/**
 * Calculate the order amount on the SERVER.
 *
 * The frontend amount must never be trusted.
 *
 * Pricing calculation:
 *
 * 1. Multiple selected pricing options
 * 2. Single selected pricing option
 * 3. Service pricing type
 * 4. Dynamic field option prices
 */
const calculateOrderAmount = ({
  service,
  selectedOptions,
  quantity,
  fieldAmount = 0,
  groupedQuantities = {},
  isGroupedPricing = false,
}) => {
  let amount = 0;

  if (isGroupedPricing) {
    for (const option of selectedOptions) {
      const group = normalizeString(option.group);

      const optionQuantity =
        groupedQuantities[group] ?? Number(option.minQuantity || 1);

      amount += Number(option.price || 0) * optionQuantity;
    }
  } else if (selectedOptions.length > 0) {
    const option = selectedOptions[0];

    amount = Number(option.price || 0) * Number(quantity);
  } else {
    const pricingType = service.pricingType;

    if (pricingType === "per_unit") {
      amount = Number(service.basePrice || 0) * Number(quantity);
    } else {
      amount = Number(service.basePrice || 0);
    }
  }

  amount += Number(fieldAmount || 0);

  return amount;
};

/*
|--------------------------------------------------------------------------
| Service Snapshot
|--------------------------------------------------------------------------
*/

/**
 * Create immutable service snapshot.
 *
 * The snapshot stores the configuration actually used
 * when the order was created.
 */
const createServiceSnapshot = ({
  service,
  selectedOptions = [],
  groupedQuantities = {},
}) => {
  const selectedOptionSnapshots = selectedOptions.map((option) => {
    const group = normalizeString(option.group);

    const selectedQuantity =
      groupedQuantities[group] ?? Number(option.minQuantity || 1);

    return {
      id: option._id,
      name: option.name,
      description: option.description,
      price: option.price,
      unit: option.unit,
      group: option.group,
      quantity: selectedQuantity,
      minQuantity: option.minQuantity,
      maxQuantity: option.maxQuantity,
      isActive: option.isActive,
    };
  });

  return {
    serviceId: service._id,
    name: service.name,
    slug: service.slug,
    category: service.category,
    description: service.description,
    pricingType: service.pricingType,
    basePrice: service.basePrice,
    unit: service.unit,
    minQuantity: service.minQuantity,
    maxQuantity: service.maxQuantity,

    // Keep existing backwards-compatible field.
    selectedOption:
      selectedOptionSnapshots.length === 1 ? selectedOptionSnapshots[0] : null,

    // New complete selection snapshot.
    selectedOptions: selectedOptionSnapshots,
  };
};

/*
|--------------------------------------------------------------------------
| Create Order
|--------------------------------------------------------------------------
*/

const createOrder = async (req, res) => {
  try {
    const {
      serviceId,
      pricingOptionId,
      quantity = 1,
      formData = {},
      additionalRequirements = "",
      paymentMethod,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | 1. Basic request validation
    |--------------------------------------------------------------------------
    */

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: "Service is required.",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required.",
      });
    }

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    if (
      formData === null ||
      typeof formData !== "object" ||
      Array.isArray(formData)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid form data.",
      });
    }

    if (
      additionalRequirements !== undefined &&
      additionalRequirements !== null &&
      typeof additionalRequirements !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Additional requirements must be a string.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Find active service
    |--------------------------------------------------------------------------
    */

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Selected service is not available.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Determine whether this is grouped pricing
    |--------------------------------------------------------------------------
    */

    const isGroupedPricing =
      Array.isArray(service.pricingOptions) &&
      service.pricingOptions.some(
        (option) => option.isActive && normalizeString(option.group) !== "",
      );

    /*
    |--------------------------------------------------------------------------
    | 4. Prepare form data
    |--------------------------------------------------------------------------
    |
    | pricingQuantities is internal pricing information.
    | It should be used for calculation/validation but should NOT
    | be treated as a dynamic service field.
    |
    */

    const submittedFormData = {
      ...formData,
    };

    let pricingQuantities = {};

    if (isGroupedPricing) {
      pricingQuantities = submittedFormData.pricingQuantities || {};

      if (
        pricingQuantities === null ||
        typeof pricingQuantities !== "object" ||
        Array.isArray(pricingQuantities)
      ) {
        return res.status(400).json({
          success: false,
          message: "Pricing quantities must be an object.",
        });
      }

      /*
       * Remove pricingQuantities before dynamic-field validation.
       */
      delete submittedFormData.pricingQuantities;
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Validate normal-service quantity
    |--------------------------------------------------------------------------
    |
    | Grouped services use per-group quantities instead.
    |
    */

    let parsedQuantity = 1;

    if (!isGroupedPricing) {
      parsedQuantity = validateQuantity(quantity);

      if (!parsedQuantity) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a valid positive whole number.",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Resolve pricing selections
    |--------------------------------------------------------------------------
    */

    const {
      errors: pricingErrors,
      pricingOption,
      selectedOptions,
    } = resolvePricingSelections({
      service,
      pricingOptionId,
      formData: submittedFormData,
    });

    if (pricingErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the pricing selections.",
        errors: pricingErrors,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 7. Resolve per-group quantities
    |--------------------------------------------------------------------------
    */

    let groupedQuantities = {};

    if (isGroupedPricing) {
      try {
        groupedQuantities = resolveGroupedPricingQuantities(
          selectedOptions,
          pricingQuantities,
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | 8. Validate quantity rules
    |--------------------------------------------------------------------------
    */

    try {
      validateQuantityRules({
        service,
        pricingOptions: selectedOptions,
        quantity: parsedQuantity,
        groupedQuantities,
        isGroupedPricing,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 9. Determine applicable dynamic fields
    |--------------------------------------------------------------------------
    |
    | This includes:
    |
    | - service.fields
    | - selected pricing option fields
    |
    | For Reels, selecting Camera will therefore include:
    |
    | - shootLocation
    | - preferredShootDate
    | - referenceLink
    | - requirements
    |
    */

    const applicableFields = getApplicableFields(
      service,
      selectedOptions,
      isGroupedPricing,
    );

    /*
    |--------------------------------------------------------------------------
    | 10. Validate dynamic fields
    |--------------------------------------------------------------------------
    */

    const validationErrors = validateFormData(
      applicableFields,
      submittedFormData,
    );

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Please correct the form fields.",
        errors: validationErrors,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 11. Clean dynamic form data
    |--------------------------------------------------------------------------
    */

    const cleanFormDataResult = cleanFormData(
      applicableFields,
      submittedFormData,
    );

    /*
    |--------------------------------------------------------------------------
    | 12. Calculate dynamic field pricing
    |--------------------------------------------------------------------------
    */

    const fieldAmount = calculateFieldOptionsAmount(
      applicableFields,
      cleanFormDataResult,
    );

    /*
    |--------------------------------------------------------------------------
    | 13. Calculate final amount server-side
    |--------------------------------------------------------------------------
    */

    const amount = calculateOrderAmount({
      service,
      selectedOptions,
      quantity: parsedQuantity,
      fieldAmount,
      groupedQuantities,
      isGroupedPricing,
    });

    /*
    |--------------------------------------------------------------------------
    | 14. Generate unique order number
    |--------------------------------------------------------------------------
    */

    let orderNumber;
    let orderNumberExists = true;

    while (orderNumberExists) {
      orderNumber = generateOrderNumber();

      const existingOrder = await Order.findOne({
        orderNumber,
      });

      orderNumberExists = !!existingOrder;
    }

    /*
    |--------------------------------------------------------------------------
    | 15. Create immutable service snapshot
    |--------------------------------------------------------------------------
    */

    const serviceSnapshot = createServiceSnapshot({
      service,
      pricingOption,
      selectedOptions,
      groupedQuantities,
    });

    /*
    |--------------------------------------------------------------------------
    | 16. Create order
    |--------------------------------------------------------------------------
    */

    const order = await Order.create({
      orderNumber,

      // Client comes from authenticated JWT.
      client: req.user.userId,

      service: service._id,

      serviceSnapshot,

      /*
       * Normal services:
       *
       * quantity = selected quantity
       *
       * Grouped services:
       *
       * quantity = 1
       * Actual quantities are stored inside
       * serviceSnapshot.selectedOptions[].quantity
       */
      quantity: isGroupedPricing ? 1 : parsedQuantity,

      formData: cleanFormDataResult,

      additionalRequirements:
        typeof additionalRequirements === "string"
          ? additionalRequirements.trim()
          : "",

      amount,

      paymentMethod,

      paymentStatus: "pending",

      orderStatus: "pending",
    });

    /*
    |--------------------------------------------------------------------------
    | 17. Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      success: true,

      message: "Order created successfully.",

      order: {
        id: order._id,

        orderNumber: order.orderNumber,

        service: order.serviceSnapshot,

        quantity: order.quantity,

        amount: order.amount,

        paymentMethod: order.paymentMethod,

        paymentStatus: order.paymentStatus,

        orderStatus: order.orderStatus,

        formData: Object.fromEntries(order.formData),

        additionalRequirements: order.additionalRequirements,

        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create order.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Client - Get My Orders
|--------------------------------------------------------------------------
*/

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      client: req.user.userId,
    })
      .select("-codPin")
      .populate("service", "name category")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Client - Get Single Order
|--------------------------------------------------------------------------
*/

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      client: req.user.userId,
    })
      .select("-codPin")
      .populate("service", "name category");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get All Orders
|--------------------------------------------------------------------------
*/

const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .select("-codPin")
      .populate("client", "name email username")
      .populate("service", "name category")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get admin orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get Single Order
|--------------------------------------------------------------------------
*/

const getAdminOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select("-codPin")
      .populate("client", "name email username")
      .populate("service", "name category");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get admin order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch order.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Update Order Status
|--------------------------------------------------------------------------
*/

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

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
        message: "Order status is required.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.orderStatus = status;

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .select("-codPin")
      .populate("client", "name email username")
      .populate("service", "name category");

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Update Payment Status
|--------------------------------------------------------------------------
*/

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "paid",
      "failed",
      "collected",
    ];

    if (!paymentStatus || !allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    /*
     * COD payment must go through
     * the COD verification flow.
     */
    if (order.paymentMethod === "cod" && paymentStatus === "collected") {
      return res.status(400).json({
        success: false,
        message: "COD payment must be completed through COD PIN verification.",
      });
    }

    /*
     * Prevent changing an already
     * collected COD payment.
     */
    if (order.paymentMethod === "cod" && order.paymentStatus === "collected") {
      return res.status(400).json({
        success: false,
        message: "COD payment has already been collected.",
      });
    }

    order.paymentStatus = paymentStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("Update payment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update payment status.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Update Notes
|--------------------------------------------------------------------------
*/

const updateAdminNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({
        success: false,
        message: "Notes must be a string.",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    order.notes = typeof notes === "string" ? notes.trim() : "";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Admin notes updated successfully.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        notes: order.notes,
      },
    });
  } catch (error) {
    console.error("Update admin notes error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update admin notes.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Admin - Get All COD Orders
|--------------------------------------------------------------------------
*/

const getAdminCodOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      paymentMethod: "cod",
    })
      .select("-codPin")
      .populate("client", "name email username")
      .populate("service", "name category")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get admin COD orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch COD orders.",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  updateAdminNotes,
  getAdminCodOrders,
};
