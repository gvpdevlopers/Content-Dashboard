const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const services = require("../utils/initialSeoDevelopmentServices");
const Service = require("../models/Service");
const { validateTarget } = require("../scripts/seedSeoDevelopmentServices");
function controller(file, mock) {
  const filename = path.resolve(__dirname, "..", file), localRequire = createRequire(filename), module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, "utf8")}\n})`, { filename })(
    (id) => id === "../models/Service" ? mock : localRequire(id), module, module.exports);
  return module.exports;
}
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
test("seed refuses remote, production, ambiguous and mismatched database targets", () => {
  assert.equal(validateTarget("mongodb://127.0.0.1:27017/glow_dev", "glow_dev", "development"), "glow_dev");
  assert.equal(validateTarget("mongodb+srv://example.com/?appName=Cluster0", "test", "development", true), "test");
  assert.throws(() => validateTarget("mongodb+srv://example.com/test", "test", "production", true));
  assert.throws(() => validateTarget("mongodb+srv://example.com/test", "test", undefined, true));
  assert.throws(() => validateTarget("mongodb+srv://example.com/test", "other_dev", "development", true));
  for (const [uri, db, env] of [
    ["mongodb+srv://example.com/glow_dev", "glow_dev"], ["mongodb://example.com/glow_dev", "glow_dev"],
    ["mongodb://127.0.0.1/glow", "glow"], ["mongodb://127.0.0.1/glow_dev", "other_dev"],
    ["mongodb://127.0.0.1/prod_dev", "prod_dev"], ["mongodb://127.0.0.1/glow_dev", "glow_dev", "production"],
    [undefined, "glow_dev"],
  ]) assert.throws(() => validateTarget(uri, db, env));
});
test("all ten seed records satisfy the schema and actual admin creation validation", async () => {
  assert.equal(services.length, 10);
  assert.equal(new Set(services.map((item) => item.slug)).size, 10);
  const admin = controller("controllers/serviceController.js", { findOne: async () => null, create: async (data) => new Service(data) });
  for (const service of services) {
    await new Service(service).validate();
    assert.equal(service.basePrice, 0); assert.equal(service.isActive, false); assert.equal(service.isPublic, false);
    const res = response(); await admin.createService({ body: service }, res);
    assert.equal(res.statusCode, 201, `${service.slug}: ${res.body?.message}`);
  }
});
test("inactive seed records are excluded by catalogue and rejected by quote and order submission", async () => {
  const user = { _id: "123456789012345678901234", role: "client", serviceAccess: { mode: "groups", groups: ["seo", "development"] } };
  const catalogue = controller("controllers/serviceController.js", { find: (query) => ({ sort: async () => services.filter((row) => row.isActive === query.isActive) }) });
  const list = response(); await catalogue.getActiveServices({ user }, list);
  assert.deepEqual(list.body.services, []);
  for (const input of services) {
    const document = new Service(input);
    const orders = controller("controllers/orderController.js", { findOne: async () => document });
    for (const action of ["getOrderQuote", "createOrder"]) {
      const res = response();
      await orders[action]({ user, get: () => undefined, body: { paymentMethod: "cod", services: [{ serviceId: String(document._id), quantity: 1, formData: {} }] } }, res);
      assert.equal(res.statusCode, 400, `${action}: ${res.body?.message}`);
      assert.match(res.body.message, /not available for your account/);
    }
  }
});
