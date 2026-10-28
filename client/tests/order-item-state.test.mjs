import test from "node:test";
import assert from "node:assert/strict";
import { cleanInactiveOrderFields } from "../src/utils/orderItemState.js";
const options = (service) => service.pricingOptions || [];
const activeFields = (item) => [...(item.service.fields || []), ...(item.selectedPricingOption?.fields || [])];

test("switching options removes stale priced fields immediately and preserves selected values and repeatable data", () => {
  const a = { fields: [{ name: "oldBudget", includeValueInPrice: true }] };
  const b = { fields: [{ name: "newBudget", includeValueInPrice: true }] };
  const entries = [{ fields: { brief: "Keep this repeatable entry" } }];
  const item = { service: { fields: [{ name: "brief" }], pricingOptions: [a, b] }, selectedPricingOption: b,
    formData: { brief: "Keep this brief", oldBudget: 5000, newBudget: 2000, reels: entries, pricingQuantities: { media: 2 } } };
  const next = cleanInactiveOrderFields([item], options, activeFields);
  assert.equal(next[0].formData.oldBudget, undefined); assert.equal(next[0].formData.newBudget, 2000);
  assert.equal(next[0].formData.brief, "Keep this brief"); assert.equal(next[0].formData.reels, entries);
  assert.deepEqual(next[0].formData.pricingQuantities, { media: 2 });
  assert.equal(item.formData.oldBudget, 5000);
  assert.equal(cleanInactiveOrderFields(next, options, activeFields), next);
});

test("cleaning one service leaves another service's state and an already clean array unchanged", () => {
  const first = { service: { fields: [], pricingOptions: [{ fields: [{ name: "stale" }] }] }, formData: { stale: 1 } };
  const second = { service: { fields: [{ name: "brief" }] }, formData: { brief: "Keep" } };
  const next = cleanInactiveOrderFields([first, second], options, activeFields);
  assert.equal(next[1], second); assert.notEqual(next[0], first);
  assert.equal(cleanInactiveOrderFields(next, options, activeFields), next);
});
