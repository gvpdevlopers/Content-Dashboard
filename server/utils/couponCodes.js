const normalizeCouponCodes = (codes, legacy) => {
  const values = codes === undefined ? (String(legacy || "").trim() ? [legacy] : []) : codes;
  const fail = message => { throw Object.assign(new Error(message), { statusCode: 400 }); };
  if (!Array.isArray(values) || values.length > 5) fail("Apply at most five coupons per order.");
  const normalized = values.map(value => typeof value === "string" ? value.trim().toUpperCase() : "");
  if (normalized.some(code => !/^[A-Z0-9_-]{2,40}$/.test(code))) fail("Coupon code is invalid.");
  if (new Set(normalized).size !== normalized.length) fail("The same coupon cannot be applied twice.");
  return normalized;
};
module.exports = { normalizeCouponCodes };
