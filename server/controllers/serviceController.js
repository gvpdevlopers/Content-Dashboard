const mongoose = require("mongoose");
const Service = require("../models/Service");

/* =========================================================
   Validation Constants
========================================================= */

const VALID_PRICING_TYPES = [
  "fixed",
  "per_unit",
  "starting_from",
  "custom",
];

const VALID_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "select",
  "radio",
  "checkbox",
  "date",
  "url",
];

const OPTION_FIELD_TYPES = [
  "select",
  "radio",
  "checkbox",
];

/* =========================================================
   Validation Helpers
========================================================= */

const isValidNumber = (value) => {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
};

const isNonNegativeNumber = (value) => {
  return (
    isValidNumber(value) &&
    Number(value) >= 0
  );
};

const isPositiveInteger = (value) => {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isInteger(Number(value)) &&
    Number(value) >= 1
  );
};

const isNonNegativeInteger = (value) => {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isInteger(Number(value)) &&
    Number(value) >= 0
  );
};

const isBoolean = (value) => {
  return typeof value === "boolean";
};

const cleanString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeName = (value) => {
  return cleanString(value).toLowerCase();
};

/* =========================================================
   Validate Quantity Range
========================================================= */

const validateQuantityRange = (
  minQuantity,
  maxQuantity,
  label = "Quantity"
) => {
  if (!isPositiveInteger(minQuantity)) {
    return `${label} minimum quantity must be a positive integer.`;
  }

  if (
    maxQuantity !== undefined &&
    maxQuantity !== null &&
    maxQuantity !== ""
  ) {
    if (!isPositiveInteger(maxQuantity)) {
      return `${label} maximum quantity must be a positive integer.`;
    }

    if (Number(minQuantity) > Number(maxQuantity)) {
      return `${label} minimum quantity cannot be greater than maximum quantity.`;
    }
  }

  return null;
};

/* =========================================================
   Validate Field Options
========================================================= */

const validateFieldOptions = (field, fieldPath) => {
  const type = field.type || "text";

  /*
   * Fields that support selectable options.
   */
  if (!OPTION_FIELD_TYPES.includes(type)) {
    if (
      field.options !== undefined &&
      field.options !== null &&
      !Array.isArray(field.options)
    ) {
      return `${fieldPath} options must be an array.`;
    }

    if (
      Array.isArray(field.options) &&
      field.options.length > 0
    ) {
      return `${fieldPath} of type "${type}" cannot contain options.`;
    }

    return null;
  }

  /*
   * Select / radio / checkbox must have options.
   */
  if (!Array.isArray(field.options)) {
    return `${fieldPath} options must be an array.`;
  }

  if (field.options.length === 0) {
    return `${fieldPath} of type "${type}" must contain at least one option.`;
  }

  const optionValues = new Set();

  for (
    let index = 0;
    index < field.options.length;
    index += 1
  ) {
    const option = field.options[index];
    const optionPath = `${fieldPath} option ${index + 1}`;

    if (
      !option ||
      typeof option !== "object" ||
      Array.isArray(option)
    ) {
      return `${optionPath} must be a valid object.`;
    }

    const label = cleanString(option.label);
    const value = cleanString(option.value);

    if (!label) {
      return `${optionPath} label is required.`;
    }

    if (!value) {
      return `${optionPath} value is required.`;
    }

    /*
     * Option values must be unique.
     * Comparison is case-insensitive.
     */
    const normalizedValue = normalizeName(value);

    if (optionValues.has(normalizedValue)) {
      return `${fieldPath} contains duplicate option value "${value}".`;
    }

    optionValues.add(normalizedValue);

    /*
     * Option price must be a valid non-negative number.
     */
    if (!isNonNegativeNumber(option.price)) {
      return `${optionPath} price must be a valid non-negative number.`;
    }
  }

  return null;
};

/* =========================================================
   Validate Individual Field
========================================================= */

const validateField = (field, fieldPath) => {
  if (
    !field ||
    typeof field !== "object" ||
    Array.isArray(field)
  ) {
    return `${fieldPath} must be a valid object.`;
  }

  const name = cleanString(field.name);
  const label = cleanString(field.label);

  if (!name) {
    return `${fieldPath} name is required.`;
  }

  if (!label) {
    return `${fieldPath} label is required.`;
  }

  /*
   * Validate field type.
   */
  if (
    field.type !== undefined &&
    !VALID_FIELD_TYPES.includes(field.type)
  ) {
    return `${fieldPath} has an invalid field type.`;
  }

  const type = field.type || "text";

  /*
   * Required must be boolean.
   */
  if (
    field.required !== undefined &&
    !isBoolean(field.required)
  ) {
    return `${fieldPath} required must be a boolean.`;
  }

  /*
   * Placeholder.
   */
  if (
    field.placeholder !== undefined &&
    field.placeholder !== null
  ) {
    if (typeof field.placeholder !== "string") {
      return `${fieldPath} placeholder must be a string.`;
    }
  }

  /*
   * Help text.
   */
  if (
    field.helpText !== undefined &&
    field.helpText !== null
  ) {
    if (typeof field.helpText !== "string") {
      return `${fieldPath} helpText must be a string.`;
    }
  }

  /*
   * Display order.
   */
  if (
    field.order !== undefined &&
    !isNonNegativeInteger(field.order)
  ) {
    return `${fieldPath} order must be a non-negative integer.`;
  }

  /*
   * Min value.
   */
  if (
    field.min !== undefined &&
    field.min !== null &&
    field.min !== ""
  ) {
    if (!isValidNumber(field.min)) {
      return `${fieldPath} min must be a valid number.`;
    }
  }

  /*
   * Max value.
   */
  if (
    field.max !== undefined &&
    field.max !== null &&
    field.max !== ""
  ) {
    if (!isValidNumber(field.max)) {
      return `${fieldPath} max must be a valid number.`;
    }
  }

  /*
   * Min cannot be greater than max.
   */
  if (
    field.min !== undefined &&
    field.max !== undefined &&
    field.min !== null &&
    field.max !== null &&
    field.min !== "" &&
    field.max !== ""
  ) {
    if (Number(field.min) > Number(field.max)) {
      return `${fieldPath} min cannot be greater than max.`;
    }
  }

  /*
   * Step must be positive.
   */
  if (
    field.step !== undefined &&
    field.step !== null &&
    field.step !== ""
  ) {
    if (
      !isValidNumber(field.step) ||
      Number(field.step) <= 0
    ) {
      return `${fieldPath} step must be a positive number.`;
    }
  }

  /*
   * Min / max / step only make practical sense
   * for number fields.
   *
   * We don't reject them on other field types here
   * because existing service configurations may contain
   * them and the schema supports these properties generally.
   */

  const optionsError = validateFieldOptions(
    field,
    fieldPath
  );

  if (optionsError) {
    return optionsError;
  }

  return null;
};

/* =========================================================
   Validate Field Collection
========================================================= */

const validateFields = (
  fields,
  scopeName = "Service"
) => {
  if (!Array.isArray(fields)) {
    return `${scopeName} fields must be an array.`;
  }

  const fieldNames = new Set();

  for (
    let index = 0;
    index < fields.length;
    index += 1
  ) {
    const field = fields[index];
    const fieldPath = `${scopeName} field ${index + 1}`;

    const fieldError = validateField(
      field,
      fieldPath
    );

    if (fieldError) {
      return fieldError;
    }

    const fieldName = cleanString(field.name);
    const normalizedFieldName =
      normalizeName(fieldName);

    if (fieldNames.has(normalizedFieldName)) {
      return `${scopeName} contains duplicate field name "${fieldName}".`;
    }

    fieldNames.add(normalizedFieldName);
  }

  return null;
};

/* =========================================================
   Validate Pricing Options
========================================================= */

const validatePricingOptions = (
  pricingOptions
) => {
  if (!Array.isArray(pricingOptions)) {
    return "Pricing options must be an array.";
  }

  const pricingOptionIds = new Set();
  const pricingOptionNames = new Set();

  for (
    let index = 0;
    index < pricingOptions.length;
    index += 1
  ) {
    const option = pricingOptions[index];
    const optionPath = `Pricing option ${index + 1}`;

    if (
      !option ||
      typeof option !== "object" ||
      Array.isArray(option)
    ) {
      return `${optionPath} must be a valid object.`;
    }

    const name = cleanString(option.name);
    const unit = cleanString(option.unit);

    /*
     * Name.
     */
    if (!name) {
      return `${optionPath} name is required.`;
    }

    /*
     * Prevent duplicate pricing option names.
     *
     * Comparison is case-insensitive.
     */
    const normalizedName = normalizeName(name);

    if (pricingOptionNames.has(normalizedName)) {
      return `Pricing options contain duplicate name "${name}".`;
    }

    pricingOptionNames.add(normalizedName);

    /*
     * Unit.
     */
    if (!unit) {
      return `${optionPath} unit is required.`;
    }

    /*
     * Price.
     */
    if (!isNonNegativeNumber(option.price)) {
      return `${optionPath} price must be a valid non-negative number.`;
    }

    /*
     * Quantity.
     */
    const quantityError = validateQuantityRange(
      option.minQuantity,
      option.maxQuantity,
      optionPath
    );

    if (quantityError) {
      return quantityError;
    }

    /*
     * Active state.
     */
    if (
      option.isActive !== undefined &&
      !isBoolean(option.isActive)
    ) {
      return `${optionPath} isActive must be a boolean.`;
    }

    /*
     * Display order.
     */
    if (
      option.order !== undefined &&
      !isNonNegativeInteger(option.order)
    ) {
      return `${optionPath} order must be a non-negative integer.`;
    }

    /*
     * Group.
     */
    if (
      option.group !== undefined &&
      option.group !== null
    ) {
      if (typeof option.group !== "string") {
        return `${optionPath} group must be a string.`;
      }

      /*
       * If group is supplied, it cannot only contain spaces.
       */
      if (
        option.group.trim().length === 0
      ) {
        return `${optionPath} group cannot be empty.`;
      }
    }

    /*
     * Pricing option ID.
     *
     * New pricing options can omit _id.
     * Existing options should contain valid ObjectIds.
     */
    if (option._id !== undefined && option._id !== null) {
      const optionId = String(option._id);

      if (
        !mongoose.Types.ObjectId.isValid(optionId)
      ) {
        return `${optionPath} has an invalid ID.`;
      }

      if (pricingOptionIds.has(optionId)) {
        return `${optionPath} contains a duplicate pricing option ID.`;
      }

      pricingOptionIds.add(optionId);
    }

    /*
     * Pricing option fields.
     */
    if (option.fields !== undefined) {
      const fieldsError = validateFields(
        option.fields,
        `${optionPath}`
      );

      if (fieldsError) {
        return fieldsError;
      }
    }
  }

  return null;
};

/* =========================================================
   Validate Complete Service Configuration
========================================================= */

const validateServiceConfiguration = (
  data
) => {
  const {
    name,
    slug,
    category,
    pricingType,
    basePrice,
    minQuantity,
    maxQuantity,
    pricingOptions,
    fields,
    isActive,
    displayOrder,
  } = data;

  /*
   * Basic information.
   */

  if (!cleanString(name)) {
    return "Name is required.";
  }

  if (!cleanString(slug)) {
    return "Slug is required.";
  }

  if (!cleanString(category)) {
    return "Category is required.";
  }

  /*
   * Pricing type.
   */

  if (
    pricingType !== undefined &&
    !VALID_PRICING_TYPES.includes(
      pricingType
    )
  ) {
    return "Invalid pricing type.";
  }

  /*
   * Base price.
   */

  if (!isNonNegativeNumber(basePrice)) {
    return "Base price must be a valid non-negative number.";
  }

  /*
   * Service quantity.
   */

  const quantityError =
    validateQuantityRange(
      minQuantity,
      maxQuantity,
      "Service"
    );

  if (quantityError) {
    return quantityError;
  }

  /*
   * Active state.
   */

  if (
    isActive !== undefined &&
    !isBoolean(isActive)
  ) {
    return "isActive must be a boolean.";
  }

  /*
   * Display order.
   */

  if (
    displayOrder !== undefined &&
    !isNonNegativeInteger(displayOrder)
  ) {
    return "Display order must be a non-negative integer.";
  }

  /*
   * Service fields.
   */

  if (fields !== undefined) {
    const fieldsError = validateFields(
      fields,
      "Service"
    );

    if (fieldsError) {
      return fieldsError;
    }
  }

  /*
   * Pricing options.
   */

  if (pricingOptions !== undefined) {
    const pricingOptionsError =
      validatePricingOptions(
        pricingOptions
      );

    if (pricingOptionsError) {
      return pricingOptionsError;
    }
  }

  return null;
};

/* =========================================================
   Public - Get Active Services
========================================================= */

const getPublicServices = async (
  req,
  res
) => {
  try {
    const services = await Service.find(
      { isActive: true },
      {
        name: 1,
        slug: 1,
        category: 1,
        description: 1,
        pricingType: 1,
        basePrice: 1,
        unit: 1,
        displayOrder: 1,
      }
    ).sort({
      displayOrder: 1,
      name: 1,
    });

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error(
      "Get public services error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch public services.",
    });
  }
};

/* =========================================================
   Client - Get Active Services
========================================================= */

const getActiveServices = async (
  req,
  res
) => {
  try {
    const services = await Service.find({
      isActive: true,
    }).sort({
      displayOrder: 1,
      name: 1,
    });

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error(
      "Get services error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch services.",
    });
  }
};

/* =========================================================
   Client - Get Active Service By ID
========================================================= */

const getServiceById = async (
  req,
  res
) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error(
      "Get service error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch service.",
    });
  }
};

/* =========================================================
   Admin - Get All Services
========================================================= */

const getAdminServices = async (
  req,
  res
) => {
  try {
    const services = await Service.find({})
      .sort({
        displayOrder: 1,
        name: 1,
      });

    return res.status(200).json({
      success: true,
      services,
    });
  } catch (error) {
    console.error(
      "Get admin services error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch services.",
    });
  }
};

/* =========================================================
   Admin - Get Service By ID
========================================================= */

const getAdminServiceById = async (
  req,
  res
) => {
  try {
    const service = await Service.findById(
      req.params.id
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error(
      "Get admin service error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch service.",
    });
  }
};

/* =========================================================
   Admin - Create Service
========================================================= */

const createService = async (
  req,
  res
) => {
  try {
    const {
      name,
      slug,
      category,
      description,
      pricingType,
      basePrice,
      unit,
      minQuantity,
      maxQuantity,
      pricingOptions,
      fields,
      isActive,
      displayOrder,
    } = req.body;

    const normalizedService = {
      name: cleanString(name),

      slug: cleanString(slug).toLowerCase(),

      category: cleanString(category),

      description:
        description !== undefined
          ? String(description).trim()
          : "",

      pricingType:
        pricingType || "fixed",

      basePrice:
        Number(basePrice),

      unit:
        unit !== undefined
          ? String(unit).trim()
          : "",

      minQuantity:
        minQuantity !== undefined &&
        minQuantity !== null &&
        minQuantity !== ""
          ? Number(minQuantity)
          : 1,

      maxQuantity:
        maxQuantity !== undefined &&
        maxQuantity !== null &&
        maxQuantity !== ""
          ? Number(maxQuantity)
          : undefined,

      pricingOptions:
        Array.isArray(pricingOptions)
          ? pricingOptions
          : [],

      fields:
        Array.isArray(fields)
          ? fields
          : [],

      isActive:
        isActive !== undefined
          ? isActive
          : true,

      displayOrder:
        displayOrder !== undefined &&
        displayOrder !== null &&
        displayOrder !== ""
          ? Number(displayOrder)
          : 0,
    };

    /*
     * Validate complete configuration.
     */
    const validationError =
      validateServiceConfiguration(
        normalizedService
      );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    /*
     * Check duplicate slug.
     */
    const existingService =
      await Service.findOne({
        slug: normalizedService.slug,
      });

    if (existingService) {
      return res.status(409).json({
        success: false,
        message:
          "A service with this slug already exists.",
      });
    }

    /*
     * Create service.
     */
    const service =
      await Service.create(
        normalizedService
      );

    return res.status(201).json({
      success: true,
      message:
        "Service created successfully.",
      service,
    });
  } catch (error) {
    console.error(
      "Create service error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A service with this slug already exists.",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create service.",
    });
  }
};

/* =========================================================
   Admin - Update Service
========================================================= */

const updateService = async (
  req,
  res
) => {
  try {
    const service =
      await Service.findById(
        req.params.id
      );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    const {
      name,
      slug,
      category,
      description,
      pricingType,
      basePrice,
      unit,
      minQuantity,
      maxQuantity,
      pricingOptions,
      fields,
      isActive,
      displayOrder,
    } = req.body;

    /*
     * Build the complete resulting configuration.
     *
     * Validation is performed against the final
     * service state, not only the PATCH fields.
     */

    const updatedConfiguration = {
      name:
        name !== undefined
          ? cleanString(name)
          : service.name,

      slug:
        slug !== undefined
          ? cleanString(slug).toLowerCase()
          : service.slug,

      category:
        category !== undefined
          ? cleanString(category)
          : service.category,

      description:
        description !== undefined
          ? String(description).trim()
          : service.description,

      pricingType:
        pricingType !== undefined
          ? pricingType
          : service.pricingType,

      basePrice:
        basePrice !== undefined
          ? Number(basePrice)
          : service.basePrice,

      unit:
        unit !== undefined
          ? String(unit).trim()
          : service.unit,

      minQuantity:
        minQuantity !== undefined
          ? Number(minQuantity)
          : service.minQuantity,

      maxQuantity:
        maxQuantity !== undefined
          ? maxQuantity === null ||
            maxQuantity === ""
            ? undefined
            : Number(maxQuantity)
          : service.maxQuantity,

      pricingOptions:
        pricingOptions !== undefined
          ? pricingOptions
          : service.pricingOptions.map(
              (option) =>
                option.toObject
                  ? option.toObject()
                  : option
            ),

      fields:
        fields !== undefined
          ? fields
          : service.fields.map(
              (field) =>
                field.toObject
                  ? field.toObject()
                  : field
            ),

      isActive:
        isActive !== undefined
          ? isActive
          : service.isActive,

      displayOrder:
        displayOrder !== undefined
          ? Number(displayOrder)
          : service.displayOrder,
    };

    /*
     * Validate complete resulting configuration.
     */
    const validationError =
      validateServiceConfiguration(
        updatedConfiguration
      );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    /*
     * Check slug uniqueness.
     */
    if (slug !== undefined) {
      const existingService =
        await Service.findOne({
          slug:
            updatedConfiguration.slug,
          _id: {
            $ne: service._id,
          },
        });

      if (existingService) {
        return res.status(409).json({
          success: false,
          message:
            "A service with this slug already exists.",
        });
      }
    }

    /*
     * Apply validated configuration.
     */
    service.name =
      updatedConfiguration.name;

    service.slug =
      updatedConfiguration.slug;

    service.category =
      updatedConfiguration.category;

    service.description =
      updatedConfiguration.description;

    service.pricingType =
      updatedConfiguration.pricingType;

    service.basePrice =
      updatedConfiguration.basePrice;

    service.unit =
      updatedConfiguration.unit;

    service.minQuantity =
      updatedConfiguration.minQuantity;

    service.maxQuantity =
      updatedConfiguration.maxQuantity;

    service.pricingOptions =
      updatedConfiguration.pricingOptions;

    service.fields =
      updatedConfiguration.fields;

    service.isActive =
      updatedConfiguration.isActive;

    service.displayOrder =
      updatedConfiguration.displayOrder;

    await service.save();

    return res.status(200).json({
      success: true,
      message:
        "Service updated successfully.",
      service,
    });
  } catch (error) {
    console.error(
      "Update service error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A service with this slug already exists.",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to update service.",
    });
  }
};

/* =========================================================
   Admin - Toggle Service Status
========================================================= */

const toggleServiceStatus = async (
  req,
  res
) => {
  try {
    const service =
      await Service.findById(
        req.params.id
      );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    service.isActive =
      !service.isActive;

    await service.save();

    return res.status(200).json({
      success: true,
      message: service.isActive
        ? "Service activated successfully."
        : "Service deactivated successfully.",
      service,
    });
  } catch (error) {
    console.error(
      "Toggle service status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update service status.",
    });
  }
};

/* =========================================================
   Exports
========================================================= */

module.exports = {
  getPublicServices,
  getActiveServices,
  getServiceById,
  getAdminServices,
  getAdminServiceById,
  createService,
  updateService,
  toggleServiceStatus,
};