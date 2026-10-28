// Seed inputs for the existing Service model, not a separate client catalogue.
const templates = require("../data/serviceTemplates.json");
const definitions = [
  ["complete-seo-package", "Complete SEO Package", "General SEO planning and website optimization support", "package"],
  ["keyword-research", "Keyword Research", "Research into search topics, audience intent and relevant keywords", "project"],
  ["seo-audit", "SEO Audit", "Review of a website's search-related structure and technical considerations", "project"],
  ["on-page-seo", "On-Page SEO", "Review and optimization of website page content and on-page elements", "project"],
  ["website-speed-performance", "Speed & Performance Optimization", "Assessment and optimization of website speed and performance considerations", "project"],
  ["wordpress-website", "WordPress Website", "Website development using WordPress", "project"],
  ["shopify-store", "Shopify Website", "Website and storefront development using Shopify", "project"],
  ["custom-website", "Custom Website", "Custom website development based on project requirements", "project"],
  ["website-changes", "Website Changes", "Updates and modifications to an existing website", "project"],
  ["development-hours", "Hourly Development Package", "Development support priced by administrator-configured hours", "hour"],
];

module.exports = definitions.map(([slug, name, scope, unit], index) => {
  const template = templates.find((entry) => entry.slug === slug);
  if (!template) throw new Error(`Missing service template: ${slug}`);
  return {
    name, slug, serviceGroup: template.serviceGroup, category: template.category,
    description: `Initial configuration placeholder: ${scope}. Scope, pricing and any delivery terms require administrator configuration before activation.`,
    pricingType: unit === "hour" ? "per_unit" : "fixed",
    basePrice: 0, unit, minQuantity: 1,
    pricingOptions: [],
    fields: structuredClone(template.fields).filter((field) => field.type !== "number"),
    repeatableGroups: [], isActive: false, isPublic: false, displayOrder: 100 + index,
  };
});
