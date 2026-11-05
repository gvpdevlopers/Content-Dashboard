const assert = require("node:assert/strict");

module.exports = async ({ t, call, orders, Order, Service, admin, clients }) => {
  const User = require("../../models/User");
  const employee = await User.create({ name: "Status QA Employee", username: "status-qa-employee", password: "fixture-only", role: "employee" });
  const service = await Service.findOne({ slug: "social-media-grid-posts" });
  const body = { paymentMethod: "cod", services: [{ serviceId: String(service._id), quantity: 1, formData: {} }] };
  for (const actor of [admin, employee]) {
    await t.test(`${actor.role} completes and reopens orders with confirmation, audit and unchanged payments`, async () => {
      const quote = await call(orders.getOrderQuote, clients[0], body);
      const created = await call(orders.createOrder, clients[0], { ...body, confirmedAmount: quote.body.quote.amount });
      assert.equal(created.statusCode, 201, created.body.message);
      const id = String(created.body.order._id), params = { id };
      await Order.updateOne({ _id: id }, { $set: { paymentStatus: "paid", deliveryLink: "https://example.com/delivery", "invoice.url": "https://example.com/invoice" } });
      const original = (await Order.findById(id)).toObject();
      for (const target of ["pending", "in_progress", "on_hold"]) {
        let result = await call(orders.updateOrderStatus, actor, { status: "completed" }, params);
        assert.equal(result.statusCode, 200, result.body.message);
        result = await call(orders.updateOrderStatus, actor, { status: target }, params);
        assert.equal(result.statusCode, 409); assert.equal(result.body.requiresConfirmation, true);
        assert.equal((await Order.findById(id)).orderStatus, "completed");
        result = await call(orders.updateOrderStatus, actor, { status: target, confirmCompleted: true, expectedStatus: "completed" }, params);
        assert.equal(result.statusCode, 200, result.body.message); assert.equal(result.body.order.orderStatus, target);
        const saved = (await Order.findById(id)).toObject();
        for (const field of ["paymentStatus", "paymentMethod", "amount", "subtotal", "gstAmount", "items", "deliveryLink", "invoice"]) assert.deepEqual(saved[field], original[field], field);
        const last = saved.statusHistory.at(-1);
        assert.equal(last.previousStatus, "completed"); assert.equal(last.newStatus, target);
        assert.equal(String(last.changedBy), String(actor._id)); assert.ok(last.changedAt instanceof Date);
        for (const get of [orders.getAdminOrders, orders.getStaffOrders, orders.getMyOrders]) {
          const view = await call(get, get === orders.getMyOrders ? clients[0] : actor);
          assert.equal(view.body.orders.find(entry => String(entry._id) === id).orderStatus, target);
        }
        const clientView = await call(orders.getOrderById, clients[0], {}, params);
        assert.equal(clientView.body.order.orderStatus, target); assert.equal(clientView.body.order.statusHistory, undefined);
      }
      assert.equal((await Order.findById(id)).statusHistory.length, 6);
      assert.equal((await call(orders.updateOrderStatus, actor, { status: "on_hold" }, params)).statusCode, 200);
      assert.equal((await Order.findById(id)).statusHistory.length, 6); // No-op doesn't duplicate audit entries.
      assert.equal((await call(orders.updateOrderStatus, clients[0], { status: "pending" }, params)).statusCode, 403);
      assert.equal((await call(orders.updateOrderStatus, actor, { status: "unknown" }, params)).statusCode, 400);
      assert.equal((await call(orders.updateOrderStatus, actor, { status: "pending", expectedStatus: "completed", confirmCompleted: true }, params)).statusCode, 409);
      const stale = await Order.findById(id);
      await call(orders.updateOrderStatus, actor, { status: "pending" }, params);
      await assert.rejects(require("../../utils/adCreditCancellation").changeOrderStatus(stale, "completed", actor._id), /order changed/i);
      assert.equal((await Order.findById(id)).orderStatus, "pending");
      // On Hold is not silently lifted by output updates.
      await call(orders.updateOrderStatus, actor, { status: "on_hold" }, params);
      const progress = await call(orders.updateDeliverable, actor, { status: "completed" }, { id, itemId: String(original.items[0]._id), deliverableKey: "1" });
      assert.equal(progress.statusCode, 200, progress.body.message); assert.equal(progress.body.order.orderStatus, "on_hold");
    });
  }
  await t.test("scheduled starts respect inactive orders and completion uses the newly due state", async () => {
    const calendar = await Service.create({ name: "Scheduled QA", slug: "social-media-profile-management", category: "Content", serviceGroup: "content", pricingType: "per_unit", basePrice: 100, minQuantity: 1, unit: "profile" });
    const request = { paymentMethod: "cod", services: [{ serviceId: String(calendar._id), quantity: 1, formData: {} }] };
    const quote = await call(orders.getOrderQuote, clients[0], request);
    const created = await call(orders.createOrder, clients[0], { ...request, confirmedAmount: quote.body.quote.amount });
    assert.equal(created.statusCode, 201, created.body.message);
    const id = String(created.body.order._id), itemId = String(created.body.order.items[0]._id);
    const due = new Date("2020-01-01T00:00:00Z");
    for (const status of ["cancelled", "on_hold", "completed"]) {
      await Order.updateOne({ _id: id }, { $set: { orderStatus: status, "items.0.serviceProgress.scheduledStartAt": due, "items.0.serviceProgress.startAt": null, "items.0.serviceProgress.status": "pending_start" } });
      const view = await call(orders.getOrderById, clients[0], {}, { id });
      assert.equal(view.statusCode, 200, view.body.message);
      await orders.activateDueScheduledServices();
      const saved = await Order.findById(id);
      assert.equal(saved.items[0].serviceProgress.startAt, null, status);
      assert.equal(saved.items[0].serviceProgress.status, "pending_start", status);
      assert.equal(saved.orderStatus, status);
    }
    await Order.updateOne({ _id: id }, { $set: { orderStatus: "processing" } });
    // No preceding read or timer run: the completion request itself sees the due start.
    const completed = await call(orders.updateServiceProgress, employee, { action: "complete" }, { id, itemId });
    assert.equal(completed.statusCode, 200, completed.body.message);
    assert.equal(completed.body.order.items[0].serviceProgress.status, "completed");
    assert.equal(new Date(completed.body.order.items[0].serviceProgress.startAt).getTime(), due.getTime());
    assert.equal(completed.body.order.orderStatus, "completed");
    assert.equal((await call(orders.updateOrderStatus, admin, null, { id })).statusCode, 400);
    assert.equal((await call(orders.updateServiceProgress, admin, null, { id, itemId })).statusCode, 400);
  });

};
