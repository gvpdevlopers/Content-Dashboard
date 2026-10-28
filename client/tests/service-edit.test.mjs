import test from "node:test";
import assert from "node:assert/strict";
import { buildServiceEditPayload } from "../src/utils/serviceEditPayload.js";
const base = { name: "SEO", slug: "seo", category: "SEO", serviceGroup: "seo", isPublic: false, isActive: false,
  pricingType: "per_unit", basePrice: 1000, unit: "page", minQuantity: 1, pricingOptions: [], fields: [] };

test("cleared service cap is explicitly sent to PATCH while numeric caps remain numeric", () => {
  for (const maxQuantity of ["", null, undefined]) {
    const payload = buildServiceEditPayload({ ...base, maxQuantity });
    assert.equal(payload.maxQuantity, null);
    assert.equal(JSON.parse(JSON.stringify(payload)).maxQuantity, null);
    assert.equal(payload.basePrice, 1000); assert.equal(payload.serviceGroup, "seo");
    assert.equal(payload.isActive, false); assert.equal(payload.isPublic, false);
  }
  assert.equal(buildServiceEditPayload({ ...base, maxQuantity: "12" }).maxQuantity, 12);
});

test("service edits preserve option IDs and priced fields while allowing an option cap to be removed", () => {
  const optionId = "abcdef123456789012345678";
  const original = { ...base, maxQuantity: "", pricingOptions: [{ _id: optionId, name: "Media", price: 100,
    unit: "month", minQuantity: 1, maxQuantity: "", isActive: true,
    fields: [{ name: "budget", label: "Budget", type: "number", required: true, includeValueInPrice: true, min: 0, step: 1 }] }] };
  const payload = buildServiceEditPayload(original), option = payload.pricingOptions[0];
  assert.equal(option._id, optionId); assert.equal(option.maxQuantity, undefined);
  assert.equal(option.fields[0].includeValueInPrice, true); assert.equal(option.fields[0].min, 0);
  assert.equal(original.pricingOptions[0].maxQuantity, "");
});
