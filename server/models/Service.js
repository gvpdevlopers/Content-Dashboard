const mongoose = require("mongoose");

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

    required: {
      type: Boolean,
      default: false,
    },

    options: [
      {
        label: {
          type: String,
          trim: true,
        },
        value: {
          type: String,
          trim: true,
        },
      },
    ],

    min: {
      type: Number,
    },

    max: {
      type: Number,
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
      enum: ["fixed", "starting_from", "custom"],
      default: "fixed",
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    fields: [serviceFieldSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Service", serviceSchema);