const test = require("node:test");
const assert = require("node:assert/strict");
const { canClientOrderService, getClientServiceAccess, getServiceGroup, isServicePublic, publicServiceFilter } = require("../utils/serviceAccess");
const { buildServiceAccessPreview } = require("../utils/serviceAccessPreview");
const first = "123456789012345678901234";
const second = "123456789012345678901235";

test("public controller uses marketing visibility while client catalogue still requires activation", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const vm = require("node:vm");
  const { createRequire } = require("node:module");
  const filename = path.resolve(__dirname, "../controllers/serviceController.js");
  const localRequire = createRequire(filename);
  const queries = [];
  const mockService = { find: (filter, projection) => {
    queries.push({ filter, projection });
    return { sort: async () => [] };
  } };
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, "utf8")}\n})`, { filename })(
    (id) => id === "../models/Service" ? mockService : localRequire(id), module, module.exports,
  );
  const res = { status() { return this; }, json(body) { assert.equal(body.success, true); return this; } };
  await module.exports.getPublicServices({}, res);
  await module.exports.getActiveServices({}, res);
  assert.deepEqual(queries[0].filter, publicServiceFilter());
  assert.equal(queries[0].projection.serviceGroup, 1);
  assert.deepEqual(queries[1].filter, { isActive: true });
});

test("legacy users and services retain Content defaults without modifying input records", () => {
  const user = { role: "client" };
  const service = { _id: first, isActive: true, basePrice: 1200 };
  assert.equal(getServiceGroup(service), "content");
  assert.deepEqual(getClientServiceAccess(user), { mode: "groups", groups: ["content"], serviceIds: [] });
  assert.equal(canClientOrderService(user, service), true);
  assert.equal(canClientOrderService(user, { ...service, serviceGroup: "seo" }), false);
  assert.deepEqual(user, { role: "client" });
  assert.deepEqual(service, { _id: first, isActive: true, basePrice: 1200 });
});

test("group access includes new group services; selected access never inherits group access", () => {
  const user = { role: "client", serviceAccess: { mode: "groups", groups: ["seo", "development"] } };
  assert.equal(canClientOrderService(user, { _id: first, isActive: true, serviceGroup: "seo" }), true);
  assert.equal(canClientOrderService(user, { _id: second, isActive: true, serviceGroup: "development" }), true);
  user.serviceAccess = { mode: "selected", groups: ["seo"], serviceIds: [first] };
  assert.equal(canClientOrderService(user, { _id: first, isActive: true, serviceGroup: "seo" }), true);
  assert.equal(canClientOrderService(user, { _id: second, isActive: true, serviceGroup: "seo" }), false);
  assert.equal(canClientOrderService(user, { _id: first, isActive: false, serviceGroup: "seo" }), false);
  assert.deepEqual(user.serviceAccess.serviceIds, [first]);
});

test("invalid explicit settings and non-client/inactive accounts cannot authorize orders", () => {
  const service = { _id: first, isActive: true };
  for (const serviceAccess of [null, {}, { mode: "unknown" }, { mode: "groups", groups: "content" }, { mode: "selected", serviceIds: [] }]) {
    assert.equal(canClientOrderService({ role: "client", serviceAccess }, service), false);
  }
  for (const user of [null, { role: "employee" }, { role: "admin" }, { role: "client", isActive: false }]) assert.equal(canClientOrderService(user, service), false);
  assert.equal(canClientOrderService({ role: "client" }, { ...service, serviceGroup: null }), false);
});

test("public marketing and active authorized ordering are independent", () => {
  const user = { role: "client" };
  const marketed = { _id: first, serviceGroup: "seo", isPublic: true, isActive: false };
  assert.equal(isServicePublic(marketed), true);
  assert.equal(canClientOrderService(user, marketed), false);
  const privateService = { _id: first, isPublic: false, isActive: true };
  assert.equal(isServicePublic(privateService), false);
  assert.equal(canClientOrderService(user, privateService), true);
  assert.equal(isServicePublic({ isActive: true }), true);
  assert.equal(isServicePublic({ isActive: false }), false);
  assert.deepEqual(publicServiceFilter(), { $or: [{ isPublic: true }, { isPublic: { $exists: false }, isActive: true }] });
});

test("Mongoose defaults preserve Content and legacy public visibility without changing service prices", async () => {
  const User = require("../models/User");
  const Service = require("../models/Service");
  const client = new User({ role: "client" });
  assert.deepEqual(client.serviceAccess.toObject(), { mode: "groups", groups: ["content"], serviceIds: [] });
  const selected = new User({ serviceAccess: { mode: "selected", serviceIds: [first] } });
  assert.equal(String(selected.serviceAccess.serviceIds[0]), first);
  assert.deepEqual(selected.serviceAccess.groups, []);
  for (const isActive of [true, false]) {
    const service = new Service({ name: "Existing service", slug: "existing", category: "Social", basePrice: 1234, isActive });
    assert.equal(service.serviceGroup, "content");
    assert.equal(service.isPublic, isActive);
    assert.equal(service.basePrice, 1234);
  }
  assert.equal(new Service({ isActive: false, isPublic: true }).isPublic, true);
  await assert.rejects(new Service({ serviceGroup: "invalid" }).validate(), (error) => Boolean(error.errors.serviceGroup));
});

test("preview changes only missing fields, keeps inactive assignments and is idempotent", () => {
  const services = [{ _id: first, isActive: true, basePrice: 100 }, { _id: second, serviceGroup: "seo", isActive: false, isPublic: true }];
  const clients = [{ _id: first, role: "client" }, { _id: second, role: "client", serviceAccess: { mode: "selected", groups: [], serviceIds: [second] } }];
  const original = JSON.stringify({ services, clients });
  const input = { services, clients, database: "staging", serviceCount: 2, clientCount: 2 };
  const preview = buildServiceAccessPreview(input);
  assert.equal(preview.counts.servicesAffected, 1);
  assert.equal(preview.counts.clientsAffected, 1);
  assert.equal(preview.issues.length, 0);
  assert.deepEqual(preview.changes.find((change) => change.collection === "services").sourceGuards, { isActive: { exists: true, value: true } });
  assert.equal(JSON.stringify({ services, clients }), original);
  for (const change of preview.changes) {
    const records = change.collection === "services" ? services : clients;
    const record = records.find((entry) => entry._id === change.id);
    assert.deepEqual(change.requireMissing, change.rollbackUnset);
    for (const field of change.requireMissing) assert.equal(Object.hasOwn(record, field), false);
    Object.assign(record, change.set);
  }
  assert.equal(buildServiceAccessPreview(input).changes.length, 0);
  assert.equal(services[0].basePrice, 100);
  assert.equal(services[1].isPublic, true);
  assert.deepEqual(clients[1].serviceAccess.serviceIds, [second]);
});

test("preview checks raw counts, flags invalid records and never overwrites explicit fields", () => {
  assert.throws(() => buildServiceAccessPreview({ services: [], clients: [], serviceCount: 1, clientCount: 0 }), /counts changed/);
  const preview = buildServiceAccessPreview({ database: "staging", services: [{ _id: first, serviceGroup: null, isPublic: null }], clients: [{ _id: second, role: "client", serviceAccess: null }], serviceCount: 1, clientCount: 1 });
  assert.equal(preview.issues.length, 3);
  assert.equal(preview.changes.length, 0);
  assert.equal(preview.sha256.length, 64);
});
const loadAccessModule = (file, mocks = {}) => {
  const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
  const filename = path.resolve(__dirname, "..", file);
  const module = { exports: {} }, localRequire = require("node:module").createRequire(filename);
  vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, "utf8")}\n})`, { filename })(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : localRequire(id), module, module.exports);
  return module.exports;
};
const accessResponse = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("client catalogue/detail enforce grants while staff catalogue remains available", async () => {
  const records = [{ _id: first, name: "Content", isActive: true, fields: [], pricingOptions: [] },
    { _id: second, name: "SEO", serviceGroup: "seo", isActive: true, fields: [], pricingOptions: [] }];
  const controller = loadAccessModule("controllers/serviceController.js", { "../models/Service": {
    find: () => ({ sort: async () => records }), findOne: async () => records[1],
  } });
  const listed = accessResponse(); await controller.getActiveServices({ user: { role: "client" } }, listed);
  assert.deepEqual(listed.body.services.map((service) => service.name), ["Content"]);
  const detail = accessResponse(); await controller.getServiceById({ user: { role: "client" }, params: { id: second } }, detail);
  assert.equal(detail.statusCode, 404);
  const staff = accessResponse(); await controller.getActiveServices({ user: { role: "employee" } }, staff);
  assert.equal(staff.body.services.length, 2);
});

test("authentication ignores stale token grants and reloads database access", async () => {
  const access = { mode: "groups", groups: [], serviceIds: [] };
  const protect = loadAccessModule("middleware/auth.js", {
    jsonwebtoken: { verify: () => ({ userId: first, serviceAccess: { mode: "groups", groups: ["content"] } }) },
    "../models/User": { findById: () => ({ select: async (fields) => {
      assert.match(fields, /serviceAccess/);
      return { _id: first, role: "client", isActive: true, serviceAccess: access };
    } }) },
  });
  const req = { headers: { authorization: "Bearer test" } };
  let next = false; await protect(req, accessResponse(), () => { next = true; });
  assert.equal(next, true); assert.deepEqual(req.user.serviceAccess, access);
});

test("draft writes reject restricted services; existing drafts retain all items and named issues", async () => {
  let writes = 0;
  const saved = { services: [{ serviceId: second, quantity: 1, formData: {} }] };
  const controller = loadAccessModule("controllers/draftController.js", {
    "../models/Service": { find: async () => [{ _id: second, name: "SEO audit", serviceGroup: "seo", isActive: true }] },
    "../models/OrderDraft": {
      create: async () => { writes++; }, findOneAndUpdate: async () => { writes++; }, findOne: async () => saved,
    },
  });
  const req = { user: { _id: first, role: "client" }, body: saved, params: { id: first } };
  for (const method of ["createDraft", "updateDraft"]) {
    const res = accessResponse(); await controller[method](req, res);
    assert.equal(res.statusCode, 400); assert.match(res.body.message, /SEO audit/);
  }
  assert.equal(writes, 0);
  const res = accessResponse(); await controller.getDraft(req, res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.draft, saved);
  assert.equal(res.body.accessIssues[0].name, "SEO audit"); assert.equal(saved.services.length, 1);
});

test("admin validation rejects ambiguous grants and retains explicitly selected inactive services", async () => {
  const { validateServiceAccess } = loadAccessModule("utils/validateServiceAccess.js", {
    "../models/Service": { countDocuments: async () => 1 },
  });
  assert.deepEqual(await validateServiceAccess({ mode: "selected", groups: [], serviceIds: [first, first] }),
    { mode: "selected", groups: [], serviceIds: [first] });
  for (const access of [null, {}, { mode: "groups", groups: ["other"], serviceIds: [] },
    { mode: "selected", groups: ["content"], serviceIds: [first] },
    { mode: "groups", groups: ["content"], serviceIds: [first] }]) {
    await assert.rejects(validateServiceAccess(access), (error) => error.statusCode === 400);
  }
});
test("only admins can update client grants and writes are limited to serviceAccess", async () => {
  let writes = 0;
  const access = { mode: "groups", groups: ["seo", "development"], serviceIds: [] };
  const controller = loadAccessModule("controllers/adminUserController.js", {
    "../models/User": { findOneAndUpdate: (filter, update, options) => {
      writes++; assert.deepEqual(filter, { _id: first, role: "client" });
      assert.deepEqual(update, { $set: { serviceAccess: access } });
      assert.equal(options.runValidators, true);
      return { select: async () => ({ _id: first, role: "client", serviceAccess: access }) };
    } },
  });
  for (const role of ["client", "employee"]) {
    const res = accessResponse(); await controller.updateServiceAccess({ user: { role }, body: { serviceAccess: access }, params: { id: first } }, res);
    assert.equal(res.statusCode, 403);
  }
  assert.equal(writes, 0);
  const res = accessResponse(); await controller.updateServiceAccess({ user: { role: "admin" }, body: { serviceAccess: access }, params: { id: first } }, res);
  assert.equal(res.statusCode, 200); assert.equal(writes, 1);
});

test("draft duplicate checks canonicalize ObjectId casing before any service reads or writes", async () => {
  const value = "abcdef123456789012345678";
  const controller = loadAccessModule("controllers/draftController.js", {
    "../models/Service": { find: async () => assert.fail("Duplicate input must be rejected before lookup") },
    "../models/OrderDraft": { create: async () => assert.fail("Duplicate draft must not be saved") },
  });
  const res = accessResponse();
  await controller.createDraft({ user: { _id: first, role: "client" }, body: { services: [value, value.toUpperCase()].map((serviceId) => ({ serviceId, quantity: 1 })) } }, res);
  assert.equal(res.statusCode, 400); assert.match(res.body.message, /only be included once/);
});

test("custom assignments deduplicate mixed-case IDs without treating an existing service as missing", async () => {
  const value = "abcdef123456789012345678";
  const { validateServiceAccess } = loadAccessModule("utils/validateServiceAccess.js", {
    "../models/Service": { countDocuments: async (filter) => {
      assert.deepEqual(filter, { _id: { $in: [value] } }); return 1;
    } },
  });
  assert.deepEqual(await validateServiceAccess({ mode: "selected", groups: [], serviceIds: [value, value.toUpperCase()] }),
    { mode: "selected", groups: [], serviceIds: [value] });
});
