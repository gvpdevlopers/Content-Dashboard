// Keys use existing schema identifiers, never display labels. Deleted keys fail closed.
const key = (...parts) => JSON.stringify(parts.map(String));
const pricingKey = (option) => key("pricing", option._id);
const fieldKey = (owner, field, value) => key("field", owner, field.name, value);
const fieldTargets = (fields, owner, prefix = "") => (fields || []).flatMap(field => {
  if (field.includeValueInPrice) return [{ key: fieldKey(owner, field, "@value"), label: `${prefix}${field.label || field.name}`, field, owner }];
  return (field.options || []).filter(option => Number(option.price) > 0).map(option => ({ key: fieldKey(owner, field, option.value), label: `${prefix}${field.label || field.name}: ${option.label}`, field, owner, value: String(option.value) }));
});
const getCouponTargets = (service) => {
  const options = (service.pricingOptions || []).filter(o => o.isActive !== false);
  const pricing = options.filter(o => Number(o.price) > 0).map(o => ({ key: pricingKey(o), label: o.name }));
  // Ad budgets are pass-through funds, not discountable service fees.
  if (String(service.slug).toLowerCase() === "ads") return pricing;
  return [...pricing, ...fieldTargets(service.fields, "service"),
    ...options.flatMap(o => fieldTargets(o.fields, `option:${o._id}`, `${o.name} / `)),
    ...(service.repeatableGroups || []).filter(g => g.isActive !== false).flatMap(g => fieldTargets(g.fields, `group:${g.name}`, `${g.label || g.name} / `))
  ].map(({ key, label }) => ({ key, label }));
};
const collectCouponComponents = (service, contexts) => {
  const catalog = new Map(getCouponTargets(service).map(t => [t.key, t]));
  const amounts = new Map();
  const add = (id, amount) => {
    if (catalog.has(id) && Number.isFinite(amount) && amount > 0) amounts.set(id, (amounts.get(id) || 0) + amount);
  };
  for (const context of contexts) {
    for (const { option, quantity } of context.pricing || []) add(pricingKey(option), Number(option.price) * quantity);
    const fields = new Map();
    for (const source of context.sources || []) for (const field of source.fields || []) {
      if (!context.applicableFields || context.applicableFields.includes(field)) fields.set(field.name, { field, owner: source.owner });
    }
    for (const { field, owner } of fields.values()) {
      const value = context.data?.[field.name];
      if (value === undefined || value === null || value === "" || (field.type === "checkbox" && value === false)) continue;
      if (field.includeValueInPrice) { add(fieldKey(owner, field, "@value"), Number(value)); continue; }
      const selected = new Set((Array.isArray(value) ? value : [value]).map(String));
      for (const option of field.options || []) if (selected.has(String(option.value))) add(fieldKey(owner, field, option.value), Number(option.price));
    }
  }
  return [...amounts].map(([key, amount]) => ({ key, label: catalog.get(key).label, amount: Math.round((amount + Number.EPSILON) * 100) / 100 }));
};
module.exports = { getCouponTargets, collectCouponComponents };
