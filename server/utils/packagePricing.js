// Keep service-specific coupons meaningful inside a fixed-price bundle. Ad
// budgets remain fully funded; distribute only the service-fee portion.
const applyFixedPackagePrice = (results, price) => {
  const totalPaise = Math.round(Number(price) * 100);
  if (!Number.isSafeInteger(totalPaise) || totalPaise < 0) throw new Error("This package has invalid pricing.");
  const rows = results.map((result) => {
    const original = Math.round(Number(result.amount || 0) * 100);
    const eligible = Math.min(original, Math.round(Number(result.couponEligibleAmount || 0) * 100));
    return { result, reserve: original - eligible, weight: eligible };
  });
  const reserves = rows.reduce((sum, row) => sum + row.reserve, 0);
  if (reserves > totalPaise) throw Object.assign(new Error("Package price must cover the included ad spend. Reduce ad spend or ask an administrator to update the package price."), { statusCode: 400 });
  const fee = totalPaise - reserves;
  const weights = rows.reduce((sum, row) => sum + row.weight, 0);
  let remaining = fee;
  rows.forEach((row, index) => {
    const share = index === rows.length - 1 ? remaining : Math.floor(fee * (weights ? row.weight / weights : 1 / rows.length));
    remaining -= share;
    row.result.amount = (row.reserve + share) / 100;
    row.result.item.amount = row.result.amount;
    row.result.couponEligibleAmount = share / 100;
  });
};
module.exports = { applyFixedPackagePrice };
