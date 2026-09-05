const mongoose = require("mongoose");

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

    pricingOptions: {
      type: [servicePricingOptionSchema],
      default: [],
    },

    fields: {
      type: [serviceFieldSchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

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