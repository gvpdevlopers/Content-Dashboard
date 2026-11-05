# Current-code review and fixes

Reviewed the recent status, scheduling, deliverable, coupon-stack and checkout changes and ran the available regression checks. This is a targeted code review and automated verification, not a guarantee that every application path is bug-free.

## Confirmed fixes

1. Scheduled services could activate during an order read or background job even if the order was cancelled, on hold, completed or had released ad credit. Automatic activation now skips these orders.
2. The service-progress endpoint read its progress before activating an overdue schedule. Completing a newly due service could therefore fail with an invalid-action error. It now normalizes the selected service's due start before validating the requested action, without mutating other services in memory.
3. Empty/null request bodies on order-status and service-progress endpoints could throw and produce HTTP 500. They now produce validation errors.
4. The delivery editor used `crypto.randomUUID()` for temporary row IDs. This API can be missing on HTTP/LAN development addresses. Temporary link rows now use a component-local counter with React's stable ID instead.

## Files changed in this review

- `server/controllers/orderController.js`
- `server/utils/serviceDeliverables.js`
- `client/src/components/ServiceDelivery.jsx`
- `server/tests/helpers/orderStatusWorkflow.js`
- `artifacts/code-review/` contains test logs and browser evidence.

Existing uncommitted feature work was preserved. No dependencies were added, and no remote database records, payment transactions, commits or deployments were performed.

## Verification

- New isolated-database regression covers inactive scheduled orders, the scheduler, completing an overdue service without a preceding read, and null request bodies.
- Frontend tests: 43 passed.
- Browser regression: all deliverable checks passed with `crypto.randomUUID` explicitly disabled, including admin/employee editing, add/replace/remove links, stale-write feedback, client visibility and responsive layouts.
- ESLint and production build passed. The build retains its existing large-bundle warning.
- Initial backend run: 147 passed, 1 optional test skipped, and 1 integration-suite startup failure (temporary MongoDB connection timeout). The database suite passed on the isolated rerun: all 8 tests passed. See `database-retry.log`. No application failure remained reproducible.
