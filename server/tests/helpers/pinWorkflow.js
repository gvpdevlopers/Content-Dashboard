const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const mongoose = require("mongoose");
const response = () => ({ statusCode: 200, headers: {}, status(code) { this.statusCode = code; return this; },
  set(key, value) { this.headers[key] = value; return this; }, json(body) { this.body = body; return this; } });
function load(file, mocks) {
  const filename = path.resolve(__dirname, "../..", file), module = { exports: {} }, realRequire = createRequire(filename);
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, "utf8")}\n})`, { filename })(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : realRequire(id), module, module.exports);
  return module.exports;
}

module.exports = async function verifyPinWorkflow(uri) {
  const connection = await mongoose.createConnection(uri, { dbName: "pin_workflow_test" }).asPromise();
  try {
    const User = connection.model("User", require("../../models/User").schema);
    const Order = connection.model("Order", require("../../models/Order").schema);
    const Service = connection.model("Service", require("../../models/Service").schema);
    const [admin, employee, otherEmployee, client, otherClient, inactive] = await User.create([
      ["Admin", "admin"], ["Krish", "employee"], ["Other employee", "employee"], ["Client", "client"], ["Other client", "client"], ["Inactive", "employee"],
    ].map(([name, role], index) => ({ name, role, username: `pin-qa-${index}`, password: "synthetic-hash-only", isActive: index !== 5,
      serviceAccess: { mode: "groups", groups: ["content", "seo", "development"], serviceIds: [] } })));
    const services = await Service.create(["content", "seo", "development"].map((group, index) => ({
      name: `${group} fixture`, slug: `pin-${group}`, serviceGroup: group, category: group, basePrice: (index + 1) * 100,
      pricingType: "per_unit", unit: "item", isActive: true, isPublic: false,
      fields: [{ name: "websitePlatform", label: "Website platform", type: "select", required: true,
        options: [{ label: "Configured platform", value: "configured_platform", price: 0 }] }],
    })));
    const mocks = { "../models/Order": Order, "../models/User": User, "../models/Service": Service,
      "../utils/adCredit": { quoteCredit: async ({ subtotal, gstRate }) => ({ total: 0, requested: {},
        totals: require("../../utils/orderPricing").calculateOrderTotals(subtotal, gstRate) }) } };
    const orders = load("controllers/orderController.js", mocks);
    const pins = load("controllers/codController.js", mocks);
    const request = (user, body = {}) => ({ user: { _id: user._id, role: user.role }, body, get: () => undefined });
    const newOrder = async (paymentMethod = "cod") => {
      const req = request(client, { paymentMethod, ...(paymentMethod === "cheque" ? { chequeType: "with_gst" } : {}),
        services: services.map((service) => ({ serviceId: String(service._id), quantity: 2, formData: { websitePlatform: "configured_platform" } })) });
      req.user.serviceAccess = client.serviceAccess;
      const quote = response(); await orders.getOrderQuote(req, quote); assert.equal(quote.statusCode, 200, quote.body.message);
      const res = response(); await orders.createOrder(req, res); assert.equal(res.statusCode, 201, res.body.message);
      const stored = await Order.findById(res.body.order._id);
      assert.equal(stored.items.length, 3); assert.equal(stored.subtotal, 1200); assert.equal(stored.amount, quote.body.quote.amount);
      assert.equal(stored.gstRate, require("../../utils/orderPricing").getGstRate(paymentMethod, req.body.chequeType));
      for (const item of stored.items) {
        assert.equal(item.formData.get("websitePlatform"), "configured_platform");
        const original = services.find((service) => String(service._id) === String(item.service));
        assert.equal(item.serviceSnapshot.name, original.name);
        assert.equal(item.serviceSnapshot.basePrice, original.basePrice);
        assert.equal(item.serviceSnapshot.slug, original.slug);
      }
      assert.equal(res.body.order.codPin, undefined);
      return stored;
    };
    const order = await newOrder();
    const legacyPayment = await newOrder("cheque");
    await Order.collection.updateOne({ _id: legacyPayment._id }, { $unset: { codPinStatus: "" } });
    const legacyStatus = response(); await orders.updatePaymentStatus({ ...request(admin, { paymentStatus: "processing" }), params: { id: String(legacyPayment._id) } }, legacyStatus);
    assert.equal(legacyStatus.statusCode, 200); assert.equal((await Order.findById(legacyPayment._id)).paymentStatus, "processing");
    for (const paymentStatus of ["paid", "collected"]) {
      const bypass = response(); await orders.updatePaymentStatus({ ...request(admin, { paymentStatus }), params: { id: String(order._id) } }, bypass);
      assert.equal(bypass.statusCode, 400); assert.equal((await Order.findById(order._id)).paymentStatus, "pending");
    }
    const generate = async (target, assignee = employee, actor = admin) => {
      const res = response(); await pins.generateCodPin(request(actor, { orderId: String(target._id), employeeId: String(assignee._id) }), res); return res;
    };
    for (const invalid of [client, inactive]) assert.equal((await generate(order, invalid)).statusCode, 400);
    assert.equal((await generate(order, { _id: new mongoose.Types.ObjectId() })).statusCode, 400);
    assert.equal((await generate(order, employee, employee)).statusCode, 403);
    const missing = response(); await pins.generateCodPin(request(admin, { orderId: String(order._id) }), missing); assert.equal(missing.statusCode, 400);
    const generationRace = await Promise.all([generate(order), generate(order)]);
    assert.equal(generationRace.filter((res) => res.statusCode === 200).length, 1);
    const generated = generationRace.find((res) => res.statusCode === 200);
    const persisted = await Order.findById(order._id); assert.equal(String(persisted.codPinEmployee), String(employee._id)); assert.equal(persisted.paymentStatus, "pending");
    // A PIN stays active even months after generation; time alone cannot replace it.
    await Order.updateOne({ _id: order._id }, { $set: { codPinGeneratedAt: new Date(Date.now() - 120 * 86400000) } });
    assert.equal((await generate(order)).statusCode, 400);
    const ownPins = response(); await pins.getAssignedPins(request(employee), ownPins); assert.equal(ownPins.body.orders.length, 1); assert.equal(ownPins.body.orders[0].codPin, generated.body.codPin); assert.equal(ownPins.headers["Cache-Control"], "no-store");
    const otherPins = response(); await pins.getAssignedPins(request(otherEmployee), otherPins); assert.equal(otherPins.body.orders.length, 0);
    const clientPins = response(); await pins.getAssignedPins(request(client), clientPins); assert.equal(clientPins.statusCode, 403);
    const staffOrder = response(); await orders.getStaffOrderById({ ...request(otherEmployee), params: { id: String(order._id) } }, staffOrder); assert.equal(staffOrder.body.order.codPin, undefined);
    const verify = async (actor, target, pin) => { const res = response(); await pins.verifyCodPin(request(actor, { orderId: String(target._id), pin }), res); return res; };
    assert.equal((await verify(client, order, "12")).statusCode, 400);
    assert.equal((await verify(otherClient, order, generated.body.codPin)).statusCode, 403);
    assert.equal((await verify(otherEmployee, order, generated.body.codPin)).statusCode, 403);
    const wrongPin = generated.body.codPin === "111111" ? "222222" : "111111";
    assert.equal((await verify(client, order, wrongPin)).statusCode, 400);
    assert.equal((await Order.findById(order._id)).paymentStatus, "pending");
    assert.equal((await Order.findById(order._id)).codPinAttempts, 1);
    const race = await Promise.all([verify(client, order, generated.body.codPin), verify(client, order, generated.body.codPin)]);
    assert.equal(race.filter((res) => res.statusCode === 200).length, 1);
    const paid = await Order.findById(order._id);
    assert.equal(paid.paymentStatus, "paid"); assert.equal(paid.codPinStatus, "used"); assert.ok(paid.codCollectedAt); assert.ok(paid.codPinVerifiedAt);
    assert.equal(String(paid.codPinVerifiedBy), String(client._id));
    const repeated = await verify(client, order, generated.body.codPin); assert.equal(repeated.statusCode, 400);
    assert.equal((await Order.findById(order._id)).codPinVerifiedAt.getTime(), paid.codPinVerifiedAt.getTime());
    const consumed = response(); await pins.getAssignedPins(request(employee), consumed); assert.deepEqual(consumed.body.orders, []);
    const racingTarget = await newOrder(); const racingPin = await generate(racingTarget);
    const raceController = load("controllers/orderController.js", { ...mocks, "../models/Order": {
      findById: async () => {
        const stale = await Order.findById(racingTarget._id);
        assert.equal((await verify(client, racingTarget, racingPin.body.codPin)).statusCode, 200);
        return stale;
      }, updateOne: (...args) => Order.updateOne(...args),
    } });
    const staleUpdate = response(); await raceController.updatePaymentStatus({ ...request(admin, { paymentStatus: "processing" }), params: { id: String(racingTarget._id) } }, staleUpdate);
    assert.equal(staleUpdate.statusCode, 409); assert.equal((await Order.findById(racingTarget._id)).paymentStatus, "paid");
    for (const actor of [admin, employee]) {
      const staffTarget = await newOrder();
      const staffPin = await generate(staffTarget);
      if (actor.role === "admin") await Order.updateOne({ _id: staffTarget._id }, { $set: { codPinEmployee: null }, $unset: { codPinAttempts: "" } });
      const exact = response(); await pins.getAssignedPins({ ...request(actor), query: { orderId: String(staffTarget._id) } }, exact);
      assert.equal(exact.body.orders[0].codPin, staffPin.body.codPin);
      const unauthorizedView = response(); await pins.getAssignedPins({ ...request(otherEmployee), query: { orderId: String(staffTarget._id) } }, unauthorizedView); assert.deepEqual(unauthorizedView.body.orders, []);
      assert.equal((await verify(actor, staffTarget, "12")).statusCode, 403);
      assert.equal((await verify(actor, staffTarget, staffPin.body.codPin === "111111" ? "222222" : "111111")).statusCode, 403);
      assert.equal((await Order.findById(staffTarget._id)).paymentStatus, "pending");
      assert.equal((await verify(actor, staffTarget, staffPin.body.codPin)).statusCode, 403);
      assert.equal((await Order.findById(staffTarget._id)).codPinAttempts || 0, 0);
      assert.equal((await verify(client, staffTarget, staffPin.body.codPin)).statusCode, 200);
      const completed = await Order.findById(staffTarget._id);
      assert.equal(completed.paymentStatus, "paid"); assert.equal(String(completed.codPinVerifiedBy), String(client._id));
      assert.equal((await verify(client, staffTarget, staffPin.body.codPin)).statusCode, 400);
    }
    const second = await newOrder(); const secondPin = await generate(second, otherEmployee); assert.equal(secondPin.statusCode, 200);
    const secondList = response(); await pins.getAssignedPins(request(otherEmployee), secondList); assert.equal(String(secondList.body.orders[0]._id), String(second._id));
    await Order.updateOne({ _id: second._id }, { $set: { codPinGeneratedAt: new Date(Date.now() - 120 * 86400000) } });
    const aged = response(); await pins.getAssignedPins(request(otherEmployee), aged); assert.equal(aged.body.orders.length, 1);
    assert.equal(aged.body.orders[0].codPinExpiresAt, undefined);
    const unauthorizedDisable = response(); await pins.disableCodPin(request(otherEmployee, { orderId: String(second._id) }), unauthorizedDisable); assert.equal(unauthorizedDisable.statusCode, 403);
    assert.equal((await Order.findById(second._id)).codPinStatus, "active");
    const disabled = response(); await pins.disableCodPin(request(admin, { orderId: String(second._id) }), disabled); assert.equal(disabled.statusCode, 200);
    assert.equal((await Order.findById(second._id)).paymentStatus, "pending");
    assert.equal((await Order.findById(second._id)).codPin, null);
    assert.equal((await Order.findById(second._id)).codPinStatus, "disabled");
    const disabledList = response(); await pins.getAssignedPins(request(otherEmployee), disabledList); assert.deepEqual(disabledList.body.orders, []);
    assert.equal((await verify(client, second, secondPin.body.codPin)).statusCode, 400);
    const repeatedDisable = response(); await pins.disableCodPin(request(admin, { orderId: String(second._id) }), repeatedDisable); assert.equal(repeatedDisable.statusCode, 409);
    const renewed = await generate(second); assert.equal(renewed.statusCode, 200);
    await Order.updateOne({ _id: second._id }, { $set: { codPinAttempts: 5 } });
    assert.equal((await verify(client, second, renewed.body.codPin)).statusCode, 400);
    const locked = response(); await pins.getAssignedPins(request(employee), locked); assert.deepEqual(locked.body.orders, []);
    const lockedView = response(); await orders.getAdminOrderById({ ...request(admin), params: { id: String(second._id) } }, lockedView); assert.equal(lockedView.body.order.codPinStatus, "locked");
    await Order.updateOne({ _id: second._id }, { $set: { orderStatus: "cancelled" } });
    assert.equal((await generate(second)).statusCode, 409); assert.equal((await verify(client, second, renewed.body.codPin)).statusCode, 409);
    const cheque = await newOrder("cheque"); const chequePin = await generate(cheque); assert.equal(chequePin.statusCode, 200);
    for (const actor of [admin, employee, otherClient]) assert.equal((await verify(actor, cheque, chequePin.body.codPin)).statusCode, 403);
    for (const paymentStatus of ["paid", "collected"]) {
      const bypass = response(); await orders.updatePaymentStatus({ ...request(admin, { paymentStatus }), params: { id: String(cheque._id) } }, bypass);
      assert.equal(bypass.statusCode, 400);
    }
    assert.equal((await Order.findById(cheque._id)).paymentStatus, "pending");
    assert.equal((await verify(client, cheque, chequePin.body.codPin)).statusCode, 200);
    const chequeAfter = await Order.findById(cheque._id); assert.equal(chequeAfter.paymentStatus, "paid"); assert.equal(chequeAfter.codPinStatus, "used");
    assert.equal(String(chequeAfter.codPinVerifiedBy), String(client._id));
    assert.equal((await verify(client, cheque, chequePin.body.codPin)).statusCode, 400);
    for (const target of [order, cheque]) {
      for (const [actor, handler] of [[admin, orders.getAdminOrderById], [employee, orders.getStaffOrderById], [client, orders.getOrderById]]) {
        const view = response(); await handler({ ...request(actor), params: { id: String(target._id) } }, view);
        assert.equal(view.statusCode, 200); assert.equal(view.body.order.paymentStatus, "paid"); assert.equal(view.body.order.codPin, undefined);
      }
    }
    const expired = await newOrder(); const expiredPin = await generate(expired);
    await Order.updateOne({ _id: expired._id }, { $set: { codPinStatus: "expired" } });
    assert.equal((await verify(client, expired, expiredPin.body.codPin)).statusCode, 400);
    assert.equal((await Order.findById(expired._id)).paymentStatus, "pending");
    const alreadyPaid = await newOrder(); await Order.updateOne({ _id: alreadyPaid._id }, { $set: { paymentStatus: "paid" } });
    assert.equal((await generate(alreadyPaid)).statusCode, 400);
    const disablePaid = response(); await pins.disableCodPin(request(admin, { orderId: String(order._id) }), disablePaid); assert.equal(disablePaid.statusCode, 409);
    const malformed = response(); await pins.generateCodPin(request(admin, { orderId: "invalid", employeeId: String(employee._id) }), malformed); assert.equal(malformed.statusCode, 400);
    const employees = response(); await pins.getPinEmployees(request(admin), employees);
    assert.equal(employees.body.employees.length, 2); assert.ok(employees.body.employees.every((row) => !row.password && !row.email));
    const employeeDirectory = response(); await pins.getPinEmployees(request(employee), employeeDirectory); assert.equal(employeeDirectory.statusCode, 403);
    return { persistedPayment: true, concurrency: true, employeeIsolation: true, crossGroupSnapshots: true };
  } finally { await connection.close(); }
};
