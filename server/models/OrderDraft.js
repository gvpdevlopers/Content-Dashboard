const mongoose = require("mongoose");

const orderDraftSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },

    services: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      validate: {
        validator: (services) => services.length > 0 && services.length <= 50,
        message: "A draft must contain between 1 and 50 services.",
      },
    },

    additionalRequirements: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      maxlength: 40,
    },

    status: {
      type: String,
      enum: ["active", "submitted"],
      default: "active",
      index: true,
    },

    submittedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

orderDraftSchema.index({ client: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model("OrderDraft", orderDraftSchema);
