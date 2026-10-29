const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");

function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const module = { exports: {} };
  const realRequire = createRequire(filename);
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, "utf8")}\n})`, { filename })(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : realRequire(id), module, module.exports);
  return module.exports;
}
const clientId = "123456789012345678901234";
const orderId = "123456789012345678901235";
const response = () => ({ statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; } });

test("delivery capability uses catalog slugs and snapshot overrides, never display names", () => {
  const { supportsServiceDelivery } = require("../config/serviceDelivery");
  for (const slug of ["social-media-grid-posts", "festival-stories-animated-graphics", "visual-content-reels"]) {
    assert.equal(supportsServiceDelivery({ slug }), true);
    assert.equal(supportsServiceDelivery({ slug, supportsDelivery: false }), false);
  }
  assert.equal(supportsServiceDelivery({ slug: "ads" }), false);
  assert.equal(supportsServiceDelivery({ name: "Social Media Grid Posts" }), false);
});

const itemId = "123456789012345678901236";
function fixture({ slug = "social-media-grid-posts", itemMissing = false, orderMissing = false, matchedCount = 1 } = {}) {
  const writes = [];
  const item = { _id: itemId, serviceSnapshot: { slug }, serviceProgress: { status: "in_progress" } };
  const order = { _id: orderId, items: { id: (id) => id === itemId && !itemMissing ? item : null },
    paymentStatus: "pending", orderStatus: "processing", deliveryLink: "https://example.com/legacy" };
  const controller = load("controllers/orderController.js", { "../models/Order": {
    findById: async () => orderMissing ? null : order,
    updateOne: async (filter, update, options) => { writes.push({ filter, update, options }); return { matchedCount }; },
  } });
  return { controller, writes, item, order };
}
const request = (url, role = "employee") => ({ user: { _id: clientId, role }, params: { id: orderId, itemId }, body: { url } });

test("admin and employee independently save and clear one service delivery with metadata", async () => {
  for (const role of ["admin", "employee"]) {
    const f = fixture();
    for (const url of [" https://example.com/deliverables ", ""]) {
      const res = response(); await f.controller.updateServiceDelivery(request(url, role), res);
      assert.equal(res.statusCode, 200);
      const write = f.writes.at(-1);
      assert.deepEqual(write.filter, { _id: orderId, "items._id": itemId });
      assert.deepEqual(Object.keys(write.update.$set), ["items.$.delivery"]);
      assert.equal(write.update.$set["items.$.delivery"].url, url.trim());
      assert.equal(write.update.$set["items.$.delivery"].updatedBy, clientId);
      assert.ok(write.update.$set["items.$.delivery"].updatedAt instanceof Date);
      assert.equal(write.options.runValidators, true);
      assert.equal(f.order.orderStatus, "processing");
      assert.equal(f.order.paymentStatus, "pending");
      assert.equal(f.order.deliveryLink, "https://example.com/legacy");
      assert.equal(f.item.serviceProgress.status, "in_progress");
    }
  }
});

test("clients, unsafe URLs and malformed IDs cannot write delivery links", async () => {
  const f = fixture();
  for (const [url, role, expected] of [
    ["https://example.com", "client", 403], ["javascript:alert(1)", "employee", 400],
    ["data:text/html,test", "admin", 400], ["https://user:secret@example.com", "admin", 400],
    ["https://example.com/a b", "admin", 400], [null, "admin", 400], [{}, "admin", 400],
    ["https://" + "a".repeat(2050), "admin", 400], ["relative/path", "employee", 400],
  ]) {
    const res = response(); await f.controller.updateServiceDelivery(request(url, role), res);
    assert.equal(res.statusCode, expected);
  }
  const req = request("https://example.com"); req.params.itemId = "legacy";
  const res = response(); await f.controller.updateServiceDelivery(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(f.writes.length, 0);
});

test("ineligible, missing or changed services reject delivery writes", async () => {
  for (const [config, expected] of [[{ slug: "ads" }, 400], [{ itemMissing: true }, 404],
    [{ orderMissing: true }, 404], [{ matchedCount: 0 }, 409]]) {
    const f = fixture(config), res = response();
    await f.controller.updateServiceDelivery(request("https://example.com"), res);
    assert.equal(res.statusCode, expected);
    if (expected !== 409) assert.equal(f.writes.length, 0);
  }
});

test("item delivery routes require authentication and existing staff/admin guards", () => {
  const routes = [], router = {};
  for (const method of ["get", "post", "patch"]) router[method] = (url, ...handlers) => routes.push({ url, handlers });
  const protect = () => {}, adminOnly = () => {}, orderStaff = () => {};
  load("routes/orderRoutes.js", { express: { Router: () => router }, "../middleware/auth": protect,
    "../middleware/admin": adminOnly, "../middleware/orderStaff": orderStaff });
  for (const [url, guard] of [["/admin/:id/items/:itemId/delivery", adminOnly], ["/staff/:id/items/:itemId/delivery", orderStaff]]) {
    const route = routes.find((r) => r.url === url);
    assert.equal(route.handlers[0], protect); assert.equal(route.handlers[1], guard);
  }
});

test("client detail queries scope service links to the authenticated owner and preserve invoice gating", async () => {
  let found;
  const raw = { _id: orderId, orderStatus: "processing", paymentStatus: "pending", invoice: { url: "https://example.com/invoice" },
    deliveryLink: "https://example.com/legacy", items: [{ _id: itemId, serviceSnapshot: { slug: "visual-content-reels" },
      delivery: { url: "https://example.com/reels", updatedAt: new Date(), updatedBy: clientId } }] };
  const query = { select() { return this; }, populate() { return this; }, then(resolve) { return Promise.resolve(found).then(resolve); } };
  const controller = load("controllers/orderController.js", { "../models/Order": { findOne: (filter) => {
    assert.equal(filter.client, clientId); found = filter._id === orderId ? raw : null; return query;
  } } });
  const res = response(); await controller.getOrderById({ user: { _id: clientId }, params: { id: orderId } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.order.items[0].delivery.url, "https://example.com/reels");
  assert.equal(res.body.order.items[0].supportsDelivery, true);
  assert.equal(res.body.order.invoice, undefined);
  assert.equal(res.body.order.deliveryLink, undefined);
  const missing = response(); await controller.getOrderById({ user: { _id: clientId }, params: { id: "123456789012345678901237" } }, missing);
  assert.equal(missing.statusCode, 404);
  raw.orderStatus = "completed";
  const complete = response(); await controller.getOrderById({ user: { _id: clientId }, params: { id: orderId } }, complete);
  assert.equal(complete.body.order.invoice.url, raw.invoice.url);
  assert.equal(complete.body.order.deliveryLink, raw.deliveryLink);
});
