const toGroupKey = (value) =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_match, next) =>
      next ? next.toUpperCase() : "",
    )
    .replace(/^[A-Z]/, (first) => first.toLowerCase());

const normalizeAdsService = (service) => {
  if (!service) {
    return service;
  }

  const normalizedService = service.toObject
    ? service.toObject()
    : { ...service };

  if (String(normalizedService.slug || "").toLowerCase() !== "ads") {
    return normalizedService;
  }

  const sourceOptions = Array.isArray(normalizedService.pricingOptions)
    ? normalizedService.pricingOptions
    : [];

  const options = sourceOptions.map((option) => ({
    ...(option?.toObject ? option.toObject() : option),
    fields: Array.isArray(option?.fields)
      ? option.fields.map((field) => ({
          ...(field?.toObject ? field.toObject() : field),
        }))
      : [],
  }));

  options.forEach((option) => {
    if (!String(option.group || "").trim()) {
      option.group = toGroupKey(option.name);
    }
  });

  const fieldCounts = new Map();

  options.forEach((option) => {
    option.fields.forEach((field) => {
      const name = String(field.name || "").trim();

      if (name) {
        fieldCounts.set(name, (fieldCounts.get(name) || 0) + 1);
      }
    });
  });

  options.forEach((option) => {
    const groupPrefix = toGroupKey(option.group || option.name);

    option.fields.forEach((field) => {
      const name = String(field.name || "").trim();

      if (name && fieldCounts.get(name) > 1) {
        field.name = `${groupPrefix}${name[0].toUpperCase()}${name.slice(1)}`;
      }
    });
  });

  return {
    ...normalizedService,
    pricingOptions: options,
  };
};

module.exports = normalizeAdsService;
