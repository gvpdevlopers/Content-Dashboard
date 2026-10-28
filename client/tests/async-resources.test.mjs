import test from "node:test";
import assert from "node:assert/strict";
import { createAsyncRequestController } from "../src/utils/asyncRequest.js";
import { initialUserListState, userListReducer } from "../src/utils/userListState.js";
const deferred = () => { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej; }); return { promise, resolve, reject }; };

test("a slow older request cannot overwrite a refreshed resource or its form fields", async () => {
  const older = deferred(), newer = deferred(), published = [];
  const controller = createAsyncRequestController({ onSuccess: (value) => published.push(value), onError: assert.fail });
  const first = controller.run(() => older.promise), second = controller.run(() => newer.promise);
  newer.resolve({ orderId: "new", notes: "current form" }); await second;
  older.resolve({ orderId: "old", notes: "stale form" }); await first;
  assert.deepEqual(published, [{ orderId: "new", notes: "current form" }]);
});

test("unmount/route cleanup prevents pending results and errors from reaching a different record", async () => {
  for (const fail of [false, true]) {
    const pending = deferred(), calls = [];
    const controller = createAsyncRequestController({ onSuccess: (value) => calls.push(value), onError: (error) => calls.push(error) });
    const request = controller.run(() => pending.promise); controller.cancel();
    if (fail) pending.reject(new Error("old route error")); else pending.resolve("old route");
    await request; assert.deepEqual(calls, []);
    await controller.run(async () => "new route"); assert.deepEqual(calls, ["new route"]);
  }
});

test("only the current failure is published; retry succeeds after a failed load", async () => {
  const stale = deferred(), failures = [], results = [];
  const controller = createAsyncRequestController({ onSuccess: (value) => results.push(value), onError: (error) => failures.push(error.message) });
  const first = controller.run(() => stale.promise);
  await controller.run(async () => { throw new Error("Current load failed"); });
  stale.reject(new Error("Stale failure")); await first;
  assert.deepEqual(failures, ["Current load failed"]);
  await controller.run(async () => "Retry succeeded"); assert.deepEqual(results, ["Retry succeeded"]);
});

test("user filtering resets pagination on filter changes and on returning to the original filters", () => {
  const expanded = userListReducer(initialUserListState, { field: "visibleCount", value: 100 });
  const searched = userListReducer(expanded, { field: "search", value: "test" });
  assert.equal(searched.visibleCount, 20);
  const restored = userListReducer(searched, { field: "search", value: "" });
  assert.equal(restored.visibleCount, 20); assert.equal(expanded.visibleCount, 100);
  for (const field of ["roleFilter", "statusFilter"]) {
    assert.equal(userListReducer(expanded, { field, value: "client" }).visibleCount, 20);
  }
  assert.equal(userListReducer(initialUserListState, { field: "visibleCount", value: (count) => count + 20 }).visibleCount, 40);
});
