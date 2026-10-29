const RequestLock = require("../models/RequestLock");

const acquireLock = async (key) => {
  // Match the lease date on release so old requests cannot remove newer leases.
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  try {
    await RequestLock.findOneAndUpdate(
      { _id: key, expiresAt: { $lte: new Date() } },
      { $set: { expiresAt } },
    { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    const busy = new Error("This request is already processing. Please retry shortly.");
    busy.statusCode = 409;
    throw busy;
  }
  return () => RequestLock.deleteOne({ _id: key, expiresAt });
};

module.exports = { acquireLock };
