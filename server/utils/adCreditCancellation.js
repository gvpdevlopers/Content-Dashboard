const mongoose = require("mongoose");
const Order = require("../models/Order");
const Wallet = require("../models/AdCreditWallet");
const Entry = require("../models/AdCreditEntry");
const { normalizeCredit, plain, creditError, PLATFORMS } = require("./adCredit");
const { acquireLock } = require("./requestLock");

// Return unused reservations only when there cannot be an outstanding online payment.
const changeOrderStatus = async (order, status, actor) => {
  if (order.adCreditReleased && status !== "cancelled") {
    throw creditError("This order's ad credit was returned. Create a new order instead of reopening it.", 409);
  }
  if (!order.adCreditTotal || status !== "cancelled" || order.adCreditReleased ||
      ["paid", "collected"].includes(order.paymentStatus)) {
    order.orderStatus = status;
    await order.save();
    return;
  }
  const release = await acquireLock(`payment:${order._id}`);
  let session;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const current = await Order.findById(order._id).session(session);
      if (current.adCreditReleased) return;
      if (["paid", "collected"].includes(current.paymentStatus)) {
        throw creditError("Payment changed. Refresh the order before cancelling.", 409);
      }
      if (current.paymentMethod === "online" && current.razorpayOrderId) {
        throw creditError("This order has an online payment attempt. Reconcile its payment before cancelling so its ad credit cannot be spent twice.", 409);
      }
      const requested = normalizeCredit(plain(current.adCreditApplied));
      current.orderStatus = "cancelled";
      current.adCreditReleased = true;
      current.codPinStatus = "expired";
      await current.save({ session });
      for (const platform of PLATFORMS) {
        const amountPaise = requested[platform];
        if (!amountPaise) continue;
        await Wallet.findOneAndUpdate({ _id: `${current.client}:${platform}` },
          { $inc: { balancePaise: amountPaise }, $setOnInsert: { client: current.client, platform } },
          { session, upsert: true, setDefaultsOnInsert: false });
        await Entry.create([{ client: current.client, order: current._id, actor,
          platform, kind: "released", amountPaise, note: "Returned after unpaid order cancellation." }], { session });
      }
    });
  } finally {
    if (session) await session.endSession();
    await release().catch((error) => console.error("Cancellation lease release failed:", error));
  }
};
module.exports = { changeOrderStatus };
