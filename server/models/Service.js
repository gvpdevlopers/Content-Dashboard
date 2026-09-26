const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Service Field Option
|--------------------------------------------------------------------------
*/

const serviceFieldOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    value: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Service Field
|--------------------------------------------------------------------------
*/

const serviceFieldSchema = new mongoose.Schema(
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

    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "number",
        "select",
        "radio",
        "checkbox",
        "date",
        "url",
      ],
      default: "text",
    },

    placeholder: {
      type: String,
      default: "",
      trim: true,
    },

    helpText: {
      type: String,
      default: "",
      trim: true,
    },

    required: {
      type: Boolean,
      default: false,
    },

    options: {
      type: [serviceFieldOptionSchema],
      default: [],
    },

    min: {
      type: Number,
      default: undefined,
    },

    max: {
      type: Number,
      default: undefined,
    },

    step: {
      type: Number,
      default: undefined,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Repeatable Configuration Group
|--------------------------------------------------------------------------
|
| Used for services where the client can configure multiple
| independent items.
|
| Example:
|
| repeatableGroups: [
|   {
|     name: "reels",
|     label: "Reel",
|     description: "Configure each reel individually",
|     pricingGroups: ["shoot", "drone", "host"],
|     requiredPricingGroups: ["shoot"],
|     minItems: 1,
|     maxItems: 10,
|     fields: [
|       {
|         name: "url",
|         label: "Reel URL",
|         type: "url",
|         required: true
|       }
|     ]
|   }
| ]
|
*/

const serviceRepeatableGroupSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Internal key
    |--------------------------------------------------------------------------
    |
    | This is used by the frontend/backend to store the repeated data.
    |
    | Example:
    | formData.reels = [...]
    |
    */

    name: {
      type: String,
      required: true,
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Display label
    |--------------------------------------------------------------------------
    */

    label: {
      type: String,
      required: true,
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Optional description
    |--------------------------------------------------------------------------
    */

    description: {
      type: String,
      default: "",
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Pricing Groups
    |--------------------------------------------------------------------------
    |
    | References the `group` values from service.pricingOptions.
    |
    | Example:
    |
    | pricingOptions:
    |   - group: "shoot"
    |   - group: "drone"
    |   - group: "host"
    |
    | repeatableGroups:
    |   - pricingGroups: ["shoot", "drone", "host"]
    |
    | This allows every repeated item to have its own pricing
    | selections without duplicating pricing configuration.
    |
    */

    pricingGroups: {
      type: [String],
      default: [],
      set: (values) => {
        if (!Array.isArray(values)) {
          return [];
        }

        return [
          ...new Set(
            values
              .map((value) => String(value).trim())
              .filter(Boolean)
          ),
        ];
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Required Pricing Groups
    |--------------------------------------------------------------------------
    |
    | Defines which pricing groups must have a selection
    | for every repeated item.
    |
    | Example:
    |
    | pricingGroups:
    |   ["shoot", "drone", "host"]
    |
    | requiredPricingGroups:
    |   ["shoot"]
    |
    | Result:
    |
    | Shoot = required
    | Drone = optional
    | Host = optional
    |
    | IMPORTANT:
    | requiredPricingGroups should always be a subset of pricingGroups.
    |
    */

    requiredPricingGroups: {
      type: [String],
      default: [],
      set: (values) => {
        if (!Array.isArray(values)) {
          return [];
        }

        return [
          ...new Set(
            values
              .map((value) => String(value).trim())
              .filter(Boolean)
          ),
        ];
      },
    },

    /*
    |--------------------------------------------------------------------------
    | Minimum Number Of Items
    |--------------------------------------------------------------------------
    */

    minItems: {
      type: Number,
      default: 1,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Maximum Number Of Items
    |--------------------------------------------------------------------------
    */

    maxItems: {
      type: Number,
      default: 10,
      min: 1,
    },

    /*
    |--------------------------------------------------------------------------
    | Active / Inactive
    |--------------------------------------------------------------------------
    */

    isActive: {
      type: Boolean,
      default: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Fields
    |--------------------------------------------------------------------------
    |
    | These fields are repeated for every item.
    |
    */

    fields: {
      type: [serviceFieldSchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | Display Order
    |--------------------------------------------------------------------------
    */

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Service Pricing Option
|--------------------------------------------------------------------------
*/

const servicePricingOptionSchema = new mongoose.Schema(
  {
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
      required: true,
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Pricing Group
    |--------------------------------------------------------------------------
    |
    | Example:
    | "shoot"
    | "drone"
    | "host"
    |
    */

    group: {
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

    isActive: {
      type: Boolean,
      default: true,
    },

    fields: {
      type: [serviceFieldSchema],
      default: [],
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: true,
  }
);

/*
|--------------------------------------------------------------------------
| Main Service Schema
|--------------------------------------------------------------------------
*/

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
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
    | Service Pricing Options
    |--------------------------------------------------------------------------
    */

    pricingOptions: {
      type: [servicePricingOptionSchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | Service-Level Fields
    |--------------------------------------------------------------------------
    */

    fields: {
      type: [serviceFieldSchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | Repeatable Configuration Groups
    |--------------------------------------------------------------------------
    |
    | Generic support for services containing multiple independently
    | configurable items.
    |
    | Example:
    |
    | repeatableGroups: [
    |   {
    |     name: "reels",
    |     label: "Reel",
    |     pricingGroups: ["shoot", "drone", "host"],
    |     requiredPricingGroups: ["shoot"],
    |     minItems: 1,
    |     maxItems: 10,
    |     fields: [...]
    |   }
    | ]
    |
    */

    repeatableGroups: {
      type: [serviceRepeatableGroupSchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | Service Status
    |--------------------------------------------------------------------------
    */

    isActive: {
      type: Boolean,
      default: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Display Order
    |--------------------------------------------------------------------------
    */

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Service", serviceSchema);