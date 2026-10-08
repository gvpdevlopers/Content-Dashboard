const getOptionMinimum = (option) => {
  const price = Number(option?.price);
  const quantity = Number(option?.minQuantity ?? 1);

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  return price * (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
};

export const getServiceStartingPrice = (service) => {
  const activeOptions = Array.isArray(service?.pricingOptions)
    ? service.pricingOptions.filter((option) => option?.isActive !== false)
    : [];

  if (activeOptions.length > 0) {
    const requiredRepeatableGroups = (
      service.repeatableGroups || []
    ).flatMap((group) =>
      (group.requiredPricingGroups || []).map((name) => ({
        name: String(name),
        options: activeOptions.filter(
          (option) => String(option.group || "") === String(name),
        ),
      })),
    );

    if (requiredRepeatableGroups.length > 0) {
      let total = 0;

      for (const group of requiredRepeatableGroups) {
        const prices = group.options
          .map(getOptionMinimum)
          .filter((price) => price !== null);

        if (!prices.length) {
          return null;
        }

        total += Math.min(...prices);
      }

      return total > 0 ? total : null;
    }

    const prices = activeOptions
      .map(getOptionMinimum)
      .filter((price) => price !== null && price > 0);

    if (prices.length > 0) {
      return Math.min(...prices);
    }
  }

  const basePrice = Number(service?.basePrice);
  return Number.isFinite(basePrice) && basePrice > 0 ? basePrice : null;
};

export const formatStartingPrice = (price) =>
  `₹${Number(price).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
