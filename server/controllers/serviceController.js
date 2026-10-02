const mongoose = require("mongoose");
const Service = require("../models/Service");
const normalizeAdsService = require("../utils/normalizeAdsService");

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
  label = "Quantity",
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

    if (
      Number(minQuantity) >
      Number(maxQuantity)
    ) {
      return `${label} minimum quantity cannot be greater than maximum quantity.`;
    }
  }

  return null;
};

/* =========================================================
   Validate Field Options
========================================================= */

const validateFieldOptions = (
  field,
  fieldPath,
) => {
  const type = field.type || "text";

  /*
  |--------------------------------------------------------------------------
  | Fields that do not support options
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | Fields that require options
  |--------------------------------------------------------------------------
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

    const optionPath =
      `${fieldPath} option ${index + 1}`;

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

    const normalizedValue =
      normalizeName(value);

    if (
      optionValues.has(normalizedValue)
    ) {
      return `${fieldPath} contains duplicate option value "${value}".`;
    }

    optionValues.add(normalizedValue);

    if (!isNonNegativeNumber(option.price)) {
      return `${optionPath} price must be a valid non-negative number.`;
    }
  }

  return null;
};

/* =========================================================
   Validate Individual Field
========================================================= */

const validateField = (
  field,
  fieldPath,
) => {
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

  if (
    field.type !== undefined &&
    !VALID_FIELD_TYPES.includes(field.type)
  ) {
    return `${fieldPath} has an invalid field type.`;
  }

  if (
    field.required !== undefined &&
    !isBoolean(field.required)
  ) {
    return `${fieldPath} required must be a boolean.`;
  }

  if (
    field.placeholder !== undefined &&
    field.placeholder !== null &&
    typeof field.placeholder !== "string"
  ) {
    return `${fieldPath} placeholder must be a string.`;
  }

  if (
    field.helpText !== undefined &&
    field.helpText !== null &&
    typeof field.helpText !== "string"
  ) {
    return `${fieldPath} helpText must be a string.`;
  }

  if (
    field.order !== undefined &&
    !isNonNegativeInteger(field.order)
  ) {
    return `${fieldPath} order must be a non-negative integer.`;
  }

  if (
    field.min !== undefined &&
    field.min !== null &&
    field.min !== ""
  ) {
    if (!isValidNumber(field.min)) {
      return `${fieldPath} min must be a valid number.`;
    }
  }

  if (
    field.max !== undefined &&
    field.max !== null &&
    field.max !== ""
  ) {
    if (!isValidNumber(field.max)) {
      return `${fieldPath} max must be a valid number.`;
    }
  }

  if (
    field.min !== undefined &&
    field.max !== undefined &&
    field.min !== null &&
    field.max !== null &&
    field.min !== "" &&
    field.max !== ""
  ) {
    if (
      Number(field.min) >
      Number(field.max)
    ) {
      return `${fieldPath} min cannot be greater than max.`;
    }
  }

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

  const optionsError =
    validateFieldOptions(
      field,
      fieldPath,
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
  scopeName = "Service",
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

    const fieldPath =
      `${scopeName} field ${index + 1}`;

    const fieldError =
      validateField(
        field,
        fieldPath,
      );

    if (fieldError) {
      return fieldError;
    }

    const fieldName =
      cleanString(field.name);

    const normalizedFieldName =
      normalizeName(fieldName);

    if (
      fieldNames.has(
        normalizedFieldName,
      )
    ) {
      return `${scopeName} contains duplicate field name "${fieldName}".`;
    }

    fieldNames.add(
      normalizedFieldName,
    );
  }

  return null;
};

/* =========================================================
   Validate Repeatable Groups
========================================================= */

const validateRepeatableGroups = (
  repeatableGroups,
  pricingOptions = [],
  scopeName = "Service",
) => {
  if (!Array.isArray(repeatableGroups)) {
    return `${scopeName} repeatable groups must be an array.`;
  }

  /*
  |--------------------------------------------------------------------------
  | Collect available pricing groups
  |--------------------------------------------------------------------------
  */

  const availablePricingGroups = new Set();

  if (Array.isArray(pricingOptions)) {
    pricingOptions.forEach((option) => {
      const groupName =
        normalizeName(option?.group);

      if (groupName) {
        availablePricingGroups.add(
          groupName,
        );
      }
    });
  }

  const groupNames = new Set();

  for (
    let index = 0;
    index < repeatableGroups.length;
    index += 1
  ) {
    const group =
      repeatableGroups[index];

    const groupPath =
      `${scopeName} repeatable group ${index + 1}`;

    /*
    |--------------------------------------------------------------------------
    | Basic object validation
    |--------------------------------------------------------------------------
    */

    if (
      !group ||
      typeof group !== "object" ||
      Array.isArray(group)
    ) {
      return `${groupPath} must be a valid object.`;
    }

    const name =
      cleanString(group.name);

    const label =
      cleanString(group.label);

    if (!name) {
      return `${groupPath} name is required.`;
    }

    if (!label) {
      return `${groupPath} label is required.`;
    }

    /*
    |--------------------------------------------------------------------------
    | Duplicate repeatable group names
    |--------------------------------------------------------------------------
    */

    const normalizedName =
      normalizeName(name);

    if (
      groupNames.has(
        normalizedName,
      )
    ) {
      return `${scopeName} contains duplicate repeatable group name "${name}".`;
    }

    groupNames.add(
      normalizedName,
    );

    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    if (
      group.description !== undefined &&
      group.description !== null &&
      typeof group.description !== "string"
    ) {
      return `${groupPath} description must be a string.`;
    }

    /*
    |--------------------------------------------------------------------------
    | Minimum / Maximum items
    |--------------------------------------------------------------------------
    */

    const minItems =
      group.minItems !== undefined &&
      group.minItems !== null &&
      group.minItems !== ""
        ? group.minItems
        : 1;

    const maxItems =
      group.maxItems !== undefined &&
      group.maxItems !== null &&
      group.maxItems !== ""
        ? group.maxItems
        : 10;

    if (
      !isNonNegativeInteger(
        minItems,
      )
    ) {
      return `${groupPath} minItems must be a non-negative integer.`;
    }

    if (
      !isPositiveInteger(
        maxItems,
      )
    ) {
      return `${groupPath} maxItems must be a positive integer.`;
    }

    if (
      Number(minItems) >
      Number(maxItems)
    ) {
      return `${groupPath} minItems cannot be greater than maxItems.`;
    }

    /*
    |--------------------------------------------------------------------------
    | Active status
    |--------------------------------------------------------------------------
    */

    if (
      group.isActive !== undefined &&
      !isBoolean(group.isActive)
    ) {
      return `${groupPath} isActive must be a boolean.`;
    }

    /*
    |--------------------------------------------------------------------------
    | Display order
    |--------------------------------------------------------------------------
    */

    if (
      group.order !== undefined &&
      !isNonNegativeInteger(
        group.order,
      )
    ) {
      return `${groupPath} order must be a non-negative integer.`;
    }

    /*
    |--------------------------------------------------------------------------
    | Pricing Groups
    |--------------------------------------------------------------------------
    */

    if (
      group.pricingGroups !== undefined &&
      group.pricingGroups !== null &&
      !Array.isArray(group.pricingGroups)
    ) {
      return `${groupPath} pricingGroups must be an array.`;
    }

    const configuredPricingGroups = [];

    if (Array.isArray(group.pricingGroups)) {
      const pricingGroupNames = new Set();

      for (
        let pricingIndex = 0;
        pricingIndex < group.pricingGroups.length;
        pricingIndex += 1
      ) {
        const pricingGroup =
          cleanString(
            group.pricingGroups[
              pricingIndex
            ],
          );

        const pricingGroupPath =
          `${groupPath} pricing group ${pricingIndex + 1}`;

        if (!pricingGroup) {
          return `${pricingGroupPath} must be a non-empty string.`;
        }

        const normalizedPricingGroup =
          normalizeName(pricingGroup);

        /*
        |--------------------------------------------------------------------------
        | Duplicate pricing group references
        |--------------------------------------------------------------------------
        */

        if (
          pricingGroupNames.has(
            normalizedPricingGroup,
          )
        ) {
          return `${groupPath} contains duplicate pricing group "${pricingGroup}".`;
        }

        pricingGroupNames.add(
          normalizedPricingGroup,
        );

        configuredPricingGroups.push(
          pricingGroup,
        );

        /*
        |--------------------------------------------------------------------------
        | Pricing group must exist
        |--------------------------------------------------------------------------
        */

        if (
          !availablePricingGroups.has(
            normalizedPricingGroup,
          )
        ) {
          return `${groupPath} references pricing group "${pricingGroup}", but no matching pricing option group exists.`;
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Required Pricing Groups
    |--------------------------------------------------------------------------
    |
    | Example:
    |
    | pricingGroups: [
    |   "shoot",
    |   "drone",
    |   "host"
    | ]
    |
    | requiredPricingGroups: [
    |   "shoot"
    | ]
    |
    | This means:
    | - Shoot is required
    | - Drone is optional
    | - Host is optional
    |
    */

    if (
      group.requiredPricingGroups !== undefined &&
      group.requiredPricingGroups !== null &&
      !Array.isArray(
        group.requiredPricingGroups,
      )
    ) {
      return `${groupPath} requiredPricingGroups must be an array.`;
    }

    if (
      Array.isArray(
        group.requiredPricingGroups,
      )
    ) {
      const requiredPricingGroupNames =
        new Set();

      const configuredPricingGroupSet =
        new Set(
          configuredPricingGroups.map(
            (value) =>
              normalizeName(value),
          ),
        );

      for (
        let requiredIndex = 0;
        requiredIndex <
        group.requiredPricingGroups.length;
        requiredIndex += 1
      ) {
        const requiredPricingGroup =
          cleanString(
            group.requiredPricingGroups[
              requiredIndex
            ],
          );

        const requiredPricingGroupPath =
          `${groupPath} required pricing group ${requiredIndex + 1}`;

        if (!requiredPricingGroup) {
          return `${requiredPricingGroupPath} must be a non-empty string.`;
        }

        const normalizedRequiredPricingGroup =
          normalizeName(
            requiredPricingGroup,
          );

        /*
        |--------------------------------------------------------------------------
        | Duplicate required pricing groups
        |--------------------------------------------------------------------------
        */

        if (
          requiredPricingGroupNames.has(
            normalizedRequiredPricingGroup,
          )
        ) {
          return `${groupPath} contains duplicate required pricing group "${requiredPricingGroup}".`;
        }

        requiredPricingGroupNames.add(
          normalizedRequiredPricingGroup,
        );

        /*
        |--------------------------------------------------------------------------
        | Required group must exist globally
        |--------------------------------------------------------------------------
        */

        if (
          !availablePricingGroups.has(
            normalizedRequiredPricingGroup,
          )
        ) {
          return `${groupPath} required pricing group "${requiredPricingGroup}" does not exist in the service pricing options.`;
        }

        /*
        |--------------------------------------------------------------------------
        | Required group must be configured
        | inside repeatable group's pricingGroups
        |--------------------------------------------------------------------------
        */

        if (
          !configuredPricingGroupSet.has(
            normalizedRequiredPricingGroup,
          )
        ) {
          return `${groupPath} required pricing group "${requiredPricingGroup}" must also be included in pricingGroups.`;
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Repeatable Fields
    |--------------------------------------------------------------------------
    */

    if (
      group.fields !== undefined
    ) {
      const fieldsError =
        validateFields(
          group.fields,
          groupPath,
        );

      if (fieldsError) {
        return fieldsError;
      }
    }
  }

  return null;
};

/* =========================================================
   Validate Pricing Options
========================================================= */

const validatePricingOptions = (
  pricingOptions,
) => {
  if (!Array.isArray(pricingOptions)) {
    return "Pricing options must be an array.";
  }

  const pricingOptionIds =
    new Set();

  const pricingOptionNames =
    new Set();

  for (
    let index = 0;
    index < pricingOptions.length;
    index += 1
  ) {
    const option =
      pricingOptions[index];

    const optionPath =
      `Pricing option ${index + 1}`;

    if (
      !option ||
      typeof option !== "object" ||
      Array.isArray(option)
    ) {
      return `${optionPath} must be a valid object.`;
    }

    const name =
      cleanString(option.name);

    const unit =
      cleanString(option.unit);

    if (!name) {
      return `${optionPath} name is required.`;
    }

    const normalizedName =
      normalizeName(name);

    if (
      pricingOptionNames.has(
        normalizedName,
      )
    ) {
      return `Pricing options contain duplicate name "${name}".`;
    }

    pricingOptionNames.add(
      normalizedName,
    );

    if (!unit) {
      return `${optionPath} unit is required.`;
    }

    if (
      !isNonNegativeNumber(
        option.price,
      )
    ) {
      return `${optionPath} price must be a valid non-negative number.`;
    }

    const quantityError =
      validateQuantityRange(
        option.minQuantity,
        option.maxQuantity,
        optionPath,
      );

    if (quantityError) {
      return quantityError;
    }

    if (
      option.isActive !== undefined &&
      !isBoolean(option.isActive)
    ) {
      return `${optionPath} isActive must be a boolean.`;
    }

    if (
      option.order !== undefined &&
      !isNonNegativeInteger(
        option.order,
      )
    ) {
      return `${optionPath} order must be a non-negative integer.`;
    }

    /*
    |--------------------------------------------------------------------------
    | Pricing Group
    |--------------------------------------------------------------------------
    */

    if (
      option.group !== undefined &&
      option.group !== null
    ) {
      if (
        typeof option.group !== "string"
      ) {
        return `${optionPath} group must be a string.`;
      }

      if (
        option.group.trim().length === 0
      ) {
        return `${optionPath} group cannot be empty.`;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Pricing Option ID
    |--------------------------------------------------------------------------
    */

    if (
      option._id !== undefined &&
      option._id !== null
    ) {
      const optionId =
        String(option._id);

      if (
        !mongoose.Types.ObjectId.isValid(
          optionId,
        )
      ) {
        return `${optionPath} has an invalid ID.`;
      }

      if (
        pricingOptionIds.has(
          optionId,
        )
      ) {
        return `${optionPath} contains a duplicate pricing option ID.`;
      }

      pricingOptionIds.add(
        optionId,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Pricing Option Fields
    |--------------------------------------------------------------------------
    */

    if (
      option.fields !== undefined
    ) {
      const fieldsError =
        validateFields(
          option.fields,
          optionPath,
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
  data,
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
    repeatableGroups,
    isActive,
    displayOrder,
  } = data;

  /*
  |--------------------------------------------------------------------------
  | Basic Service Information
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | Pricing Type
  |--------------------------------------------------------------------------
  */

  if (
    pricingType !== undefined &&
    !VALID_PRICING_TYPES.includes(
      pricingType,
    )
  ) {
    return "Invalid pricing type.";
  }

  /*
  |--------------------------------------------------------------------------
  | Base Price
  |--------------------------------------------------------------------------
  */

  if (
    !isNonNegativeNumber(
      basePrice,
    )
  ) {
    return "Base price must be a valid non-negative number.";
  }

  /*
  |--------------------------------------------------------------------------
  | Service Quantity
  |--------------------------------------------------------------------------
  */

  const quantityError =
    validateQuantityRange(
      minQuantity,
      maxQuantity,
      "Service",
    );

  if (quantityError) {
    return quantityError;
  }

  /*
  |--------------------------------------------------------------------------
  | Active Status
  |--------------------------------------------------------------------------
  */

  if (
    isActive !== undefined &&
    !isBoolean(isActive)
  ) {
    return "isActive must be a boolean.";
  }

  /*
  |--------------------------------------------------------------------------
  | Display Order
  |--------------------------------------------------------------------------
  */

  if (
    displayOrder !== undefined &&
    !isNonNegativeInteger(
      displayOrder,
    )
  ) {
    return "Display order must be a non-negative integer.";
  }

  /*
  |--------------------------------------------------------------------------
  | Service Fields
  |--------------------------------------------------------------------------
  */

  if (fields !== undefined) {
    const fieldsError =
      validateFields(
        fields,
        "Service",
      );

    if (fieldsError) {
      return fieldsError;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Pricing Options
  |--------------------------------------------------------------------------
  */

  if (pricingOptions !== undefined) {
    const pricingOptionsError =
      validatePricingOptions(
        pricingOptions,
      );

    if (pricingOptionsError) {
      return pricingOptionsError;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Repeatable Groups
  |--------------------------------------------------------------------------
  |
  | Validate AFTER pricing options so that pricingGroups
  | and requiredPricingGroups can be checked against
  | the actual pricing option groups.
  |
  */

  if (
    repeatableGroups !== undefined
  ) {
    const repeatableGroupsError =
      validateRepeatableGroups(
        repeatableGroups,
        pricingOptions || [],
        "Service",
      );

    if (repeatableGroupsError) {
      return repeatableGroupsError;
    }
  }

  return null;
};

/* =========================================================
   Public - Get Active Services
========================================================= */

const getPublicServices = async (
  req,
  res,
) => {
  try {
    const services =
      await Service.find(
        {
          isActive: true,
        },
        {
          name: 1,
          slug: 1,
          category: 1,
          description: 1,
          pricingType: 1,
          basePrice: 1,
          unit: 1,
          displayOrder: 1,
        },
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
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch public services.",
    });
  }
};

/* =========================================================
   Client - Get Active Services
========================================================= */

const getActiveServices = async (
  req,
  res,
) => {
  try {
    const services =
      await Service.find({
        isActive: true,
      }).sort({
        displayOrder: 1,
        name: 1,
      });

    return res.status(200).json({
      success: true,
      services: services.map(normalizeAdsService),
    });
  } catch (error) {
    console.error(
      "Get services error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch services.",
    });
  }
};

/* =========================================================
   Client - Get Active Service By ID
========================================================= */

const getServiceById = async (
  req,
  res,
) => {
  try {
    const service =
      await Service.findOne({
        _id: req.params.id,
        isActive: true,
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        message:
          "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      service: normalizeAdsService(service),
    });
  } catch (error) {
    console.error(
      "Get service error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch service.",
    });
  }
};

/* =========================================================
   Admin - Get All Services
========================================================= */

const getAdminServices = async (
  req,
  res,
) => {
  try {
    const services =
      await Service.find({}).sort({
        displayOrder: 1,
        name: 1,
      });

    return res.status(200).json({
      success: true,
      services: services.map(normalizeAdsService),
    });
  } catch (error) {
    console.error(
      "Get admin services error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch services.",
    });
  }
};

/* =========================================================
   Admin - Get Service By ID
========================================================= */

const getAdminServiceById = async (
  req,
  res,
) => {
  try {
    const service =
      await Service.findById(
        req.params.id,
      );

    if (!service) {
      return res.status(404).json({
        success: false,
        message:
          "Service not found.",
      });
    }

    return res.status(200).json({
      success: true,
      service: normalizeAdsService(service),
    });
  } catch (error) {
    console.error(
      "Get admin service error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch service.",
    });
  }
};

/* =========================================================
   Admin - Create Service
========================================================= */

const createService = async (
  req,
  res,
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
      repeatableGroups,
      isActive,
      displayOrder,
    } = req.body;

    const normalizedService = {
      name:
        cleanString(name),

      slug:
        cleanString(slug).toLowerCase(),

      category:
        cleanString(category),

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

      repeatableGroups:
        Array.isArray(
          repeatableGroups,
        )
          ? repeatableGroups
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
    |--------------------------------------------------------------------------
    | Validate Configuration
    |--------------------------------------------------------------------------
    */

    const validationError =
      validateServiceConfiguration(
        normalizedService,
      );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message:
          validationError,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Duplicate Slug
    |--------------------------------------------------------------------------
    */

    const existingService =
      await Service.findOne({
        slug:
          normalizedService.slug,
      });

    if (existingService) {
      return res.status(409).json({
        success: false,
        message:
          "A service with this slug already exists.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Service
    |--------------------------------------------------------------------------
    */

    const service =
      await Service.create(
        normalizedService,
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
      error,
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
        message:
          error.message,
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
  res,
) => {
  try {
    const service =
      await Service.findById(
        req.params.id,
      );

    if (!service) {
      return res.status(404).json({
        success: false,
        message:
          "Service not found.",
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
      repeatableGroups,
      isActive,
      displayOrder,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Build Complete Updated Configuration
    |--------------------------------------------------------------------------
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
                  : option,
            ),

      fields:
        fields !== undefined
          ? fields
          : service.fields.map(
              (field) =>
                field.toObject
                  ? field.toObject()
                  : field,
            ),

      repeatableGroups:
        repeatableGroups !== undefined
          ? repeatableGroups
          : service.repeatableGroups
            ? service.repeatableGroups.map(
                (group) =>
                  group.toObject
                    ? group.toObject()
                    : group,
              )
            : [],

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
    |--------------------------------------------------------------------------
    | Validate Complete Updated Configuration
    |--------------------------------------------------------------------------
    */

    const validationError =
      validateServiceConfiguration(
        updatedConfiguration,
      );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message:
          validationError,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check Duplicate Slug
    |--------------------------------------------------------------------------
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
    |--------------------------------------------------------------------------
    | Update Service
    |--------------------------------------------------------------------------
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

    service.repeatableGroups =
      updatedConfiguration.repeatableGroups;

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
      error,
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
        message:
          error.message,
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
  res,
) => {
  try {
    const service =
      await Service.findById(
        req.params.id,
      );

    if (!service) {
      return res.status(404).json({
        success: false,
        message:
          "Service not found.",
      });
    }

    service.isActive =
      !service.isActive;

    await service.save();

    return res.status(200).json({
      success: true,
      message:
        service.isActive
          ? "Service activated successfully."
          : "Service deactivated successfully.",
      service,
    });
  } catch (error) {
    console.error(
      "Toggle service status error:",
      error,
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