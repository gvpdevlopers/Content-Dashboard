# Completed-order status changes

In Admin or Employee Order Details, use **Change Status**. Completed orders remain editable. Selecting another status opens the shared confirmation dialog with the order number and proposed transition. Cancel sends no update; confirming submits the change. Valid statuses are Pending, Processing, In Progress, On Hold, Completed and Cancelled.

## Implementation

The existing overall-order API already allowed reopening completed orders. This change adds a clear UI confirmation, a backend confirmation requirement, role validation, stale-edit protection and a persistent audit trail. On Hold is a new supported status.

`statusHistory` appends the previous status, new status, actor ID, timestamp and source. Existing fulfillment history is retained. Automatic order transitions from deliverables also append status history. No-op status updates do not duplicate entries. History is available in staff/admin order responses and excluded from client responses.

The API accepts `expectedStatus` and `confirmCompleted`. A completed-to-other transition without explicit confirmation returns 409. A stale expected status or concurrent database edit also returns 409. The existing cancellation/ad-credit reconciliation safeguards remain: an order whose credit has been returned cannot be reopened. Payment status, amounts, GST, invoices and saved deliverables are not changed by ordinary status transitions.

On Hold remains in place when deliverables change, until staff explicitly changes the order status. Deliverable statuses are not reset when the overall order is reopened.

Read-only dashboards, order lists and client tracking refresh on status-change events, cross-tab storage events and window focus, and every 30 seconds while visible. Editor forms are excluded to preserve unsaved drafts. The existing statistics recalculate from refreshed orders; On Hold appears in the shared badges and status filters and remains an active employee order.

## Files changed for this feature

- `server/models/Order.js`
- `server/controllers/orderController.js`
- `server/utils/adCreditCancellation.js`
- `server/utils/serviceDeliverables.js`
- `client/src/services/adminOrderService.js`
- `client/src/hooks/useOrderStatusRefresh.js`
- `client/src/components/OrderStatusBadge.jsx`
- `client/src/pages/admin/AdminOrderDetails.jsx`
- `client/src/pages/admin/AdminOrders.jsx`
- `client/src/pages/admin/AdminDashboard.jsx`
- `client/src/pages/Dashboard.jsx`
- `client/src/pages/EmployeeDashboard.jsx`
- `client/src/pages/OrderDetails.jsx`
- `client/src/pages/OrderHistory.jsx`
- `server/tests/helpers/orderStatusWorkflow.js`
- `server/tests/package-workflow.test.js`

## Verification

Full backend suite: 154 passed, 1 optional catalogue-copy test skipped. New isolated MongoDB tests cover admin and employee completion/reopening to Pending, In Progress and On Hold; confirmation enforcement; client denial; invalid/stale updates; audit append behavior; unchanged payments, invoice and deliveries; client/staff list visibility; and preserving On Hold during output updates.

Frontend suite: 43 passed. ESLint passed. Production build passed with the existing large-bundle warning. Detailed logs and browser evidence are under `artifacts/order-status/`. No remote database records or live payment transactions were used.

Browser verification: 9 checks passed in headless Edge with mocked APIs, including both role confirmations/cancel, completing and reopening to all three requested earlier states, payment preservation, client read-only display, refresh handling, 390px overflow and no page errors.
