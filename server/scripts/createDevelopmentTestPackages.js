// Explicit opt-in only. Creates QA packages; never creates clients, services,
// orders or payments. Keep the records available for review in Admin > Packages.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const mongoose = require("mongoose");
const { canClientOrderService } = require("../utils/serviceAccess");

const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const call = async (method, user, body = {}, params = {}) => {
  const res = response();
  await method({ user, body, params, get: () => undefined }, res);
  return res;
};
const requiredValue = (field) => {
  if (["select", "radio"].includes(field.type)) return field.options?.[0]?.value;
  if (field.type === "checkbox") return field.options?.length ? [field.options[0].value] : true;
  if (field.type === "url") return "https://example.com";
  if (field.type === "date") return "2026-10-30";
  if (field.type === "number") return Math.max(Number(field.min || 0), Number(field.step || 1));
  return "Development package verification";
};

async function main() {
  if (!process.argv.includes("--apply") || process.argv[process.argv.indexOf("--database") + 1] !== "test") {
    throw new Error("Explicit --apply --database test is required for this user-authorized development verification.");
  }
  require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  assert.equal(mongoose.connection.db.databaseName, "test", "Unexpected target database; no writes allowed");
  const Package = require("../models/Package");
  const Service = require("../models/Service");
  const User = require("../models/User");
  const controller = require("../controllers/packageController");
  const orders = require("../controllers/orderController");
  await Package.createIndexes();
  const catalogue = await Service.find({ isActive: true });
  const clients = await User.find({ role: "client", isActive: true }).select("_id role isActive serviceAccess allowMonthEndPayment");
  const admin = await User.findOne({ role: "admin", isActive: true }).select("_id role isActive");
  assert.ok(admin, "An existing active admin is required");
  const source = JSON.parse(await fs.readFile(path.resolve(__dirname, "../../artifacts/package-workflow-report.json"), "utf8"));
  const destination = path.resolve(__dirname, "../../artifacts/package-development-verification.json");
  const report = { environment: "user-confirmed development Atlas database", database: "test", verifiedAt: new Date().toISOString(),
    scope: "QA package records and read-only checkout quotes; no service, user, order, coupon or payment writes", packages: [] };
  try {
    for (const template of source.packages) {
      const slug = `qa-package-flow-20261030-${template.name.replace("QA Existing ", "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const name = `[QA Test] ${template.name.replace("QA Existing ", "")} - 30 Oct 2026`;
      const selected = template.services.map((entry) => {
        const matches = catalogue.filter((service) => service.name === entry.name);
        assert.equal(matches.length, 1, `Expected exactly one active existing service: ${entry.name}`);
        return matches[0];
      });
      const eligible = clients.filter((client) => selected.every((service) => canClientOrderService(client, service)));
      assert.ok(eligible.length, `No eligible existing client for ${name}`);
      const services = template.services.map((entry, index) => ({ serviceId: String(selected[index]._id), quantity: entry.quantity, formData: entry.formData }));
      let item = await Package.findOne({ slug });
      if (!item) {
        const created = await call(controller.createPackage, admin, { name, slug,
          description: "QA verification package created with permission in the development database. Uses existing services and clients; safe to deactivate after review.",
          services, pricingMode: template.pricingMode, price: template.price, visibility: template.visibility,
          clients: template.visibility === "selected" ? [String(eligible[0]._id)] : [], isActive: true });
        assert.equal(created.statusCode, 201, created.body.message);
        item = created.body.package;
      } else {
        assert.equal(item.name, name, "Existing slug is not this QA record; refusing to overwrite");
      }
      const row = { id: String(item._id), name: item.name, slug, price: item.price, visibility: item.visibility,
        selectedClientCount: item.clients.length, services: template.services, checks: {} };
      report.packages.push(row);
      const actor = item.visibility === "selected" ? eligible.find((client) => item.clients.some((id) => String(id) === String(client._id))) : eligible[0];
      assert.ok(actor, "Existing QA assignment is no longer eligible");
      const visible = await call(controller.getClientPackage, actor, {}, { id: row.id });
      assert.equal(visible.statusCode, 200, visible.body.message); row.checks.eligibleClientVisibility = true;
      if (item.visibility === "selected") {
        const other = eligible.find((client) => String(client._id) !== String(actor._id)) || clients.find((client) => String(client._id) !== String(actor._id));
        assert.ok(other, "An existing second client is needed for exclusion verification");
        assert.equal((await call(controller.getClientPackage, other, {}, { id: row.id })).statusCode, 404);
        row.checks.unassignedClientExcluded = true;
      }
      const checkout = { packageId: row.id, paymentMethod: "online", services: item.services.map((entry, index) => ({ serviceId: String(entry.service), quantity: entry.quantity,
        formData: { ...entry.formData, ...Object.fromEntries((selected[index].fields || []).filter((field) => field.required && !Object.hasOwn(entry.formData || {}, field.name)).map((field) => [field.name, requiredValue(field)])) } })) };
      const quote = await call(orders.getOrderQuote, actor, checkout);
      assert.equal(quote.statusCode, 200, quote.body.message);
      row.quote = { subtotal: quote.body.quote.taxableSubtotal ?? quote.body.quote.originalSubtotal, gstRate: quote.body.quote.gstRate, gstAmount: quote.body.quote.gstAmount, amount: quote.body.quote.amount };
      row.checks.checkoutQuote = true;
      const before = JSON.parse(JSON.stringify({ services: item.services, clients: item.clients, visibility: item.visibility }));
      const edited = await call(controller.updatePackage, admin, { description: `${item.description}\nVerified: configuration, visibility, edit preservation and checkout quote.` }, { id: row.id });
      assert.equal(edited.statusCode, 200, edited.body.message);
      assert.deepEqual(JSON.parse(JSON.stringify({ services: edited.body.package.services, clients: edited.body.package.clients, visibility: edited.body.package.visibility })), before);
      row.checks.editPreservation = true;
      if (item.visibility === "selected") {
        const off = await call(controller.updatePackage, admin, { isActive: false }, { id: row.id }); assert.equal(off.statusCode, 200);
        assert.equal((await call(controller.getClientPackage, actor, {}, { id: row.id })).statusCode, 404);
        assert.equal((await call(orders.getOrderQuote, actor, checkout)).statusCode, 400);
        row.checks.deactivationBlocksCheckout = true;
        const on = await call(controller.updatePackage, admin, { isActive: true }, { id: row.id }); assert.equal(on.statusCode, 200, on.body.message);
        assert.equal((await call(controller.getClientPackage, actor, {}, { id: row.id })).statusCode, 200);
      }
      row.isActive = (await Package.findById(row.id)).isActive;
      console.log(JSON.stringify({ name, id: row.id, price: row.price, visibility: row.visibility, active: row.isActive, verified: true }));
    }
    const listed = await call(controller.listAdminPackages, admin);
    assert.equal(listed.statusCode, 200);
    assert.ok(report.packages.every((row) => listed.body.packages.some((item) => String(item._id) === row.id)));
    report.adminListingVerified = true;
  } finally {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, JSON.stringify(report, null, 2));
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
