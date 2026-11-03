const test = require("node:test");
const assert = require("node:assert/strict");
const { outputDefinition, hydrateDeliverables, deliverableSummary, validateDeliverablePatch, deriveOrderStatus } = require("../utils/serviceDeliverables");

test("output plans count grids and separate reels, never shoot/host/add-on quantities", () => {
  assert.deepEqual(outputDefinition({ serviceSnapshot: { slug: "social-media-grid-posts" }, quantity: 3 }).map(entry => entry.name), ["Grid 1", "Grid 2", "Grid 3"]);
  assert.equal(outputDefinition({ serviceSnapshot: { slug: "social-media-grid-posts", selectedPricingMode: { key: "single_post" } }, quantity: 3 })[0].name, "Post 1");
  const configuration = { pricingOptions: { shoot: "camera", host: "host", voiceOver: "voice", editing: "edit" }, pricingQuantities: { shoot: 3, host: 3 } };
  const snapshot = { slug: "visual-content-reels", pricingOptions: [{ quantity: 3 }, { quantity: 3 }, { quantity: 1 }] };
  assert.equal(outputDefinition({ serviceSnapshot: snapshot, quantity: 7, formData: { reels: [configuration] } }).length, 1);
  assert.equal(outputDefinition({ serviceSnapshot: snapshot, formData: new Map([["reels", [configuration, configuration, configuration]]]) }).length, 3);
  assert.equal(outputDefinition({ serviceSnapshot: { ...snapshot, repeatableGroups: [{ name: "reels", items: [configuration, configuration, configuration] }] } }).length, 3);
  assert.equal(outputDefinition({ serviceSnapshot: snapshot, quantity: 7 }).length, 1);
  assert.equal(outputDefinition({ serviceSnapshot: { slug: "ads" }, quantity: 3 }).length, 0);
  assert.equal(outputDefinition({ serviceSnapshot: { supportsDelivery: true, pricingType: "per_unit", unit: "video" }, quantity: 3 }).length, 3);
});

test("legacy single link is carried over once; frozen output identities, statuses and removed links survive", () => {
  const item = { serviceSnapshot: { slug: "social-media-grid-posts" }, quantity: 3, delivery: { url: "https://example.com/shared" } };
  const entries = hydrateDeliverables(item);
  assert.equal(entries.length, 3); assert.equal(entries[0].links[0].url, item.delivery.url);
  assert.equal(entries[1].links.length, 0); assert.equal(entries[0].status, "pending");
  entries[0].links = []; entries[0].status = "completed";
  assert.deepEqual(hydrateDeliverables({ ...item, quantity: 9, serviceProgress: { deliveryVersion: 1, deliverables: entries } }), entries);
});

test("progress weights pending/in-progress/completed as 0/50/100 and counts completion", () => {
  assert.deepEqual(deliverableSummary([{ status: "completed" }, { status: "in_progress" }, { status: "pending" }]), {
    completedCount: 1, totalCount: 3, progressPercent: 50, displayStatus: "in_progress",
  });
  assert.equal(deliverableSummary([]).progressPercent, 0);
});

test("strict patch validation rejects injection, unsafe/duplicate links and oversized content", () => {
  for (const body of [{}, { status: "other" }, { name: "New output" }, { links: null }, { links: Array(21).fill({ url: "https://example.com" }) },
    { notes: 123 }, { notes: "x".repeat(4001) }, { links: [{ url: "https://example.com", label: "x".repeat(121) }] },
    ...["javascript:alert(1)", "data:text/html,x", "https://user:pass@example.com", "https://example.com/a b", "//example.com", "https://" + "a".repeat(2048)].map(url => ({ links: [{ url }] })),
    { links: [{ url: "https://example.com" }, { url: "https://example.com/" }] }]) assert.ok(validateDeliverablePatch(body), JSON.stringify(body));
  assert.equal(validateDeliverablePatch({ links: [{ label: "Final video", url: "https://example.com/final.mp4" }, { url: "https://example.com/source.zip" }], status: "completed", notes: "Ready" }), null);
  assert.equal(validateDeliverablePatch({ links: [] }), null);
});

test("order aggregation does not complete untracked services or revive cancelled/credit-released orders", () => {
  const complete = { type: "quantity_based", deliverables: [{ status: "completed" }] };
  assert.equal(deriveOrderStatus({ orderStatus: "processing" }, [complete]), "completed");
  assert.equal(deriveOrderStatus({ orderStatus: "processing" }, [complete, undefined]), "in_progress");
  assert.equal(deriveOrderStatus({ orderStatus: "cancelled" }, [complete]), "cancelled");
  assert.equal(deriveOrderStatus({ orderStatus: "cancelled", adCreditReleased: true }, [complete]), "cancelled");
  assert.equal(deriveOrderStatus({ orderStatus: "completed" }, [{ type: "quantity_based", deliverables: [{ status: "pending" }] }]), "in_progress");
  assert.equal(deriveOrderStatus({ orderStatus: "processing" }, [{ type: "time_based", status: "in_progress", deliverables: complete.deliverables }]), "in_progress");
});
