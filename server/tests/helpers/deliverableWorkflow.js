const assert = require("node:assert/strict");

module.exports = async ({ t, call, orders, Order, Service, admin, clients }) => {
  const employee = { _id: admin._id, role: "employee" };
  const grids = await Service.create({ name: "Isolated grids", slug: "social-media-grid-posts", category: "Content", serviceGroup: "content", pricingType: "per_unit", basePrice: 300, unit: "line", minQuantity: 1, maxQuantity: 10 });
  const reels = await Service.create({ name: "Isolated reels", slug: "visual-content-reels", category: "Content", serviceGroup: "content", pricingType: "custom", basePrice: 0,
    pricingOptions: ["shoot", "host", "voiceOver"].map(group => ({ name: group, group, price: 100, unit: "reel", minQuantity: 1 })),
    repeatableGroups: [{ name: "reels", label: "Reel", minItems: 1, maxItems: 10, pricingGroups: ["shoot", "host", "voiceOver"], requiredPricingGroups: ["shoot"] }] });
  const create = async (service, quantity, formData = {}) => {
    const body = { paymentMethod: "cod", services: [{ serviceId: String(service._id), quantity, formData }] };
    const quote = await call(orders.getOrderQuote, clients[0], body); assert.equal(quote.statusCode, 200, quote.body.message);
    const result = await call(orders.createOrder, clients[0], { ...body, confirmedAmount: quote.body.quote.amount });
    assert.equal(result.statusCode, 201, result.body.message);
    return Order.findById(result.body.order._id);
  };
  const reelConfiguration = { pricingOptions: Object.fromEntries(reels.pricingOptions.map(option => [option.group, String(option._id)])), pricingQuantities: { shoot: 3, host: 3, voiceOver: 1 }, fields: {} };
  let gridOrder, repeatedOrder;
  const params = (order, key = "1") => ({ id: String(order._id), itemId: String(order.items[0]._id), deliverableKey: key });
  await t.test("checkout persists three grids, one configured reel and three separately configured reels", async () => {
    gridOrder = await create(grids, 3);
    assert.equal(gridOrder.items[0].serviceProgress.deliverables.length, 3);
    assert.equal(new Set(gridOrder.items[0].serviceProgress.deliverables.map(entry => entry.id)).size, 3);
    for (const count of [1, 3]) {
      const order = await create(reels, 1, { reels: Array.from({ length: count }, () => reelConfiguration) });
      assert.equal(order.items[0].serviceProgress.deliverables.length, count);
      if (count === 3) repeatedOrder = order;
      assert.ok(order.items[0].serviceProgress.deliverables.every(entry => entry.createdAt && entry.updatedAt));
      // Removing the live catalogue configuration cannot change saved output counts.
      await Service.updateOne({ _id: reels._id }, { $set: { description: "Changed after purchase" } });
      const view = await call(orders.getOrderById, clients[0], {}, { id: String(order._id) });
      assert.equal(view.body.order.items[0].serviceProgress.totalCount, count);
    }
  });
  await t.test("independent staff delivery edits persist multiple links, notes, weighted progress and history", async () => {
    const original = gridOrder.toObject();
    let result = await call(orders.updateDeliverable, admin, { status: "completed", links: [{ label: "Final grid", url: "https://example.com/grid-1" }, { label: "Source", url: "https://example.com/source.zip" }], notes: "Approved artwork" }, params(gridOrder));
    assert.equal(result.statusCode, 200, result.body.message);
    let progress = result.body.order.items[0].serviceProgress;
    assert.equal(progress.completedCount, 1); assert.equal(progress.deliverables[1].status, "pending");
    const first = progress.deliverables[0];
    result = await call(orders.updateDeliverable, employee, { status: "in_progress", links: [{ url: "https://example.com/grid-2" }] }, params(gridOrder, "2"));
    assert.equal(result.statusCode, 200, result.body.message);
    progress = result.body.order.items[0].serviceProgress;
    assert.equal(progress.progressPercent, 50); assert.deepEqual(progress.deliverables[0], first);
    assert.equal(result.body.order.orderStatus, "in_progress");
    for (const field of ["amount", "subtotal", "gstAmount", "paymentStatus", "paymentMethod", "deliveryLink"]) assert.deepEqual(result.body.order[field], original[field]);
    const saved = await Order.findById(gridOrder._id).select("+fulfillmentHistory");
    assert.equal(saved.fulfillmentHistory.length, 2); assert.equal(String(saved.fulfillmentHistory[1].actor), String(employee._id));
    assert.equal(saved.fulfillmentHistory[0].toStatus, "completed");
    assert.ok(saved.items[0].serviceProgress.deliverables[0].completedAt);
  });
  await t.test("three grids and three reels retain independent output URLs and real route authorization", async () => {
    const third = await call(orders.updateDeliverable, employee, { links: [{ url: "https://example.com/grid-3" }] }, params(gridOrder, "3"));
    assert.equal(third.statusCode, 200, third.body.message);
    assert.equal(third.body.order.items[0].serviceProgress.deliverables.filter(entry => entry.links.length).length, 3);
    for (const key of ["1", "2", "3"]) {
      const result = await call(orders.updateDeliverable, employee, { status: key === "2" ? "in_progress" : "pending", links: [{ url: `https://example.com/reel-${key}` }] }, params(repeatedOrder, key));
      assert.equal(result.statusCode, 200, result.body.message);
    }
    const saved = await Order.findById(repeatedOrder._id);
    assert.deepEqual(saved.items[0].serviceProgress.deliverables.map(entry => entry.status), ["pending", "in_progress", "pending"]);
    assert.equal(new Set(saved.items[0].serviceProgress.deliverables.map(entry => entry.links[0].url)).size, 3);
    const express = require("express"), jwt = require("jsonwebtoken"), { once } = require("node:events");
    const User = require("../../models/User");
    const staff = await User.create({ name: "Delivery staff", username: "delivery-staff", password: "fixture-only", role: "employee" });
    const app = express(); app.use(express.json()); app.use("/api/orders", require("../../routes/orderRoutes"));
    const server = app.listen(0, "127.0.0.1"); await once(server, "listening");
    try {
      const endpoint = `/api/orders/staff/${repeatedOrder._id}/items/${repeatedOrder.items[0]._id}/deliverables/1`;
      const request = (user, path = endpoint) => fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...(user ? { Authorization: `Bearer ${jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET)}` } : {}) }, body: JSON.stringify({ notes: "Route verified" }) });
      assert.equal((await request(null)).status, 401);
      assert.equal((await request(clients[0])).status, 403);
      assert.equal((await request(staff, endpoint.replace("/staff/", "/admin/"))).status, 403);
      assert.equal((await request(staff)).status, 200);
      assert.equal((await request(admin, endpoint.replace("/staff/", "/admin/"))).status, 200);
    } finally { await new Promise(resolve => server.close(resolve)); }
  });
  await t.test("clients can read their deliveries only; invalid and stale writes are rejected", async () => {
    const own = await call(orders.getOrderById, clients[0], {}, { id: String(gridOrder._id) });
    assert.equal(own.body.order.items[0].serviceProgress.deliverables[0].links.length, 2);
    assert.equal(own.body.order.fulfillmentHistory, undefined);
    assert.equal((await call(orders.getOrderById, clients[1], {}, { id: String(gridOrder._id) })).statusCode, 404);
    assert.equal((await call(orders.updateDeliverable, clients[0], { status: "completed" }, params(gridOrder))).statusCode, 403);
    assert.equal((await call(orders.updateDeliverable, employee, { links: [{ url: "javascript:alert(1)" }] }, params(gridOrder))).statusCode, 400);
    assert.equal((await call(orders.updateDeliverable, employee, { status: "completed" }, params(gridOrder, "99"))).statusCode, 404);
    assert.equal((await call(orders.updateDeliverable, employee, { status: "pending", updatedAt: "2000-01-01" }, params(gridOrder))).statusCode, 409);
    assert.equal((await call(orders.updateDeliverable, employee, { status: "pending" }, { ...params(gridOrder), itemId: "legacy" })).statusCode, 404);
  });
  await t.test("all outputs complete the order; reopening one preserves other outputs and resets its completion", async () => {
    for (const key of ["2", "3"]) {
      const result = await call(orders.updateServiceProgress, employee, { action: "set_deliverable_status", deliverableKey: key, status: "completed" }, params(gridOrder));
      assert.equal(result.statusCode, 200, result.body.message);
    }
    assert.equal((await Order.findById(gridOrder._id)).orderStatus, "completed");
    const reopened = await call(orders.updateDeliverable, employee, { status: "pending", links: [] }, params(gridOrder, "2"));
    assert.equal(reopened.body.order.orderStatus, "in_progress");
    const outputs = reopened.body.order.items[0].serviceProgress.deliverables;
    assert.equal(outputs[1].completedAt, null); assert.equal(outputs[1].links.length, 0);
    assert.equal(outputs[0].status, "completed"); assert.equal(outputs[2].status, "completed");
    await Order.updateOne({ _id: gridOrder._id }, { $set: { orderStatus: "cancelled" } });
    assert.equal((await call(orders.updateDeliverable, admin, { status: "completed" }, params(gridOrder))).statusCode, 409);
  });
  await t.test("legacy service links migrate once on first edit and remain removed after clearing", async () => {
    const legacy = await create(grids, 3);
    await Order.updateOne({ _id: legacy._id }, { $unset: { "items.0.serviceProgress": "" }, $set: { "items.0.delivery": { url: "https://example.com/old", updatedAt: new Date(), updatedBy: admin._id } } });
    const before = await call(orders.getOrderById, clients[0], {}, { id: String(legacy._id) });
    assert.equal(before.body.order.items[0].serviceProgress.deliverables[0].links[0].url, "https://example.com/old");
    assert.equal((await Order.findById(legacy._id)).items[0].serviceProgress, undefined); // Read does not migrate.
    const changed = await call(orders.updateDeliverable, employee, { notes: "Preserved" }, params(legacy, "2"));
    assert.equal(changed.statusCode, 200, changed.body.message);
    assert.equal(changed.body.order.items[0].serviceProgress.deliverables[0].links.length, 1);
    await call(orders.updateDeliverable, employee, { links: [] }, params(legacy));
    const after = await call(orders.getOrderById, clients[0], {}, { id: String(legacy._id) });
    assert.equal(after.body.order.items[0].serviceProgress.deliverables[0].links.length, 0);
    assert.equal(after.body.order.items[0].delivery.url, "https://example.com/old"); // Original historical record retained.
    assert.equal((await call(orders.updateServiceDelivery, employee, { url: "https://example.com/overwrite" }, params(legacy))).statusCode, 409);
  });
  await t.test("existing progress without timestamps accepts its first edit and retains completion and identity", async () => {
    const old = await create(grids, 3);
    await Order.collection.updateOne({ _id: old._id }, { $set: { orderStatus: "completed", "items.0.serviceProgress": {
      type: "quantity_based", status: "completed", deliverables: [1, 2, 3].map(key => ({ key: String(key), name: `Grid ${key}`, status: "completed", completedAt: new Date("2026-01-01") })),
    } } });
    const before = await call(orders.getOrderById, clients[0], {}, { id: String(old._id) });
    const entry = before.body.order.items[0].serviceProgress.deliverables[0];
    const result = await call(orders.updateDeliverable, employee, { notes: "First edit of old progress", updatedAt: entry.updatedAt }, params(old));
    assert.equal(result.statusCode, 200, result.body.message);
    const current = result.body.order.items[0].serviceProgress.deliverables[0];
    assert.equal(current.id, entry.id); assert.equal(current.status, "completed");
    assert.equal(new Date(current.completedAt).getTime(), new Date("2026-01-01").getTime());
    assert.ok(current.createdAt); assert.ok(current.updatedAt);
    assert.equal(result.body.order.orderStatus, "completed");
  });
  await t.test("pre-item legacy orders support deliverables and retain their order-level handoff", async () => {
    const legacy = await create(grids, 3);
    const savedItem = legacy.items[0].toObject();
    await Order.updateOne({ _id: legacy._id }, { $set: { items: [], service: grids._id, serviceSnapshot: savedItem.serviceSnapshot, quantity: 3,
      deliveryLink: "https://example.com/whole-order" }, $unset: { serviceProgress: "" } });
    const result = await call(orders.updateDeliverable, admin, { status: "in_progress", links: [{ url: "https://example.com/legacy-grid" }] }, { id: String(legacy._id), itemId: "legacy", deliverableKey: "1" });
    assert.equal(result.statusCode, 200, result.body.message);
    assert.equal(result.body.order.serviceProgress.totalCount, 3);
    assert.equal(result.body.order.deliveryLink, "https://example.com/whole-order");
  });
};
