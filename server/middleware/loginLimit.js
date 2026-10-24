const crypto = require("crypto");
const RateBucket = require("../models/RateBucket");

module.exports = async (req, res, next) => {
  if (typeof req.body?.identifier !== "string" ||
      typeof req.body?.password !== "string" ||
      req.body.identifier.length > 254 || req.body.password.length > 1024) {
    return res.status(400).json({ success: false, message: "Invalid login input." });
  }
  const windowMs = 15 * 60 * 1000;
  const windowId = Math.floor(Date.now() / windowMs);
  try {
    for (const [kind, value, limit] of [
      ["ip", req.ip, 100],
      ["account", req.body.identifier.toLowerCase(), 15],
    ]) {
      const hash = crypto.createHash("sha256").update(String(value)).digest("hex");
      const bucket = await RateBucket.findOneAndUpdate(
        { _id: `${kind}:${hash}:${windowId}` },
        { $inc: { count: 1 }, $set: { expiresAt: new Date((windowId + 1) * windowMs) } },
        { upsert: true, new: true },
      );
      if (bucket.count > limit) {
        res.set("Retry-After", String(Math.ceil(((windowId + 1) * windowMs - Date.now()) / 1000)));
        return res.status(429).json({ success: false, message: "Too many login attempts. Please try again later." });
      }
    }
    next();
  } catch (error) {
    console.error("Login rate limit unavailable:", error);
    return res.status(503).json({ success: false, message: "Login temporarily unavailable. Please try again." });
  }
};
