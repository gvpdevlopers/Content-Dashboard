const mongoose = require("mongoose");
const Order = require("../models/Order");
const Wallet = require("../models/AdCreditWallet");
const Entry = require("../models/AdCreditEntry");
const { PLATFORMS, toPaise, plain, adBudgets, getBalances, creditError } = require("../utils/adCredit");
const { quoteCredit, spendCredit } = require("../utils/adCredit");
const { acquireLock } = require("../utils/requestLock");
const requireStaff = req => {
  if (!["admin", "employee"].includes(req.user?.role)) throw creditError("Order management access required.", 403);
};

const handleError = (res, error) => {
  const duplicate = error.code === 11000;
  if (!error.statusCode && !duplicate) console.error("Ad credit error:", error);
  return res.status(duplicate ? 409 : error.statusCode || 500).json({ success: false,
    message: duplicate ? "Unused spend was already recorded for this platform and order." :
      error.statusCode ? error.message : "Unable to process ad credit. Please try again." });
};
const getMyAdCredit = async (req, res) => {
  try {
    const page = Number(req.query?.page || 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) throw creditError("Invalid history page.");
    const available = await getBalances(req.user._id);
    const entries = await Entry.find({ client: req.user._id }).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 50).limit(51)
      .populate("order", "orderNumber").populate("actor", "name role");
    return res.json({ success: true, page, hasMore: entries.length > 50,
      available: Object.fromEntries(PLATFORMS.map((platform) => [platform, available[platform] / 100])),
      entries: entries.slice(0, 50).map((entry) => ({ id: entry._id, platform: entry.platform, kind: entry.kind,
        amount: entry.amountPaise / 100, order: entry.order, note: entry.note, actor: entry.actor, createdAt: entry.createdAt })),
    });
  } catch (error) { return handleError(res, error); }
};
const getOrderAdCredit = async (req, res) => {
  try {
    requireStaff(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw creditError("Invalid order ID.");
    const order = await Order.findById(req.params.id);
    if (!order) throw creditError("Order not found.", 404);
    const budgets = adBudgets(order);
    const available = await getBalances(order.client);
    const entries = await Entry.find({ order: order._id }).sort({ createdAt: -1 })
      .populate("actor", "name role");
    return res.json({ success: true, settled: ["paid", "collected"].includes(order.paymentStatus),
      budgets: Object.fromEntries(PLATFORMS.map((platform) => [platform, budgets[platform] / 100])),
      issued: plain(order.adCreditIssued),
      available: Object.fromEntries(PLATFORMS.map((platform) => [platform, available[platform] / 100])),
      entries: entries.map((entry) => ({ id: entry._id, platform: entry.platform, kind: entry.kind,
        amount: entry.amountPaise / 100, note: entry.note, actor: entry.actor, createdAt: entry.createdAt })),
    });
  } catch (error) { return handleError(res, error); }
};
const issueAdCredit = async (req, res) => {
  let session;
  try {
    requireStaff(req);
    const { platform, amount, note } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw creditError("Invalid order ID.");
    if (!PLATFORMS.includes(platform)) throw creditError("Select Meta or Google Ads.");
    const amountPaise = toPaise(amount);
    if (!amountPaise) throw creditError("Unused ad spend must be greater than zero.");
    if (typeof note !== "string" || !note.trim() || note.trim().length > 1000) {
      throw creditError("Add a reason of 1 to 1000 characters.");
    }
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw creditError("Order not found.", 404);
      if (!["paid", "collected"].includes(order.paymentStatus)) throw creditError("Only settled orders can issue unused ad spend.");
      if (amountPaise > adBudgets(order)[platform]) throw creditError("Unused spend exceeds this order's ad spend for the selected platform.");
      const updated = await Order.updateOne({ _id: order._id, paymentStatus: order.paymentStatus,
        [`adCreditIssued.${platform}`]: { $exists: false } },
      { $set: { [`adCreditIssued.${platform}`]: amountPaise / 100 } }, { session });
      if (updated.modifiedCount !== 1) throw creditError("Unused spend was already recorded for this platform and order.", 409);
      await Wallet.findOneAndUpdate({ _id: `${order.client}:${platform}` },
        { $inc: { balancePaise: amountPaise }, $setOnInsert: { client: order.client, platform } },
  { session, upsert: true, returnDocument: "after", setDefaultsOnInsert: false });
      await Entry.create([{ client: order.client, platform, kind: "issued", amountPaise,
        order: order._id, actor: req.user._id, note: note.trim() }], { session });
    });
    return res.status(201).json({ success: true, message: "Unused ad spend added to the client's ad credit." });
  } catch (error) { return handleError(res, error); }
  finally { if (session) await session.endSession(); }
};
// A management adjustment is only possible before collection/payment begins.
// Reuse checkout's budget validation, GST calculation and atomic debit logic.
const applyOrderCredit = async (req, res) => {
  let session, release;
  try {
    requireStaff(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) throw creditError("Invalid order ID.");
    if (req.body?.confirmed !== true) throw creditError("Confirm applying the client's credit.");
    release = await acquireLock(`payment:${req.params.id}`);
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) throw creditError("Order not found.", 404);
      if (order.paymentStatus !== "pending" || order.razorpayOrderId || order.razorpayPaymentId ||
          order.codPinStatus === "active" || order.adCreditReleased || order.adCreditTotal > 0 ||
          ["completed", "cancelled"].includes(order.orderStatus) || order.invoice?.url || order.monthEndPaymentHistory?.length) {
        throw creditError("Credit can only be applied once to an unpaid order before payment, invoice or PIN collection begins.", 409);
      }
      const quote = await quoteCredit({ client: order.client, items: order.items?.length ? order.items : [order],
        input: req.body.adCredit, subtotal: order.subtotal, gstRate: order.gstRate });
      if (!quote.total) throw creditError("Enter an amount of credit to apply.");
      await spendCredit({ client: order.client, order: order._id, requested: quote.requested, session, actor: req.user._id });
      order.subtotalBeforeAdCredit = order.subtotal;
      order.adCreditApplied = Object.fromEntries(PLATFORMS.map(platform => [platform, quote.requested[platform] / 100]));
      order.adCreditTotal = quote.total;
      Object.assign(order, quote.totals);
      if (order.amount === 0 && order.paymentMethod !== "month_end") order.paymentStatus = "paid";
      await order.save({ session });
    });
    return res.json({ success: true, message: "Ad credit applied. The remaining payable amount has been updated." });
  } catch (error) { return handleError(res, error); }
  finally {
    if (session) await session.endSession();
    if (release) { try { await release(); } catch (error) { console.error("Ad credit lock release failed:", error.message); } }
  }
};
module.exports = { getMyAdCredit, getOrderAdCredit, issueAdCredit, applyOrderCredit };
