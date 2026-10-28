const { createHash } = require("node:crypto");
const { SERVICE_GROUPS } = require("./serviceAccess");
const has = (record, field) => Object.prototype.hasOwnProperty.call(record, field);

function buildServiceAccessPreview({ services, clients, database, serviceCount, clientCount }) {
  if (services.length !== serviceCount || clients.length !== clientCount) {
    throw new Error("Record counts changed during preview. Generate a fresh preview.");
  }
  const changes = [];
  const issues = [];
  const add = (collection, record, values) => {
    if (!Object.keys(values).length) return;
    const sourceGuards = collection === "services" && has(values, "isPublic")
      ? { isActive: has(record, "isActive") ? { exists: true, value: record.isActive } : { exists: false } }
      : {};
    changes.push({ collection, id: String(record._id), set: values, sourceGuards,
      requireMissing: Object.keys(values), rollbackUnset: Object.keys(values) });
  };
  for (const service of services) {
    const values = {};
    if (!has(service, "serviceGroup")) values.serviceGroup = "content";
    else if (!SERVICE_GROUPS.includes(service.serviceGroup)) issues.push({ collection: "services", id: String(service._id), field: "serviceGroup" });
    if (!has(service, "isPublic")) values.isPublic = service.isActive === true;
    else if (typeof service.isPublic !== "boolean") issues.push({ collection: "services", id: String(service._id), field: "isPublic" });
    add("services", service, values);
  }
  for (const user of clients) {
    if (user.role !== "client") throw new Error("Preview must contain client accounts only.");
    if (!has(user, "serviceAccess")) {
      add("users", user, { serviceAccess: { mode: "groups", groups: ["content"], serviceIds: [] } });
    } else {
      const access = user.serviceAccess;
      const valid = access && ["groups", "selected"].includes(access.mode) &&
        Array.isArray(access.groups) && access.groups.every((group) => SERVICE_GROUPS.includes(group)) &&
        Array.isArray(access.serviceIds) && access.serviceIds.every((id) => /^[a-f\d]{24}$/i.test(String(id)));
      if (!valid) issues.push({ collection: "users", id: String(user._id), field: "serviceAccess" });
    }
  }
  changes.sort((left, right) => `${left.collection}:${left.id}`.localeCompare(`${right.collection}:${right.id}`));
  const counts = {
    servicesScanned: serviceCount, clientsScanned: clientCount,
    servicesAffected: changes.filter((change) => change.collection === "services").length,
    clientsAffected: changes.filter((change) => change.collection === "users").length,
    groupDefaults: changes.filter((change) => has(change.set, "serviceGroup")).length,
    publicVisibilityDefaults: changes.filter((change) => has(change.set, "isPublic")).length,
    issues: issues.length,
  };
  const plan = { version: 1, database, counts, changes, issues };
  return { ...plan, sha256: createHash("sha256").update(JSON.stringify(plan)).digest("hex") };
}

module.exports = { buildServiceAccessPreview };
