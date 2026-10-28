// Disposable browser QA: never connects to the app's configured database.
// Run with --start, then send "stop" on stdin to remove its temporary data.
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const net = require("node:net");
const { pathToFileURL } = require("node:url");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { randomBytes } = require("node:crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const root = path.resolve(__dirname, "../..");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function freePort() {
  const listener = net.createServer(); await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port; await new Promise((resolve) => listener.close(resolve)); return port;
}
async function main() {
  if (process.argv[2] !== "--start") { console.log("Use --start for a disposable local MongoDB/API/Vite browser QA environment. Send stop on stdin to clean it up."); return; }
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "service-access-browser-"));
  const [mongoPort, apiPort, uiPort] = await Promise.all([freePort(), freePort(), freePort()]);
  const binary = process.env.SERVICE_ACCESS_TEST_MONGOD || "C:/Program Files/MongoDB/Server/8.0/bin/mongod.exe";
  const child = spawn(binary, ["--dbpath", directory, "--bind_ip", "127.0.0.1", "--port", String(mongoPort),
    "--replSet", "browserAccessQA", "--quiet", "--logpath", path.join(directory, "mongod.log")], { windowsHide: true, stdio: "ignore" });
  const exited = once(child, "exit").catch(() => undefined);
  let spawnError; child.on("error", (error) => { spawnError = error; });
  let client, vite, stopping = false;
  const cleanup = async () => {
    if (stopping) return; stopping = true;
    await vite?.close(); await mongoose.disconnect(); await client?.close();
    if (child.exitCode === null) child.kill(); await exited;
    const resolved = path.resolve(directory);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith("service-access-browser-")) throw new Error("Unsafe QA cleanup target");
    await fs.rm(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    console.log("QA environment stopped; disposable database removed.");
  };
  try {
    const uri = `mongodb://127.0.0.1:${mongoPort}/browser_access_qa?directConnection=true`;
    const deadline = Date.now() + 60000;
    console.log(JSON.stringify({ starting: true, mongoPort, apiPort, uiPort }));
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null) throw new Error("Disposable MongoDB exited during startup");
      try { client = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 500 }); await client.connect(); break; }
      catch { await client?.close(); client = null; await wait(100); }
    }
    if (!client) throw new Error("Disposable MongoDB startup timed out");
    await client.db("admin").command({ replSetInitiate: { _id: "browserAccessQA", members: [{ _id: 0, host: `127.0.0.1:${mongoPort}` }] } });
    while (!(await client.db("admin").command({ hello: 1 })).isWritablePrimary) {
      if (Date.now() > deadline) throw new Error("QA replica set startup timed out"); await wait(100);
    }
    const ui = `http://127.0.0.1:${uiPort}`, api = `http://127.0.0.1:${apiPort}/api`;
    Object.assign(process.env, { MONGO_URI: uri, PORT: String(apiPort), CLIENT_URL: ui, JWT_SECRET: randomBytes(32).toString("hex"),
      CI: "true", NODE_ENV: "development", AUTH_COOKIE_SAME_SITE: "lax", VITE_API_URL: api,
      RAZORPAY_KEY_ID: "qa_local_only", RAZORPAY_KEY_SECRET: "qa_local_only", RAZORPAY_WEBHOOK_SECRET: "qa_local_only" });
    await mongoose.connect(uri);
    const Service = require("../models/Service"), User = require("../models/User");
    const field = { name: "projectBrief", label: "Project brief", type: "textarea", required: true };
    const services = await Service.create([
      { name: "QA Content Service", slug: "qa-content", category: "QA Content", basePrice: 100, pricingType: "per_unit", unit: "item", maxQuantity: 10, fields: [field], isActive: true, isPublic: false },
      { name: "QA SEO Audit", slug: "qa-seo", category: "QA SEO", serviceGroup: "seo", basePrice: 5000, fields: [field], isActive: true, isPublic: false },
      { name: "QA Development Hours", slug: "qa-development", category: "QA Development", serviceGroup: "development", basePrice: 1200, pricingType: "per_unit", unit: "hour", maxQuantity: 20, fields: [field], isActive: true, isPublic: false },
      { name: "QA Other SEO Service", slug: "qa-other-seo", category: "QA SEO", serviceGroup: "seo", basePrice: 3000, fields: [field], isActive: true, isPublic: false },
      { name: "QA Inactive SEO", slug: "qa-inactive-seo", category: "QA SEO", serviceGroup: "seo", basePrice: 999, fields: [field], isActive: false, isPublic: true },
    ]);
    const password = "LocalQa-Access-2026!", hash = await bcrypt.hash(password, 10);
    const users = await User.create([
      { name: "QA Content Client", username: "qa.content", email: "content@qa.invalid", password: hash },
      { name: "QA SEO Development Client", username: "qa.seo-development", email: "seo-development@qa.invalid", password: hash, serviceAccess: { mode: "groups", groups: ["seo", "development"], serviceIds: [] } },
      { name: "QA Custom Client", username: "qa.custom", email: "custom@qa.invalid", password: hash, serviceAccess: { mode: "groups", groups: ["content", "seo", "development"], serviceIds: [] } },
      { name: "QA Admin", username: "qa.admin", email: "admin@qa.invalid", password: hash, role: "admin" },
    ]);
    // Exercise legacy missing-field defaults for the Content test account.
    await User.collection.updateOne({ _id: users[0]._id }, { $unset: { serviceAccess: "" } });
    require("../server");
    for (;;) {
      try { const response = await fetch(`${api}/health`); if (response.ok) break; } catch {}
      if (Date.now() > deadline + 10000) throw new Error("QA API did not start"); await wait(100);
    }
    const cookies = {};
    const request = async (account, route, method = "GET", body) => {
      const response = await fetch(`${api}${route}`, { method, headers: { "Content-Type": "application/json", Origin: ui, ...(cookies[account] ? { Cookie: cookies[account] } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}) });
      const cookie = response.headers.get("set-cookie"); if (cookie) cookies[account] = cookie.split(";")[0];
      return { status: response.status, body: await response.json() };
    };
    for (const user of users) {
      const result = await request(user.username, "/auth/login", "POST", { identifier: user.username, password });
      if (result.status !== 200) throw new Error("Fixture login failed");
    }
    const historical = await request("qa.custom", "/orders", "POST", { services: [{ serviceId: String(services[2]._id), quantity: 2, formData: { projectBrief: "Previously authorized development work" } }], paymentMethod: "cod" });
    if (historical.status !== 201) throw new Error(`Fixture order failed: ${historical.body.message}`);
    const draft = await request("qa.custom", "/drafts", "POST", { title: "QA restricted draft", services: [services[1], services[2]].map((service) => ({ serviceId: String(service._id), quantity: 1, formData: { projectBrief: "Saved before access changed" } })) });
    if (draft.status !== 201) throw new Error(`Fixture draft failed: ${draft.body.message}`);
    const access = { mode: "selected", groups: [], serviceIds: [services[0], services[1], services[4]].map((service) => String(service._id)) };
    const permission = await request("qa.admin", `/users/${users[2]._id}/service-access`, "PATCH", { serviceAccess: access });
    if (permission.status !== 200) throw new Error("Fixture access update failed");
    const apiChecks = [];
    for (const [account, expected] of [["qa.content", ["qa-content"]], ["qa.seo-development", ["qa-seo", "qa-development", "qa-other-seo"]], ["qa.custom", ["qa-content", "qa-seo"]]]) {
      const result = await request(account, "/services");
      const actual = result.body.services.map((service) => service.slug).sort();
      if (JSON.stringify(actual) !== JSON.stringify(expected.sort())) throw new Error(`Fixture access mismatch: ${account}`);
      apiChecks.push({ account, visibleServices: actual, passed: true });
    }
    const denied = await request("qa.custom", "/orders/quote", "POST", { services: [{ serviceId: String(services[2]._id), quantity: 1, formData: { projectBrief: "Unauthorized retry" } }], paymentMethod: "cod" });
    if (denied.status !== 400) throw new Error("Restricted quote was not rejected");
    const { createServer } = await import(pathToFileURL(path.join(root, "client/node_modules/vite/dist/node/index.js")).href);
    vite = await createServer({ root: path.join(root, "client"), cacheDir: path.join(directory, "vite-cache"), configLoader: "native", server: { host: "127.0.0.1", port: uiPort, strictPort: true }, logLevel: "warn" });
    await vite.listen();
    const metadata = { ui, api, password, fixtureProcessId: process.pid, mongoProcessId: child.pid, fixtureDirectory: directory, accounts: users.map((user) => ({ username: user.username, name: user.name })),
      serviceIds: Object.fromEntries(services.map((service) => [service.slug, String(service._id)])),
      userIds: Object.fromEntries(users.map((user) => [user.username, String(user._id)])),
      historicalOrderId: String(historical.body.order._id), draftId: String(draft.body.draft._id), apiChecks };
    const output = path.join(root, "artifacts/browser-access-qa/session.json");
    await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, JSON.stringify(metadata, null, 2));
    console.log(JSON.stringify({ ready: true, ui, api, accounts: metadata.accounts, password, metadata: "artifacts/browser-access-qa/session.json", apiChecks }));
    const stopFile = path.join(root, "artifacts/browser-access-qa/stop");
    await fs.rm(stopFile, { force: true });
    setInterval(async () => {
      if (!stopping) { try { await fs.access(stopFile); await cleanup(); process.exit(0); } catch {} }
    }, 1000);
    process.stdin.setEncoding("utf8"); process.stdin.on("data", (data) => { if (data.trim() === "stop") cleanup().then(() => process.exit(0)); });
    process.on("SIGINT", () => cleanup().then(() => process.exit(0)));
    setTimeout(() => cleanup().then(() => process.exit(0)), 45 * 60 * 1000).unref();
  } catch (error) {
    try { console.error((await fs.readFile(path.join(directory, "mongod.log"), "utf8")).split("\n").slice(-4).join("\n")); } catch {}
    await cleanup(); throw error;
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
