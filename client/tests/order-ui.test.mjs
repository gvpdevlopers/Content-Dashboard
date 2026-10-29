import { getModalViewport, getSelectPortalTarget, lockBodyScroll } from "../src/utils/modal.js";
import { canEnterPaymentPin, getVerifiedPaymentUpdate } from "../src/utils/paymentPin.js";
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { validResourceUrl, hasProjectDetails } from "../src/utils/orderResources.js";
import { getSelectPlacement, findEnabledOption, findTypeaheadOption } from "../src/utils/selectNavigation.js";
import { getDraftLabel, formatDraftDate } from "../src/utils/draftLabels.js";
let server, cacheDirectory, Progress, Delivery, Resource, Badge, PaymentBadge, Select, Filters, Feedback, Modal, Confirm, PinEmployee, AccessEditor, Role, PinActions, ClientPin;
before(async () => {
  cacheDirectory = await mkdtemp(join(tmpdir(), "glow-ui-vite-"));
  server = await createServer({ configFile: false, cacheDir: cacheDirectory, plugins: [react()], optimizeDeps: { noDiscovery: true, entries: [] }, resolve: { preserveSymlinks: true }, server: { middlewareMode: true }, appType: "custom" });
  Filters = (await server.ssrLoadModule("/src/components/ActiveFilters.jsx")).default;
  Feedback = (await server.ssrLoadModule("/src/components/FormFeedback.jsx")).default;
  Modal = (await server.ssrLoadModule("/src/components/Modal.jsx")).default;
  Confirm = (await server.ssrLoadModule("/src/components/ConfirmDialog.jsx")).default;
  Select = (await server.ssrLoadModule("/src/components/CustomSelect.jsx")).default;
  Progress = (await server.ssrLoadModule("/src/components/ServiceProgress.jsx")).default;
  Delivery = (await server.ssrLoadModule("/src/components/ServiceDelivery.jsx")).default;
  Resource = (await server.ssrLoadModule("/src/components/OrderResourceAction.jsx")).default;
  Badge = (await server.ssrLoadModule("/src/components/OrderStatusBadge.jsx")).default;
  PaymentBadge = (await server.ssrLoadModule("/src/components/PaymentStatusBadge.jsx")).default;
  PinEmployee = (await server.ssrLoadModule("/src/components/PinEmployeeSelect.jsx")).default;
  AccessEditor = (await server.ssrLoadModule("/src/components/ServiceAccessEditor.jsx")).default;
  Role = (await server.ssrLoadModule("/src/components/RoleBadge.jsx")).default;
  ClientPin = (await server.ssrLoadModule("/src/components/ClientPaymentPinSection.jsx")).default;
  PinActions = (await server.ssrLoadModule("/src/components/OrderPaymentPinActions.jsx")).default;
});
after(async () => {
  try { await server?.close(); }
  finally { if (cacheDirectory) await rm(cacheDirectory, { recursive: true, force: true }); }
});
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test("order PIN actions visibly offer entry and authorized PIN display without exposing a secret in row markup", () => {
  const order = { _id: "order-one", paymentMethod: "cod", paymentStatus: "pending", codPinStatus: "active", codPinEmployee: "assigned", codPin: "secret-must-not-render" };
  for (const user of [{ role: "admin" }, { role: "employee", _id: "assigned" }]) {
    const html = render(PinActions, { order, user });
    assert.match(html, /View PIN/); assert.doesNotMatch(html, /Enter PIN|Verify PIN|<input/); assert.doesNotMatch(html, /secret-must-not-render/);
  }
  const client = render(PinActions, { order, user: { role: "client" } });
  assert.match(client, /Enter PIN/); assert.doesNotMatch(client, /View PIN/);
  assert.equal(render(PinActions, { order, user: { role: "employee", _id: "other" } }), "");
  assert.equal(render(PinActions, { order: { ...order, paymentStatus: "collected", codPinStatus: "used" }, user: { role: "admin" } }), "");
});

test("employee picker shows the actual selected identity and accessible loading, empty and failure states", () => {
  const assignment = { data: [{ _id: "employee-a", name: "Krish", username: "krish" }, { _id: "employee-b", name: "Other", username: "other" }], employeeId: "employee-b", setEmployeeId() {}, reload() {} };
  const selected = render(PinEmployee, { assignment });
  assert.match(selected, /Other \(@other\)/); assert.match(selected, /role="combobox"/); assert.doesNotMatch(selected, /<select/);
  assert.match(render(PinEmployee, { assignment: { ...assignment, loading: true } }), /Loading employees/);
  assert.match(render(PinEmployee, { assignment: { ...assignment, data: [], employeeId: "" } }), /Create or activate an employee/);
  const failed = render(PinEmployee, { assignment: { ...assignment, error: "Offline" } });
  assert.match(failed, /role="alert"/); assert.match(failed, /Retry/);
});

test("service access uses custom dropdowns while retaining group grants and explicit service selection", () => {
  const groups = render(AccessEditor, { value: { mode: "groups", groups: ["seo", "development"], serviceIds: [] }, onChange() {} });
  assert.match(groups, /Service groups/); assert.doesNotMatch(groups, /<select/);
  assert.equal((groups.match(/checked=""/g) || []).length, 2);
  const custom = render(AccessEditor, { value: { mode: "selected", groups: [], serviceIds: ["existing"] }, onChange() {}, disabled: true });
  assert.match(custom, /Find a service/); assert.match(custom, /Add a service/); assert.match(custom, /Loading services/);
  assert.equal((custom.match(/role="combobox"/g) || []).length, 2);
});

test("ordinary role badges use neutral colors while retaining the admin shield", () => {
  const admin = render(Role, { role: "admin" });
  assert.match(admin, /<svg/); assert.match(admin, /Admin/);
  assert.doesNotMatch(admin, /purple|blue|gradient/);
});
test("resource actions hide missing or unsafe URLs and invoice action uses the authorized link", () => {
  for (const url of [null, "", "  ", "javascript:alert(1)", "data:text/html,x", "https://user:secret@example.com", "/relative"]) {
    assert.equal(validResourceUrl(url), ""); assert.equal(render(Resource, { url }), "");
  }
  const html = render(Resource, { url: "https://example.com/invoice", download: true, label: "Invoice" });
  assert.match(html, /download=/); assert.match(html, />Invoice</); assert.match(html, /noopener noreferrer/);
});
test("empty project details are absent and real text remains available", () => {
  for (const text of [null, undefined, "", "  ", "\n\t"]) assert.equal(hasProjectDetails(text), false);
  assert.equal(hasProjectDetails(" Project brief "), true);
});
test("progress uses actual data and only active services pulse with reduced-motion support", () => {
  const item = { serviceProgress: { type: "quantity_based", displayStatus: "in_progress", progressPercent: 50, completedCount: 1, totalCount: 2 } };
  const active = render(Progress, { item, compact: true });
  assert.match(active, /aria-valuenow="50"/); assert.match(active, /bg-blue-500/); assert.match(active, /motion-safe:animate-pulse/);
  assert.doesNotMatch(render(Progress, { item, inactive: true }), /animate-pulse/);
  for (const status of ["pending_start", "completed"]) {
    const html = render(Progress, { item: { serviceProgress: { ...item.serviceProgress, displayStatus: status } } });
    assert.doesNotMatch(html, /animate-pulse/);
    if (status === "completed") assert.match(html, /bg-emerald-500/);
  }
  const unknown = render(Progress, { item: { serviceProgress: { type: "quantity_based", displayStatus: "in_progress" } } });
  assert.doesNotMatch(unknown, /role="progressbar"/);
});
test("delivery editors appear only for eligible staff-managed items", () => {
  const item = { _id: "one", supportsDelivery: true, serviceSnapshot: { name: "Reels" } };
  assert.equal(render(Delivery, { item }), "");
  assert.match(render(Delivery, { item, onSave() {} }), /Service delivery link/);
  assert.equal(render(Delivery, { item: { ...item, supportsDelivery: false }, onSave() {} }), "");
  const html = render(Delivery, { item: { ...item, delivery: { url: "https://example.com/reels" } } });
  assert.match(html, /Open delivery/); assert.doesNotMatch(html, /Save link/);
});
test("supported order statuses share compact labels and icons", () => {
  for (const [status, label] of [["pending", "Pending"], ["processing", "Processing"], ["in_progress", "In Progress"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["failed", "Failed"]]) {
    const html = render(Badge, { status }); assert.match(html, /<svg/); assert.ok(html.includes(label));
  }
});

test("shared select preserves numeric values, names, required validation and disabled state", () => {
  const html = render(Select, { value: 0, onChange() {}, name: "quantity", required: true,
    disabled: true, "aria-label": "Quantity", options: [{ value: 0, label: "Zero" }] });
  assert.match(html, /role="combobox"/);
  assert.match(html, /aria-label="Quantity"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /name="quantity"/);
  assert.match(html, /value="0"/);
  assert.match(html, /required=""/);
  assert.match(html, /disabled=""/);
  assert.match(html, />Zero</);
  assert.doesNotMatch(html, /role="listbox"/);
});

test("select navigation wraps, skips disabled options, and supports typeahead", () => {
  const options = [{ value: "a", label: "Apple" }, { value: "b", label: "Banana", disabled: true },
    { value: "c", label: "Cherry" }, { value: "d", label: "Apricot" }];
  assert.equal(findEnabledOption(options, -1, 1), 0);
  assert.equal(findEnabledOption(options, options.length, -1), 3);
  assert.equal(findEnabledOption(options, 0, 1), 2);
  assert.equal(findEnabledOption(options, 0, -1), 3);
  assert.equal(findEnabledOption([], 0, 1), -1);
  assert.equal(findEnabledOption([{ disabled: true }], 0, 1), -1);
  assert.equal(findTypeaheadOption(options, 0, "a"), 3);
  assert.equal(findTypeaheadOption(options, 3, "ap"), 0);
  assert.equal(findTypeaheadOption(options, -1, "B"), -1);
});

test("dropdown placement fits mobile, tablet and desktop viewports and opens above low triggers", () => {
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1440, 900]]) {
    for (const top of [20, height / 2, height - 70]) {
      const rect = { left: 16, top, bottom: top + 44, width: width - 32 };
      const p = getSelectPlacement(rect, width, height);
      assert.ok(p.left >= 8);
      assert.ok(p.left + p.width <= width - 8);
      assert.ok(p.maxHeight >= 0 && p.maxHeight <= 288);
      if (p.top !== undefined) assert.ok(p.top + p.maxHeight <= height - 8);
      else assert.ok(height - p.bottom - p.maxHeight >= 8);
    }
  }
  const up = getSelectPlacement({ left: 900, top: 700, bottom: 744, width: 300 }, 1024, 768);
  assert.ok(up.bottom > 0); assert.equal(up.top, undefined); assert.ok(up.left + up.width <= 1016);
});

test("draft labels normalize generated titles while preserving custom names and data", () => {
  const draft = { title: "Draft 24/10/2026", updatedAt: "2026-10-25T10:00:00Z" };
  assert.equal(getDraftLabel(draft), "Draft \u00b7 24 Oct 2026");
  assert.equal(draft.title, "Draft 24/10/2026");
  assert.equal(getDraftLabel({ title: "Campaign launch" }), "Campaign launch");
  assert.equal(formatDraftDate("invalid"), "recently");
  assert.equal(getDraftLabel({}), "Saved draft");
});

test("contact form reuses the accessible service select without changing submission validation", async () => {
  const ContactForm = (await server.ssrLoadModule("/src/components/public/contact/ContactForm.jsx")).default;
  const html = render(ContactForm, {});
  assert.equal((html.match(/role="combobox"/g) || []).length, 1);
  assert.match(html, /id="service"/);
  assert.match(html, /aria-label="Service"/);
  assert.match(html, /aria-required="true"/);
  assert.match(html, /novalidate=""/i);
  assert.match(html, />Select a service</);
  assert.doesNotMatch(html, /<select/);
});


test("payment badges distinguish pending, failed, refunded and settled payments across views", () => {
  for (const [status, label, color] of [
    ["paid", "Payment Done", "emerald"], ["collected", "Payment Done", "emerald"],
    ["pending", "Pending", "amber"], ["processing", "Processing", "blue"],
    ["failed", "Failed", "red"], ["refunded", "Refunded", "blue"],
  ]) {
    const html = render(PaymentBadge, { status });
    assert.ok(html.includes(`Payment: ${label}`));
    assert.ok(html.includes(`text-${color}-700`));
    assert.match(html, /aria-hidden="true"/);
  }
  for (const status of [undefined, "chargeback_review"]) {
    const html = render(PaymentBadge, { status });
    assert.match(html, /text-zinc-600/);
    assert.doesNotMatch(html, /emerald/);
  }
  assert.match(render(PaymentBadge, { status: "PAID" }), /Payment: Payment Done/);
});

test("custom validation can announce required selects without adding browser validation", () => {
  const html = render(Select, { id: "order-field", value: "", onChange() {}, options: [],
    "aria-label": "Project type", "aria-required": true, "aria-describedby": "project-help" });
  assert.match(html, /aria-required="true"/);
  assert.match(html, /aria-describedby="project-help"/);
  assert.match(html, /id="order-field"/);
  assert.doesNotMatch(html, /<input/);
});


test("PIN entry is available only for generated active unpaid collection orders", () => {
  const order = { paymentMethod: "cod", codPinStatus: "active", paymentStatus: "pending", orderStatus: "processing" };
  assert.equal(canEnterPaymentPin(order), true);
  assert.equal(canEnterPaymentPin({ ...order, paymentMethod: "cheque" }), true);
  for (const codPinStatus of [undefined, "not_generated", "disabled", "locked", "expired", "verified", "used"]) {
    assert.equal(canEnterPaymentPin({ ...order, codPinStatus }), false);
  }
  for (const paymentMethod of ["online", "month_end"]) {
    assert.equal(canEnterPaymentPin({ ...order, paymentMethod }), false);
  }
  for (const paymentStatus of ["paid", "collected"]) {
    assert.equal(canEnterPaymentPin({ ...order, paymentStatus }), false);
  }
  for (const orderStatus of ["cancelled", "rejected"]) {
    assert.equal(canEnterPaymentPin({ ...order, orderStatus }), false);
  }
  assert.equal(canEnterPaymentPin(null), false);
});

test("PIN verification requires saved payment confirmation and never invents a success fallback", () => {
  const order = { paymentStatus: "pending", codPinStatus: "active" };
  const update = getVerifiedPaymentUpdate(order, { order: {
    paymentStatus: "paid", codPinStatus: "used", codCollectedAt: "2026-10-27T10:00:00Z",
    codPinVerifiedAt: "2026-10-27T10:00:00Z",
  } });
  assert.equal(update.paymentStatus, "paid");
  assert.equal(update.codPinStatus, "used");
  assert.equal(update.codCollectedAt, "2026-10-27T10:00:00Z");
  assert.equal(canEnterPaymentPin({ ...order, ...update, paymentMethod: "cod" }), false);
  assert.throws(() => getVerifiedPaymentUpdate(order, { order: { codPinStatus: "used" } }), /confirmation was incomplete/);
  assert.throws(() => getVerifiedPaymentUpdate(order, {}), /confirmation was incomplete/);
  assert.equal(order.paymentStatus, "pending");
});


test("active filters show selected values, escape search text and keep clearing outside form submission", () => {
  assert.equal(render(Filters, { filters: [{ label: "Search", value: "  " }, { label: "Status", value: "" }], onClear() {} }), "");
  const html = render(Filters, { filters: [{ label: "Search", value: "<script>alert(1)</script>" }, { label: "Status", value: "active" }], onClear() {} });
  assert.match(html, /aria-label="Active filters"/);
  assert.match(html, /aria-label="Clear all filters"/);
  assert.match(html, /type="button"/);
  assert.ok(html.includes("active"));
  assert.doesNotMatch(html, /<script>/);
});

test("form feedback announces errors and successful saves with different live priorities", () => {
  assert.equal(render(Feedback, { message: "" }), "");
  assert.match(render(Feedback, { message: "Unable to save." }), /role="alert"/);
  const saved = render(Feedback, { message: "Saved.", tone: "success" });
  assert.match(saved, /role="status"/);
  assert.match(saved, /Saved\./);
  assert.match(saved, /aria-hidden="true"/);
});

test("nested dialog scroll locks restore the original page state regardless of close order", () => {
  for (const reverse of [false, true]) {
    const body = { style: { overflow: "auto" } };
    const first = lockBodyScroll(body);
    const second = lockBodyScroll(body);
    assert.equal(body.style.overflow, "hidden");
    const release = reverse ? [second, first] : [first, second];
    release[0]();
    assert.equal(body.style.overflow, "hidden");
    release[1]();
    assert.equal(body.style.overflow, "auto");
    release[1]();
    assert.equal(body.style.overflow, "auto");
  }
});

test("modal positioning follows keyboard-reduced viewport height and vertical offset", () => {
  assert.deepEqual(getModalViewport({ height: 800, offsetTop: 0 }, 800), { height: 800, top: 0 });
  assert.deepEqual(getModalViewport({ height: 280, offsetTop: 120 }, 800), { height: 280, top: 120 });
  assert.deepEqual(getModalViewport(null, 640), { height: 640, top: 0 });
  assert.deepEqual(getModalViewport({ height: 0, offsetTop: -10 }, 640), { height: 640, top: 0 });
  assert.equal(render(Modal, { open: false }), "");
  assert.equal(render(Confirm, { open: false }), "");
});


test("select menus inside native dialogs stay in the interactive top layer", () => {
  const body = {};
  const dialog = {};
  assert.equal(getSelectPortalTarget({ closest(selector) { assert.equal(selector, "dialog[open]"); return dialog; } }, body), dialog);
  assert.equal(getSelectPortalTarget({ closest() { return null; } }, body), body);
  assert.equal(getSelectPortalTarget(null, body), body);
});


test("client details offer inline entry only for active collection PINs and confirm Paid", () => {
  const user = { role: "client", _id: "owner" };
  for (const paymentMethod of ["cod", "cheque"]) {
    const order = { _id: "order", client: "owner", paymentMethod, paymentStatus: "pending", codPinStatus: "active" };
    const html = render(ClientPin, { order, user, onVerified() {} });
    assert.match(html, /type="password"/); assert.match(html, /Verify PIN/);
    for (const codPinStatus of ["not_generated", "disabled", "expired", "locked", "used"]) {
      assert.doesNotMatch(render(ClientPin, { order: { ...order, codPinStatus }, user }), /<input|Verify PIN/);
    }
    const paid = render(ClientPin, { order: { ...order, paymentStatus: "paid", codPinStatus: "used" }, user });
    assert.match(paid, /Payment Done/); assert.doesNotMatch(paid, /<input|Verify PIN/);
    for (const role of ["admin", "employee"]) assert.equal(render(ClientPin, { order, user: { role } }), "");
  }
});
