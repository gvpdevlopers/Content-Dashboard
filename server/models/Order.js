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

    // Snapshot of the service at the time the order was created.
    // This prevents future admin price/service changes from
    // affecting historical orders.
    serviceSnapshot: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      category: {
        type: String,
        required: true,
        trim: true,
      },

      description: {
        type: String,
        default: "",
        trim: true,
      },

      pricingType: {
        type: String,
        enum: ["fixed", "per_unit", "starting_from", "custom"],
        default: "fixed",
      },

      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },

      unit: {
        type: String,
        default: "",
        trim: true,
      },

      // If a service has a selected pricing option,
      // store the option details as part of the snapshot.
      selectedOption: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          default: null,
        },

        name: {
          type: String,
          default: "",
          trim: true,
        },

        description: {
          type: String,
          default: "",
          trim: true,
        },

        price: {
          type: Number,
          default: 0,
          min: 0,
        },

        unit: {
          type: String,
          default: "",
          trim: true,
        },

        minQuantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    },

    // Quantity selected by the client.
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Stores dynamic fields submitted by the client.
    // The structure depends on the selected service.
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Optional information provided by the client.
    additionalRequirements: {
      type: String,
      default: "",
      trim: true,
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