// Largest-remainder allocation in paise keeps component balances and the
// undiscounted base fee consistent when a whole-service discount is stacked.
const reduceCouponComponents = (components, eligibleAmount, line, scope) => {
  if (scope === "options") {
    const discounts = new Map(line.optionBreakdown.map(option => [option.key, Math.round(option.discountAmount * 100)]));
    return components.map(component => ({ ...component, amount: Math.max(0, Math.round(component.amount * 100) - (discounts.get(component.key) || 0)) / 100 }));
  }
  const weights = components.map(component => Math.round(component.amount * 100));
  weights.push(Math.max(0, Math.round(eligibleAmount * 100) - weights.reduce((sum, value) => sum + value, 0)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (!total) return components;
  const discount = Math.round(line.discountAmount * 100);
  const shares = weights.map(weight => Math.floor(discount * weight / total));
  let remaining = discount - shares.reduce((sum, value) => sum + value, 0);
  const ranked = weights.map((weight, index) => ({ index, remainder: (discount * weight) % total })).sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const { index } of ranked) { if (remaining <= 0) break; if (shares[index] < weights[index]) { shares[index]++; remaining--; } }
  return components.map((component, index) => ({ ...component, amount: Math.max(0, weights[index] - shares[index]) / 100 }));
};
module.exports = { reduceCouponComponents };
