import test from "node:test";
import assert from "node:assert/strict";
import { choosePinEmployee } from "../src/utils/pinAssignment.js";
import { canUseOrderPaymentPin, canViewOrderPaymentPin, getVerifiedPaymentUpdate, getCurrentGeneratedPin, mergeOrderPaymentRefresh } from "../src/utils/paymentPin.js";

test("PIN assignment defaults to the single eligible Krish by ID and preserves explicit alternatives", () => {
  const employees = [{ _id: "first", name: " Krish " }, { _id: "second", name: "Another employee" }];
  assert.equal(choosePinEmployee(employees), "first");
  assert.equal(choosePinEmployee(employees, "second"), "second");
  assert.equal(choosePinEmployee(employees, "removed"), "first");
});
test("missing or ambiguous Krish requires explicit employee choice", () => {
  assert.equal(choosePinEmployee([]), "");
  assert.equal(choosePinEmployee([{ _id: "one", name: "Krishna" }]), "");
  assert.equal(choosePinEmployee([{ _id: "one", name: "Krish" }, { _id: "two", name: "krish" }]), "");
});

test("only the owning client enters PINs; admins and assigned employees may view them", () => {
  const order = { client: "owner", paymentMethod: "cod", paymentStatus: "pending", codPinStatus: "active", codPinEmployee: "one" };
  assert.equal(canUseOrderPaymentPin(order, { role: "client", _id: "owner" }), true);
  assert.equal(canUseOrderPaymentPin(order, { role: "client", _id: "other" }), false);
  for (const user of [{ role: "admin" }, { role: "employee", _id: "one" }]) {
    assert.equal(canUseOrderPaymentPin(order, user), false);
    assert.equal(canViewOrderPaymentPin(order, user), true);
  }
  assert.equal(canViewOrderPaymentPin(order, { role: "client", _id: "owner" }), false);
  assert.equal(canViewOrderPaymentPin(order, { role: "employee", _id: "two" }), false);
  for (const codPinStatus of ["disabled", "expired", "locked", "used", "verified", "not_generated"]) {
    assert.equal(canUseOrderPaymentPin({ ...order, codPinStatus }, { role: "client", _id: "owner" }), false);
    assert.equal(canViewOrderPaymentPin({ ...order, codPinStatus }, { role: "admin" }), false);
  }
});

test("both payment methods require backend Paid and consumed PIN confirmation", () => {
  for (const paymentMethod of ["cod", "cheque"]) {
    const order = { paymentMethod, paymentStatus: "pending" };
    assert.equal(getVerifiedPaymentUpdate(order, { order: { paymentStatus: "paid", codPinStatus: "used" } }).paymentStatus, "paid");
    assert.throws(() => getVerifiedPaymentUpdate(order, { order: { paymentStatus: "pending", codPinStatus: "verified" } }), /confirmation was incomplete/);
    assert.throws(() => getVerifiedPaymentUpdate(order, {}), /confirmation was incomplete/);
  }
});

test("locally generated PIN display is bound to its generation, never to a later active PIN", () => {
  const generated = { value: "123456", generatedAt: "2026-10-28T10:00:00Z" };
  const order = { paymentMethod: "cod", codPinStatus: "active", codPinGeneratedAt: generated.generatedAt, paymentStatus: "pending" };
  assert.equal(getCurrentGeneratedPin(generated, order), "123456");
  assert.equal(getCurrentGeneratedPin(generated, { ...order, codPinGeneratedAt: "2026-10-28T11:00:00Z" }), "");
  for (const codPinStatus of ["disabled", "used", "verified", "locked"]) assert.equal(getCurrentGeneratedPin(generated, { ...order, codPinStatus }), "");
  assert.equal(getCurrentGeneratedPin(generated, { ...order, orderStatus: "cancelled" }), "");
});

test("payment polling refreshes assignment/cancellation and clears replaced PINs without resetting form edits", () => {
  const current = { codPinStatus: "active", paymentStatus: "pending", codPinGeneratedAt: "2026-10-28T10:00:00Z", codPinEmployee: "one", codPin: "123456", deliveryLink: "unsaved", notes: "unsaved note" };
  const incoming = { ...current, codPinGeneratedAt: "2026-10-28T11:00:00Z", codPinEmployee: "two", deliveryLink: "old", notes: "old" };
  const refreshed = mergeOrderPaymentRefresh(current, incoming);
  assert.equal(refreshed.codPinEmployee, "two"); assert.equal(refreshed.codPin, null);
  assert.equal(refreshed.deliveryLink, "unsaved"); assert.equal(refreshed.notes, "unsaved note");
  assert.equal(mergeOrderPaymentRefresh(current, { ...current, orderStatus: "cancelled" }).orderStatus, "cancelled");
  assert.equal(mergeOrderPaymentRefresh(current, { ...current, orderStatus: "cancelled" }).codPin, null);
  assert.equal(mergeOrderPaymentRefresh(refreshed, current), refreshed);
  const completed = { ...current, paymentStatus: "paid", codPinStatus: "used" };
  assert.equal(mergeOrderPaymentRefresh(completed, current), completed);
});

test("a verification response for another order or a failed response cannot mark this order paid", () => {
  const order = { _id: "one", paymentMethod: "cod", paymentStatus: "pending" };
  const response = { order: { id: "two", paymentStatus: "paid", codPinStatus: "used" } };
  assert.throws(() => getVerifiedPaymentUpdate(order, response), /confirmation was incomplete/);
  assert.throws(() => getVerifiedPaymentUpdate(order, { order: { paymentStatus: "paid", codPinStatus: "used" } }), /confirmation was incomplete/);
  assert.throws(() => getVerifiedPaymentUpdate(order, { success: false, order: { id: "one", paymentStatus: "paid", codPinStatus: "used" } }), /confirmation was incomplete/);
  assert.equal(order.paymentStatus, "pending");
});
