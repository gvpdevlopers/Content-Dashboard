const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  _id: String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  platform: { type: String, enum: ["metaAds", "googleAds"], required: true },
  balancePaise: { type: Number, default: 0, min: 0, required: true },
}, { timestamps: true });
module.exports = mongoose.model("AdCreditWallet", schema);
