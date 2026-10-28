const crypto = require("crypto");
const Order = require("../models/Order");
const User = require("../models/User");
const { normalizeServiceId: validId } = require("../utils/serviceIdentity");
const { PIN_MAX_ATTEMPTS } = require("../utils/pinPolicy");

const generateCodPin = async (req, res) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required." });
    const { orderId, employeeId } = req.body || {};

    if (!validId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (!["cod", "cheque"].includes(order.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "This order does not use PIN verification.",
      });
    }

    if (order.orderStatus === "cancelled" || order.adCreditReleased) return res.status(409).json({ success: false,
      message: "Cancelled orders or orders with returned ad credit cannot use a payment PIN." });

    if (
      ["collected", "paid"].includes(order.paymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment has already been completed.",
      });
    }

    if (
      (order.codPinStatus === "active" &&
        order.codPinGeneratedAt &&
        Number(order.codPinAttempts || 0) < PIN_MAX_ATTEMPTS) ||
      order.codPinStatus === "verified" ||
      order.codPinStatus === "used"
    ) {
      return res.status(400).json({
        success: false,
        message: "A PIN has already been generated or verified for this order.",
      });
    }

    if (!validId(employeeId)) return res.status(400).json({ success: false, message: "Select an active employee for this PIN." });
    const employee = await User.findOne({ _id: employeeId, role: "employee", isActive: true }).select("_id name username");
    if (!employee) return res.status(400).json({ success: false, message: "The selected employee is unavailable. Choose an active employee." });

    const codPin = crypto
      .randomInt(100000, 1000000)
      .toString();

    const generatedAt = new Date();

    const generated = await Order.findOneAndUpdate(
      { _id: order._id, codPinStatus: order.codPinStatus,
        codPinGeneratedAt: order.codPinGeneratedAt,
        paymentStatus: order.paymentStatus, orderStatus: { $ne: "cancelled" }, adCreditReleased: { $ne: true } },
      { $set: { codPin, codPinStatus: "active", codPinGeneratedAt: generatedAt,
        codPinEmployee: employee._id, codPinAttempts: 0, codPinVerifiedAt: null, codPinVerifiedBy: null, codCollectedAt: null } },
      { returnDocument: "after" },
    );
    if (!generated) return res.status(409).json({ success: false,
      message: "Payment PIN changed. Please refresh and try again." });
    order.codPinStatus = generated.codPinStatus;

    return res.status(200).json({
      success: true,
      message: `${order.paymentMethod === "cheque" ? "Cheque" : "COD"} PIN generated successfully.`,
      codPin,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        paymentStatus: order.paymentStatus,
        codPinStatus: order.codPinStatus,
        codPinEmployee: employee._id,
        codPinGeneratedAt: generatedAt,
      },
    });
  } catch (error) {
    console.error("Generate payment PIN failed.");

    return res.status(500).json({
      success: false,
      message: "Unable to generate payment PIN.",
    });
  }
};

const verifyCodPin = async (req, res) => {
  try {
    if (req.user?.role !== "client") return res.status(403).json({ success: false, message: "Only the client who owns this order can verify its payment PIN." });
    const actorId = req.user._id || req.user.userId;
    const { orderId, pin } = req.body || {};

    if (!validId(orderId) || !pin) {
      return res.status(400).json({
        success: false,
        message: "Order ID and PIN are required.",
      });
    }

    if (!["string", "number"].includes(typeof pin) || !/^\d{6}$/.test(String(pin))) {
      return res.status(400).json({
        success: false,
        message: "PIN must be a 6-digit number.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (String(order.client) !== String(actorId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to verify this order.",
      });
    }

    if (order.orderStatus === "cancelled" || order.adCreditReleased) return res.status(409).json({ success: false,
      message: "Cancelled orders or orders with returned ad credit cannot use a payment PIN." });

    if (!["cod", "cheque"].includes(order.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "This order does not use PIN verification.",
      });
    }

    // Payment has already been completed.
    if (
      ["collected", "paid"].includes(order.paymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment has already been completed.",
      });
    }

    if (order.codPinStatus === "expired") {
      return res.status(400).json({
        success: false,
        message: "This PIN has expired. Ask an admin to generate a new PIN.",
      });
    }

    if (["verified", "used"].includes(order.codPinStatus)) {
      return res.status(400).json({
        success: false,
        message: "This PIN has already been verified.",
      });
    }

    // PIN must have been generated by admin.
    if (order.codPinStatus !== "active") {
      return res.status(400).json({
        success: false,
        message: "This PIN is not active.",
      });
    }

    if (!order.codPinGeneratedAt ||
        Number(order.codPinAttempts || 0) >= PIN_MAX_ATTEMPTS) {
      return res.status(400).json({ success: false,
        message: "This PIN is locked or invalid. Ask an admin to generate a new PIN." });
    }
    const filter = {
      _id: order._id, client: actorId, codPinStatus: "active", orderStatus: { $ne: "cancelled" },
      adCreditReleased: { $ne: true },
      codPinGeneratedAt: order.codPinGeneratedAt,
      paymentStatus: order.paymentStatus,
      $or: [{ codPinAttempts: { $lt: PIN_MAX_ATTEMPTS } },
            { codPinAttempts: { $exists: false } }],
    };
    if (order.codPin !== String(pin)) {
      await Order.updateOne({ ...filter, codPin: { $ne: String(pin) } },
        { $inc: { codPinAttempts: 1 } });
      return res.status(400).json({ success: false, message: "Invalid or locked PIN." });
    }
    const verifiedAt = new Date();
    const verified = await Order.findOneAndUpdate(
      { ...filter, codPin: String(pin) },
      { $set: { codPinStatus: "used",
        codPinVerifiedAt: verifiedAt,
        codPinVerifiedBy: actorId,
        paymentStatus: "paid", codCollectedAt: verifiedAt } },
      { returnDocument: "after" },
    );
    if (!verified) return res.status(409).json({ success: false,
      message: "PIN disabled, changed, locked or already used. Please refresh." });
    order.paymentStatus = verified.paymentStatus;
    order.codPinStatus = verified.codPinStatus;
    order.codCollectedAt = verified.codCollectedAt;

    return res.status(200).json({
      success: true,
      message: "Payment collected and marked as paid successfully.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        codPinStatus: order.codPinStatus,
        codCollectedAt: order.codCollectedAt,
        codPinVerifiedAt: verifiedAt,
      },
    });
  } catch (error) {
    console.error("Verify payment PIN failed.");

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment PIN.",
    });
  }
};

const getPinEmployees = async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required." });
  try {
    const employees = await User.find({ role: "employee", isActive: true }).select("_id name username").sort({ name: 1, username: 1 });
    return res.json({ success: true, employees });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load employees." });
  }
};

// PIN secrets are exposed only here, to their active assignee or an administrator.
// Generic staff/client order endpoints continue to exclude codPin.
const getAssignedPins = async (req, res) => {
  if (!["admin", "employee"].includes(req.user?.role)) return res.status(403).json({ success: false, message: "Staff access required." });
  try {
    const filter = {
      codPinStatus: "active", codPinGeneratedAt: { $ne: null },
      $or: [{ codPinAttempts: { $lt: PIN_MAX_ATTEMPTS } }, { codPinAttempts: { $exists: false } }], codPinEmployee: { $ne: null },
      paymentMethod: { $in: ["cod", "cheque"] }, paymentStatus: { $nin: ["paid", "collected"] },
      orderStatus: { $ne: "cancelled" }, adCreditReleased: { $ne: true },
    };
    if (req.query?.orderId !== undefined) {
      const orderId = validId(req.query.orderId);
      if (!orderId) return res.status(400).json({ success: false, message: "A valid order ID is required." });
      filter._id = orderId;
      if (req.user.role === "admin") delete filter.codPinEmployee;
    }
    if (req.user.role === "employee") filter.codPinEmployee = req.user._id || req.user.userId;
    const orders = await Order.find(filter)
      .select("_id orderNumber client amount paymentMethod codPin codPinGeneratedAt codPinEmployee")
      .populate("client", "name username").sort({ codPinGeneratedAt: -1 }).lean();
    res.set("Cache-Control", "no-store");
    return res.json({ success: true, orders });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load assigned payment PINs." });
  }
};

const disableCodPin = async (req, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required." });
  const { orderId } = req.body || {};
  if (!validId(orderId)) return res.status(400).json({ success: false, message: "A valid order ID is required." });
  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    if (order.codPinStatus !== "active" || ["paid", "collected"].includes(order.paymentStatus)) {
      return res.status(409).json({ success: false, message: "This PIN is no longer active. Refresh the order." });
    }
    const updated = await Order.findOneAndUpdate({ _id: order._id, codPinStatus: "active",
      codPinGeneratedAt: order.codPinGeneratedAt, paymentStatus: order.paymentStatus },
    { $set: { codPinStatus: "disabled", codPin: null } }, { returnDocument: "after" });
    if (!updated) return res.status(409).json({ success: false, message: "The PIN changed or was already used. Refresh the order." });
    return res.json({ success: true, message: "Payment PIN disabled.", order: {
      id: updated._id, codPinStatus: updated.codPinStatus, paymentStatus: updated.paymentStatus,
    } });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to disable payment PIN." });
  }
};

module.exports = {
  disableCodPin,
  getPinEmployees,
  getAssignedPins,
  generateCodPin,
  verifyCodPin,
};
