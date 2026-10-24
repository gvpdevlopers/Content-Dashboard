const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const crypto = require("crypto");
const { acquireLock } = require("../utils/requestLock");

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const signatureMatches = (payload, signature, secret) => {
  if (!secret || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, "hex"));
};
const paymentView = (order) => ({
  id: order._id, orderNumber: order.orderNumber, paymentStatus: order.paymentStatus,
  subtotal: order.subtotal, gstRate: order.gstRate, gstAmount: order.gstAmount, amount: order.amount,
  ...(order.adCreditTotal > 0 ? { adCreditTotal: order.adCreditTotal,
    subtotalBeforeAdCredit: order.subtotalBeforeAdCredit,
    adCreditApplied: order.adCreditApplied instanceof Map
      ? Object.fromEntries(order.adCreditApplied) : order.adCreditApplied } : {}),
});

const recordCapturedPayment = async (order, paymentId, capture = false) => {
  let payment = await razorpay.payments.fetch(paymentId);
  const matches = (value) => value.order_id === order.razorpayOrderId &&
    Number(value.amount) === Math.round(order.amount * 100) && value.currency === "INR";
  if (!matches(payment)) throw fail("Payment does not match this order.");
  if (payment.status === "authorized" && capture) {
    try {
      payment = await razorpay.payments.capture(paymentId, Math.round(order.amount * 100), "INR");
    } catch (error) {
      // Automatic capture or another verifier may have captured it concurrently.
      payment = await razorpay.payments.fetch(paymentId);
      if (payment.status !== "captured") throw error;
    }
  }
  if (!matches(payment) || payment.status !== "captured") {
    throw fail("Payment has not been captured yet. Please retry verification shortly.", 409);
  }
  const updated = await Order.findOneAndUpdate({
    _id: order._id, paymentMethod: "online", razorpayOrderId: payment.order_id,
    adCreditReleased: { $ne: true },
    $or: [{ paymentStatus: { $ne: "paid" } }, { razorpayPaymentId: paymentId }],
  }, { $set: { razorpayPaymentId: paymentId, paymentStatus: "paid" } }, { new: true });
  if (!updated) throw fail("Order payment changed. Please refresh.", 409);
  return updated;
};

const createRazorpayOrder = async (req, res) => {
  let release;
  try {
    const { orderId } = req.body;
    if (typeof orderId !== "string" || !/^[a-f0-9]{24}$/i.test(orderId)) throw fail("Valid order ID is required.");
    release = await acquireLock(`payment:${orderId}`);
    const order = await Order.findOne({ _id: orderId, client: req.user._id });
    if (!order) throw fail("Order not found.", 404);
    if (order.paymentMethod !== "online") throw fail("This order is not configured for online payment.");
    if (order.paymentStatus === "paid") {
      return res.json({ success: true, alreadyPaid: true, order: paymentView(order) });
    }
    if (order.orderStatus === "cancelled") throw fail("This order has been cancelled.");
    if (order.adCreditReleased) throw fail("This order's ad credit has been returned.", 409);
    if (!Number.isFinite(order.amount) || order.amount <= 0) throw fail("Invalid order amount.");
    // Reuse the same provider order for all checkout retries.
    const providerOrder = order.razorpayOrderId
      ? await razorpay.orders.fetch(order.razorpayOrderId)
      : await razorpay.orders.create({ amount: Math.round(order.amount * 100), currency: "INR",
          receipt: order.orderNumber, notes: { orderId: String(order._id), orderNumber: order.orderNumber } });
    if (Number(providerOrder.amount) !== Math.round(order.amount * 100) || providerOrder.currency !== "INR") {
      throw fail("Payment amount changed. Contact support.", 409);
    }
    if (order.razorpayOrderId && providerOrder.status === "paid") {
      const payments = await razorpay.orders.fetchPayments(providerOrder.id);
      const captured = payments.items?.find((payment) => payment.status === "captured");
      if (!captured) throw fail("Payment is still being confirmed. Please retry shortly.", 409);
      const updated = await recordCapturedPayment(order, captured.id);
      return res.json({ success: true, alreadyPaid: true, order: paymentView(updated) });
    }
    // Do not overwrite a payment that a webhook verified while the API call ran.
    const initialized = await Order.findOneAndUpdate({ _id: order._id, paymentStatus: { $ne: "paid" },
      orderStatus: { $ne: "cancelled" }, adCreditReleased: { $ne: true } },
      { $set: { razorpayOrderId: providerOrder.id, paymentStatus: "processing" } }, { new: true });
    if (!initialized) {
      const latest = await Order.findOne({ _id: order._id, client: req.user._id });
      if (latest?.paymentStatus === "paid") {
        return res.json({ success: true, alreadyPaid: true, order: paymentView(latest) });
      }
      throw fail("Order payment changed. Please refresh.", 409);
    }
    return res.json({ success: true, razorpayOrder: {
      id: providerOrder.id, amount: providerOrder.amount, currency: providerOrder.currency,
    }, order: { ...paymentView(order), paymentStatus: "processing" } });
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(error.statusCode || 502).json({ success: false,
      message: error.statusCode ? error.message : "Unable to initialize payment. Please retry from your order." });
  } finally {
    if (release) await release().catch((error) => console.error("Payment lease release failed:", error));
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (typeof orderId !== "string" || !/^[a-f0-9]{24}$/i.test(orderId) ||
        typeof razorpay_order_id !== "string" || typeof razorpay_payment_id !== "string") {
      throw fail("Payment verification data is incomplete.");
    }
    const order = await Order.findOne({ _id: orderId, client: req.user._id });
    if (!order) throw fail("Order not found.", 404);
    if (order.adCreditReleased) throw fail("This order's ad credit has been returned.", 409);
    if (order.paymentMethod !== "online" || order.razorpayOrderId !== razorpay_order_id) {
      throw fail("Razorpay order mismatch.");
    }
    if (!signatureMatches(`${order.razorpayOrderId}|${razorpay_payment_id}`,
      razorpay_signature, process.env.RAZORPAY_KEY_SECRET)) throw fail("Payment verification failed.");
    const updated = await recordCapturedPayment(order, razorpay_payment_id, true);
    return res.json({ success: true, message: "Payment verified successfully.", order: paymentView(updated) });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(error.statusCode || 502).json({ success: false,
      message: error.statusCode ? error.message : "Unable to verify payment. Please retry shortly." });
  }
};

const razorpayWebhook = async (req, res) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return res.status(503).json({ success: false, message: "Webhook is not configured." });
  }
  if (!Buffer.isBuffer(req.body) || !signatureMatches(req.body,
    req.get("X-Razorpay-Signature"), process.env.RAZORPAY_WEBHOOK_SECRET)) {
    return res.status(400).json({ success: false, message: "Invalid webhook signature." });
  }
  let event;
  try { event = JSON.parse(req.body.toString("utf8")); }
  catch { return res.status(400).json({ success: false, message: "Invalid webhook body." }); }
  if (!["payment.captured", "order.paid"].includes(event.event)) return res.json({ success: true });
  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id) return res.status(400).json({ success: false });
  try {
    const order = await Order.findOne({ razorpayOrderId: payment.order_id, paymentMethod: "online" });
    // Ask the provider to retry if checkout initialization has not saved its reference yet.
    if (!order) return res.status(503).json({ success: false });
    await recordCapturedPayment(order, payment.id);
    return res.json({ success: true });
  } catch (error) {
    console.error("Payment webhook reconciliation failed:", error);
    return res.status(503).json({ success: false });
  }
};
module.exports = { createRazorpayOrder, verifyRazorpayPayment, razorpayWebhook };
