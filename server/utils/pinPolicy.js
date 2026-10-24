const PIN_TTL_MS = 15 * 60 * 1000;
const PIN_MAX_ATTEMPTS = 5;
const pinHasExpired = (order) => order.codPinStatus === "active" && (
  !order.codPinGeneratedAt ||
  Date.now() - new Date(order.codPinGeneratedAt).getTime() >= PIN_TTL_MS ||
  Number(order.codPinAttempts || 0) >= PIN_MAX_ATTEMPTS
);
module.exports = { PIN_TTL_MS, PIN_MAX_ATTEMPTS, pinHasExpired };
