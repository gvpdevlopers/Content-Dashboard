const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  platform: { type: String, enum: ["metaAds", "googleAds"], required: true },
  kind: { type: String, enum: ["issued", "applied", "released"], required: true },
  amountPaise: { type: Number, required: true, min: 1 },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  note: { type: String, maxlength: 1000, default: "" },
}, { timestamps: true });
schema.index({ order: 1, platform: 1, kind: 1 }, { unique: true });
module.exports = mongoose.model("AdCreditEntry", schema);
