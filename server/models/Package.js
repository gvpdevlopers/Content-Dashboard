const mongoose = require("mongoose");

const packageServiceSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
  quantity: { type: Number, required: true, min: 1, max: 100, default: 1 },
  pricingOptionId: { type: String, default: "" },
  formData: { type: mongoose.Schema.Types.Mixed, default: {} },
  serviceSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const packageSchema = new mongoose.Schema({
  slug: { type: String, required: true, trim: true, lowercase: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", trim: true, maxlength: 1000 },
  services: { type: [packageServiceSchema], required: true, validate: (value) => value.length > 0 && value.length <= 50 },
  pricingMode: { type: String, enum: ["fixed", "calculated"], default: "fixed" },
  price: { type: Number, required: true, min: 0 },
  comparisonPrice: { type: Number, default: null, min: 0 },
  visibility: { type: String, enum: ["all", "selected"], default: "all" },
  clients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

packageSchema.index({ isActive: 1, visibility: 1, updatedAt: -1 });

module.exports = mongoose.model("Package", packageSchema);
