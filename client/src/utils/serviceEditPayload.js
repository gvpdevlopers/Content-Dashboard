const isOptionFieldType = (type) => ["select", "radio", "checkbox"].includes(type);
const isNumberFieldType = (type) => type === "number";

const cleanFieldForPayload = (field, index = 0) => {
  const cleaned = {
    name: String(field.name || "").trim(),

    label: String(field.label || "").trim(),

    type: field.type || "text",

    placeholder: String(field.placeholder || "").trim(),

    helpText: String(field.helpText || "").trim(),

    required: Boolean(field.required),
    includeValueInPrice:
      field.type === "number" && Boolean(field.includeValueInPrice),

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

export const buildServiceEditPayload = (form) => ({
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

  // PATCH must explicitly clear a previous limit; omitting it preserves it.
  maxQuantity: form.maxQuantity === "" || form.maxQuantity === null || form.maxQuantity === undefined
    ? null : Number(form.maxQuantity),

  pricingOptions: Array.isArray(form.pricingOptions)
    ? form.pricingOptions.map((option, index) =>
        cleanPricingOptionForPayload(option, index),
      )
    : [],

  fields: Array.isArray(form.fields)
    ? form.fields.map((field, index) => cleanFieldForPayload(field, index))
    : [],

  serviceGroup: form.serviceGroup,
  isPublic: form.isPublic,
  isActive: Boolean(form.isActive),

  displayOrder:
    form.displayOrder === "" ||
    form.displayOrder === null ||
    form.displayOrder === undefined
      ? 0
      : Number(form.displayOrder),
});

