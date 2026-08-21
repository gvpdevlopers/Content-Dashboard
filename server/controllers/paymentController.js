const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const crypto = require("crypto");

const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    // Find client's order
    const order = await Order.findOne({
      _id: orderId,
      client: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Only online payments
    if (order.paymentMethod !== "online") {
      return res.status(400).json({
        success: false,
        message: "This order is not configured for online payment.",
      });
    }

    // Prevent paying an already-paid order
    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "This order has already been paid.",
      });
    }

    // Amount must be greater than zero
    if (!order.amount || order.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount.",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.amount * 100),
      currency: "INR",
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = "processing";

    await order.save();

    return res.status(200).json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        amount: order.amount,
      },
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order.",
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data is incomplete.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      client: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      order.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order mismatch.",
      });
    }

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    if (
      generatedSignature !== razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }

    order.razorpayPaymentId =
      razorpay_payment_id;

    order.razorpaySignature =
      razorpay_signature;

    order.paymentStatus = "paid";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        amount: order.amount,
      },
    });
  } catch (error) {
    console.error(
      "Verify Razorpay payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment.",
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};