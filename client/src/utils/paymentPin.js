export const canEnterPaymentPin = (order) =>
  ["cod", "cheque"].includes(order?.paymentMethod) &&
  order.codPinStatus === "active" &&
  !["paid", "collected"].includes(order.paymentStatus) &&
  !["cancelled", "rejected"].includes(order.orderStatus);

export const canUseOrderPaymentPin = (order, user) => {
  if (!canEnterPaymentPin(order) || user?.role !== "client") return false;
  const ownerId = order.client?._id || order.client;
  const actorId = user._id || user.id;
  return !ownerId || Boolean(actorId && String(ownerId) === String(actorId));
};

export const canViewOrderPaymentPin = (order, user) => {
  if (!canEnterPaymentPin(order)) return false;
  if (user?.role === "admin") return true;
  const actorId = user?._id || user?.id;
  const assignedId = order.codPinEmployee?._id || order.codPinEmployee;
  return user?.role === "employee" && Boolean(actorId && assignedId) && String(actorId) === String(assignedId);
};

export const getVerifiedPaymentUpdate = (order, response) => {
  const verified = response?.order;
  const expectedId = order?._id || order?.id;
  const receivedId = verified?._id || verified?.id;
  if (response?.success === false || !verified || !verified.paymentStatus ||
      (verified.codPinStatus !== "used" || verified.paymentStatus !== "paid") ||
      (expectedId && String(expectedId) !== String(receivedId))) {
    throw new Error("Payment confirmation was incomplete. Refresh the order to check its saved payment status.");
  }
  return { paymentStatus: verified.paymentStatus, codPinStatus: verified.codPinStatus,
    codCollectedAt: verified.codCollectedAt || null,
    codPinVerifiedAt: verified.codPinVerifiedAt || null };
};

// Never show a locally generated secret after another generation replaces it.
export const getCurrentGeneratedPin = (generated, order) => {
  if (!canEnterPaymentPin(order) || !generated?.value || !generated.generatedAt || !order?.codPinGeneratedAt) return "";
  return new Date(generated.generatedAt).getTime() === new Date(order.codPinGeneratedAt).getTime() ? generated.value : "";
};

// Refresh payment metadata without touching unsaved delivery/invoice/note fields.
export const mergeOrderPaymentRefresh = (current, incoming) => {
  if (!current || !incoming || current.codPinStatus !== "active" || ["paid", "collected"].includes(current.paymentStatus)) return current;
  if (new Date(incoming.codPinGeneratedAt).getTime() < new Date(current.codPinGeneratedAt).getTime() ||
      new Date(incoming.updatedAt).getTime() < new Date(current.updatedAt).getTime()) return current;
  const changedGeneration = new Date(incoming.codPinGeneratedAt).getTime() !== new Date(current.codPinGeneratedAt).getTime() || String(incoming.codPinEmployee) !== String(current.codPinEmployee);
  const update = {};
  for (const key of ["orderStatus", "paymentStatus", "codPinStatus", "codPinGeneratedAt", "codPinEmployee", "codPinVerifiedAt", "codCollectedAt", "updatedAt"]) {
    if (incoming[key] !== undefined) update[key] = incoming[key];
  }
  return { ...current, ...update, ...(changedGeneration || incoming.codPinStatus !== "active" || incoming.orderStatus === "cancelled" ? { codPin: null } : {}) };
};
