const mongoose = require("mongoose");
const Order = require("../models/Order");
const Wallet = require("../models/AdCreditWallet");
const Entry = require("../models/AdCreditEntry");
const { PLATFORMS, toPaise, plain, adBudgets, getBalances, creditError } = require("../utils/adCredit");

const handleError = (res, error) => {
  const duplicate = error.code === 11000;
  if (!error.statusCode && !duplicate) console.error("Ad credit error:", error);
  return res.status(duplicate ? 409 : error.statusCode || 500).json({ success: false,
    message: duplicate ? "Unused spend was already recorded for this platform and order." :
      error.statusCode ? error.message : "Unable to process ad credit. Please try again." });
};
const getMyAdCredit = async (req, res) => {
  try {
    const available = await getBalances(req.user._id);
    const entries = await Entry.find({ client: req.user._id }).sort({ createdAt: -1 }).limit(50)
      .populate("order", "orderNumber");
    return res.json({ success: true,
      available: Object.fromEntries(PLATFORMS.map((platform) => [platform, available[platform] / 100])),
      entries: entries.map((entry) => ({ id: entry._id, platform: entry.platform, kind: entry.kind,
        amount: entry.amountPaise / 100, order: entry.order, createdAt: entry.createdAt })),
    });
  } catch (error) { return handleError(res, error); }
};
const getOrderAdCredit = async (req, res) => {
  try {
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
        { session, upsert: true, new: true, setDefaultsOnInsert: false });
      await Entry.create([{ client: order.client, platform, kind: "issued", amountPaise,
        order: order._id, actor: req.user._id, note: note.trim() }], { session });
    });
    return res.status(201).json({ success: true, message: "Unused ad spend added to the client's ad credit." });
  } catch (error) { return handleError(res, error); }
  finally { if (session) await session.endSession(); }
};
module.exports = { getMyAdCredit, getOrderAdCredit, issueAdCredit };
