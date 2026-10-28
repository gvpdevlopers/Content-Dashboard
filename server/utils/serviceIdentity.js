// HTTP service references must be scalar ObjectId strings. Canonical hex also
// prevents the same MongoDB ID appearing twice with different letter casing.
const normalizeServiceId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value)
  ? value.toLowerCase() : null;
module.exports = { normalizeServiceId };
