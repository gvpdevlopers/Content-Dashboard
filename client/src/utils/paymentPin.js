export const canEnterCashPaymentPin = (order) =>
  order?.paymentMethod === "cod" &&
  order.codPinStatus === "active" &&
  !["paid", "collected"].includes(order.paymentStatus) &&
  !["cancelled", "rejected"].includes(order.orderStatus);

export const getVerifiedPaymentUpdate = (order, response) => response.order ? {
  paymentStatus: response.order.paymentStatus || order.paymentStatus,
  codPinStatus: response.order.codPinStatus || order.codPinStatus,
  codCollectedAt: response.order.codCollectedAt || null,
  codPinVerifiedAt: response.order.codPinVerifiedAt || new Date().toISOString(),
} : {
  paymentStatus: "collected",
  codPinStatus: "used",
  codCollectedAt: new Date().toISOString(),
};
