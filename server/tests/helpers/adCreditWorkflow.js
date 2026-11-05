const assert = require("node:assert/strict");

module.exports = async ({ t, call, orders, Order, Service, admin, clients }) => {
  const credit = require("../../controllers/adCreditController");
  const Wallet = require("../../models/AdCreditWallet");
  const Entry = require("../../models/AdCreditEntry");
  const User = require("../../models/User");
  await Wallet.createIndexes(); await Entry.createIndexes();
  const employee = await User.create({ name: "Credit QA", username: "credit-qa", password: "fixture-only", role: "employee" });
  const service = await Service.create({ name: "Local Ads", slug: "ads", category: "Advertising", serviceGroup: "content",
    pricingType: "custom", basePrice: 0, minQuantity: 1, isActive: true,
    pricingOptions: [{ name: "Meta Ads", group: "metaAds", price: 1200, unit: "30 days", minQuantity: 1, isActive: true,
      fields: [{ name: "metaAdsAdSpendAmount", label: "Ad spend", type: "number", required: true, min: 0, includeValueInPrice: true }] }] });
  const body = (amount = 5000) => ({ paymentMethod: "online", services: [{ serviceId: String(service._id), quantity: 1,
    formData: { metaAds: String(service.pricingOptions[0]._id), metaAdsAdSpendAmount: amount, pricingQuantities: { metaAds: 1 } } }] });
  const create = async (extra = {}, amount = 5000) => {
    const result = await call(orders.createOrder, clients[0], { ...body(amount), ...extra });
    assert.equal(result.statusCode, 201, result.body.message);
    return result.body.order;
  };
  const balance = async () => (await Wallet.findById(`${clients[0]._id}:metaAds`))?.balancePaise || 0;
  const params = order => ({ id: String(order._id) });
  await t.test("wallet records In Progress and older source orders, rejects duplicates and unauthorized credits", async () => {
    for (const [actor, status] of [[admin, "in_progress"], [employee, "completed"]]) {
      const source = await create();
      await Order.updateOne({ _id: source._id }, { $set: { paymentStatus: "paid", orderStatus: status } });
      const input = { platform: "metaAds", amount: 2000, note: `${status} confirmed unused budget` };
      assert.equal((await call(credit.issueAdCredit, clients[0], input, params(source))).statusCode, 403);
      assert.equal((await call(credit.issueAdCredit, actor, input, params(source))).statusCode, 201);
      assert.equal((await call(credit.issueAdCredit, actor, input, params(source))).statusCode, 409);
      const saved = await Order.findById(source._id);
      assert.equal(saved.orderStatus, status); assert.equal(saved.paymentStatus, "paid");
      const entry = await Entry.findOne({ order: source._id });
      assert.equal(String(entry.actor), String(actor._id)); assert.equal(entry.note, input.note);
    }
    assert.equal(await balance(), 400000);
    const unpaid = await create();
    assert.equal((await call(credit.issueAdCredit, admin, { platform: "metaAds", amount: 100, note: "Unfunded" }, params(unpaid))).statusCode, 400);
  });
  await t.test("client checkout partially consumes wallet and preserves fees, GST and snapshots", async () => {
    const order = await create({ adCredit: { metaAds: 500 } });
    assert.equal(order.adCreditTotal, 500); assert.equal(order.subtotalBeforeAdCredit, 6200);
    assert.equal(order.subtotal, 5700); assert.equal(order.amount, 6726);
    assert.equal(order.items[0].amount, 6200); assert.equal(await balance(), 350000);
  });
  await t.test("admin and employee apply partial credit with confirmation and immutable paid-order safeguards", async () => {
    for (const actor of [admin, employee]) {
      const order = await create(); const input = { confirmed: true, adCredit: { metaAds: 500 } };
      assert.equal((await call(credit.applyOrderCredit, clients[0], input, params(order))).statusCode, 403);
      assert.equal((await call(credit.applyOrderCredit, actor, { adCredit: input.adCredit }, params(order))).statusCode, 400);
      const result = await call(credit.applyOrderCredit, actor, input, params(order));
      assert.equal(result.statusCode, 200, result.body.message);
      const saved = await Order.findById(order._id);
      assert.equal(saved.amount, 6726); assert.equal(saved.adCreditTotal, 500); assert.equal(saved.paymentStatus, "pending");
      assert.equal((await call(credit.applyOrderCredit, actor, input, params(order))).statusCode, 409);
      const entry = await Entry.findOne({ order: order._id, kind: "applied" });
      assert.equal(String(entry.actor), String(actor._id));
    }
    for (const patch of [{ paymentStatus: "paid" }, { razorpayOrderId: "already-initialized" }, { codPinStatus: "active" }, { "invoice.url": "https://example.com/invoice" }]) {
      const order = await create(); await Order.updateOne({ _id: order._id }, { $set: patch });
      assert.equal((await call(credit.applyOrderCredit, admin, { confirmed: true, adCredit: { metaAds: 1 } }, params(order))).statusCode, 409);
    }
    assert.equal(await balance(), 250000);
  });
  await t.test("simultaneous real transactions cannot double spend; remaining credit covers only eligible ad spend", async () => {
    const targets = [await create(), await create()];
    const results = await Promise.all(targets.map(order => call(credit.applyOrderCredit, admin, { confirmed: true, adCredit: { metaAds: 2000 } }, params(order))));
    assert.deepEqual(results.map(result => result.statusCode).sort(), [200, 409]);
    assert.equal(await balance(), 50000);
    const final = await create({ adCredit: { metaAds: 500 } }, 500);
    assert.equal(final.adCreditTotal, 500); assert.equal(final.subtotal, 1200); assert.equal(final.amount, 1416);
    assert.equal(await balance(), 0);
    const history = await call(credit.getMyAdCredit, clients[0]);
    assert.equal(history.statusCode, 200, history.body.message);
    assert.equal(history.body.entries.length, 7);
    assert.ok(history.body.entries.every(entry => entry.order.orderNumber && entry.actor.name && entry.note && entry.createdAt));
    assert.equal(history.body.available.googleAds, 0);
    const other = await call(credit.getMyAdCredit, clients[1]);
    assert.equal(other.body.entries.length, 0); assert.equal(other.body.available.metaAds, 0);
  });
};
