const PIN_MAX_ATTEMPTS = 5;
const pinIsLocked = (order) => order.codPinStatus === "active" && (
  !order.codPinGeneratedAt ||
  Number(order.codPinAttempts || 0) >= PIN_MAX_ATTEMPTS
);
module.exports = { PIN_MAX_ATTEMPTS, pinIsLocked };
