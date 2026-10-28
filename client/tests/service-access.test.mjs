import test from "node:test";
import assert from "node:assert/strict";
import { getEditableServiceAccess } from "../src/utils/serviceAccess.js";

test("only missing legacy access defaults to Content; invalid explicit access stays empty", () => {
  assert.deepEqual(getEditableServiceAccess(undefined), { mode: "groups", groups: ["content"], serviceIds: [] });
  for (const value of [null, {}, { mode: "invalid" }]) {
    assert.deepEqual(getEditableServiceAccess(value), { mode: "selected", groups: [], serviceIds: [] });
  }
  assert.deepEqual(getEditableServiceAccess({ mode: "groups", groups: null }), { mode: "groups", groups: [], serviceIds: [] });
  assert.deepEqual(getEditableServiceAccess({ mode: "selected", serviceIds: null }), { mode: "selected", groups: [], serviceIds: [] });
});

test("editing selected access preserves inactive/missing assignments without mutating saved data", () => {
  const value = { mode: "selected", groups: ["content"], serviceIds: ["inactive-service-id", "missing-service-id"] };
  const editable = getEditableServiceAccess(value);
  assert.deepEqual(editable, { mode: "selected", groups: [], serviceIds: value.serviceIds });
  editable.serviceIds.pop(); assert.equal(value.serviceIds.length, 2);
  assert.deepEqual(value.groups, ["content"]);
});
