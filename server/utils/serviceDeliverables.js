const { supportsServiceDelivery } = require("../config/serviceDelivery");

const plain = (value) => typeof value?.toObject === "function" ? value.toObject({ flattenMaps: true }) : value;
const statuses = ["pending", "in_progress", "completed"];
const inactiveStatuses = ["cancelled", "rejected", "failed"];

// Only saved output-bearing configuration counts. Pricing option quantities are
// shoot/add-on quantities, not additional finished outputs.
function outputDefinition(item) {
  const snapshot = item?.serviceSnapshot || {};
  const slug = String(snapshot.slug || "").trim().toLowerCase();
  const unit = String(snapshot.unit || "").trim().toLowerCase();
  const data = item?.formData instanceof Map ? Object.fromEntries(item.formData) : item?.formData || {};
  let count = 1, name = "Delivery";
  if (slug === "visual-content-reels") {
    const saved = snapshot.repeatableGroups?.find(group => group.name === "reels")?.items;
    count = saved?.length || (Array.isArray(data.reels) ? data.reels.length : 0) || 1;
    name = "Reel";
  } else if (slug === "social-media-grid-posts") {
    count = Number(item.quantity) || 1;
    name = snapshot.selectedPricingMode?.key === "single_post" ? "Post" : "Grid";
  } else {
    if (!supportsServiceDelivery(snapshot)) return [];
    // A saved per-unit video/design service can safely use its service quantity.
    // Subscriptions and other ambiguous services get one shared handoff.
    if (snapshot.pricingType === "per_unit" && ["video", "design", "image", "post"].includes(unit)) {
      count = Number(item.quantity) || 1;
      name = unit[0].toUpperCase() + unit.slice(1);
    }
  }
  if (!Number.isSafeInteger(count) || count < 1) count = 1;
  return Array.from({ length: count }, (_, index) => ({ key: String(index + 1), name: `${name} ${index + 1}` }));
}

function hydrateDeliverables(item) {
  const saved = plain(item?.serviceProgress);
  // Once frozen, the output list is authoritative even if other snapshots change.
  const definitions = saved?.deliverables?.length ? saved.deliverables : outputDefinition(item);
  const at = item.createdAt || item.delivery?.updatedAt || null;
  return definitions.map((entry, index) => ({
    status: "pending", completedAt: null, notes: "", links: [],
    createdAt: at, updatedAt: at,
    ...plain(entry),
    id: entry.id || `${item._id || "legacy"}:${entry.key}`,
    // A legacy single service link is carried forward exactly once. Never copy
    // it onto every output or treat its presence as completion.
    ...(!saved?.deliveryVersion && index === 0 && validDeliveryUrl(item.delivery?.url) && !entry.links?.length
      ? { links: [{ label: "Previous service delivery (shared)", url: item.delivery.url }] } : {}),
  }));
}

function deliverableSummary(deliverables = []) {
  const completedCount = deliverables.filter(entry => entry.status === "completed").length;
  const totalCount = deliverables.length;
  const started = deliverables.some(entry => entry.status !== "pending");
  return {
    completedCount, totalCount,
    progressPercent: totalCount ? deliverables.reduce((sum, entry) => sum + (entry.status === "completed" ? 100 : entry.status === "in_progress" ? 50 : 0), 0) / totalCount : 0,
    displayStatus: totalCount && completedCount === totalCount ? "completed" : started ? "in_progress" : "pending_start",
  };
}

function validDeliveryUrl(value) {
  if (typeof value !== "string" || !value || value.length > 2048 || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

function validateDeliverablePatch(body) {
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some(key => !["status", "notes", "links", "updatedAt"].includes(key)) ||
      !["status", "notes", "links"].some(key => Object.hasOwn(body, key))) return "Supply a status, notes or delivery links.";
  if (Object.hasOwn(body, "status") && !statuses.includes(body.status)) return "Select a valid deliverable status.";
  if (Object.hasOwn(body, "notes") && (typeof body.notes !== "string" || body.notes.length > 4000)) return "Notes must be at most 4,000 characters.";
  if (Object.hasOwn(body, "links")) {
    if (!Array.isArray(body.links) || body.links.length > 20) return "Each deliverable can have up to 20 links.";
    const seen = new Set();
    for (const link of body.links) {
      if (!link || typeof link !== "object" || Array.isArray(link) || Object.keys(link).some(key => !["url", "label"].includes(key)) ||
          !validDeliveryUrl(typeof link.url === "string" ? link.url.trim() : link.url) ||
          (link.label !== undefined && (typeof link.label !== "string" || link.label.length > 120))) return "Use a valid HTTP/HTTPS URL without credentials and a label of at most 120 characters.";
      const url = new URL(link.url.trim()).href;
      if (seen.has(url)) return "Remove duplicate delivery links.";
      seen.add(url);
    }
  }
  return null;
}

// Do not complete untracked services, revive cancelled orders, release credit,
// or change any payment state. Calendar-based services still need staff completion.
function deriveOrderStatus(order, progresses) {
  if (inactiveStatuses.includes(order.orderStatus) || order.adCreditReleased) return order.orderStatus;
  const complete = progress => progress &&
    (progress.type === "time_based" ? progress.status === "completed" : deliverableSummary(progress.deliverables).displayStatus === "completed") &&
    (!progress.deliverables?.length || deliverableSummary(progress.deliverables).displayStatus === "completed");
  if (progresses.length && progresses.every(complete)) return "completed";
  const started = progresses.some(progress => progress && (progress.status === "in_progress" || progress.status === "completed" || progress.deliverables?.some(entry => entry.status !== "pending")));
  if (started || order.orderStatus === "completed") return "in_progress";
  return order.orderStatus;
}

module.exports = { outputDefinition, hydrateDeliverables, deliverableSummary, validDeliveryUrl, validateDeliverablePatch, deriveOrderStatus, inactiveStatuses };
