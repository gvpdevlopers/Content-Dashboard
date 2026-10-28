const { createHash } = require("node:crypto");
const { isDeepStrictEqual } = require("node:util");
const { ObjectId } = require("mongoose").mongo;
const { buildServiceAccessPreview } = require("./serviceAccessPreview");

const RECEIPTS = "_service_access_migrations";
const has = (value, key) => Object.hasOwn(value, key);
const fail = (message) => { throw Object.assign(new Error(message), { code: "SERVICE_ACCESS_MIGRATION_GUARD" }); };
const sameKeys = (value, keys) => value && typeof value === "object" &&
  !Array.isArray(value) && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort());
const defaultAccess = { mode: "groups", groups: ["content"], serviceIds: [] };

// Revalidate even a checksum-approved artifact: hashes are approvals, not a
// license to write arbitrary fields. Receipt rollback uses this same allowlist.
function validatePreview(preview, { database, approvedSha256 }) {
  if (!sameKeys(preview, ["version", "database", "counts", "changes", "issues", "sha256"]) ||
      preview.version !== 1 || preview.database !== database ||
      typeof database !== "string" || !database ||
      !/^[a-f0-9]{64}$/.test(approvedSha256 || "") || preview.sha256 !== approvedSha256) {
    fail("Preview identity, database or approved checksum does not match.");
  }
  const { sha256, ...plan } = preview;
  if (createHash("sha256").update(JSON.stringify(plan)).digest("hex") !== sha256) fail("Preview checksum is invalid.");
  if (!Array.isArray(preview.changes) || !Array.isArray(preview.issues) || preview.issues.length ||
      !sameKeys(preview.counts, ["servicesScanned", "clientsScanned", "servicesAffected", "clientsAffected", "groupDefaults", "publicVisibilityDefaults", "issues"]) ||
      Object.values(preview.counts).some((value) => !Number.isSafeInteger(value) || value < 0) || preview.counts.issues !== 0) {
    fail("Resolve preview issues and verify record counts before applying.");
  }
  const seen = new Set();
  for (const change of preview.changes) {
    if (!sameKeys(change, ["collection", "id", "set", "sourceGuards", "requireMissing", "rollbackUnset"]) ||
        !["services", "users"].includes(change.collection) || !/^[a-f0-9]{24}$/i.test(change.id || "")) fail("Invalid migration target.");
    const target = `${change.collection}:${change.id}`;
    if (seen.has(target)) fail("Duplicate migration target.");
    seen.add(target);
    const keys = Object.keys(change.set || {});
    if (!keys.length || !isDeepStrictEqual(change.requireMissing, keys) || !isDeepStrictEqual(change.rollbackUnset, keys)) fail("Invalid missing-field or rollback guards.");
    if (change.collection === "users") {
      if (!sameKeys(change.set, ["serviceAccess"]) || !isDeepStrictEqual(change.set.serviceAccess, defaultAccess) ||
          !sameKeys(change.sourceGuards, [])) fail("Only missing client Content defaults can be backfilled.");
    } else {
      if (keys.some((key) => !["serviceGroup", "isPublic"].includes(key)) ||
          (has(change.set, "serviceGroup") && change.set.serviceGroup !== "content") ||
          (has(change.set, "isPublic") && typeof change.set.isPublic !== "boolean")) fail("Invalid service backfill.");
      if (has(change.set, "isPublic")) {
        const guard = change.sourceGuards?.isActive;
        if (!sameKeys(change.sourceGuards, ["isActive"]) || !guard ||
            !(sameKeys(guard, ["exists"]) && guard.exists === false || sameKeys(guard, ["exists", "value"]) && guard.exists === true) ||
            change.set.isPublic !== (guard.exists && guard.value === true)) fail("Public visibility requires the original activation guard.");
      } else if (!sameKeys(change.sourceGuards, [])) fail("Unexpected source guards.");
    }
  }
  const count = (predicate) => preview.changes.filter(predicate).length;
  const expected = {
    servicesAffected: count((item) => item.collection === "services"),
    clientsAffected: count((item) => item.collection === "users"),
    groupDefaults: count((item) => has(item.set, "serviceGroup")),
    publicVisibilityDefaults: count((item) => has(item.set, "isPublic")),
  };
  if (Object.entries(expected).some(([key, value]) => preview.counts[key] !== value) ||
      expected.servicesAffected > preview.counts.servicesScanned || expected.clientsAffected > preview.counts.clientsScanned) fail("Affected counts do not match the approved changes.");
  return preview;
}

async function scan(db, session) {
  const services = await db.collection("services").find({}, { session,
    projection: { _id: 1, serviceGroup: 1, isPublic: 1, isActive: 1 } }).toArray();
  const clients = await db.collection("users").find({ role: "client" }, { session,
    projection: { _id: 1, role: 1, serviceAccess: 1 } }).toArray();
  const serviceCount = await db.collection("services").countDocuments({}, { session });
  const clientCount = await db.collection("users").countDocuments({ role: "client" }, { session });
  return buildServiceAccessPreview({ database: db.databaseName, services, clients, serviceCount, clientCount });
}

function sourceFilter(change) {
  const filter = { _id: new ObjectId(change.id) };
  if (change.collection === "users") filter.role = "client";
  for (const [key, guard] of Object.entries(change.sourceGuards)) {
    filter[key] = guard.exists ? { $exists: true, $eq: guard.value } : { $exists: false };
  }
  return filter;
}

function validateReceipt(receipt, database, approvedSha256) {
  if (receipt?.kind !== "service-access-v1" || receipt._id !== approvedSha256 ||
      receipt.database !== database || !["applied", "rolled_back"].includes(receipt.state)) fail("Migration receipt is missing or invalid.");
  validatePreview(receipt.preview, { database, approvedSha256 });
  const counts = { services: receipt.preview.counts.servicesAffected, clients: receipt.preview.counts.clientsAffected };
  if (!isDeepStrictEqual(receipt.appliedCounts, counts) ||
      (receipt.state === "rolled_back" && !isDeepStrictEqual(receipt.rolledBackCounts, counts))) fail("Receipt affected counts do not match its approved plan.");
}

// Full-document reads are compared only in memory. Receipts never contain
// credentials or original documents. Native $set/$unset bypass Mongoose defaults,
// timestamps and hooks; no historical collections are read or written.
async function changeRecord(db, session, change, direction) {
  const collection = db.collection(change.collection);
  const filter = sourceFilter(change);
  const before = await collection.findOne(filter, { session });
  if (!before) fail("A target record or its source guard changed; no migration was committed.");
  const expected = { ...before };
  for (const [key, value] of Object.entries(change.set)) {
    if (direction === "apply") {
      if (has(before, key)) fail("A migration field is no longer missing. Generate a fresh preview.");
      filter[key] = { $exists: false };
      expected[key] = value;
    } else {
      if (!has(before, key) || !isDeepStrictEqual(before[key], value)) fail("A migrated field was edited. Rollback requires review; no changes were committed.");
      filter[key] = { $exists: true, $eq: value };
      delete expected[key];
    }
  }
  const update = direction === "apply" ? { $set: change.set } :
    { $unset: Object.fromEntries(change.rollbackUnset.map((key) => [key, ""])) };
  const result = await collection.updateOne(filter, update, { session });
  if (result.matchedCount !== 1 || result.modifiedCount !== 1) fail("A guarded record update failed; no migration was committed.");
  const after = await collection.findOne({ _id: before._id }, { session });
  if (!isDeepStrictEqual(after, expected)) fail("Protected document fields changed; no migration was committed.");
}

async function runServiceAccessMigration({ db, startSession, mode, preview, approvedSha256, environment, backupReference }) {
  if (!["apply", "rollback"].includes(mode) || !["staging", "production"].includes(environment) ||
      !/^[a-zA-Z0-9_.:-]{1,120}$/.test(backupReference || "") || !/^[a-f0-9]{64}$/.test(approvedSha256 || "")) fail("An explicit mode, environment, backup reference and approved hash are required.");
  const database = db.databaseName;
  if (mode === "apply") validatePreview(preview, { database, approvedSha256 });
  const session = await startSession();
  let outcome;
  try {
    await session.withTransaction(async () => {
      const receipts = db.collection(RECEIPTS);
      const existing = await receipts.findOne({ _id: approvedSha256 }, { session });
      if (existing) {
        validateReceipt(existing, database, approvedSha256);
        if (existing.environment !== environment) fail("Receipt environment does not match.");
      }
      if (mode === "apply") {
        if (existing?.state === "applied") { outcome = { receipt: existing, noOp: true }; return; }
        if (existing) fail("This migration was rolled back. Reapplying this receipt requires a new reviewed rollout.");
        const current = await scan(db, session);
        if (current.sha256 !== approvedSha256) fail("Counts, assignments or source guards changed since preview. Generate and review a fresh preview.");
        for (const change of preview.changes) await changeRecord(db, session, change, "apply");
        const receipt = { _id: approvedSha256, kind: "service-access-v1", database, environment,
          state: "applied", appliedAt: new Date(), backupReference, preview,
          appliedCounts: { services: preview.counts.servicesAffected, clients: preview.counts.clientsAffected } };
        await receipts.insertOne(receipt, { session });
        outcome = { receipt, noOp: false };
      } else {
        if (!existing) fail("No committed receipt was found for rollback.");
        if (existing.state === "rolled_back") { outcome = { receipt: existing, noOp: true }; return; }
        for (const change of existing.preview.changes) await changeRecord(db, session, change, "rollback");
        const rollback = { state: "rolled_back", rolledBackAt: new Date(), rollbackBackupReference: backupReference,
          rolledBackCounts: existing.appliedCounts };
        const result = await receipts.updateOne({ _id: approvedSha256, state: "applied" }, { $set: rollback }, { session });
        if (result.modifiedCount !== 1) fail("Receipt changed during rollback; no changes were committed.");
        outcome = { receipt: { ...existing, ...rollback }, noOp: false };
      }
    }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" }, readPreference: "primary" });
    return outcome;
  } finally { await session.endSession(); }
}

module.exports = { RECEIPTS, validatePreview, runServiceAccessMigration };
