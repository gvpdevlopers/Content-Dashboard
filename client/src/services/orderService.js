import api from "./api";

const getPaymentPricing = async () => {
  const response = await api.get("/orders/payment-pricing");

  return response.data;
};

let pendingCheckout = null;
const checkoutStorageKey = "content-dashboard:pending-checkout";

const clearPendingCheckout = () => {
  pendingCheckout = null;
  try { sessionStorage.removeItem(checkoutStorageKey); } catch { /* Storage may be disabled. */ }
};

const createOrder = async (orderData) => {
  const payload = JSON.stringify(orderData);
  const canPersist = Boolean(globalThis.crypto?.subtle);
  const bytes = new TextEncoder().encode(payload);
  const digest = canPersist ? await crypto.subtle.digest("SHA-256", bytes) : null;
  // LAN HTTP development lacks SubtleCrypto. Keep its raw payload in memory only.
  const fingerprint = digest
    ? Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("")
    : payload;
  if (!pendingCheckout && canPersist) {
    try { pendingCheckout = JSON.parse(sessionStorage.getItem(checkoutStorageKey)); }
    catch { pendingCheckout = null; }
  }
  if (pendingCheckout?.fingerprint !== fingerprint ||
      !/^[a-zA-Z0-9_-]{16,100}$/.test(pendingCheckout?.key || "")) {
    const key = Array.from(crypto.getRandomValues(new Uint8Array(24)),
      (value) => value.toString(16).padStart(2, "0")).join("");
    pendingCheckout = { fingerprint, key };
    try {
      if (canPersist) sessionStorage.setItem(checkoutStorageKey, JSON.stringify(pendingCheckout));
    }
    catch { /* The in-memory key still protects retries in this tab. */ }
  }
  const response = await api.post("/orders", orderData, {
    headers: { "Idempotency-Key": pendingCheckout.key },
  });

  return response.data;
};

const validateCoupon = async (couponData) => {
  const response = await api.post("/orders/coupon-quote", couponData);
  return response.data;
};

const getOrderQuote = async (quoteData) => {
  const response = await api.post("/orders/quote", quoteData);
  return response.data;
};

const getMyOrders = async () => {
  const response = await api.get("/orders");

  return response.data;
};

const getLatestMyOrder = async () => {
  const response = await api.get("/orders/latest");

  return response.data;
};

const getOrderById = async (orderId) => {
  if (!/^[a-f\d]{24}$/i.test(String(orderId || ""))) {
    throw new Error("A valid order ID is required to open this order.");
  }
  const response = await api.get(`/orders/${orderId}`);

  return response.data;
};

const orderService = {
  clearPendingCheckout,
  getPaymentPricing,
  createOrder,
  validateCoupon,
  getOrderQuote,
  getMyOrders,
  getLatestMyOrder,
  getOrderById,
};

export default orderService;
