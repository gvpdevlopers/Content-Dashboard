const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    serviceSnapshot: {
      name: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
    },

    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment information
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "failed",
        "collected",
      ],
      default: "pending",
    },

    // Razorpay information
    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    // COD information
    codPin: {
      type: String,
      default: null,
    },

    codPinStatus: {
      type: String,
      enum: [
        "not_generated",
        "active",
        "verified",
        "used",
        "expired",
      ],
      default: "not_generated",
    },

    // When the admin generated the COD PIN
    codPinGeneratedAt: {
      type: Date,
      default: null,
    },

    // When the client successfully verified the COD PIN
    codPinVerifiedAt: {
      type: Date,
      default: null,
    },

    // When COD payment was successfully collected
    codCollectedAt: {
      type: Date,
      default: null,
    },

    // Order workflow status
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },

    // Admin notes
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);