const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const Service = require("../models/Service");
const templates = require("../data/serviceTemplates.json");
const { canClientOrderService, isServicePublic } = require("../utils/serviceAccess");
const load = (file, mocks = {}) => {
  const filename = path.resolve(__dirname, "..", file);
  const module = { exports: {} }, localRequire = createRequire(filename);
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, "utf8")}\n})`, { filename })(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : localRequire(id), module, module.exports);
  return module.exports;
};
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("all starters are schema-valid, unique and unavailable for marketing or ordering until reviewed", async () => {
  assert.equal(templates.length, 11);
  assert.equal(new Set(templates.map((item) => item.slug)).size, templates.length);
  assert.deepEqual([...new Set(templates.map((item) => item.serviceGroup))].sort(), ["development", "seo"]);
  for (const template of templates) {
    const document = new Service(template);
    await document.validate();
    assert.equal(template.isActive, false);
    assert.equal(template.isPublic, false);
    assert.equal(isServicePublic(document), false);
    assert.equal(canClientOrderService({ role: "client", serviceAccess: { mode: "groups", groups: [template.serviceGroup] } }, document), false);
    assert.match(template.description, /sample scope and pricing/);
    assert.equal(new Set(template.fields.map((field) => field.name)).size, template.fields.length);
  }
});

test("every starter passes actual admin create validation without overwriting existing services", async () => {
  let creates = 0;
  const controller = load("controllers/serviceController.js", { "../models/Service": {
    findOne: async () => null,
    create: async (data) => { creates++; return new Service(data); },
  } });
  for (const template of templates) {
    const res = response(); await controller.createService({ body: structuredClone(template) }, res);
    assert.equal(res.statusCode, 201, `${template.name}: ${res.body.message}`);
    assert.equal(res.body.service.isActive, false); assert.equal(res.body.service.isPublic, false);
    assert.equal(res.body.service.basePrice, template.basePrice);
    assert.equal(res.body.service.fields.length, template.fields.length);
  }
  assert.equal(creates, templates.length);
  const duplicate = load("controllers/serviceController.js", { "../models/Service": {
    findOne: async () => ({ slug: templates[0].slug }), create: async () => assert.fail("Must not overwrite or create a duplicate"),
  } });
  const res = response(); await duplicate.createService({ body: templates[0] }, res);
  assert.equal(res.statusCode, 409);
});

test("starter endpoint is admin-only and is registered before the service ID route", () => {
  const routes = [];
  const router = { get: (...args) => routes.push(args), post() {}, patch() {} };
  const protect = () => {}, admin = () => {};
  load("routes/serviceRoutes.js", { express: { Router: () => router }, "../middleware/auth": protect, "../middleware/admin": admin });
  const templateRoute = routes.find((route) => route[0] === "/admin/templates");
  assert.equal(templateRoute[1], protect); assert.equal(templateRoute[2], admin);
  assert.ok(routes.indexOf(templateRoute) < routes.findIndex((route) => route[0] === "/admin/:id"));
  const controller = load("controllers/serviceController.js");
  const res = response(); controller.getServiceTemplates({}, res);
  assert.equal(res.body.templates.length, templates.length);
});

test("activated starters use existing server pricing and enforce their required brief and quantity limits", async () => {
  for (const template of templates) {
    const document = new Service({ ...template, isActive: true });
    const controller = load("controllers/orderController.js", {
      "../models/Service": { findOne: async () => document },
      "../utils/adCredit": { quoteCredit: async ({ subtotal, gstRate }) => ({ total: 0, requested: {}, totals: {
        subtotal, gstRate, gstAmount: subtotal * gstRate / 100, amount: subtotal * (1 + gstRate / 100),
      } }) },
    });
    const formData = Object.fromEntries(template.fields.map((field) => [field.name,
      field.type === "url" ? "https://example.com" : field.type === "number" ? 5 : field.type === "select" ? field.options[0].value : "Sample project details"]));
    const quantity = template.pricingType === "per_unit" ? 3 : 1;
    const req = { user: { _id: "123456789012345678901234", role: "client", serviceAccess: { mode: "groups", groups: [template.serviceGroup] } },
      body: { paymentMethod: "cod", services: [{ serviceId: String(document._id), quantity, formData }] } };
    const res = response(); await controller.getOrderQuote(req, res);
    assert.equal(res.statusCode, 200, `${template.name}: ${res.body.message}`);
    assert.equal(res.body.quote.originalSubtotal, template.basePrice * quantity);
    const firstRequired = template.fields.find((field) => field.required);
    const requiredValue = formData[firstRequired.name];
    delete formData[firstRequired.name];
    const invalid = response(); await controller.getOrderQuote(req, invalid);
    assert.equal(invalid.statusCode, 400, template.name);
    formData[firstRequired.name] = requiredValue;
    req.body.services[0].quantity = template.maxQuantity + 1;
    const overLimit = response(); await controller.getOrderQuote(req, overLimit);
    assert.equal(overLimit.statusCode, 400);
  }
});

test("clearing a service quantity cap preserves its price and configuration", async () => {
  const service = new Service({ ...templates[0], maxQuantity: 12 });
  const before = service.toObject();
  service.save = async () => { await service.validate(); return service; };
  const controller = load("controllers/serviceController.js", { "../models/Service": { findById: async () => service } });
  const res = response(); await controller.updateService({ params: { id: String(service._id) }, body: { maxQuantity: null } }, res);
  assert.equal(res.statusCode, 200, res.body.message); assert.equal(service.maxQuantity, undefined);
  delete before.maxQuantity; assert.deepEqual(service.toObject(), before);
});
