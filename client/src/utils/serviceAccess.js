export const defaultServiceAccess = { mode: "groups", groups: ["content"], serviceIds: [] };

// Missing legacy access defaults to Content; explicit malformed access must not.
export function getEditableServiceAccess(value) {
  if (value === undefined) return { mode: "groups", groups: ["content"], serviceIds: [] };
  if (value?.mode === "groups") return { mode: "groups", serviceIds: [],
    groups: Array.isArray(value.groups) ? [...new Set(value.groups.filter((group) => ["content", "seo", "development"].includes(group)))] : [] };
  if (value?.mode === "selected") return { mode: "selected", groups: [],
    serviceIds: Array.isArray(value.serviceIds) ? [...new Set(value.serviceIds.map(String))] : [] };
  return { mode: "selected", groups: [], serviceIds: [] };
}
