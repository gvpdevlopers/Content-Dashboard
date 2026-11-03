# Service-option coupon discounts

Implemented 3 November 2026.

## Behavior

Admin Coupons supports All services, Individual service, and Specific service options / add-ons. The existing category tabs and reusable searchable CustomSelect multi-select are retained. Multiple targets can be selected per service. Percentage and fixed-amount discounts are supported. A fixed global discount is allocated once across the eligible order charges; a fixed service/option discount is applied once to the eligible charges for that configured service, not once per option or quantity. Discounts cannot exceed eligible charges.

The previous schema supported only per-service percentages. Existing coupons retain that behavior without migration. The existing expiry, minimum spend, usage limits, account/service permissions, transaction handling and GST calculation remain in use. An existing MongoDB bug in per-client usage reservation was fixed: an upsert cannot use `$expr`; a normal usageCount predicate and the existing unique coupon/client index enforce the atomic limit.

Targets are supplied by the backend from current service schemas: pricing-option ObjectIds and scoped internal field names/option values. Display labels are not identifiers. Paid service fields, option fields, numeric priced fields, and repeatable configurations are supported. Unpriced informational fields do not become discount targets. Ad budgets remain excluded. Package prices proportionally scale eligible components. A deleted/inactive/renamed internal key cannot match an unrelated label; a changed display label continues to match its existing key. Invalid or duplicate configured targets are rejected.

The server derives components from validated, cleaned order selections and actual prices. Client totals are not trusted. Order and coupon-usage snapshots store scope, discount type/value, component keys, display labels, eligible amounts and applied discounts. New Order and admin order details display the targeted options and distinguish fixed discounts from percentages.

## Modified source files

- client/src/pages/admin/AdminCoupons.jsx
- client/src/services/couponService.js
- client/src/pages/NewOrder.jsx
- client/src/pages/admin/AdminOrderDetails.jsx
- server/models/Coupon.js
- server/models/Order.js
- server/models/CouponUsage.js
- server/controllers/couponController.js
- server/controllers/orderController.js
- server/routes/couponRoutes.js
- server/utils/couponTargets.js (new)
- server/utils/packagePricing.js
- server/tests/coupon-options.test.js (new)
- server/tests/package-workflow.test.js

## Executed verification

- `npm --prefix server test`: 124 passed, 0 failed, 1 skipped. Includes real isolated local MongoDB transactions, persisted order/usage snapshots, option coupon checkout, later price/label edits, legacy package checkout and existing payment regressions. The skipped test is the opt-in remote-catalogue clone test.
- `node --test --experimental-test-isolation=none server/tests/coupon-options.test.js`: 13 passed, including two additional final edge-case tests for ad budgets and numeric/boolean fields.
- `node --test --experimental-test-isolation=none tests/*.test.mjs` in client: 43 passed.
- `npm --prefix client run lint`: passed.
- `npm --prefix client run build`: passed; existing large-bundle warning remains.
- Headless Edge browser with mocked API fixtures: 7 checks passed (option selection/payload, edit persistence, fixed discounts, activation persistence, global fixed coupon, 390px layout, no page errors). Screenshots and test script are in artifacts/coupon-options. Temporary Playwright installation was removed after testing; the script requires Playwright and Edge to rerun.
- `git diff --check`: passed.

No remote database records were modified, no real payment was initiated, and no changes were committed or deployed. Browser checks use fixtures; backend persistence checks use an isolated disposable local database. A live Razorpay payment was not performed. Pre-existing client/index.html and client/vite.config.js working-tree status was left untouched.
