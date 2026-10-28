// Runs against a new loopback-only MongoDB process and temporary data directory.
// It never reads MIGRATION_MONGO_URI, application .env, or a running app database.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { existsSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");
const { main: runCommand } = require("../scripts/migrateServiceAccess");
const { once } = require("node:events");
const { MongoClient, ObjectId } = require("mongoose").mongo;
const { buildServiceAccessPreview } = require("../utils/serviceAccessPreview");
const { RECEIPTS, runServiceAccessMigration } = require("../utils/serviceAccessMigration");
const candidates = [process.env.SERVICE_ACCESS_TEST_MONGOD, "C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe", "/usr/bin/mongod", "/usr/local/bin/mongod"].filter(Boolean);
const executable = candidates.find((candidate) => existsSync(candidate));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("isolated MongoDB replica set verifies actual migration commit, rollback, concurrency and abort semantics", {
  skip: executable ? false : "Set SERVICE_ACCESS_TEST_MONGOD to run real MongoDB transaction checks.", timeout: 120000,
}, async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "service-access-mongo-"));
  const listener = net.createServer(); await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port; await new Promise((resolve) => listener.close(resolve));
  const child = spawn(executable, ["--dbpath", directory, "--bind_ip", "127.0.0.1", "--port", String(port),
    "--replSet", "serviceAccessTest", "--quiet", "--logpath", path.join(directory, "mongod.log")], { windowsHide: true, stdio: "ignore" });
  let spawnError;
  child.on("error", (error) => { spawnError = error; });
  const exited = once(child, "exit").catch(() => undefined);
  let client;
  try {
    const deadline = Date.now() + 60000;
    let connectionError;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null) throw new Error("Isolated MongoDB process exited before startup.");
      try {
        client = new MongoClient(`mongodb://127.0.0.1:${port}/?directConnection=true`, { serverSelectionTimeoutMS: 500 });
        await client.connect(); break;
      } catch (error) { connectionError = error; await client?.close(); client = null; await delay(100); }
    }
    assert.ok(client, `Isolated MongoDB startup timed out: ${connectionError?.message || "no connection"}`);
    await client.db("admin").command({ replSetInitiate: { _id: "serviceAccessTest", members: [{ _id: 0, host: `127.0.0.1:${port}` }] } });
    let primary = false;
    const electionDeadline = Date.now() + 20000;
    while (Date.now() < electionDeadline) {
      primary = (await client.db("admin").command({ hello: 1 })).isWritablePrimary;
      if (primary) break;
      await delay(100);
    }
    assert.equal(primary, true, "Test replica set did not elect a primary");
    await t.test("PIN assignment and payment persistence use isolated real orders across Content, SEO and Development", async () => {
      await require("./helpers/pinWorkflow")(`mongodb://127.0.0.1:${port}/pin_workflow_test?directConnection=true`);
    });
    await t.test("initial SEO/Development seed preserves edits, Content and history across real database reruns", async () => {
      const mongoose = require("mongoose");
      const { seedServices, main: seedCommand } = require("../scripts/seedSeoDevelopmentServices");
      const uri = `mongodb://127.0.0.1:${port}/seo_seed_test?directConnection=true`;
      const connection = await mongoose.createConnection(uri).asPromise();
      try {
        const model = connection.model("Service", require("../models/Service").schema);
        const content = await model.create({ name: "Existing Content", slug: "existing-content", category: "Content", basePrice: 731, isActive: true });
        const contentBefore = await model.findById(content._id).lean();
        await connection.db.collection("orders").insertOne({ marker: "existing-history", amount: 731, snapshot: contentBefore });
        const historyBefore = await connection.db.collection("orders").findOne({});
        assert.equal((await seedServices({ model })).filter((row) => row.status === "would-create").length, 10);
        assert.equal(await model.countDocuments(), 1);
        const first = await seedServices({ model, apply: true });
        assert.equal(first.filter((row) => row.status === "created").length, 10);
        assert.ok(first.every((row) => row.groupMatches && row.isActive === false));
        assert.equal(first.filter((row) => row.serviceGroup === "seo").length, 5);
        assert.equal(first.filter((row) => row.serviceGroup === "development").length, 5);
        const before = await model.find().sort({ slug: 1 }).lean();
        assert.equal((await seedServices({ model, apply: true })).filter((row) => row.status === "preserved").length, 10);
        assert.deepEqual(await model.find().sort({ slug: 1 }).lean(), before);
        await model.updateOne({ slug: "seo-audit" }, { $set: { name: "Admin edited", description: "Manual description", basePrice: 777, isActive: true, fields: [] } });
        const edited = await model.findOne({ slug: "seo-audit" }).lean();
        await seedServices({ model, apply: true });
        assert.deepEqual(await model.findOne({ slug: "seo-audit" }).lean(), edited);
        assert.deepEqual(await model.findById(content._id).lean(), contentBefore);
        assert.deepEqual(await connection.db.collection("orders").findOne({}), historyBefore);
        assert.equal(await model.countDocuments(), 11);
        // Exercise the actual CLI path too, against this explicit loopback test DB.
        const report = await seedCommand(["--apply", "--database", "seo_seed_test"], { SEO_DEVELOPMENT_SEED_URI: uri, NODE_ENV: "test" });
        assert.ok(report.every((row) => row.status === "preserved"));
        assert.deepEqual(await model.findOne({ slug: "seo-audit" }).lean(), edited);
      } finally { await connection.close(); }
    });
    let sequence = 0;
    const fixture = async ({ rejectReceipt = false } = {}) => {
      const db = client.db(`migration_fixture_${++sequence}`);
      const serviceId = new ObjectId(), userId = new ObjectId(), protectedId = new ObjectId();
      const service = { _id: serviceId, name: "Content", isActive: true, basePrice: 987, fields: [{ name: "brief", required: true }], updatedAt: new Date("2026-01-01") };
      const user = { _id: userId, role: "client", password: "fixture-password-hash", updatedAt: new Date("2026-01-01") };
      await db.collection("services").insertOne(service); await db.collection("users").insertOne(user);
      for (const name of ["orders", "payments", "orderdrafts"]) await db.collection(name).insertOne({ _id: protectedId, amount: 987, marker: "unchanged" });
      if (rejectReceipt) await db.createCollection(RECEIPTS, { validator: { kind: { $eq: "receipt-insertion-must-fail" } } });
      const preview = buildServiceAccessPreview({ database: db.databaseName, services: [service], clients: [user], serviceCount: 1, clientCount: 1 });
      const run = (mode) => runServiceAccessMigration({ db, startSession: async () => client.startSession(), mode,
        preview, approvedSha256: preview.sha256, environment: "staging", backupReference: "isolated-fixture-backup" });
      return { db, service, user, run, preview };
    };
    await t.test("commit and rollback preserve snapshots, prices, credentials and timestamps", async () => {
      const f = await fixture(); await f.run("apply");
      assert.deepEqual(await f.db.collection("services").findOne({ _id: f.service._id }), { ...f.service, serviceGroup: "content", isPublic: true });
      assert.deepEqual(await f.db.collection("users").findOne({ _id: f.user._id }), { ...f.user, serviceAccess: { mode: "groups", groups: ["content"], serviceIds: [] } });
      assert.equal((await f.run("apply")).noOp, true);
      await f.db.collection("services").updateOne({ _id: f.service._id }, { $set: { basePrice: 1234 } });
      await f.run("rollback");
      assert.deepEqual(await f.db.collection("services").findOne({ _id: f.service._id }), { ...f.service, basePrice: 1234 });
      assert.deepEqual(await f.db.collection("users").findOne({ _id: f.user._id }), f.user);
      assert.equal((await f.run("rollback")).noOp, true);
      for (const name of ["orders", "payments", "orderdrafts"]) {
        const record = await f.db.collection(name).findOne({}); assert.equal(record.amount, 987); assert.equal(record.marker, "unchanged");
      }
    });
    await t.test("a real receipt validation failure aborts all preceding service and user updates", async () => {
      const f = await fixture({ rejectReceipt: true }); await assert.rejects(f.run("apply"));
      assert.deepEqual(await f.db.collection("services").findOne({}), f.service);
      assert.deepEqual(await f.db.collection("users").findOne({}), f.user);
      assert.equal(await f.db.collection(RECEIPTS).countDocuments({}), 0);
    });
    await t.test("two concurrent applies produce one receipt and one idempotent response", async () => {
      const f = await fixture();
      // Collection creation is independent of this concurrency check.
      await f.db.createCollection(RECEIPTS);
      const outcomes = await Promise.all([f.run("apply"), f.run("apply")]);
      assert.deepEqual(outcomes.map((result) => result.noOp).sort(), [false, true]);
      assert.equal(await f.db.collection(RECEIPTS).countDocuments({}), 1);
    });
    await t.test("the command entry point verifies offline and applies/rolls back only the explicit fixture database", async () => {
      const f = await fixture();
      const artifact = path.join(directory, "cli-preview.json");
      await fs.writeFile(artifact, JSON.stringify(f.preview));
      const base = ["--database", f.db.databaseName, "--approve-sha256", f.preview.sha256];
      const summaries = [], log = (message) => summaries.push(JSON.parse(message));
      // Inject an isolated environment; never mutate process.env or use the app URI.
      await runCommand(["--mode", "verify", ...base, "--preview", artifact], { env: {}, log });
      assert.equal(summaries.at(-1).offline, true);
      const env = { MIGRATION_MONGO_URI: `mongodb://127.0.0.1:${port}/?directConnection=true` };
      const approval = ["--environment", "staging", "--backup-reference", "isolated-cli-fixture"];
      await runCommand(["--mode", "apply", ...base, "--preview", artifact, ...approval], { env, log });
      assert.equal(summaries.at(-1).state, "applied");
      assert.equal(summaries.at(-1).database, f.db.databaseName);
      await runCommand(["--mode", "rollback", ...base, ...approval], { env, log });
      assert.equal(summaries.at(-1).state, "rolled_back");
      assert.deepEqual(await f.db.collection("services").findOne({}), f.service);
      assert.deepEqual(await f.db.collection("users").findOne({}), f.user);
    });
    await t.test("rollback refuses later access edits without partially undoing earlier records", async () => {
      const f = await fixture(); await f.run("apply");
      await f.db.collection("users").updateOne({ _id: f.user._id }, { $set: { "serviceAccess.groups": ["seo"] } });
      await assert.rejects(f.run("rollback"), /edited/);
      assert.equal((await f.db.collection("services").findOne({})).serviceGroup, "content");
      assert.deepEqual((await f.db.collection("users").findOne({})).serviceAccess.groups, ["seo"]);
      assert.equal((await f.db.collection(RECEIPTS).findOne({})).state, "applied");
    });
  } finally {
    await client?.close();
    if (child.exitCode === null) child.kill();
    await exited;
    // This exact directory was created above solely for this disposable process.
    const resolved = path.resolve(directory), root = path.resolve(os.tmpdir());
    assert.equal(path.dirname(resolved), root);
    assert.ok(path.basename(resolved).startsWith("service-access-mongo-"));
    await fs.rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
