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

    /*
     * Snapshot of the service at the time the order was created.
     *
     * This prevents future admin service/price changes
     * from affecting historical orders.
     */
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

      /*
       * Pricing option snapshot.
       *
       * This supports both:
       *
       * 1. Normal services with one selected pricing option.
       * 2. Grouped services with multiple independently
       *    selected pricing options.
       *
       * Example:
       *
       * [
       *   {
       *     id: "...",
       *     name: "iPhone Shoot",
       *     price: 3000,
       *     unit: "per reel",
       *     group: "shoot",
       *     quantity: 2
       *   },
       *   {
       *     id: "...",
       *     name: "Drone",
       *     price: 3500,
       *     unit: "per reel",
       *     group: "drone",
       *     quantity: 1
       *   }
       * ]
       *
       * Keeping this as an array also preserves compatibility
       * with existing orders that contain a single option.
       */
      selectedOptions: {
        type: [
          {
            id: {
              type: mongoose.Schema.Types.ObjectId,
              default: null,
            },

            name: {
              type: String,
              required: true,
              trim: true,
            },

            description: {
              type: String,
              default: "",
              trim: true,
            },

            price: {
              type: Number,
              required: true,
              min: 0,
            },

            unit: {
              type: String,
              default: "",
              trim: true,
            },

            group: {
              type: String,
              default: "",
              trim: true,
            },

            quantity: {
              type: Number,
              required: true,
              min: 1,
            },

            minQuantity: {
              type: Number,
              default: 1,
              min: 1,
            },

            maxQuantity: {
              type: Number,
              default: undefined,
              min: 1,
            },

            isActive: {
              type: Boolean,
              default: true,
            },
          },
        ],

        default: [],
      },
    },

    /*
     * Quantity selected by the client.
     *
     * For normal services this contains the actual
     * requested quantity.
     *
     * For grouped pricing, the controller uses quantity = 1
     * because each selected pricing option has its own quantity
     * inside serviceSnapshot.selectedOptions.
     */
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    /*
     * Stores dynamic fields submitted by the client.
     *
     * The structure depends on the selected service and
     * selected pricing options.
     *
     * Example:
     *
     * {
     *   projectName: "ABC",
     *   videoStyle: "cinematic",
     *   voiceType: "professional",
     *   pricingQuantities: {
     *     shoot: 2,
     *     drone: 1
     *   }
     * }
     */
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /*
     * Optional information provided by the client.
     */
    additionalRequirements: {
      type: String,
      default: "",
      trim: true,
    },

    /*
     * Final server-calculated order amount.
     *
     * Never trust the amount sent by the frontend.
     * The order controller calculates this from the
     * current service configuration.
     */
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Payment information
     */
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "collected"],
      default: "pending",
    },

    /*
     * Razorpay information
     */
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

    /*
     * COD information
     */
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

    /*
     * When the admin generated the COD PIN
     */
    codPinGeneratedAt: {
      type: Date,
      default: null,
    },

    /*
     * When the client successfully verified the COD PIN
     */
    codPinVerifiedAt: {
      type: Date,
      default: null,
    },

    /*
     * When COD payment was successfully collected
     */
    codCollectedAt: {
      type: Date,
      default: null,
    },

    /*
     * Order workflow status
     */
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

    /*
     * Admin notes
     */
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