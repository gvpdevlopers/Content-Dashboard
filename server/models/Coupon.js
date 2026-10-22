const mongoose = require("mongoose");

const couponServiceDiscountSchema = new mongoose.Schema(
  {
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
