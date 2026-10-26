import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { validResourceUrl, hasProjectDetails } from "../src/utils/orderResources.js";
import { getSelectPlacement, findEnabledOption, findTypeaheadOption } from "../src/utils/selectNavigation.js";
import { getDraftLabel, formatDraftDate } from "../src/utils/draftLabels.js";
let server, Progress, Delivery, Resource, Badge, Select;
before(async () => {
  server = await createServer({ configFile: false, plugins: [react()], optimizeDeps: { noDiscovery: true, entries: [] }, resolve: { preserveSymlinks: true }, server: { middlewareMode: true }, appType: "custom" });
  Select = (await server.ssrLoadModule("/src/components/CustomSelect.jsx")).default;
  Progress = (await server.ssrLoadModule("/src/components/ServiceProgress.jsx")).default;
  Delivery = (await server.ssrLoadModule("/src/components/ServiceDelivery.jsx")).default;
  Resource = (await server.ssrLoadModule("/src/components/OrderResourceAction.jsx")).default;
  Badge = (await server.ssrLoadModule("/src/components/OrderStatusBadge.jsx")).default;
});
after(async () => { await server?.close(); });
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
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
  assert.equal(getDraftLabel(draft), "Draft ? 24 Oct 2026");
  assert.equal(draft.title, "Draft 24/10/2026");
  assert.equal(getDraftLabel({ title: "Campaign launch" }), "Campaign launch");
  assert.equal(formatDraftDate("invalid"), "recently");
  assert.equal(getDraftLabel({}), "Saved draft");
});
