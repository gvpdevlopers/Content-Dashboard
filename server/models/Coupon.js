const mongoose = require("mongoose");

const couponServiceDiscountSchema = new mongoose.Schema(
  {
    targets: { type: [String], default: [] },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    discountValue: { type: Number, min: 0 },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    serviceName: {
      type: String,
      required: true,
      trim: true,
    },

    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    _id: false,
  },
);

const couponSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ["all", "service", "options"], default: "service" },
    discountType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    discountValue: { type: Number, min: 0, default: 0 },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z0-9_-]{2,40}$/,
    },

    serviceDiscounts: {
      type: [couponServiceDiscountSchema],
      default: [],
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    totalUsageLimit: {
      type: Number,
      default: null,
      min: 1,
    },

    perClientUsageLimit: {
      type: Number,
      default: null,
      min: 1,
    },

    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Coupon", couponSchema);
