// Stable catalog slugs define which services produce downloadable deliverables.
// Historical snapshots retain an explicit capability; older orders use this policy.
const deliverableServiceSlugs = new Set([
  "social-media-grid-posts",
  "festival-stories-animated-graphics",
  "visual-content-reels",
]);
const supportsServiceDelivery = (snapshot = {}) =>
  typeof snapshot.supportsDelivery === "boolean"
    ? snapshot.supportsDelivery
    : deliverableServiceSlugs.has(String(snapshot.slug || "").trim().toLowerCase()) ||
      (snapshot.pricingType === "per_unit" && ["video", "design", "image", "post"].includes(String(snapshot.unit || "").trim().toLowerCase()));
module.exports = { supportsServiceDelivery };
