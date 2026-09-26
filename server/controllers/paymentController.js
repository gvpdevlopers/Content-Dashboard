const razorpay = require("../config/razorpay");
const Order = require("../models/Order");
const crypto = require("crypto");

/*
|--------------------------------------------------------------------------
| Create Razorpay Order
|--------------------------------------------------------------------------
*/

const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    /*
    |--------------------------------------------------------------------------
    | 1. Validate order ID
    |--------------------------------------------------------------------------
    */

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Find client's order
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | 3. Only online payments
    |--------------------------------------------------------------------------
    */

    if (order.paymentMethod !== "online") {
      return res.status(400).json({
        success: false,
        message:
          "This order is not configured for online payment.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Prevent paying an already-paid order
    |--------------------------------------------------------------------------
    */

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message:
          "This order has already been paid.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 5. Validate final order amount
    |--------------------------------------------------------------------------
    |
    | order.amount is already calculated by the order controller.
    |
    | For online orders:
    |
    | subtotal + 18% GST = order.amount
    |
    | Never calculate the amount again here.
    |
    */

    if (!order.amount || order.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Create Razorpay order
    |--------------------------------------------------------------------------
    |
    | Razorpay expects amount in paise.
    |
    | Example:
    |
    | order.amount = 11800 INR
    |
    | Razorpay amount = 1180000 paise
    |
    */

    const razorpayOrder =
      await razorpay.orders.create({
        amount: Math.round(
          order.amount * 100
        ),

        currency: "INR",

        receipt: order.orderNumber,

        notes: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | 7. Save Razorpay order information
    |--------------------------------------------------------------------------
    */

    order.razorpayOrderId =
      razorpayOrder.id;

    order.paymentStatus =
      "processing";

    await order.save();

    /*
    |--------------------------------------------------------------------------
    | 8. Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },

      order: {
        id: order._id,

        orderNumber:
          order.orderNumber,

        /*
         * Pricing breakdown.
         *
         * These fields are useful for the
         * frontend payment summary.
         */

        subtotal:
          order.subtotal,

        gstRate:
          order.gstRate,

        gstAmount:
          order.gstAmount,

        amount:
          order.amount,
      },
    });
  } catch (error) {
    console.error(
      "Create Razorpay order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create payment order.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Verify Razorpay Payment
|--------------------------------------------------------------------------
*/

const verifyRazorpayPayment = async (
  req,
  res
) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | 1. Validate payment data
    |--------------------------------------------------------------------------
    */

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment verification data is incomplete.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 2. Find client's order
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | 3. Verify Razorpay order ID
    |--------------------------------------------------------------------------
    */

    if (
      order.razorpayOrderId !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Razorpay order mismatch.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 4. Generate payment signature
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | 5. Verify signature
    |--------------------------------------------------------------------------
    */

    if (
      generatedSignature !==
      razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment verification failed.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | 6. Save successful payment
    |--------------------------------------------------------------------------
    */

    order.razorpayPaymentId =
      razorpay_payment_id;

    order.razorpaySignature =
      razorpay_signature;

    order.paymentStatus = "paid";

    await order.save();

    /*
    |--------------------------------------------------------------------------
    | 7. Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      message:
        "Payment verified successfully.",

      order: {
        id: order._id,

        orderNumber:
          order.orderNumber,

        paymentStatus:
          order.paymentStatus,

        subtotal:
          order.subtotal,

        gstRate:
          order.gstRate,

        gstAmount:
          order.gstAmount,

        amount:
          order.amount,
      },
    });
  } catch (error) {
    console.error(
      "Verify Razorpay payment error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify payment.",
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};