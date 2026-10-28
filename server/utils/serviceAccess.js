const SERVICE_GROUPS = Object.freeze(["content", "seo", "development"]);

const getServiceGroup = (service) => service?.serviceGroup === undefined ? "content" : service.serviceGroup;
const getClientServiceAccess = (user) => user?.serviceAccess === undefined
  ? { mode: "groups", groups: ["content"], serviceIds: [] }
  : user.serviceAccess;

// Shared by catalogue, quotes, checkout and draft validation.
const canClientOrderService = (user, service) => {
  if (user?.role !== "client" || user.isActive === false || service?.isActive !== true) return false;
  const group = getServiceGroup(service);
  if (!SERVICE_GROUPS.includes(group)) return false;
  const access = getClientServiceAccess(user);
  if (access?.mode === "groups") return Array.isArray(access.groups) && access.groups.includes(group);
  if (access?.mode === "selected") {
    return Boolean(service._id) && Array.isArray(access.serviceIds) &&
      access.serviceIds.some((id) => String(id) === String(service._id));
  }
  return false;
};

// Marketing visibility never grants ordering permission. Missing legacy values
// retain the old public visibility until explicitly backfilled/configured.
const isServicePublic = (service) => service?.isPublic === undefined
  ? service?.isActive === true : service.isPublic === true;
const publicServiceFilter = () => ({ $or: [
  { isPublic: true },
  { isPublic: { $exists: false }, isActive: true },
] });

module.exports = { SERVICE_GROUPS, getServiceGroup, getClientServiceAccess, canClientOrderService, isServicePublic, publicServiceFilter };
