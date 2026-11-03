const mongoose = require("mongoose");
const Order = require("../models/Order");

const requiresExtraConfirmation = order =>
  ["paid", "collected", "processing"].includes(order.paymentStatus) ||
  ["processing", "in_progress", "completed"].includes(order.orderStatus) ||
  order.codPinStatus === "active" ||
  ["active", "in_progress", "completed"].includes(order.serviceProgress?.status) ||
  (order.items || []).some(item => ["in_progress", "active", "completed"].includes(item.serviceProgress?.status));

// Archiving is an administrative visibility change, never a cancellation or refund.
// Keep the original document and every financial reference available for reconciliation.
const snapshot = order => ({
  orderNumber: order.orderNumber, client: order.client,
  orderStatus: order.orderStatus, paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod, amount: order.amount, subtotal: order.subtotal,
  gstAmount: order.gstAmount, discountTotal: order.discountTotal,
  serviceSnapshot: order.serviceSnapshot, items: order.items,
  couponSnapshot: order.couponSnapshot, couponSnapshots: order.couponSnapshots, packageSnapshot: order.packageSnapshot,
  invoice: order.invoice, deliveryLink: order.deliveryLink,
  razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: order.razorpayPaymentId,
});

const changeArchive = restore => async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required." });
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ success: false, message: "A valid order ID is required." });
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    if (Boolean(order.archivedAt) === !restore) return res.status(409).json({ success: false, message: restore ? "Order is not archived." : "Order is already archived." });
    if (!restore && req.body?.confirmation !== (order.orderNumber || String(order._id))) return res.status(400).json({ success: false, message: "Confirm the order number before archiving." });
    if (!restore && requiresExtraConfirmation(order) && req.body?.confirmProtected !== true) return res.status(409).json({ success: false, requiresAdditionalConfirmation: true, message: "This order is paid, active, completed, or has an active payment collection. Confirm the additional warning before archiving. Payments and fulfilment are not cancelled." });
    const at = new Date();
    const updated = await Order.findOneAndUpdate({ _id: order._id, updatedAt: order.updatedAt, archivedAt: order.archivedAt || null }, {
      $set: { archivedAt: restore ? null : at, archivedBy: restore ? null : req.user._id },
      $push: { archiveHistory: { action: restore ? "restore" : "archive", actor: req.user._id, at, snapshot: snapshot(order) } },
    }, { returnDocument: "after", runValidators: true }).select("_id orderNumber archivedAt archivedBy");
    if (!updated) return res.status(409).json({ success: false, message: "The order changed. Refresh and review it before trying again." });
    return res.json({ success: true, message: restore ? "Order restored." : "Order moved to archive. Financial records and client history are preserved.", order: updated });
  } catch (error) {
    console.error("Order archive error:", error);
    return res.status(500).json({ success: false, message: "Unable to update the order archive." });
  }
};
module.exports = { archiveOrder: changeArchive(false), restoreOrder: changeArchive(true), requiresExtraConfirmation };
