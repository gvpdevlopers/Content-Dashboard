const mongoose = require("mongoose");

const couponClientUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

couponClientUsageSchema.index(
  { coupon: 1, client: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "CouponClientUsage",
  couponClientUsageSchema,
);
