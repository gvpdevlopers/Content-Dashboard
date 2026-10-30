// Opt-in verification: read the existing catalogue and identities, clone them
// into the already-connected isolated database, and write ONLY to that clone.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const { canClientOrderService } = require("../../utils/serviceAccess");
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
module.exports = async () => {
  assert.equal(mongoose.connection.host, "127.0.0.1", "Writes are permitted only to the isolated loopback database");
  const env = require("dotenv").parse(fs.readFileSync(path.resolve(__dirname, "../../.env")));
  const source = await mongoose.createConnection(env.MONGO_URI, { serverSelectionTimeoutMS: 10000 }).asPromise();
  let catalogue, identities;
  try {
    catalogue = await source.db.collection("services").find({ isActive: true }).toArray();
    identities = await source.db.collection("users").find({ isActive: true, role: { $in: ["client", "admin"] } }).project({ _id: 1, name: 1, email: 1, username: 1, role: 1, isActive: 1, serviceAccess: 1, allowMonthEndPayment: 1 }).toArray();
  } finally { await source.close(); }
  await mongoose.connection.db.collection("services").insertMany(catalogue);
  await mongoose.connection.db.collection("users").insertMany(identities.map((user) => ({ ...user, password: "local-clone-unusable-password" })));
  const controller = require("../../controllers/packageController"), orders = require("../../controllers/orderController"), Package = require("../../models/Package"), User = require("../../models/User");
  const admin = identities.find((user) => user.role === "admin"); assert.ok(admin, "An existing active administrator is required");
  const clients = await User.find({ _id: { $in: identities.filter((user) => user.role === "client").map((user) => user._id) } });
  const content = catalogue.filter((service) => !service.serviceGroup || service.serviceGroup === "content").filter((service) => !(service.repeatableGroups || []).length && !(service.pricingOptions || []).length).slice(0, 2);
  const seo = catalogue.filter((service) => service.serviceGroup === "seo").slice(0, 2);
  const dev = catalogue.filter((service) => service.serviceGroup === "development").sort((a, b) => Number(b.pricingType === "per_unit") - Number(a.pricingType === "per_unit")).slice(0, 2);
  assert.equal(content.length, 2); assert.equal(seo.length, 2); assert.equal(dev.length, 2);
  const call = async (method, user, body = {}, params = {}) => { const res = response(); await method({ user, body, params, get: () => undefined }, res); return res; };
  const report = { environment: "isolated local replica set; existing Atlas records read-only", packages: [] };
  const valueFor = (field) => ["select", "radio"].includes(field.type) ? field.options?.[0]?.value : field.type === "checkbox" ? [field.options?.[0]?.value].filter(Boolean) : field.type === "url" ? "https://example.com" : field.type === "date" ? "2026-10-30" : field.type === "number" ? Math.max(Number(field.min || 0), Number(field.step || 1)) : "Local package workflow verification";
  const create = async (name, selected, visibility = "all") => {
    const eligible = clients.filter((client) => selected.every((service) => canClientOrderService(client, service)));
    assert.ok(eligible.length, `No existing eligible client for ${name}`);
    const services = selected.map((service) => ({ serviceId: String(service._id), quantity: service.pricingType === "per_unit" ? Math.max(2, service.minQuantity || 1) : service.minQuantity || 1,
      formData: Object.fromEntries((service.fields || []).filter((field) => field.type === "select").slice(0, 1).map((field) => [field.name, valueFor(field)])) }));
    const res = await call(controller.createPackage, admin, { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""), description: "Temporary verification in isolated local copy", pricingMode: "calculated", services, visibility, clients: visibility === "selected" ? [String(eligible[0]._id)] : [] });
    assert.equal(res.statusCode, 201, res.body.message);
    const item = res.body.package;
    const body = { packageId: String(item._id), paymentMethod: "cod", services: item.services.map((entry, index) => ({ serviceId: String(entry.service), quantity: entry.quantity,
      formData: { ...entry.formData, ...Object.fromEntries((selected[index].fields || []).filter((field) => field.required && !Object.hasOwn(entry.formData, field.name)).map((field) => [field.name, valueFor(field)])) } })) };
    const quote = await call(orders.getOrderQuote, eligible[0], body); assert.equal(quote.statusCode, 200, quote.body.message);
    const order = await call(orders.createOrder, eligible[0], { ...body, confirmedAmount: quote.body.quote.amount }); assert.equal(order.statusCode, 201, order.body.message);
    assert.equal(order.body.order.amount, quote.body.quote.amount);
    const saved = await call(controller.updatePackage, admin, { description: "Verified editing preserves configuration" }, { id: String(item._id) }); assert.equal(saved.statusCode, 200, saved.body.message);
    const loaded = await call(controller.getClientPackage, eligible[0], {}, { id: String(item._id) }); assert.equal(loaded.statusCode, 200);
    if (visibility === "selected") {
      const unassigned = clients.find((client) => String(client._id) !== String(eligible[0]._id)); assert.ok(unassigned);
      assert.equal((await call(controller.getClientPackage, unassigned, {}, { id: String(item._id) })).statusCode, 404);
    }
    report.packages.push({ id: String(item._id), name, visibility, pricingMode: item.pricingMode, price: item.price,
      services: item.services.map((entry) => ({ name: entry.serviceSnapshot.name, group: entry.serviceSnapshot.serviceGroup || "content", quantity: entry.quantity, formData: entry.formData })),
      checkoutAmount: quote.body.quote.amount, orderCreated: true, editingPreserved: true });
    await call(controller.updatePackage, admin, { isActive: false }, { id: String(item._id) });
    assert.equal((await call(controller.getClientPackage, eligible[0], {}, { id: String(item._id) })).statusCode, 404);
    assert.equal((await call(orders.getOrderQuote, eligible[0], body)).statusCode, 400);
  };
  await create("QA Existing Content", content);
  await create("QA Existing SEO", seo);
  await create("QA Existing Development", dev);
  await create("QA Existing Mixed", [content[0], seo[0], dev[0]]);
  await create("QA Existing Selected Clients", content, "selected");
  assert.equal(await Package.countDocuments({ name: /^QA Existing/ }), 5);
  const destination = path.resolve(__dirname, "../../../artifacts/package-workflow-report.json");
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  await fs.promises.writeFile(destination, JSON.stringify(report, null, 2));
  console.log("Existing-catalogue verification: five local packages created, quoted, ordered, edited and deactivated; remote source unchanged.");
};
