# Admin order archive / restore

Implemented 3 November 2026.

## Behavior

The Delete action in the desktop/mobile admin order list and admin order details performs a recoverable archive. The confirmation identifies the order number and database ID and explains that records are retained. Because this is recoverable, the interface does not falsely describe it as irreversible. The Archived orders selector provides a Restore action.

Only authenticated administrators may archive or restore, enforced both in route middleware and in the controller. Employees and clients see no archive controls. Paid/collected/processing payments, active collection PINs, in-progress/completed orders and active service progress require an explicit second warning. The backend rechecks this condition. An optimistic updatedAt condition rejects concurrent changes rather than applying a stale confirmation.

Archiving is an admin-list visibility change, not cancellation: client order history, staff fulfilment, COD/cheque collection, Razorpay callbacks and reconciliation remain available. Use the existing cancellation/refund workflows when those are intended. Active admin lists and dashboard statistics exclude archived orders. Lists reload immediately after archive/restore; dashboards refresh on mount, focus and an archive-change event.

The original order, financial references, coupon usage, ad-credit records, invoices and delivery links are retained. No files or external transactions are deleted. Invoice and delivery resources are URL references in the existing schema. The order stores archivedAt/archivedBy and an append-only archiveHistory recording action, actor ID, timestamp, order/service/financial snapshots and resource links. The history is excluded from ordinary queries, including client/staff responses. Authorized database recovery/audit can select it explicitly. Restore appends a new event; it does not remove the original archive event.

## Files changed for this task

- client/src/components/OrderArchiveAction.jsx (new shared admin action)
- client/src/pages/admin/AdminOrders.jsx
- client/src/pages/admin/AdminOrderDetails.jsx
- client/src/pages/admin/AdminDashboard.jsx
- client/src/services/adminOrderService.js
- server/models/Order.js
- server/controllers/orderArchiveController.js (new)
- server/controllers/orderController.js (admin listing filter only)
- server/routes/orderRoutes.js
- server/tests/order-archive.test.js (new)
- server/tests/ad-credit.test.js and server/tests/service-delivery.test.js (add DELETE support to existing router mocks)
- server/tests/package-workflow.test.js (isolated persistence test)

Earlier coupon changes and pre-existing workspace modifications remain intact.

## Verification

- Final full backend suite (`npm --prefix server test`): 132 passed, 0 failed, 1 opt-in test skipped. Includes existing payment, coupon, package, access, delivery, concurrency and archive regressions.

- Focused archive tests: 5 passed (admin authorization, additional warning, concurrency, audit, restore and route protection).
- Isolated local MongoDB workflow: 14 passed, 1 opt-in remote-catalogue test skipped. Includes real archive/restore persistence, retained financial/resource references, retained client access, filtered admin lists and audit history.
- Frontend tests: 43 passed.
- Headless Edge with mocked APIs: 8 checks passed (cancel without writes, additional paid-order warning, archive refresh, archive filtering, restore, 390px layout, employee restrictions, no page errors). See artifacts/order-archive for scripts, results and screenshots.
- Frontend lint and production build passed. The pre-existing bundle-size warning remains.
- git diff --check passed.
- Initial broad runs exposed an isolated MongoDB startup timeout and two old router mocks without DELETE support; the mocks were updated without changing their authorization assertions. The final serial rerun is recorded in artifacts/order-archive/backend-tests.log.

No real orders were archived, remote database records modified, files deleted, payments initiated, commits created or deployments performed. Temporary browser tooling was removed after testing.
