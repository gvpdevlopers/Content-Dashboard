# Lint and loader cleanup - 28 October 2026

The six previously reported service-access/order fixes remain in place. All remaining project-wide ESLint findings have now been resolved, with no lint rule suppressions or ESLint configuration changes.

## Changes

- A shared `useAsyncResource` hook loads data on mount and manages event-driven refresh states separately. The request controller ignores superseded and unmounted requests. Successful mutations invalidate older in-flight refreshes so their responses cannot overwrite the saved data.
- Dashboard, Order History, admin Dashboard, Orders, Services, Coupons, Users, order details, user details and COD management now use the loader. Staff/admin order requests depend on the current role, and details forms reset when their route record changes. Employee/admin user details still do not fetch client orders.
- User search/status/role filters and progressive pagination update together in a reducer. Returning to a previous filter also resets the visible batch, without a state-reset effect or an additional filter-driven network request.
- The auth context and useAuth hook live in `context/authSessionContext.js`; `context/AuthContext.jsx` exports only the provider, allowing Fast Refresh. All local consumers were updated to the shared context.

## Validation

- `npm run lint` in client: passed, zero errors and zero warnings.
- Server suite: all 89 tests passed, including disposable local MongoDB transaction checks.
- Frontend suites: all 29 tests passed. Four new tests cover out-of-order results, cleanup cancellation, retry/error ordering and pagination resets.
- Production Vite/PWA build: passed. Its existing bundle-size advisory remains.
- No browser verification or production migration was performed in this cleanup.
