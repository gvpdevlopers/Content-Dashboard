const mongoose = require("mongoose");
const { SERVICE_GROUPS } = require("../utils/serviceAccess");

const serviceAccessSchema = new mongoose.Schema({
  mode: { type: String, enum: ["groups", "selected"], required: true },
  groups: { type: [{ type: String, enum: SERVICE_GROUPS }], default: [] },
  serviceIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }], default: [] },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["client", "employee", "admin"],
      default: "client",
    },

    allowMonthEndPayment: {
      type: Boolean,
      default: false,
    },

    serviceAccess: {
      type: serviceAccessSchema,
      default: () => ({ mode: "groups", groups: ["content"], serviceIds: [] }),
    },

    tokenVersion: {
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
  }
);

module.exports = mongoose.model("User", userSchema);
