// Remove fields belonging to deselected options in the same state update.
// Preserve other items and repeatable/group metadata by reference when possible.
export function cleanInactiveOrderFields(items, getPricingOptions, getActiveFields) {
  let changed = false;
  const next = items.map((item) => {
    const configured = new Set([
      ...(item.service?.fields || []),
      ...getPricingOptions(item.service).flatMap((option) => option.fields || []),
    ].map((field) => String(field?.name || "").trim()).filter(Boolean));
    const active = new Set(getActiveFields(item).map((field) => String(field?.name || "").trim()).filter(Boolean));
    const stale = [...configured].filter((name) => !active.has(name) && Object.hasOwn(item.formData || {}, name));
    if (!stale.length) return item;
    const formData = { ...(item.formData || {}) };
    for (const name of stale) delete formData[name];
    changed = true;
    return { ...item, formData };
  });
  return changed ? next : items;
}
