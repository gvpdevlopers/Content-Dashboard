const mongoose = require("mongoose");

const couponUsageLineSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ["all", "service", "options"], default: "service" },
    discountType: { type: String, enum: ["percentage", "fixed", "combined"], default: "percentage" },
    discountValue: { type: Number, min: 0 },
    optionBreakdown: { type: [new mongoose.Schema({
      key: { type: String, required: true },
      label: { type: String, required: true },
      amount: { type: Number, min: 0, required: true },
      discountAmount: { type: Number, min: 0, required: true },
    }, { _id: false })], default: [] },
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

    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    eligibleAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    discountedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const couponUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },

    couponCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    serviceBreakdown: {
      type: [couponUsageLineSchema],
      default: [],
    },

    originalSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discountTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    taxableSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    gstRate: {
      type: Number,
      required: true,
      min: 0,
    },

    gstAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    finalTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    redeemedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

couponUsageSchema.index({ coupon: 1, redeemedAt: -1 });
couponUsageSchema.index({ client: 1, coupon: 1 });

couponUsageSchema.index({ order: 1, coupon: 1 }, { unique: true });
// Upgrade only the obsolete one-coupon-per-order index. Keep financial rows.
couponUsageSchema.statics.ensureStackedCouponIndex = async function () {
  await this.collection.createIndex({ order: 1, coupon: 1 }, { unique: true });
  const indexes = await this.collection.indexes();
  for (const index of indexes) {
    if (index.unique && Object.keys(index.key).length === 1 && index.key.order === 1) {
      try { await this.collection.dropIndex(index.name); }
      catch (error) { if (error.code !== 27) throw error; }
    }
  }
};
module.exports = mongoose.model("CouponUsage", couponUsageSchema);
