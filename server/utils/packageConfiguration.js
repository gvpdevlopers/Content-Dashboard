const normalizeAdsService = require("./normalizeAdsService");
const { resolveGridPostPricingMode } = require("./gridPostPricing");

const invalid = (message) => Object.assign(new Error(message), { statusCode: 400 });
const plain = (value) => value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const assertSafeConfiguration = (value, depth = 0) => {
  if (depth > 12) throw invalid("Service configuration is too deeply nested.");
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw invalid("Invalid configuration key.");
      assertSafeConfiguration(child, depth + 1);
    }
  }
};

// Use checkout's schema-driven validation and pricing; missing client details are
// deliberately deferred until checkout, but supplied values must already be valid.
const inspectConfiguration = (stored, entry) => {
  const pricing = require("../controllers/orderController");
  const service = normalizeAdsService(stored);
  const data = entry.formData || {};
  assertSafeConfiguration(data);
  const selection = pricing.resolvePricingSelections({ service, pricingOptionId: entry.pricingOptionId, formData: data });
  if (selection.errors.length) throw invalid(selection.errors.join(" "));
  const selectedOptions = selection.selectedOptions;
  const isGroupedPricing = selectedOptions.some((option) => option.group);
  const groupedQuantities = isGroupedPricing ? pricing.resolveGroupedPricingQuantities(selectedOptions, data) : {};
  pricing.validateQuantityRules({ service, selectedOptions, quantity: entry.quantity, groupedQuantities, isGroupedPricing });
  const fields = pricing.getApplicableFields(service, selectedOptions);
  const groups = (service.repeatableGroups || []).filter((group) => group.isActive !== false);
  const allowed = new Set([...fields.map((field) => field.name), ...groups.map((group) => group.name),
    ...(service.pricingOptions || []).filter((option) => option.isActive !== false && option.group).map((option) => option.group), "pricingQuantities", "pricingMode"]);
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.has(key) || ["__proto__", "constructor", "prototype"].includes(key)) throw invalid(`Unknown configuration field: ${key}.`);
    const field = fields.find((item) => item.name === key);
    if (field) {
      if (field.type !== "checkbox" && typeof value === "object") throw invalid(`${field.label} has an invalid value.`);
      const message = pricing.validateFieldValue({ ...field, required: false }, value);
      if (message) throw invalid(message);
    }
  }
  if (data.pricingQuantities !== undefined && !plain(data.pricingQuantities)) throw invalid("Pricing quantities must be an object.");
  const suppliedGroups = groups.filter((group) => Object.hasOwn(data, group.name)).map((group) => ({ ...group,
    requiredPricingGroups: [], fields: (group.fields || []).map((field) => ({ ...field, required: false })) }));
  const partialService = { ...service, repeatableGroups: suppliedGroups,
    pricingOptions: (service.pricingOptions || []).map((option) => ({ ...option, fields: (option.fields || []).map((field) => ({ ...field, required: false })) })) };
  const errors = pricing.validateRepeatableGroups(partialService, data);
  if (Object.keys(errors).length) throw invalid(`Invalid repeated service configuration: ${JSON.stringify(errors)}`);
  const selectedPricingMode = resolveGridPostPricingMode(service, data.pricingMode);
  if (data.pricingMode && !selectedPricingMode) throw invalid("Invalid service pricing mode.");
  const amount = pricing.calculateOrderAmount({ service, selectedOptions, quantity: entry.quantity,
    fieldAmount: pricing.calculateFieldOptionsAmount(fields, data), groupedQuantities, isGroupedPricing,
    repeatableAmount: pricing.calculateRepeatableGroupsAmount(partialService, data), selectedPricingMode });
  if (!Number.isFinite(amount) || amount < 0) throw invalid("Service configuration produces an invalid price.");
  return { amount, service };
};

// Package defaults are authoritative. Client values only fill details the admin
// left open; both quotes and order creation use the same merge.
const mergeDefaults = (defaults, supplied) => {
  if (Array.isArray(defaults)) return defaults.map((entry, index) => mergeDefaults(entry, Array.isArray(supplied) ? supplied[index] : undefined));
  if (plain(defaults)) {
    const merged = { ...(plain(supplied) ? supplied : {}) };
    for (const [key, value] of Object.entries(defaults)) merged[key] = mergeDefaults(value, merged[key]);
    return merged;
  }
  return defaults === "" || defaults == null ? supplied : defaults;
};
const mergePackageRequests = (item, requests) => {
  if (!Array.isArray(requests) || requests.length !== item.services.length) throw invalid("Include exactly the services in this package.");
  const map = new Map(requests.map((request) => [String(request?.serviceId || "").toLowerCase(), request]));
  if (map.size !== requests.length) throw invalid("Duplicate package services are not allowed.");
  return item.services.map((entry) => {
    const request = map.get(String(entry.service));
    if (!request) throw invalid("Include exactly the services in this package.");
    if (!plain(request.formData || {})) throw invalid("Service formData must be an object.");
    assertSafeConfiguration(request.formData);
    return { serviceId: String(entry.service), quantity: entry.quantity,
      pricingOptionId: entry.pricingOptionId || request.pricingOptionId || "",
      formData: mergeDefaults(entry.formData || {}, request.formData || {}) };
  });
};

module.exports = { inspectConfiguration, mergePackageRequests, invalid, plain };
