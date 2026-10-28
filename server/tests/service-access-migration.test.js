const test = require("node:test");
const assert = require("node:assert/strict");
const { isDeepStrictEqual } = require("node:util");
const { createHash } = require("node:crypto");
const { ObjectId, BSON } = require("mongoose").mongo;
const { buildServiceAccessPreview } = require("../utils/serviceAccessPreview");
const { RECEIPTS, validatePreview, runServiceAccessMigration } = require("../utils/serviceAccessMigration");
const { parseOptions } = require("../scripts/migrateServiceAccess");
const copy = (value) => BSON.deserialize(BSON.serialize({ value })).value;
const id = (number) => new ObjectId(String(number).padStart(24, "0"));
const stamp = new Date("2026-01-01T00:00:00Z");
const hash = (preview) => {
  const { sha256: _hash, ...plan } = preview;
  return { ...plan, sha256: createHash("sha256").update(JSON.stringify(plan)).digest("hex") };
};
function matches(record, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === "object" && !(value instanceof ObjectId) && ("$exists" in value || "$eq" in value)) {
      return (!("$exists" in value) || Object.hasOwn(record, key) === value.$exists) &&
        (!("$eq" in value) || isDeepStrictEqual(record[key], value.$eq));
    }
    return isDeepStrictEqual(record[key], value);
  });
}
function fixture() {
  let state = {
    services: [
      { _id: id(1), name: "Content", isActive: true, basePrice: 999, fields: [{ name: "brief" }], updatedAt: stamp },
      { _id: id(2), name: "Inactive Content", isActive: false, serviceGroup: "content", basePrice: 100, updatedAt: stamp },
      { _id: id(3), name: "SEO", serviceGroup: "seo", isPublic: true, isActive: false, basePrice: 500 },
      { _id: id(4), name: "Legacy activation absent", basePrice: 10 },
    ],
    users: [
      { _id: id(11), role: "client", name: "Legacy client", password: "protected-hash", updatedAt: stamp },
      { _id: id(12), role: "client", serviceAccess: { mode: "selected", groups: [], serviceIds: [id(3)] } },
      { _id: id(13), role: "employee", password: "employee-hash" },
    ],
    orders: [{ _id: id(20), amount: 999, invoice: "old.pdf", paymentStatus: "Paid" }],
    orderdrafts: [{ _id: id(21), services: [{ serviceId: id(1) }] }],
    payments: [{ _id: id(22), amount: 999 }],
    [RECEIPTS]: [],
  };
  const events = [], hooks = {};
  let ended = 0;
  const session = { async withTransaction(callback, options) {
    assert.equal(options.readConcern.level, "snapshot"); assert.equal(options.writeConcern.w, "majority");
    const original = copy(state);
    try { await callback(); } catch (error) { state = original; throw error; }
  }, async endSession() { ended++; } };
  const db = { databaseName: "service_access_staging", collection(name) {
    assert.ok(Object.hasOwn(state, name), `Unexpected collection: ${name}`);
    return {
      find(filter, options) { assert.equal(options.session, session); return { toArray: async () => copy(state[name].filter((record) => matches(record, filter))) }; },
      async countDocuments(filter, options) { assert.equal(options.session, session); return state[name].filter((record) => matches(record, filter)).length; },
      async findOne(filter, options) { assert.equal(options.session, session); if (hooks.read) hooks.read(name, filter, state); return copy(state[name].find((record) => matches(record, filter)) || null); },
      async updateOne(filter, update, options) {
        assert.equal(options.session, session); events.push({ name, filter: copy(filter), update: copy(update) });
        if (hooks.update) hooks.update(name, filter, update, state);
        const record = state[name].find((row) => matches(row, filter));
        if (!record) return { matchedCount: 0, modifiedCount: 0 };
        if (update.$set) Object.assign(record, copy(update.$set));
        for (const key of Object.keys(update.$unset || {})) delete record[key];
        if (hooks.afterUpdate) hooks.afterUpdate(name, record);
        return { matchedCount: 1, modifiedCount: 1 };
      },
      async insertOne(record, options) {
        assert.equal(options.session, session);
        if (hooks.insert) hooks.insert(name);
        assert.equal(state[name].some((row) => isDeepStrictEqual(row._id, record._id)), false);
        state[name].push(copy(record));
      },
    };
  } };
  const preview = buildServiceAccessPreview({ database: db.databaseName, services: copy(state.services),
    clients: copy(state.users.filter((row) => row.role === "client")), serviceCount: state.services.length, clientCount: 2 });
  const run = (mode, extra = {}) => runServiceAccessMigration({ db, startSession: async () => session, mode,
    preview, approvedSha256: preview.sha256, environment: "staging", backupReference: "staging-restore-tested-001", ...extra });
  return { db, preview, run, hooks, events, state: () => state, ended: () => ended };
}

test("apply changes only missing fields, records counts, and preserves every protected value", async () => {
  const f = fixture(), before = copy(f.state());
  const result = await f.run("apply");
  assert.equal(result.noOp, false); assert.equal(result.receipt.state, "applied");
  assert.deepEqual(result.receipt.appliedCounts, { services: 3, clients: 1 });
  const after = copy(f.state()); delete after[RECEIPTS]; delete before[RECEIPTS];
  for (const change of f.preview.changes) {
    const record = before[change.collection].find((row) => String(row._id) === change.id);
    Object.assign(record, copy(change.set));
  }
  assert.deepEqual(after, before);
  assert.deepEqual(f.state().users[1].serviceAccess.serviceIds, [id(3)]);
  assert.equal(f.state().services[3].isPublic, false);
  assert.equal(f.ended(), 1);
  assert.ok(f.events.every((event) => ["users", "services"].includes(event.name)));
});

test("apply replay is a no-op, even when an admin has since changed a migrated value", async () => {
  const f = fixture(); await f.run("apply");
  f.state().services[0].serviceGroup = "development";
  const writes = f.events.length;
  const replay = await f.run("apply");
  assert.equal(replay.noOp, true); assert.equal(f.events.length, writes);
  assert.equal(f.state().services[0].serviceGroup, "development");
  assert.equal(f.state()[RECEIPTS].length, 1);
});

test("rollback removes only receipt-proven additions, preserves later unrelated edits and is repeatable", async () => {
  const f = fixture(), original = copy(f.state()); await f.run("apply");
  f.state().services[0].basePrice = 1234; original.services[0].basePrice = 1234;
  f.state().users[0].name = "Renamed client"; original.users[0].name = "Renamed client";
  const result = await f.run("rollback");
  assert.equal(result.receipt.state, "rolled_back");
  const actual = copy(f.state()); delete actual[RECEIPTS]; delete original[RECEIPTS];
  assert.deepEqual(actual, original);
  assert.deepEqual(result.receipt.rolledBackCounts, { services: 3, clients: 1 });
  const writes = f.events.length; assert.equal((await f.run("rollback")).noOp, true);
  assert.equal(f.events.length, writes);
  await assert.rejects(f.run("apply"), /rolled back/);
});

test("rollback refuses edited grants, activation changes, missing targets and changed client roles atomically", async () => {
  for (const mutate of [
    (state) => { state.users[0].serviceAccess.groups = ["seo"]; },
    (state) => { state.services[1].isActive = true; },
    (state) => { state.users.shift(); },
    (state) => { state.users[0].role = "employee"; },
  ]) {
    const f = fixture(); await f.run("apply"); mutate(f.state()); const before = copy(f.state());
    await assert.rejects(f.run("rollback"), /edited|changed/);
    assert.deepEqual(f.state(), before); assert.equal(f.state()[RECEIPTS][0].state, "applied");
  }
});

test("apply aborts stale counts, fields and activation guards before any writes", async () => {
  for (const mutate of [
    (state) => { state.services.push({ _id: id(99), isActive: true }); },
    (state) => { state.services[0].isActive = false; },
    (state) => { state.users[0].serviceAccess = { mode: "selected", groups: [], serviceIds: [] }; },
    (state) => { state.users.push({ _id: id(98), role: "client" }); },
  ]) {
    const f = fixture(); mutate(f.state()); const before = copy(f.state());
    await assert.rejects(f.run("apply"), /changed since preview/);
    assert.deepEqual(f.state(), before); assert.equal(f.events.length, 0);
  }
});

test("write failures, record conflicts and receipt failures roll back the entire apply", async () => {
  for (const configure of [
    (f) => { f.hooks.update = (name, filter) => { if (name === "users") throw new Error("Injected write failure"); }; },
    (f) => { f.hooks.update = (name, filter, update, state) => { if (name === "users") state.users[0].serviceAccess = { mode: "selected", groups: [], serviceIds: [] }; }; },
    (f) => { f.hooks.insert = () => { throw new Error("Injected receipt failure"); }; },
    (f) => { f.hooks.afterUpdate = (name, record) => { if (name === "services") record.basePrice = 0; }; },
  ]) {
    const f = fixture(), before = copy(f.state()); configure(f);
    await assert.rejects(f.run("apply")); assert.deepEqual(f.state(), before);
    assert.equal(f.ended(), 1);
  }
});

test("artifact validation rejects tampered hashes, arbitrary fields, duplicate targets and mismatched counts", () => {
  const f = fixture(); const validate = (preview) => validatePreview(preview, { database: f.db.databaseName, approvedSha256: preview.sha256 });
  const tampered = copy(f.preview); tampered.changes[0].set.serviceGroup = "seo";
  assert.throws(() => validate(tampered), /checksum/);
  for (const mutate of [
    (p) => { p.changes[0].set = { basePrice: 0 }; p.changes[0].requireMissing = ["basePrice"]; p.changes[0].rollbackUnset = ["basePrice"]; },
    (p) => { p.changes[0].rollbackUnset.push("name"); },
    (p) => { p.changes.push(copy(p.changes[0])); },
    (p) => { p.changes[0].collection = "orders"; },
    (p) => { p.counts.servicesAffected++; },
    (p) => { p.changes[0].sourceGuards = {}; },
    (p) => { p.issues.push({ field: "serviceAccess" }); p.counts.issues = 1; },
  ]) {
    const preview = copy(f.preview); mutate(preview); assert.throws(() => validate(hash(preview)));
  }
  assert.throws(() => validatePreview(f.preview, { database: "wrong_database", approvedSha256: f.preview.sha256 }));
});

test("rollback requires an intact committed receipt and never accepts a fresh query as authority", async () => {
  const f = fixture(); await assert.rejects(f.run("rollback"), /receipt/);
  await f.run("apply"); f.state()[RECEIPTS][0].preview.changes[0].rollbackUnset.push("basePrice");
  const before = copy(f.state()); await assert.rejects(f.run("rollback"), /checksum/); assert.deepEqual(f.state(), before);
});

test("CLI requires explicit targets, approval hashes and production opt-in before connecting", () => {
  const sha = fixture().preview.sha256;
  const base = ["--mode", "apply", "--database", "staging", "--approve-sha256", sha, "--preview", "preview.json", "--environment", "staging", "--backup-reference", "backup-001"];
  assert.equal(parseOptions(base)["--mode"], "apply");
  for (const args of [[], base.concat("--allow-production"), base.concat("--database", "other"),
    base.map((arg) => arg === "staging" ? "production" : arg), base.filter((arg) => arg !== "--preview" && arg !== "preview.json"),
    base.concat("--connection-uri", "do-not-use")]) assert.throws(() => parseOptions(args));
  const production = base.map((arg) => arg === "staging" ? "production" : arg).concat("--allow-production");
  assert.equal(parseOptions(production)["--environment"], "production");
  assert.equal(parseOptions(["--mode", "verify", "--database", "staging", "--approve-sha256", sha, "--preview", "file.json"])["--mode"], "verify");
});
