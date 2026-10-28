const { normalizeServiceId } = require("./serviceIdentity");
const Service = require("../models/Service");
const { SERVICE_GROUPS } = require("./serviceAccess");

const invalid = (message) => Object.assign(new Error(message), { statusCode: 400 });

// Inactive services remain assignable, but the ordering policy rejects them.
const validateServiceAccess = async (access) => {
  if (!access || !["groups", "selected"].includes(access.mode) ||
      !Array.isArray(access.groups) || !Array.isArray(access.serviceIds)) {
    throw invalid("Choose group access or explicitly selected services.");
  }
  if (access.mode === "groups") {
    if (access.serviceIds.length || access.groups.some((group) => !SERVICE_GROUPS.includes(group))) {
      throw invalid("Group access must contain valid groups and no individual services.");
    }
    return { mode: "groups", groups: [...new Set(access.groups)], serviceIds: [] };
  }
  if (access.groups.length || access.serviceIds.length > 500 ||
      access.serviceIds.some((id) => !normalizeServiceId(id))) {
    throw invalid("Custom access must contain only valid selected service IDs.");
  }
  const serviceIds = [...new Set(access.serviceIds.map(normalizeServiceId))];
  const count = await Service.countDocuments({ _id: { $in: serviceIds } });
  if (count !== serviceIds.length) throw invalid("One or more assigned services no longer exist. Review the selection.");
  return { mode: "selected", groups: [], serviceIds };
};
module.exports = { validateServiceAccess };
