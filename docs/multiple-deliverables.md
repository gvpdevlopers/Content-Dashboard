# Multiple deliverables and delivery links

Implemented in the existing order/service progress structure. Open an admin or employee order, find **Service deliverables**, and choose **Edit deliverable**. Set its status, add labeled links and optional client-visible notes, then save. Clients see each output and its available links without editing controls.

## Output counts and stored data

- The existing `items[].serviceProgress.deliverables` array is extended rather than creating a competing status array. Pre-item orders use `serviceProgress.deliverables`.
- Each output has a stable ID and compatibility key, name, pending/in_progress/completed status, links, notes, created/updated timestamps and completion timestamp.
- Grid quantities create Grid 1, Grid 2, etc. The saved single-post pricing mode creates Post labels.
- Reels count saved repeatable `reels` entries, preferring saved snapshot items and falling back to saved form data. Shoot, host, editing, voice-over and other pricing quantities never increase this count.
- Delivery-enabled per-unit video/design/image/post services use their purchased service quantity. Ambiguous subscriptions receive one shared handoff; no fictional output count is inferred.
- Existing saved output arrays remain authoritative. Current service catalogue changes cannot change the saved outputs.

## Progress and integrity

Pending contributes 0%, In Progress 50%, Completed 100%. Completed counts and progress are calculated on the backend. A status edit affects only the selected output. Completion timestamps clear when an output is reopened.

All tracked services must be complete before automatic order completion. Untracked services prevent automatic completion. Calendar-based services retain their existing scheduling and require staff completion as well as completed outputs. Links/notes alone do not reopen a manually completed order. Cancelled/inactive and credit-released orders cannot be edited. Payments, invoices and tax calculations are unchanged.

Admin and employee PATCH routes use the existing authentication and role guards plus controller validation. Only HTTP/HTTPS links without credentials are accepted; duplicate links and invalid statuses are rejected. Limits: 20 links per output, 120-character labels, 2,048-character URLs and 4,000-character notes. Optimistic order guards and per-output timestamps reject conflicting edits. Hidden `fulfillmentHistory` records actor, time, changed fields and status transitions.

## Backward compatibility

No bulk migration or remote database write is required. Reads derive missing outputs from saved order data. The previous service link appears once on the first output as **Previous service delivery (shared)**; it is not treated as completion or duplicated across all outputs. On first edit the full output plan is persisted with `deliveryVersion: 1`. Clearing a migrated link stays cleared. The original legacy link remains stored for history. Whole-order legacy handoff links retain their existing separate display and visibility rules.

Legacy progress without timestamps keeps stable IDs and nullable dates until the first edit, which fills timestamps using the order creation date. New outputs receive timestamps at creation. The old status-only API delegates to the new update path. The old single-service-link API remains available for unmigrated orders and rejects writes after migration to prevent conflicting link sources.

## Files involved

Backend:
- `server/models/Order.js`
- `server/config/serviceDelivery.js`
- `server/utils/serviceDeliverables.js`
- `server/controllers/orderController.js`
- `server/routes/orderRoutes.js`

Frontend:
- `client/src/components/ServiceDelivery.jsx`
- `client/src/components/ServiceProgress.jsx`
- `client/src/components/OrderItemsOverview.jsx`
- `client/src/pages/admin/AdminOrderDetails.jsx` (shared by admin and employee)
- `client/src/services/adminOrderService.js`

The existing client order details page consumes the shared order overview and needs no separate editor or API.

Tests and evidence:
- `server/tests/deliverables.test.js`
- `server/tests/helpers/deliverableWorkflow.js`
- `server/tests/package-workflow.test.js`
- `server/tests/service-delivery.test.js`
- `client/tests/order-ui.test.mjs`
- `artifacts/deliverables/` contains browser script, screenshots, results and command logs.

## Verification actually executed

- Full backend suite: 151 passed, 1 optional existing-catalogue-copy test skipped.
- Final focused backend regression after additional legacy timestamp/ID coverage: 34 passed, 1 optional test skipped.
- Frontend suite: 43 passed.
- Browser: 11 checks passed using mocked API responses in headless Edge. Admin/employee edits, multiple links, replacement/removal/cancel, conflict recovery, client read-only display, weighted progress and 1440/768/390/360px overflow checks.
- Persistence and authenticated-route tests use an isolated local MongoDB instance and synthetic fixtures, not the remote development database.
- ESLint and production build passed; build reports the existing large-bundle warning.

No live Razorpay transaction was performed. No external file download was verified; delivery links open the supplied provider URL, where file access/download permissions remain controlled by that provider.
