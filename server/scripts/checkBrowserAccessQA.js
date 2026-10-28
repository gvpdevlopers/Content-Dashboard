// Checks the disposable browser fixture only; no application URI is accepted.
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
async function main() {
  const artifact = path.resolve(__dirname, "../../artifacts/browser-access-qa");
  const fixture = JSON.parse(await fs.readFile(path.join(artifact, "session.json"), "utf8"));
  assert.match(fixture.api, /^http:\/\/127\.0\.0\.1:\d+\/api$/);
  assert.match(fixture.ui, /^http:\/\/127\.0\.0\.1:\d+$/);
  const cookies = {}, results = [];
  const request = async (account, route, { method = "GET", body, headers = {} } = {}) => {
    const response = await fetch(fixture.api + route, { method, signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json", Origin: fixture.ui, ...(cookies[account] ? { Cookie: cookies[account] } : {}), ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const cookie = response.headers.get("set-cookie"); if (cookie) cookies[account] = cookie.split(";")[0];
    return { status: response.status, body: await response.json() };
  };
  const check = async (name, action) => {
    try { await action(); results.push({ name, passed: true }); }
    catch (error) { results.push({ name, passed: false, error: error.message }); }
  };
  for (const { username } of fixture.accounts) {
    assert.match(username, /^qa\./);
    const login = await request(username, "/auth/login", { method: "POST", body: { identifier: username, password: fixture.password } });
    assert.equal(login.status, 200);
  }
  const ids = fixture.serviceIds;
  const item = (slug, quantity = 1) => ({ serviceId: ids[slug], quantity, formData: { projectBrief: "Isolated QA project brief" } });
  for (const [account, slugs] of [["qa.content", ["qa-content"]], ["qa.seo-development", ["qa-seo", "qa-development", "qa-other-seo"]], ["qa.custom", ["qa-content", "qa-seo"]]]) {
    await check(`${account}: only authorized active catalogue services`, async () => {
      const res = await request(account, "/services"); assert.equal(res.status, 200);
      assert.deepEqual(res.body.services.map((service) => service.slug).sort(), slugs.sort());
    });
  }
  await check("private active service is orderable; public inactive service is not", async () => {
    const privateService = await request("qa.seo-development", `/services/${ids['qa-seo']}`);
    assert.equal(privateService.status, 200); assert.equal(privateService.body.service.isPublic, false);
    const inactive = await request("qa.custom", `/services/${ids['qa-inactive-seo']}`); assert.equal(inactive.status, 404);
    const publicListing = await request("qa.content", "/services/public");
    assert.deepEqual(publicListing.body.services.map((service) => service.slug), ["qa-inactive-seo"]);
  });
  await check("unauthorized direct service URL is blocked", async () => {
    assert.equal((await request("qa.content", `/services/${ids['qa-seo']}`)).status, 404);
    assert.equal((await request("qa.custom", `/services/${ids['qa-other-seo']}`)).status, 404);
  });
  for (const [account, services, amount] of [["qa.content", [item("qa-content", 2)], 200], ["qa.seo-development", [item("qa-seo"), item("qa-development", 3)], 8600], ["qa.custom", [item("qa-content"), item("qa-seo")], 5100]]) {
    await check(`${account}: server quote preserves quantity and pricing`, async () => {
      const res = await request(account, "/orders/quote", { method: "POST", body: { services, paymentMethod: "cod" } });
      assert.equal(res.status, 200, res.body.message); assert.equal(res.body.quote.originalSubtotal, amount);
    });
  }
  for (const route of ["/orders/quote", "/orders/coupon-quote", "/orders", "/drafts"]) {
    await check(`custom access: restricted development ID rejected by ${route}`, async () => {
      const res = await request("qa.custom", route, { method: "POST", body: { services: [item("qa-development")], paymentMethod: "cod", code: "QAONLY" } });
      assert.equal(res.status, 400); assert.match(res.body.message, /QA Development Hours.*not available|QA Development Hours.*unavailable/);
    });
  }
  await check("inactive assignment remains stored but cannot be ordered", async () => {
    const user = await request("qa.admin", `/users/${fixture.userIds['qa.custom']}`);
    assert.ok(user.body.user.serviceAccess.serviceIds.includes(ids['qa-inactive-seo']));
    const res = await request("qa.custom", "/orders", { method: "POST", body: { services: [item("qa-inactive-seo")], paymentMethod: "cod" } });
    assert.equal(res.status, 400);
  });
  await check("restricted historical order remains visible with its original amount", async () => {
    const res = await request("qa.custom", `/orders/${fixture.historicalOrderId}`);
    assert.equal(res.status, 200); assert.equal(res.body.order.amount, 2400);
    assert.equal(res.body.order.items[0].serviceSnapshot.name, "QA Development Hours");
  });
  await check("restricted saved draft retains both services and returns a named access warning", async () => {
    const res = await request("qa.custom", `/drafts/${fixture.draftId}`);
    assert.equal(res.status, 200); assert.equal(res.body.draft.services.length, 2);
    assert.ok(res.body.accessIssues.some((issue) => issue.name === "QA Development Hours"));
  });
  await check("client cannot edit its own service access or view admin users", async () => {
    assert.equal((await request("qa.custom", `/users/${fixture.userIds['qa.custom']}/service-access`, { method: "PATCH", body: { serviceAccess: { mode: "groups", groups: ["development"], serviceIds: [] } } })).status, 403);
    assert.equal((await request("qa.custom", "/users")).status, 403);
  });
  await check("access revocation and restoration work without client login again", async () => {
    const accessRoute = `/users/${fixture.userIds['qa.seo-development']}/service-access`;
    try {
      const updated = await request("qa.admin", accessRoute, { method: "PATCH", body: { serviceAccess: { mode: "groups", groups: [], serviceIds: [] } } });
      assert.equal(updated.status, 200);
      assert.equal((await request("qa.seo-development", "/services")).body.services.length, 0);
      assert.equal((await request("qa.seo-development", "/orders/quote", { method: "POST", body: { services: [item("qa-seo")], paymentMethod: "cod" } })).status, 400);
    } finally {
      const restored = await request("qa.admin", accessRoute, { method: "PATCH", body: { serviceAccess: { mode: "groups", groups: ["seo", "development"], serviceIds: [] } } });
      assert.equal(restored.status, 200);
    }
    assert.equal((await request("qa.seo-development", "/services")).body.services.length, 3);
  });
  await check("valid cash checkout is idempotent in the disposable fixture", async () => {
    const headers = { "Idempotency-Key": randomUUID() }, body = { services: [item("qa-content", 2)], paymentMethod: "cod" };
    const first = await request("qa.content", "/orders", { method: "POST", headers, body });
    assert.equal(first.status, 201, first.body.message); assert.equal(first.body.order.amount, 200);
    let replay;
    // The first HTTP response may arrive before its finally block releases the
    // short-lived checkout lease. Retry only that explicit in-flight response.
    for (let attempt = 0; attempt < 10; attempt++) {
      replay = await request("qa.content", "/orders", { method: "POST", headers, body });
      if (replay.status !== 409 || !/already processing/.test(replay.body.message)) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(replay.status, 200, replay.body.message); assert.equal(replay.body.order._id, first.body.order._id);
  });
  const report = { generatedAt: new Date().toISOString(), scope: "Disposable localhost API integration; not browser verification", results,
    passed: results.filter((result) => result.passed).length, failed: results.filter((result) => !result.passed).length };
  await fs.writeFile(path.join(artifact, "api-results.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2)); if (report.failed) process.exitCode = 1;
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
