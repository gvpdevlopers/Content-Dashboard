// Real persistence and route tests in an isolated loopback MongoDB process.
// No application .env or remote database is read by this test.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const mongoose = require("mongoose");
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const executable = [process.env.SERVICE_ACCESS_TEST_MONGOD, "C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe", "/usr/bin/mongod"].filter(Boolean).find(existsSync);

test("package pricing allocates exact cents, supports every service coupon and protects ad budgets", () => {
  const { applyFixedPackagePrice } = require("../utils/packagePricing");
  const rows = [100, 200, 300].map((amount) => ({ amount, couponEligibleAmount: amount, item: {} }));
  applyFixedPackagePrice(rows, 500.01);
  assert.equal(Math.round(rows.reduce((sum, row) => sum + row.amount, 0) * 100), 50001);
  assert.ok(rows.every((row) => row.couponEligibleAmount > 0 && row.amount === row.item.amount));
  const ads = [{ amount: 1100, couponEligibleAmount: 100, item: {} }];
  assert.throws(() => applyFixedPackagePrice(ads, 999), /cover the included ad spend/);
  applyFixedPackagePrice(ads, 1050); assert.equal(ads[0].couponEligibleAmount, 50); assert.equal(ads[0].amount, 1050);
});

test("package defaults lock configured values while client details complete repeated entries", () => {
  const { mergePackageRequests } = require("../utils/packageConfiguration");
  const service = "123456789012345678901234";
  const item = { services: [{ service, quantity: 2, pricingOptionId: "locked", formData: { channel: "locked", reels: [{ fields: { title: "Template" }, pricingOptions: { shoot: "locked" } }] } }] };
  const merged = mergePackageRequests(item, [{ serviceId: service, quantity: 99, pricingOptionId: "other", formData: { channel: "other", brief: "Client brief", reels: [{ fields: { title: "Other", url: "https://example.com" } }] } }]);
  assert.equal(merged[0].quantity, 2); assert.equal(merged[0].pricingOptionId, "locked");
  assert.equal(merged[0].formData.channel, "locked"); assert.equal(merged[0].formData.brief, "Client brief");
  assert.deepEqual(merged[0].formData.reels[0].fields, { title: "Template", url: "https://example.com" });
  assert.throws(() => mergePackageRequests(item, []), /exactly/);
});

test("real package API persists all groups, validates assignments, quotes and submits checkout", { skip: executable ? false : "Local mongod unavailable", timeout: 180000 }, async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "package-workflow-"));
  const listener = net.createServer(); await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port; await new Promise((resolve) => listener.close(resolve));
  const child = spawn(executable, ["--dbpath", directory, "--bind_ip", "127.0.0.1", "--port", String(port), "--replSet", "packageQa", "--quiet", "--logpath", path.join(directory, "mongod.log")], { windowsHide: true, stdio: "ignore" });
  let spawnError; child.on("error", (error) => { spawnError = error; });
  const exited = once(child, "exit").catch(() => undefined);
  let http;
  const previousSecret = process.env.JWT_SECRET;
  try {
    for (let attempt = 0; attempt < 160; attempt++) {
      if (spawnError) throw spawnError;
      try { await mongoose.connect(`mongodb://127.0.0.1:${port}/package_workflow_test?directConnection=true`, { serverSelectionTimeoutMS: 300 }); break; }
      catch (error) { if (child.exitCode !== null || attempt === 159) { console.error((await fs.readFile(path.join(directory, "mongod.log"), "utf8")).split("\n").slice(-8).join("\n")); throw error; } await mongoose.disconnect(); await new Promise((resolve) => setTimeout(resolve, 100)); }
    }
    await mongoose.connection.db.admin().command({ replSetInitiate: { _id: "packageQa", members: [{ _id: 0, host: `127.0.0.1:${port}` }] } });
    for (let attempt = 0; attempt < 100; attempt++) {
      if ((await mongoose.connection.db.admin().command({ hello: 1 })).isWritablePrimary) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const User = require("../models/User"), Service = require("../models/Service"), Package = require("../models/Package"), Order = require("../models/Order");
    // Wait for the unique slug index before exercising duplicate requests.
    await Package.createIndexes();
    const admin = await User.create({ name: "Local fixture admin", username: "qa-admin", password: "fixture-only", role: "admin" });
    const clients = await User.create(["assigned", "unassigned", "content-only"].map((name, index) => ({ name, username: name, password: "fixture-only", role: "client", serviceAccess: { mode: "groups", groups: index === 2 ? ["content"] : ["content", "seo", "development"], serviceIds: [] } })));
    const services = await Service.create(["content", "content", "seo", "development"].map((group, index) => ({ name: `Local ${group} ${index}`, slug: `local-${group}-${index}`, category: group, serviceGroup: group,
      pricingType: "per_unit", basePrice: (index + 1) * 100, minQuantity: 1, maxQuantity: 5,
      fields: [{ name: "brief", label: "Client brief", type: "text", required: true }, { name: "tier", label: "Tier", type: "select", options: [{ label: "Extra", value: "extra", price: 20 }] }],
      pricingOptions: index === 0 ? [{ name: "Standard", price: 75, unit: "item", minQuantity: 2, maxQuantity: 4, fields: [{ name: "website", label: "Website", type: "url", required: true }] }] : [] })));
    const controller = require("../controllers/packageController");
    const orders = require("../controllers/orderController");
    const drafts = require("../controllers/draftController");
    const call = async (method, user, body = {}, params = {}) => { const res = response(); await method({ user, body, params, get: () => undefined }, res); return res; };
    const requests = (items) => items.map((service) => ({ serviceId: String(service._id), quantity: service.minQuantity || 1, formData: {} }));
    const create = async (slug, selected, extra = {}) => {
      const res = await call(controller.createPackage, admin, { name: slug, slug, price: 500, services: requests(selected), ...extra });
      assert.equal(res.statusCode, 201, res.body.message); return res.body.package;
    };
    let content, mixed, restricted;
    await t.test("create Content, SEO, Development and mixed packages using real persistence", async () => {
      content = await create("qa-content", services.slice(0, 2), { services: [{ serviceId: String(services[0]._id), quantity: 2, pricingOptionId: String(services[0].pricingOptions[0]._id), formData: { tier: "extra" } }, requests([services[1]])[0]] });
      await create("qa-seo", [services[2]]); await create("qa-development", [services[3]]);
      mixed = await create("qa-mixed", services.slice(1), { pricingMode: "calculated" });
      assert.equal(mixed.price, 900);
      restricted = await create("qa-restricted", services.slice(1), { visibility: "selected", clients: [String(clients[0]._id)] });
      assert.equal(await Package.countDocuments(), 5);
      const preview = await call(controller.previewPackage, admin, { services: content.services.map((entry) => ({ serviceId: String(entry.service), quantity: entry.quantity, pricingOptionId: entry.pricingOptionId, formData: entry.formData })) });
      assert.equal(preview.body.price, 370);
    });
    await t.test("reject direct API invalid configurations, references, enums and assignments", async () => {
      const base = { name: "Invalid", slug: "invalid", price: 100, services: requests([services[2]]) };
      const cases = [{ name: " " }, { slug: "bad slug" }, { pricingMode: "other" }, { visibility: "other" }, { price: -1 },
        { services: [{ ...base.services[0], quantity: 6 }] }, { services: [{ ...base.services[0], pricingOptionId: String(admin._id) }] },
        { services: [{ ...base.services[0], formData: { tier: "invalid" } }] }, { services: [{ ...base.services[0], formData: [] }] },
        { services: [base.services[0], base.services[0]] }, { services: [{ ...base.services[0], serviceId: String(admin._id) }] },
        { visibility: "selected", clients: [] }, { visibility: "selected", clients: [String(admin._id)] }, { visibility: "selected", clients: [String(clients[2]._id)] }];
      for (const patch of cases) { const res = await call(controller.createPackage, admin, { ...base, ...patch }); assert.equal(res.statusCode, 400, JSON.stringify(patch)); }
      const duplicate = await call(controller.createPackage, admin, { ...base, slug: "qa-content" }); assert.equal(duplicate.statusCode, 409);
    });
    await t.test("eligible clients and client catalogue enforce every service and assignment", async () => {
      const eligible = await call(controller.eligibleClients, admin, { services: requests(services.slice(1)) });
      assert.equal(eligible.body.clients.length, 2); assert.ok(eligible.body.clients.every((user) => user.role === "client"));
      const assigned = await call(controller.listClientPackages, clients[0]); const unassigned = await call(controller.listClientPackages, clients[1]);
      assert.ok(assigned.body.packages.some((item) => item.slug === restricted.slug)); assert.ok(!unassigned.body.packages.some((item) => item.slug === restricted.slug));
      const limited = await call(controller.listClientPackages, clients[2]); assert.deepEqual(limited.body.packages.map((item) => item.slug), ["qa-content"]);
      assert.equal((await call(controller.getClientPackage, clients[1], {}, { id: String(restricted._id) })).statusCode, 404);
      const publicContent = assigned.body.packages.find((item) => item.slug === content.slug); assert.deepEqual(publicContent.services[0].formData, { tier: "extra" });
    });
    await t.test("partial editing preserves assignments, services and defaults", async () => {
      const res = await call(controller.updatePackage, admin, { description: "Updated description" }, { id: String(restricted._id) }); assert.equal(res.statusCode, 200, res.body.message);
      const saved = await Package.findById(restricted._id); assert.equal(String(saved.clients[0]), String(clients[0]._id)); assert.equal(saved.services.length, 3); assert.equal(saved.visibility, "selected");
      const configured = await call(controller.updatePackage, admin, { name: "Configured content" }, { id: String(content._id) }); assert.equal(configured.statusCode, 200); assert.equal(configured.body.package.services[0].quantity, 2); assert.equal(configured.body.package.services[0].formData.tier, "extra");
    });
    const checkout = (item) => ({ packageId: String(item._id), paymentMethod: "cod", services: item.services.map((entry) => ({ serviceId: String(entry.service), quantity: entry.quantity, pricingOptionId: entry.pricingOptionId, formData: { ...entry.formData, brief: "Client completes the required brief", website: "https://example.com" } })) });
    await t.test("quotes, coupons, GST, snapshots, drafts and package order creation agree", async () => {
      const body = checkout(content);
      const quote = await call(orders.getOrderQuote, clients[0], { ...body, paymentMethod: "online" }); assert.equal(quote.statusCode, 200, quote.body.message); assert.equal(quote.body.quote.originalSubtotal, 500);
      const Coupon = require("../models/Coupon"); await Coupon.create({ code: "PACKAGE_QA", serviceDiscounts: content.services.map((entry) => ({ serviceId: entry.service, serviceName: "Fixture", discountPercent: 10 })) });
      const discounted = await call(orders.getOrderQuote, clients[0], { ...body, paymentMethod: "online", couponCode: "PACKAGE_QA" }); assert.equal(discounted.statusCode, 200, discounted.body.message); assert.equal(discounted.body.quote.discountTotal, 50);
      const draft = await call(drafts.createDraft, clients[0], { ...body, title: "Package draft" }); assert.equal(draft.statusCode, 201, draft.body.message); assert.equal(String(draft.body.draft.packageId), String(content._id));
      const res = await call(orders.createOrder, clients[0], { ...body, paymentMethod: "online", couponCode: "PACKAGE_QA", confirmedAmount: discounted.body.quote.amount }); assert.equal(res.statusCode, 201, res.body.message);
      const order = (await Order.findById(res.body.order._id)).toObject({ flattenMaps: true }); assert.equal(order.amount, discounted.body.quote.amount); assert.equal(order.subtotal, 450); assert.equal(order.items.length, 2); assert.equal(String(order.packageSnapshot.packageId), String(content._id));
      assert.equal(order.items[0].formData.brief, "Client completes the required brief"); assert.equal(order.items[0].formData.tier, "extra"); assert.equal(order.items[0].quantity, 2);
      assert.equal(order.gstRate, require("../utils/orderPricing").getGstRate("online")); assert.equal(order.gstAmount, discounted.body.quote.gstAmount);
      const calc = await call(orders.getOrderQuote, clients[0], checkout(mixed)); assert.equal(calc.statusCode, 200, calc.body.message); assert.equal(calc.body.quote.amount, 900);
      const custom = await call(orders.getOrderQuote, clients[0], { paymentMethod: "cod", services: checkout(mixed).services }); assert.equal(custom.statusCode, 200); assert.equal(custom.body.quote.amount, 900);
    });
    await t.test("checkout rejects substitutions, missing fields and unassigned clients", async () => {
      const body = checkout(restricted);
      assert.equal((await call(orders.getOrderQuote, clients[1], body)).statusCode, 400);
      assert.equal((await call(orders.createOrder, clients[1], body)).statusCode, 403);
      assert.equal((await call(orders.getOrderQuote, clients[0], { ...body, services: body.services.slice(1) })).statusCode, 400);
      assert.equal((await call(orders.getOrderQuote, clients[0], { ...body, services: body.services.map((entry) => ({ ...entry, formData: {} })) })).statusCode, 400);
      const tampered = checkout(content); tampered.services[0].quantity = 99; tampered.services[0].formData.tier = "invalid";
      const res = await call(orders.getOrderQuote, clients[0], tampered); assert.equal(res.statusCode, 200, res.body.message); assert.equal(res.body.quote.amount, 500);
    });
    await t.test("deactivated packages and services disappear immediately and block checkout", async () => {
      const res = await call(controller.updatePackage, admin, { isActive: false }, { id: String(restricted._id) }); assert.equal(res.statusCode, 200, res.body.message);
      assert.equal((await call(controller.getClientPackage, clients[0], {}, { id: String(restricted._id) })).statusCode, 404);
      assert.equal((await call(orders.getOrderQuote, clients[0], checkout(restricted))).statusCode, 400);
      await Service.updateOne({ _id: services[2]._id }, { isActive: false });
      const catalogue = await call(controller.listClientPackages, clients[0]); assert.ok(!catalogue.body.packages.some((item) => item.slug === mixed.slug));
      assert.equal((await call(controller.createPackage, admin, { name: "Inactive", slug: "inactive", price: 1, services: requests([services[2]]) })).statusCode, 400);
    });
    await t.test("actual authenticated admin route is reachable before the client ID route", async () => {
      const express = require("express"), jwt = require("jsonwebtoken");
      process.env.JWT_SECRET = "isolated-package-test-secret";
      const app = express(); app.use(express.json()); app.use("/api/packages", require("../routes/packageRoutes"));
      http = app.listen(0, "127.0.0.1"); await once(http, "listening");
      const url = `http://127.0.0.1:${http.address().port}/api/packages/admin`;
      const token = jwt.sign({ userId: String(admin._id) }, process.env.JWT_SECRET);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }); assert.equal(res.status, 200); assert.equal((await res.json()).packages.length, 5);
      assert.equal((await fetch(url)).status, 401);
      const clientToken = jwt.sign({ userId: String(clients[0]._id) }, process.env.JWT_SECRET);
      assert.equal((await fetch(url, { headers: { Authorization: `Bearer ${clientToken}` } })).status, 403);
      const deleteUrl = `${url}/${content._id}`;
      const adminHeaders = { Authorization: `Bearer ${token}` };
      assert.equal((await fetch(deleteUrl, { method: "DELETE" })).status, 401);
      assert.equal((await fetch(deleteUrl, { method: "DELETE", headers: { Authorization: `Bearer ${clientToken}` } })).status, 403);
      assert.equal((await fetch(`${url}/invalid`, { method: "DELETE", headers: adminHeaders })).status, 400);
      const existingOrders = await Order.find({}).lean();
      const serviceCount = await Service.countDocuments();
      assert.equal((await fetch(deleteUrl, { method: "DELETE", headers: adminHeaders })).status, 200);
      assert.equal(await Package.findById(content._id), null);
      assert.deepEqual(await Order.find({}).lean(), existingOrders);
      assert.equal(await Service.countDocuments(), serviceCount);
      assert.equal((await call(controller.getClientPackage, clients[0], {}, { id: String(content._id) })).statusCode, 404);
      assert.equal((await call(orders.getOrderQuote, clients[0], checkout(content))).statusCode, 400);
      assert.equal((await fetch(deleteUrl, { method: "DELETE", headers: adminHeaders })).status, 404);
    });
    await t.test("repeatable pricing templates defer client fields and retain locked options during checkout", async () => {
      const service = await Service.create({ name: "Local repeated service", slug: "local-repeated", category: "content", serviceGroup: "content", pricingType: "custom", basePrice: 0,
        pricingOptions: [{ name: "Shoot", group: "shoot", price: 75, unit: "reel", minQuantity: 2, fields: [{ name: "url", label: "Reference URL", type: "url", required: true }] }],
        repeatableGroups: [{ name: "reels", label: "Reel", minItems: 1, maxItems: 3, pricingGroups: ["shoot"], requiredPricingGroups: ["shoot"], fields: [{ name: "title", label: "Title", type: "text", required: true }] }] });
      const pricingOptionId = String(service.pricingOptions[0]._id);
      const item = await create("qa-repeatable", [service], { pricingMode: "calculated", services: [{ serviceId: String(service._id), quantity: 1,
        formData: { reels: [{ pricingOptions: { shoot: pricingOptionId }, pricingQuantities: { shoot: 2 }, fields: {} }] } }] });
      assert.equal(item.price, 150);
      const body = { packageId: String(item._id), paymentMethod: "cod", services: [{ serviceId: String(service._id), quantity: 1,
        formData: { reels: [{ fields: { title: "Client title", url: "https://example.com" } }] } }] };
      const quote = await call(orders.getOrderQuote, clients[0], body); assert.equal(quote.statusCode, 200, quote.body.message); assert.equal(quote.body.quote.amount, 150);
      const submitted = await call(orders.createOrder, clients[0], body); assert.equal(submitted.statusCode, 201, submitted.body.message);
      const saved = (await Order.findById(submitted.body.order._id)).toObject({ flattenMaps: true });
      assert.equal(saved.items[0].formData.reels[0].fields.title, "Client title");
      assert.equal(saved.items[0].formData.reels[0].pricingOptions.shoot, pricingOptionId);
    });
    await t.test("existing active services and existing clients complete package checkout in a local clone", {
      skip: process.env.PACKAGE_QA_READ_EXISTING === "1" ? false : "Opt in with PACKAGE_QA_READ_EXISTING=1 to read the existing catalogue into the isolated database",
    }, async () => { await require("./helpers/existingPackageWorkflow")(); });
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = previousSecret;
    if (http) await new Promise((resolve) => http.close(resolve));
    await mongoose.disconnect(); child.kill(); await exited;
    // This unique directory was created by mkdtemp above, never an app database.
    await fs.rm(directory, { recursive: true, force: true });
  }
});
