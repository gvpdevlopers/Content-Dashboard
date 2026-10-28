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

test("new and legacy users default to disabled; month_end is a pending order method", () => {
  const User = require("../models/User");
  for (const data of [{}, { role: "client" }]) assert.equal(new User(data).allowMonthEndPayment, false);
  const Order = require("../models/Order");
  assert.ok(Order.schema.path("paymentMethod").enumValues.includes("month_end"));
  assert.equal(new Order({ paymentMethod: "month_end" }).paymentStatus, "pending");
});

test("auth rechecks database eligibility and ignores stale token claims", async () => {
  for (const [role, allowed] of [["client", true], ["client", false], ["client", undefined], ["employee", true]]) {
    const protect = load("middleware/auth.js", {
      jsonwebtoken: { verify: () => ({ userId: clientId, role: "client", allowMonthEndPayment: true }) },
      "../models/User": { findById: (id) => {
        assert.equal(id, clientId);
        return { select: async (fields) => {
          assert.ok(fields.includes("allowMonthEndPayment"));
          return { _id: clientId, role, isActive: true, allowMonthEndPayment: allowed };
        } };
      } },
    });
    const req = { headers: { authorization: "Bearer token" }, method: "GET" };
    let next = false;
    await protect(req, response(), () => { next = true; });
    assert.equal(next, true);
    assert.equal(req.user.allowMonthEndPayment, role === "client" && allowed === true);
  }
});

test("permission updates require admin, boolean input and a client record", async () => {
  let writes = 0;
  const controller = load("controllers/adminUserController.js", { "../models/User": {
    findOneAndUpdate: (filter, update) => {
      writes++;
      assert.equal(filter.role, "client");
      assert.equal(update.$set.allowMonthEndPayment, true);
      return { select: async () => ({ _id: clientId, role: "client", allowMonthEndPayment: true }) };
    },
  } });
  for (const role of ["client", "employee"]) {
    const res = response();
    await controller.updateMonthEndPermission({ user: { role }, body: { allowMonthEndPayment: true }, params: { id: clientId } }, res);
    assert.equal(res.statusCode, 403);
  }
  const invalid = response();
  await controller.updateMonthEndPermission({ user: { role: "admin" }, body: { allowMonthEndPayment: "true" } }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(writes, 0);
  const res = response();
  await controller.updateMonthEndPermission({ user: { role: "admin" }, body: { allowMonthEndPayment: true }, params: { id: clientId } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.allowMonthEndPayment, true);
});

test("admin create defaults permission off and persists explicit client permission", async () => {
  let saved;
  const controller = load("controllers/adminUserController.js", {
    "../models/User": { findOne: async () => null, create: async (data) => { saved = { ...data, _id: clientId }; return saved; } },
    bcryptjs: { hash: async () => "hash" },
  });
  const body = { name: "Client", email: "client@example.com", username: "client", password: "password" };
  for (const permission of [undefined, true, false]) {
    const res = response();
    await controller.createAdminUser({ body: { ...body, ...(permission === undefined ? {} : { allowMonthEndPayment: permission }) } }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(saved.allowMonthEndPayment, permission === true);
  }
  for (const extra of [{ allowMonthEndPayment: "true" }, { role: "employee", allowMonthEndPayment: true }]) {
    const res = response(); await controller.createAdminUser({ body: { ...body, ...extra } }, res);
    assert.equal(res.statusCode, 400);
  }
});

test("permission and payment routes preserve admin and staff authorization", () => {
  const routes = [], uses = [];
  const router = { use: (...handlers) => uses.push(handlers) };
  for (const method of ["get", "post", "patch", "delete"]) router[method] = (url, ...handlers) => routes.push({ method, url, handlers });
  const protect = () => {}, adminOnly = () => {}, orderStaff = () => {};
  const mocks = { express: { Router: () => router }, "../middleware/auth": protect,
    "../middleware/admin": adminOnly, "../middleware/orderStaff": orderStaff };
  load("routes/adminUserRoutes.js", mocks);
  assert.deepEqual(uses[0], [protect, adminOnly]);
  assert.ok(routes.some((r) => r.url === "/:id/payment-permissions"));
  load("routes/orderRoutes.js", mocks);
  for (const [url, guard] of [["/admin/:id/payment-status", adminOnly], ["/staff/:id/payment-status", orderStaff]]) {
    const route = routes.find((r) => r.url === url);
    assert.equal(route.handlers[0], protect); assert.equal(route.handlers[1], guard);
  }
});

test("month-end receipt records actor and time atomically without changing order status", async () => {
  for (const role of ["admin", "employee"]) {
    let write;
    const order = { _id: orderId, paymentMethod: "month_end", paymentStatus: "pending", orderStatus: "processing" };
    const controller = load("controllers/orderController.js", { "../models/Order": {
      findById: async () => order,
      updateOne: async (filter, update) => { write = { filter, update }; return { matchedCount: 1 }; },
    } });
    const res = response();
    await controller.updatePaymentStatus({ user: { _id: clientId, role }, params: { id: orderId }, body: { paymentStatus: "paid" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.order.paymentStatus, "paid");
    assert.equal(res.body.order.orderStatus, "processing");
    assert.equal(write.filter.paymentStatus, "pending");
    const entry = write.update.$push.monthEndPaymentHistory;
    assert.equal(entry.changedBy, clientId);
    assert.ok(entry.changedAt instanceof Date);
    assert.equal(entry.from, "pending"); assert.equal(entry.to, "paid");
    assert.equal(write.update.$set.orderStatus, undefined);
  }
});

test("unauthorized updates, Collected and concurrent changes are rejected", async () => {
  for (const [role, status, matchedCount, expected] of [
    ["client", "paid", 1, 403], ["employee", "collected", 1, 400], ["admin", "paid", 0, 409],
  ]) {
    let writes = 0;
    const controller = load("controllers/orderController.js", { "../models/Order": {
      findById: async () => ({ _id: orderId, paymentMethod: "month_end", paymentStatus: "pending" }),
      updateOne: async () => { writes++; return { matchedCount }; },
    } });
    const res = response();
    await controller.updatePaymentStatus({ user: { _id: clientId, role }, params: { id: orderId }, body: { paymentStatus: status } }, res);
    assert.equal(res.statusCode, expected);
    assert.equal(writes, expected === 409 ? 1 : 0);
  }
});

test("month-end orders reject PIN and Razorpay initialization and verification", async () => {
  const order = { _id: orderId, client: clientId, paymentMethod: "month_end", paymentStatus: "pending" };
  const Order = { findById: async () => order, findOne: async () => order };
  const cod = load("controllers/codController.js", { "../models/Order": Order });
  for (const method of ["generateCodPin", "verifyCodPin"]) {
    const res = response(); await cod[method]({ user: { _id: clientId, userId: clientId, role: method === "generateCodPin" ? "admin" : "client" }, body: { orderId, pin: "123456" } }, res);
    assert.equal(res.statusCode, 400, method);
  }
  const payment = load("controllers/paymentController.js", { "../models/Order": Order,
    "../config/razorpay": {}, "../utils/requestLock": { acquireLock: async () => async () => {} } });
  for (const method of ["createRazorpayOrder", "verifyRazorpayPayment"]) {
    const res = response();
    await payment[method]({ user: { _id: clientId }, body: { orderId, razorpay_order_id: "order_fake", razorpay_payment_id: "pay_fake" } }, res);
    assert.equal(res.statusCode, 400, method);
  }
});

test("draft saving ignores payment permissions for both eligible and ineligible clients", async () => {
  const controller = load("controllers/draftController.js", { "../models/Service": { find: async () => [{ _id: orderId, isActive: true }] }, "../models/OrderDraft": {
    create: async (data) => { assert.equal(data.paymentMethod, undefined); assert.equal(data.allowMonthEndPayment, undefined); return data; },
  } });
  for (const allowMonthEndPayment of [true, false]) {
    const res = response();
    await controller.createDraft({ user: { _id: clientId, role: "client", allowMonthEndPayment }, body: {
      services: [{ serviceId: orderId, quantity: 1, formData: {} }], paymentMethod: "month_end", allowMonthEndPayment: true,
    } }, res);
    assert.equal(res.statusCode, 201);
  }
});
