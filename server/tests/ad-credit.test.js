const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const mongoose = require("mongoose");

function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const module = { exports: {} };
  const realRequire = createRequire(filename);
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, "utf8")}\n})`, { filename })(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : realRequire(id), module, module.exports);
  return module.exports;
}
const client = "123456789012345678901234";
const orderId = "123456789012345678901235";
const serviceId = "123456789012345678901236";
const optionId = "123456789012345678901237";
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; } });
const query = (value) => ({ session: async () => value, populate() { return this; },
  then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
const adsItem = (meta = 5000, google = 3000) => ({ serviceSnapshot: { slug: "ads" },
  formData: { metaAdsAdSpendAmount: meta, googleAdsAdSpendAmount: google } });

function fixture() {
  const state = { balances: { metaAds: 200000, googleAds: 100000 }, entries: [], issued: {}, writes: 0 };
  const session = {
    async withTransaction(fn) {
      const before = structuredClone(state);
      try { await fn(); } catch (error) { Object.assign(state, before); throw error; }
    },
    async endSession() {},
  };
  const Wallet = {
    find: async () => Object.entries(state.balances).map(([platform, balancePaise]) => ({ platform, balancePaise })),
    findOneAndUpdate: async (filter, update, options) => {
      assert.equal(options.session, session);
      const platform = filter._id.split(":").at(-1);
      if (filter.balancePaise && state.balances[platform] < filter.balancePaise.$gte) return null;
      state.balances[platform] += update.$inc.balancePaise;
      state.writes++;
      return { balancePaise: state.balances[platform] };
    },
  };
  const Entry = { create: async (rows, options) => { assert.equal(options.session, session); state.entries.push(...rows); } };
  const credit = load("utils/adCredit.js", { "../models/AdCreditWallet": Wallet, "../models/AdCreditEntry": Entry });
  return { state, session, Wallet, Entry, credit, mongo: { ...mongoose, startSession: async () => session } };
}

test("credit budgets use historical ads fields and ignore other services", () => {
  const { credit } = fixture();
  const budgets = credit.adBudgets({ items: [adsItem(5000.25, 100),
    { ...adsItem(99999, 99999), serviceSnapshot: { slug: "reels" } }] });
  assert.equal(budgets.metaAds, 500025);
  assert.equal(budgets.googleAds, 10000);
  assert.equal(credit.adBudgets({ ...adsItem(200, 0), formData: new Map([["metaAdsAdSpendAmount", 200]]) }).metaAds, 20000);
});

test("invalid or fractional-paise credit inputs are rejected", () => {
  const { credit } = fixture();
  for (const value of [-1, 0.001, NaN, Infinity, {}, true, ""]) assert.throws(() => credit.toPaise(value));
  assert.throws(() => credit.normalizeCredit({ unknown: 10 }));
  assert.throws(() => credit.normalizeCredit([]));
  assert.equal(credit.toPaise("0.29"), 29);
});

test("credit covers matching ad spend, keeps fees and follows existing payment tax rates", async () => {
  const { credit } = fixture();
  for (const gstRate of [0, 18]) {
    const quote = await credit.quoteCredit({ client, items: [adsItem()], input: { metaAds: 2000 }, subtotal: 6200, gstRate });
    assert.equal(quote.total, 2000);
    assert.equal(quote.totals.subtotal, 4200);
    assert.equal(quote.totals.amount, gstRate === 18 ? 4956 : 4200);
  }
  await assert.rejects(credit.quoteCredit({ client, items: [adsItem(100, 3000)], input: { metaAds: 200 }, subtotal: 6200, gstRate: 0 }), /matching platform/);
  await assert.rejects(credit.quoteCredit({ client, items: [adsItem()], input: { googleAds: 1001 }, subtotal: 6200, gstRate: 0 }), /balance changed/);
  await assert.rejects(credit.quoteCredit({ client, items: [{ ...adsItem(), serviceSnapshot: { slug: "reels" } }], input: { metaAds: 100 }, subtotal: 6200, gstRate: 0 }), /matching platform/);
});

test("concurrent spending cannot overdraw a platform balance", async () => {
  const { credit, state, session } = fixture();
  const outcomes = await Promise.allSettled([1, 2].map((n) => credit.spendCredit({ client,
    order: `order-${n}`, requested: { metaAds: 150000, googleAds: 0 }, session, actor: client })));
  assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
  assert.equal(state.balances.metaAds, 50000);
  assert.equal(state.entries.length, 1);
});

test("credit issuance checks settlement, budget, and duplicates", async () => {
  const f = fixture();
  const order = { _id: orderId, client, paymentStatus: "paid", items: [adsItem()] };
  const Order = {
    findById: () => query(order),
    updateOne: async (filter, update, options) => {
      assert.equal(options.session, f.session);
      const field = Object.keys(update.$set)[0];
      if (f.state.issued[field]) return { modifiedCount: 0 };
      f.state.issued[field] = update.$set[field];
      return { modifiedCount: 1 };
    },
  };
  const controller = load("controllers/adCreditController.js", { mongoose: f.mongo,
    "../models/Order": Order, "../models/AdCreditWallet": f.Wallet,
    "../models/AdCreditEntry": f.Entry, "../utils/adCredit": f.credit });
  const req = (amount) => ({ params: { id: orderId }, user: { _id: client, role: "employee" },
    body: { platform: "metaAds", amount, note: "Campaign ended; confirmed unused spend." } });
  const first = response(); await controller.issueAdCredit(req(1500), first);
  assert.equal(first.statusCode, 201);
  assert.equal(f.state.balances.metaAds, 350000);
  assert.equal(f.state.entries[0].kind, "issued");
  const duplicate = response(); await controller.issueAdCredit(req(1500), duplicate);
  assert.equal(duplicate.statusCode, 409);
  assert.equal(f.state.balances.metaAds, 350000);
  const tooMuch = response(); await controller.issueAdCredit(req(5001), tooMuch);
  assert.equal(tooMuch.statusCode, 400);
  order.paymentStatus = "pending";
  const unpaid = response(); await controller.issueAdCredit(req(100), unpaid);
  assert.equal(unpaid.statusCode, 400);
});

test("a failed issuance rolls back the order marker and wallet together", async () => {
  const f = fixture();
  const controller = load("controllers/adCreditController.js", { mongoose: f.mongo,
    "../models/Order": { findById: () => query({ _id: orderId, client, paymentStatus: "paid", items: [adsItem()] }),
      updateOne: async () => { f.state.issued.metaAds = 100; return { modifiedCount: 1 }; } },
    "../models/AdCreditWallet": f.Wallet,
    "../models/AdCreditEntry": { create: async () => { throw Object.assign(new Error("Duplicate"), { code: 11000 }); } },
    "../utils/adCredit": f.credit,
  });
  const res = response();
  await controller.issueAdCredit({ params: { id: orderId }, user: { _id: client },
    body: { platform: "metaAds", amount: 100, note: "Unused" } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(f.state.balances.metaAds, 200000);
  assert.deepEqual(f.state.issued, {});
});

function checkoutFixture({ coupon = false } = {}) {
  const f = fixture();
  let saved;
  const service = { _id: serviceId, slug: "ads", name: "Ads", category: "Advertising", pricingType: "custom",
    basePrice: 0, minQuantity: 1, isActive: true, fields: [], repeatableGroups: [],
    pricingOptions: [{ _id: optionId, name: "Meta Ads", group: "metaAds", price: 1200,
      unit: "30 days", minQuantity: 1, isActive: true,
      fields: [{ name: "metaAdsAdSpendAmount", label: "Ad spend", type: "number", required: true, min: 0, includeValueInPrice: true }] }] };
  class Order {
    constructor(data) { Object.assign(this, data); this._id = orderId; }
    async save(options) { assert.equal(options.session, f.session); saved = this; }
    toObject() { return { ...this }; }
    static findById() { return query(saved); }
    static async create(data) { saved = new Order(data); return saved; }
  }
  const controller = load("controllers/orderController.js", { mongoose: f.mongo,
    "../models/Service": { findOne: async () => service }, "../models/Order": Order,
    "../models/Coupon": {
      findOne: async () => ({ _id: "123456789012345678901238", code: "SAVE", isActive: true,
        serviceDiscounts: [{ serviceId, discountPercent: 10 }] }),
      findOneAndUpdate: async () => ({ _id: "123456789012345678901238" }),
    },
    "../models/CouponClientUsage": { findOneAndUpdate: async () => ({ usageCount: 1 }) },
    "../models/CouponUsage": { create: async (_rows, options) => assert.equal(options.session, f.session) },
    "../models/OrderDraft": { findOne: () => query({ _id: orderId }),
      updateOne: async (_filter, _update, options) => {
        assert.equal(options.session, f.session); return { modifiedCount: 1 };
      } },
    "../utils/adCredit": f.credit });
  const req = { user: { _id: client, role: "client" }, get: () => undefined,
    body: { services: [{ serviceId, quantity: 1,
      formData: { metaAds: optionId, metaAdsAdSpendAmount: 5000, pricingQuantities: { metaAds: 1 } } }],
      paymentMethod: "online", adCredit: { metaAds: 2000 } } };
  if (coupon) req.body.couponCode = "SAVE";
  return { ...f, controller, req, service, saved: () => saved };
}

test("server quote and created order agree; credit is reserved in the order transaction", async () => {
  const f = checkoutFixture();
  const quoted = response(); await f.controller.getOrderQuote(f.req, quoted);
  assert.equal(quoted.statusCode, 200, JSON.stringify(quoted.body));
  assert.equal(quoted.body.quote.amount, 4956);
  const created = response(); await f.controller.createOrder(f.req, created);
  assert.equal(created.statusCode, 201, JSON.stringify(created.body));
  assert.equal(created.body.order.amount, quoted.body.quote.amount);
  assert.equal(created.body.order.adCreditTotal, 2000);
  assert.equal(created.body.order.subtotalBeforeAdCredit, 6200);
  assert.equal(f.state.balances.metaAds, 0);
  assert.equal(f.state.entries[0].order, orderId);
});

test("orders without credit retain their original pricing and avoid wallet writes", async () => {
  const f = checkoutFixture(); delete f.req.body.adCredit;
  const res = response(); await f.controller.createOrder(f.req, res);
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.equal(res.body.order.amount, 7316);
  assert.equal(res.body.order.adCreditTotal, undefined);
  assert.equal(f.state.writes, 0);
});

test("unpaid cancellation returns credit once and prevents reopening", async () => {
  const f = fixture();
  const order = { _id: orderId, client, paymentMethod: "cod", paymentStatus: "pending", adCreditTotal: 500,
    adCreditApplied: { metaAds: 500 }, save: async ({ session }) => assert.equal(session, f.session) };
  const { changeOrderStatus } = load("utils/adCreditCancellation.js", {
    mongoose: f.mongo, "../models/Order": { findById: () => query(order) },
    "../models/AdCreditWallet": f.Wallet, "../models/AdCreditEntry": f.Entry,
    "../utils/adCredit": f.credit, "./requestLock": { acquireLock: async () => async () => {} },
  });
  await changeOrderStatus(order, "cancelled", client);
  assert.equal(f.state.balances.metaAds, 250000);
  assert.equal(order.adCreditReleased, true);
  assert.equal(order.codPinStatus, "expired");
  order.save = async () => {};
  await changeOrderStatus(order, "cancelled", client);
  assert.equal(f.state.balances.metaAds, 250000);
  await assert.rejects(changeOrderStatus(order, "pending", client), /instead of reopening/);
});

test("cancellation cannot release credit against an outstanding online payment", async () => {
  const f = fixture();
  const order = { _id: orderId, client, paymentMethod: "online", paymentStatus: "processing",
    razorpayOrderId: "order_test", adCreditTotal: 500, adCreditApplied: { metaAds: 500 } };
  const { changeOrderStatus } = load("utils/adCreditCancellation.js", {
    mongoose: f.mongo, "../models/Order": { findById: () => query(order) },
    "../models/AdCreditWallet": f.Wallet, "../models/AdCreditEntry": f.Entry,
    "../utils/adCredit": f.credit, "./requestLock": { acquireLock: async () => async () => {} },
  });
  await assert.rejects(changeOrderStatus(order, "cancelled", client), /Reconcile its payment/);
  assert.equal(f.state.entries.length, 0);
});

test("coupons discount management fees while ad credit covers only the media budget", async () => {
  const f = checkoutFixture({ coupon: true });
  const quoted = response(); await f.controller.getOrderQuote(f.req, quoted);
  assert.equal(quoted.statusCode, 200, JSON.stringify(quoted.body));
  assert.equal(quoted.body.quote.discountTotal, 120);
  assert.equal(quoted.body.quote.adCreditTotal, 2000);
  assert.equal(quoted.body.quote.amount, 4814.4);
  const created = response(); await f.controller.createOrder(f.req, created);
  assert.equal(created.statusCode, 201, JSON.stringify(created.body));
  assert.equal(created.body.order.amount, quoted.body.quote.amount);
  assert.equal(f.state.entries.length, 1);
});

test("saved draft confirmation uses the total after ad credit", async () => {
  const f = checkoutFixture();
  f.req.body.draftId = orderId;
  f.req.body.confirmedAmount = 7316;
  const stale = response(); await f.controller.createOrder(f.req, stale);
  assert.equal(stale.statusCode, 409);
  assert.equal(f.state.writes, 0);
  f.req.body.confirmedAmount = 4956;
  const current = response(); await f.controller.createOrder(f.req, current);
  assert.equal(current.statusCode, 201, JSON.stringify(current.body));
  assert.equal(current.body.order.amount, 4956);
});

test("both cheque pricing modes and COD work with ad credit", async () => {
  for (const [paymentMethod, chequeType, amount] of [
    ["cheque", "with_gst", 4956], ["cheque", "direct_collection", 4200], ["cod", undefined, 4200],
  ]) {
    const f = checkoutFixture();
    Object.assign(f.req.body, { paymentMethod, ...(chequeType ? { chequeType } : {}) });
    const created = response(); await f.controller.createOrder(f.req, created);
    assert.equal(created.statusCode, 201, JSON.stringify(created.body));
    assert.equal(created.body.order.amount, amount);
    assert.equal(created.body.order.paymentStatus, "pending");
  }
});

test("settled credit-funded cancellation keeps campaign funds available for staff reconciliation", async () => {
  const f = fixture(); let saves = 0;
  const order = { _id: orderId, client, adCreditTotal: 500, paymentStatus: "paid", save: async () => { saves++; } };
  const { changeOrderStatus } = load("utils/adCreditCancellation.js", {
    "../models/AdCreditWallet": f.Wallet, "../models/AdCreditEntry": f.Entry,
  });
  await changeOrderStatus(order, "cancelled", client);
  assert.equal(saves, 1);
  assert.equal(f.state.entries.length, 0);
  assert.equal(order.adCreditReleased, undefined);
});

test("ad credit routes require staff permission for issuance and authenticated client access for balances", () => {
  const routes = [];
  const router = {};
  for (const method of ["get", "post", "patch"]) router[method] = (url, ...handlers) => routes.push({ method, url, handlers });
  const protect = () => {};
  const adminOnly = () => {};
  const orderStaff = () => {};
  load("routes/orderRoutes.js", { express: { Router: () => router },
    "../middleware/auth": protect, "../middleware/admin": adminOnly, "../middleware/orderStaff": orderStaff });
  const staff = routes.find((route) => route.method === "post" && route.url === "/staff/:id/ad-credit");
  const admin = routes.find((route) => route.method === "post" && route.url === "/admin/:id/ad-credit");
  const mine = routes.find((route) => route.url === "/ad-credit");
  assert.equal(staff.handlers[0], protect);
  assert.equal(staff.handlers[1], orderStaff);
  assert.equal(admin.handlers[1], adminOnly);
  assert.equal(mine.handlers[0], protect);
});

test("an order fully funded by eligible ad credit has no new payment due", async () => {
  const f = checkoutFixture();
  f.service.pricingOptions[0].price = 0;
  f.req.body.services[0].formData.metaAdsAdSpendAmount = 2000;
  const res = response(); await f.controller.createOrder(f.req, res);
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.equal(res.body.order.amount, 0);
  assert.equal(res.body.order.paymentStatus, "paid");
  assert.equal(f.state.balances.metaAds, 0);
});
