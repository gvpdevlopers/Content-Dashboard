const test = require("node:test");
const assert = require("node:assert/strict");
const { packageServices, canView } = require("../controllers/packageController");

const id = "123456789012345678901234";

test("package configuration normalizes valid service entries and rejects duplicates", () => {
  const entries = packageServices([{ serviceId: id, quantity: 2, formData: { brief: "test" } }]);
  assert.equal(entries[0].service, id);
  assert.equal(entries[0].quantity, 2);
  assert.deepEqual(entries[0].formData, { brief: "test" });
  assert.throws(() => packageServices([{ serviceId: id }, { serviceId: id }]), /cannot appear twice/);
});

test("package visibility requires active clients and access to every included service", () => {
  const user = { _id: id, role: "client", isActive: true, serviceAccess: { mode: "groups", groups: ["content"], serviceIds: [] } };
  const packageItem = { isActive: true, visibility: "selected", clients: [id], services: [{ serviceSnapshot: { _id: id, isActive: true, serviceGroup: "content" } }] };
  assert.equal(canView(user, packageItem), true);
  assert.equal(canView({ ...user, _id: "123456789012345678901235" }, packageItem), false);
  assert.equal(canView(user, { ...packageItem, services: [{ serviceSnapshot: { _id: id, isActive: true, serviceGroup: "seo" } }] }), false);
});
