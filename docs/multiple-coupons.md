# Multiple coupons at checkout

Implemented 3 November 2026.

## How it works

Clients can add up to five distinct coupons in New Order. Each coupon has its own Remove action. Coupons apply in the displayed order to remaining eligible charges; remove and re-add a coupon to change that order. Percentage, fixed-amount, whole-service, global and specific-option coupons can be combined. A coupon that has no remaining eligible charge or fails validation blocks checkout until removed. Duplicate codes are rejected after trimming and uppercasing.

Example: a voice-over charge of INR 2,500, followed by a 20% service coupon and an INR 1,000 option coupon, becomes INR 1,000 before GST. With 18% GST the final total is INR 1,180. Reversing the coupons changes the calculation: (2,500 - 1,000) x 80% = 1,200 before GST.

All calculation and eligibility checks are server-side. Each coupon retains its expiry, minimum spend, total/per-client usage limits and existing service permissions. Minimum spend is evaluated against the original basket. Ad spend remains excluded. Component balances use paise allocation so overlapping discounts cannot exceed the remaining charges. Package allocations and subsequent ad-credit/payment calculations continue through the existing paths.

The order retains a combined couponSnapshot for compatibility plus individual couponSnapshots with the actual sequential calculations. Client/admin order details show individual discounts. Each coupon gets its own usage row and count, committed with the order in one transaction. A failure on any coupon rolls back every reservation and the order. Usage reports show the actual final order total. Drafts persist couponCodes; legacy single couponCode requests and drafts remain supported.

## Database compatibility

The previous CouponUsage collection had a unique index on order alone, allowing only one coupon per order. Before the first multi-coupon order is saved, ensureStackedCouponIndex creates the unique (order, coupon) index and removes only obsolete unique order-only indexes. Existing usage rows are preserved. This operation requires the application's database account to have index-management privileges. No remote database migration was run during this implementation; the upgrade was tested against an isolated local database containing the legacy index. The operation is repeatable, and a failure prevents checkout without partially saving an order.

## Files changed for this task

- client/src/pages/NewOrder.jsx
- client/src/pages/OrderDetails.jsx
- client/src/pages/admin/AdminOrderDetails.jsx
- server/controllers/orderController.js
- server/controllers/draftController.js
- server/controllers/orderArchiveController.js (include per-coupon snapshots in archive audit)
- server/models/Order.js
- server/models/OrderDraft.js
- server/models/CouponUsage.js
- server/utils/couponCodes.js (new)
- server/utils/couponStack.js (new)
- server/tests/coupon-stack.test.js (new)
- server/tests/package-workflow.test.js

## Verification

- Six focused stacking tests passed: percentage/fixed sequencing, overlap/caps, original minimum spend, unrelated services/ad spend, legacy/duplicate input validation and paise conservation.
- Isolated MongoDB workflow passed: 15 passed, one opt-in remote catalogue test skipped. Verifies separate snapshots/usages, legacy index upgrade, draft coupon arrays, per-client limits and rollback when the second coupon becomes unavailable.
- Existing frontend tests: 43 passed.
- Nine headless Edge browser checks with mocked APIs passed: draft restoration, remove, add, duplicate rejection, invalid-code recovery, GST revalidation, draft saving, mobile overflow and no page errors.
- Frontend lint and production build passed. Existing bundle-size warning remains.
- Final full backend suite: 139 passed, 0 failed, 1 opt-in test skipped. Results are in artifacts/coupon-stack/backend-tests.log.

No remote records were changed, no real payment was initiated, and nothing was committed or deployed. Browser fixtures do not replace the real database calculation tests. Temporary browser tooling was removed after testing.
