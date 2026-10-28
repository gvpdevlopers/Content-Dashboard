const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const crypto = require("node:crypto");

function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const module = { exports: {} };
  const realRequire = createRequire(filename);
  const requireMock = (id) => Object.hasOwn(mocks, id) ? mocks[id] : realRequire(id);
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, "utf8")}\n})`,
    { filename })(requireMock, module, module.exports);
  return module.exports;
}
const response = () => ({
  statusCode: 200, headers: {},
  status(code) { this.statusCode = code; return this; },
  set(key, value) { this.headers[key] = value; return this; },
  json(body) { this.body = body; return this; },
});
const orderId = "123456789012345678901234";
const clientId = "123456789012345678901235";
const baseOrder = () => ({ _id: orderId, client: clientId, amount: 118,
  subtotal: 100, gstRate: 18, gstAmount: 18, paymentMethod: "online",
  paymentStatus: "processing", orderStatus: "pending", razorpayOrderId: "order_test" });
const payment = () => ({ id: "pay_test", order_id: "order_test", amount: 11800,
  currency: "INR", status: "captured" });
const request = (body) => ({ body, user: { _id: clientId, userId: clientId, role: "client" }, get: () => undefined });
const sign = (body, secret) => crypto.createHmac("sha256", secret).update(body).digest("hex");

test("accepted legacy ID-only tokens receive a canonical userId for session/profile handlers", async () => {
  const protect = load("middleware/auth.js", {
    jsonwebtoken: { verify: () => ({ _id: clientId, role: "admin" }) },
    "../models/User": { findById: () => ({ select: async () => ({ _id: clientId, role: "client", isActive: true }) }) },
  });
  const req = { headers: { authorization: "Bearer synthetic" }, method: "GET" };
  let next = false; await protect(req, response(), () => { next = true; });
  assert.equal(next, true); assert.equal(req.user.userId, clientId); assert.equal(req.user.role, "client");
});

test("admins and employees cannot verify PINs or query verification records", async () => {
  const controller = load("controllers/codController.js", { "../models/Order": {
    findById: async () => assert.fail("Staff must be rejected before querying the order"),
  } });
  for (const role of ["admin", "employee"]) {
    const res = response();
    await controller.verifyCodPin({ ...request({ orderId, pin: "123456" }), user: { _id: clientId, role } }, res);
    assert.equal(res.statusCode, 403); assert.equal(res.body.success, false);
  }
});

test("malformed PIN bodies and array PINs are rejected before database operations", async () => {
  const controller = load("controllers/codController.js", { "../models/Order": { findById: async () => assert.fail("No query for invalid input") } });
  for (const body of [undefined, {}, { orderId, pin: ["123456"] }, { orderId, pin: { value: "123456" } }]) {
    const res = response(); await controller.verifyCodPin(request(body), res); assert.equal(res.statusCode, 400);
  }
  const generate = response(); await controller.generateCodPin({ user: { role: "admin" } }, generate); assert.equal(generate.statusCode, 400);
});

test("password reset and account deactivation atomically revoke sessions", async () => {
  const writes = [];
  const controller = load("controllers/adminUserController.js", {
    "../models/User": { findById: async () => ({ _id: clientId, role: "client" }),
      updateOne: async (...args) => writes.push(args) },
    bcryptjs: { hash: async () => "hashed" },
  });
  await controller.resetAdminUserPassword({ params: { id: clientId }, body: { password: "new-password" } }, response());
  await controller.updateUserStatus({ params: { id: clientId }, body: { isActive: false } }, response());
  assert.equal(writes[0][1].$inc.tokenVersion, 1);
  assert.equal(writes[1][1].$inc.tokenVersion, 1);
  assert.equal(writes[0][1].$set.password, "hashed");
});

test("customer responses remove admin notes, PINs and checkout internals", async () => {
  const rows = [{ ...baseOrder(), notes: "private", codPin: "123456", codPinAttempts: 3,
    razorpaySignature: "secret", submissionKey: "key", submissionHash: "hash",
    deliveryLink: "https://example.com", invoice: { url: "https://example.com" } }];
  const chain = { select() { return this; }, populate() { return this; }, sort: async () => rows };
  const controller = load("controllers/orderController.js", { "../models/Order": { find: () => chain } });
  const res = response();
  await controller.getMyOrders(request({}), res);
  assert.equal(res.statusCode, 200);
  for (const field of ["notes", "codPin", "codPinAttempts", "razorpaySignature", "submissionKey", "submissionHash", "deliveryLink", "invoice"]) {
    assert.equal(Object.hasOwn(res.body.orders[0], field), false, field);
  }
});

test("checkout replay returns the original order without reserving another coupon", async () => {
  const body = { services: [], couponCode: "ONCE" };
  let released = false;
  const existing = { ...baseOrder(), submissionHash: crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex") };
  const controller = load("controllers/orderController.js", {
    "../models/Order": { findOne: async () => existing },
    "../utils/requestLock": { acquireLock: async () => async () => { released = true; } },
  });
  const req = request(body); req.get = () => "1234567890abcdef";
  const res = response();
  await controller.createOrder(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.order._id, orderId);
  assert.equal(released, true);
  body.couponCode = "DIFFERENT";
  const conflict = response();
  await controller.createOrder(req, conflict);
  assert.equal(conflict.statusCode, 409);
});

test("explicitly expired, disabled and attempt-locked PINs cannot collect payment", async () => {
  for (const overrides of [
    { codPinStatus: "expired" },
    { codPinStatus: "disabled" },
    { codPinAttempts: 5 },
  ]) {
    let writes = 0;
    const controller = load("controllers/codController.js", { "../models/Order": {
      findById: async () => ({ ...baseOrder(), paymentMethod: "cod", codPinStatus: "active",
        codPin: "123456", codPinGeneratedAt: new Date(), ...overrides }),
      findOneAndUpdate: async () => { writes++; },
    } });
    const res = response();
    await controller.verifyCodPin(request({ orderId, pin: "123456" }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(writes, 0);
  }
});

test("wrong PIN consumes an atomic attempt; correct PIN uses an atomic state transition", async () => {
  let attempts = 0;
  const order = { ...baseOrder(), paymentMethod: "cod", codPinStatus: "active",
    codPin: "123456", codPinGeneratedAt: new Date() };
  const controller = load("controllers/codController.js", { "../models/Order": {
    findById: async () => order,
    updateOne: async (filter, update) => { assert.equal(filter.codPinStatus, "active"); attempts += update.$inc.codPinAttempts; },
    findOneAndUpdate: async (filter, update) => {
      assert.equal(filter.codPin, "123456");
      assert.equal(filter.$or[0].codPinAttempts.$lt, 5);
      return { ...order, ...update.$set };
    },
  } });
  const wrong = response();
  await controller.verifyCodPin(request({ orderId, pin: "654321" }), wrong);
  assert.equal(attempts, 1);
  const right = response();
  await controller.verifyCodPin(request({ orderId, pin: "123456" }), right);
  assert.equal(right.body.order.paymentStatus, "paid");
});

test("payment initialization reuses the provider order", async () => {
  let creates = 0;
  const controller = load("controllers/paymentController.js", {
    "../models/Order": { findOne: async () => baseOrder(), findOneAndUpdate: async () => baseOrder() },
    "../config/razorpay": { orders: { fetch: async () => ({ id: "order_test", amount: 11800, currency: "INR" }),
      create: async () => { creates++; } } },
    "../utils/requestLock": { acquireLock: async () => async () => {} },
  });
  const res = response();
  await controller.createRazorpayOrder(request({ orderId }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.razorpayOrder.id, "order_test");
  assert.equal(creates, 0);
});

test("payment verification checks signature, capture status, amount and currency", async () => {
  process.env.RAZORPAY_KEY_SECRET = "test-secret";
  for (const [changes, signature, expected] of [
    [{}, sign("order_test|pay_test", "test-secret"), 200],
    [{ amount: 1 }, sign("order_test|pay_test", "test-secret"), 400],
    [{ currency: "USD" }, sign("order_test|pay_test", "test-secret"), 400],
    [{ status: "failed" }, sign("order_test|pay_test", "test-secret"), 409],
    [{}, "invalid", 400],
  ]) {
    let writes = 0;
    const controller = load("controllers/paymentController.js", {
      "../models/Order": { findOne: async () => baseOrder(), findOneAndUpdate: async () => { writes++; return { ...baseOrder(), paymentStatus: "paid" }; } },
      "../config/razorpay": { payments: { fetch: async () => ({ ...payment(), ...changes }) } },
    });
    const res = response();
    await controller.verifyRazorpayPayment(request({ orderId, razorpay_order_id: "order_test",
      razorpay_payment_id: "pay_test", razorpay_signature: signature }), res);
    assert.equal(res.statusCode, expected);
    assert.equal(writes, expected === 200 ? 1 : 0);
  }
});

test("authorized payments are captured before marking paid", async () => {
  let captured = false;
  const controller = load("controllers/paymentController.js", {
    "../models/Order": { findOne: async () => baseOrder(), findOneAndUpdate: async () => {
      assert.equal(captured, true); return { ...baseOrder(), paymentStatus: "paid" };
    } },
    "../config/razorpay": { payments: {
      fetch: async () => ({ ...payment(), status: "authorized" }),
      capture: async () => { captured = true; return payment(); },
    } },
  });
  const res = response();
  await controller.verifyRazorpayPayment(request({ orderId, razorpay_order_id: "order_test",
    razorpay_payment_id: "pay_test", razorpay_signature: sign("order_test|pay_test", "test-secret") }), res);
  assert.equal(res.statusCode, 200);
});

test("webhooks require a raw signed body and reconcile captured payments", async () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  const body = Buffer.from(JSON.stringify({ event: "payment.captured", payload: { payment: { entity: payment() } } }));
  let writes = 0;
  const controller = load("controllers/paymentController.js", {
    "../models/Order": { findOne: async () => baseOrder(), findOneAndUpdate: async () => { writes++; return baseOrder(); } },
    "../config/razorpay": { payments: { fetch: async () => payment() } },
  });
  const req = { body, get: () => sign(body, "webhook-secret") };
  for (let i = 0; i < 2; i++) {
    const res = response(); await controller.razorpayWebhook(req, res); assert.equal(res.statusCode, 200);
  }
  const invalid = response();
  await controller.razorpayWebhook({ body, get: () => "bad" }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(writes, 2);
});

test("login throttling stops repeated account attempts", async () => {
  const limiter = load("middleware/loginLimit.js", { "../models/RateBucket": {
    findOneAndUpdate: async ({ _id }) => ({ count: _id.startsWith("account:") ? 16 : 1 }),
  } });
  const res = response(); let next = false;
  await limiter({ body: { identifier: "client@example.com", password: "password" }, ip: "127.0.0.1" }, res, () => { next = true; });
  assert.equal(res.statusCode, 429);
  assert.equal(next, false);
  assert.ok(Number(res.headers["Retry-After"]) > 0);
});

test("collection PIN generation can replace a locked PIN", async () => {
  const order = { ...baseOrder(), paymentMethod: "cod", codPinStatus: "active",
    codPinGeneratedAt: new Date(), codPinAttempts: 5 };
  const controller = load("controllers/codController.js", { "../models/User": { findOne: () => ({ select: async () => ({ _id: clientId }) }) }, "../models/Order": {
    findById: async () => order,
    findOneAndUpdate: async (filter, update) => {
      assert.equal(filter.codPinStatus, "active");
      assert.equal(update.$set.codPinAttempts, 0);
      assert.match(update.$set.codPin, /^\d{6}$/);
      return { ...order, ...update.$set };
    },
  } });
  const res = response();
  await controller.generateCodPin({ ...request({ orderId, employeeId: clientId }), user: { _id: clientId, role: "admin" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.order.codPinStatus, "active");
});

test("database leases reject concurrent requests and release only their own lease", async () => {
  let lease;
  const { acquireLock } = load("utils/requestLock.js", { "../models/RequestLock": {
    findOneAndUpdate: async (filter, update) => {
      if (lease) throw Object.assign(new Error("duplicate"), { code: 11000 });
      assert.ok(filter.expiresAt.$lte instanceof Date);
      lease = update.$set.expiresAt;
    },
    deleteOne: async (filter) => { assert.equal(filter.expiresAt, lease); lease = null; },
  } });
  const release = await acquireLock("test");
  await assert.rejects(acquireLock("test"), (error) => error.statusCode === 409);
  await release();
  assert.equal(lease, null);
});

test("payment initialization recovers a captured payment after an interrupted callback", async () => {
  const controller = load("controllers/paymentController.js", {
    "../models/Order": { findOne: async () => baseOrder(),
      findOneAndUpdate: async () => ({ ...baseOrder(), paymentStatus: "paid" }) },
    "../config/razorpay": {
      orders: { fetch: async () => ({ id: "order_test", amount: 11800, currency: "INR", status: "paid" }),
        fetchPayments: async () => ({ items: [payment()] }) },
      payments: { fetch: async () => payment() },
    },
    "../utils/requestLock": { acquireLock: async () => async () => {} },
  });
  const res = response();
  await controller.createRazorpayOrder(request({ orderId }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.alreadyPaid, true);
  assert.equal(res.body.order.paymentStatus, "paid");
});

test("cheque PIN verification atomically completes payment", async () => {
  const order = { ...baseOrder(), paymentMethod: "cheque", paymentStatus: "pending",
    codPinStatus: "active", codPin: "123456", codPinGeneratedAt: new Date() };
  const controller = load("controllers/codController.js", { "../models/Order": {
    findById: async () => order,
    findOneAndUpdate: async (filter, update) => {
      assert.equal(update.$set.paymentStatus, "paid");
      return { ...order, ...update.$set };
    },
  } });
  const res = response();
  await controller.verifyCodPin(request({ orderId, pin: "123456" }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.order.codPinStatus, "used");
  assert.equal(res.body.order.paymentStatus, "paid");
});

test("frontend checkout retries reuse their key, survive reload and reset after success", async () => {
  const filename = path.resolve(__dirname, "../../client/src/services/orderService.js");
  const source = fs.readFileSync(filename, "utf8").replace('import api from "./api";', "")
    .replace("export default orderService;", "module.exports = orderService;");
  const calls = [];
  const storage = new Map();
  const makeService = () => {
    const context = { module: { exports: {} }, crypto: crypto.webcrypto, TextEncoder,
      sessionStorage: { getItem: (key) => storage.get(key) || null,
        setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
      api: { post: async (url, body, options) => {
        calls.push(options.headers["Idempotency-Key"]);
        return { data: { order: baseOrder() } };
      } },
    };
    vm.runInNewContext(source, context);
    return context.module.exports;
  };
  const service = makeService();
  const body = { services: [{ serviceId: orderId }], paymentMethod: "online" };
  await service.createOrder(body);
  await service.createOrder(body);
  const reloaded = makeService();
  await reloaded.createOrder(body);
  assert.equal(calls[0], calls[1]);
  assert.equal(calls[0], calls[2]);
  reloaded.clearPendingCheckout();
  await reloaded.createOrder(body);
  assert.notEqual(calls[0], calls[3]);
});
