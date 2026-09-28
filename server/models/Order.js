const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Pricing Option Snapshot Schema
|--------------------------------------------------------------------------
|
| Stores the exact pricing option configuration used when the order
| was created. This prevents future admin pricing changes from
| modifying historical orders.
|
*/

const selectedOptionSnapshotSchema = new mongoose.Schema(
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
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Repeatable Pricing Snapshot Schema
|--------------------------------------------------------------------------
|
| Stores the selected pricing configuration for one repeatable item.
|
| Example:
|
| pricingSnapshots: {
|   shoot: {
|     id: "...",
|     name: "Camera",
|     price: 5000,
|     quantity: 1
|   },
|   host: {
|     id: "...",
|     name: "Local Host",
|     price: 2000,
|     quantity: 1
|   }
| }
|
*/

const repeatablePricingSnapshotSchema = new mongoose.Schema(
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
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Repeatable Group Item Snapshot Schema
|--------------------------------------------------------------------------
|
| Stores one repeated configuration.
|
| Example:
|
| {
|   pricingOptions: {
|     shoot: "optionId",
|     drone: "optionId",
|     host: "optionId"
|   },
|
|   pricingQuantities: {
|     shoot: 1,
|     drone: 1,
|     host: 1
|   },
|
|   pricingSnapshots: {
|     shoot: {...},
|     drone: {...},
|     host: {...}
|   },
|
|   fields: {
|     url: "...",
|     requirements: "..."
|   }
| }
|
*/

const repeatableGroupItemSnapshotSchema = new mongoose.Schema(
  {
    pricingOptions: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    pricingQuantities: {
      type: Map,
      of: Number,
      default: {},
    },

    pricingSnapshots: {
      type: Map,
      of: repeatablePricingSnapshotSchema,
      default: {},
    },

    fields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Repeatable Group Snapshot Schema
|--------------------------------------------------------------------------
|
| Stores the configuration of a repeatable group at the time the
| order was created.
|
| Example:
|
| repeatableGroups: [
|   {
|     name: "reels",
|     label: "Reel",
|     minItems: 1,
|     maxItems: 10,
|     pricingGroups: ["shoot", "drone", "host"],
|     requiredPricingGroups: ["shoot"],
|     items: [...]
|   }
| ]
|
*/

const repeatableGroupSnapshotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    label: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    minItems: {
      type: Number,
      default: 1,
      min: 0,
    },

    maxItems: {
      type: Number,
      default: undefined,
      min: 1,
    },

    /*
    |--------------------------------------------------------------------------
    | Available Pricing Groups
    |--------------------------------------------------------------------------
    |
    | Stores all pricing groups that were available for this repeatable
    | group when the order was created.
    |
    | Example:
    |
    | ["shoot", "drone", "host"]
    |
    */

    pricingGroups: {
      type: [String],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | Required Pricing Groups
    |--------------------------------------------------------------------------
    |
    | Stores which pricing groups were mandatory when the order was
    | created.
    |
    | Example:
    |
    | pricingGroups: ["shoot", "drone", "host"]
    | requiredPricingGroups: ["shoot"]
    |
    | This is important for historical accuracy because an admin may
    | later change which pricing groups are required.
    |
    */

    requiredPricingGroups: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    items: {
      type: [repeatableGroupItemSnapshotSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Service Snapshot Schema
|--------------------------------------------------------------------------
|
| Stores the complete service configuration used for one order item.
|
| This is intentionally embedded so future changes to the Service
| document do not affect historical orders.
|
*/

const serviceSnapshotSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      default: "",
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

    /*
    |--------------------------------------------------------------------------
    | Backward-compatible single selected option
    |--------------------------------------------------------------------------
    |
    | Existing code may expect serviceSnapshot.selectedOption.
    | Keep it while selectedOptions remains the complete source.
    |
    */

    selectedOption: {
      type: selectedOptionSnapshotSchema,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | Complete selected pricing options
    |--------------------------------------------------------------------------
    |
    | Supports:
    |
    | 1. Normal pricing
    | 2. Grouped pricing
    | 3. Multiple selected pricing options
    |
    */

    selectedOptions: {
      type: [selectedOptionSnapshotSchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | Repeatable Groups
    |--------------------------------------------------------------------------
    |
    | Supports repeatable configurations such as:
    |
    | - Reels
    | - Multiple videos
    | - Multiple creatives
    | - Multiple posts
    | - Future repeatable service configurations
    |
    | Example:
    |
    | repeatableGroups: [
    |   {
    |     name: "reels",
    |     label: "Reel",
    |     pricingGroups: ["shoot", "drone", "host"],
    |     requiredPricingGroups: ["shoot"],
    |     items: [
    |       {...},
    |       {...}
    |     ]
    |   }
    | ]
    |
    */

    repeatableGroups: {
      type: [repeatableGroupSnapshotSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Order Item Schema
|--------------------------------------------------------------------------
|
| One Order can contain multiple services.
|
| Example:
|
| items: [
|   {
|     service: "...",
|     serviceSnapshot: {...},
|     quantity: 1,
|     formData: {...},
|     amount: 8000
|   },
|   {
|     service: "...",
|     serviceSnapshot: {...},
|     quantity: 2,
|     formData: {...},
|     amount: 5000
|   }
| ]
|
*/

const orderItemSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    serviceSnapshot: {
      type: serviceSnapshotSchema,
      required: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Quantity
    |--------------------------------------------------------------------------
    |
    | For normal services this is the selected service quantity.
    |
    | For grouped pricing, the controller stores 1 here because
    | each pricing option has its own quantity inside the snapshot.
    |
    */

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    /*
    |--------------------------------------------------------------------------
    | Dynamic service form data
    |--------------------------------------------------------------------------
    |
    | Supports normal fields as well as repeatable groups.
    |
    | Example:
    |
    | formData: {
    |   reels: [
    |     {
    |       url: "...",
    |       requirements: "..."
    |     },
    |     {
    |       url: "...",
    |       requirements: "..."
    |     }
    |   ]
    | }
    |
    */

    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /*
    |--------------------------------------------------------------------------
    | Server-calculated amount for this service
    |--------------------------------------------------------------------------
    */

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

/*
|--------------------------------------------------------------------------
| Main Order Schema
|--------------------------------------------------------------------------
*/

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

    /*
    |--------------------------------------------------------------------------
    | MULTI-SERVICE ORDER ITEMS
    |--------------------------------------------------------------------------
    |
    | New orders use this field.
    |
    */

    items: {
      type: [orderItemSchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | LEGACY SINGLE-SERVICE FIELDS
    |--------------------------------------------------------------------------
    |
    | These are intentionally retained.
    |
    | Existing orders already stored:
    |
    | - service
    | - serviceSnapshot
    | - quantity
    | - formData
    |
    | Keeping them prevents existing historical orders from breaking.
    |
    | For new multi-service orders these fields contain the first
    | selected service for backward compatibility with existing
    | payment/COD/admin code.
    |
    */

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    serviceSnapshot: {
      type: serviceSnapshotSchema,
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    /*
    |--------------------------------------------------------------------------
    | Additional requirements
    |--------------------------------------------------------------------------
    */

    additionalRequirements: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Pricing
    |--------------------------------------------------------------------------
    |
    | subtotal = sum of all selected service item amounts
    |
    | gstRate = 18 for online orders
    | gstRate = 0 for COD
    |
    | gstAmount = calculated GST
    |
    | amount = final payable amount
    |
    */

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    gstRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Final server-calculated amount
    |--------------------------------------------------------------------------
    |
    | This remains the final payable amount.
    |
    | Razorpay and COD code can continue using:
    |
    | order.amount
    |
    */

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Payment information
    |--------------------------------------------------------------------------
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
    |--------------------------------------------------------------------------
    | Razorpay information
    |--------------------------------------------------------------------------
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
    |--------------------------------------------------------------------------
    | COD information
    |--------------------------------------------------------------------------
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
    |--------------------------------------------------------------------------
    | When the admin generated the COD PIN
    |--------------------------------------------------------------------------
    */

    codPinGeneratedAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | When the client successfully verified the COD PIN
    |--------------------------------------------------------------------------
    */

    codPinVerifiedAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | When COD payment was successfully collected
    |--------------------------------------------------------------------------
    */

    codCollectedAt: {
      type: Date,
      default: null,
    },

    /*
    |--------------------------------------------------------------------------
    | Order workflow status
    |--------------------------------------------------------------------------
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

    deliveryLink: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || /^https?:\/\/\S+$/i.test(value),
        message: "Delivery link must be a valid HTTP or HTTPS URL.",
      },
    },

    invoice: {
      url: {
        type: String,
        trim: true,
        default: "",
        validate: {
          validator: (value) => !value || /^https?:\/\/\S+$/i.test(value),
          message: "Invoice URL must be a valid HTTP or HTTPS URL.",
        },
      },
      type: {
        type: String,
        enum: ["link"],
        default: "link",
      },
      name: {
        type: String,
        trim: true,
        default: "",
      },
      uploadedAt: {
        type: Date,
        default: null,
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Admin notes
    |--------------------------------------------------------------------------
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