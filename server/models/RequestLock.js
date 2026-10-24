const mongoose = require("mongoose");

// A database-backed lease works across API processes and survives restarts.
const schema = new mongoose.Schema({
  _id: String,
  expiresAt: { type: Date, required: true },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("RequestLock", schema);
