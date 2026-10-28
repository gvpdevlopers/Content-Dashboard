# Functionality audit and UI improvements — 28 October 2026

> PIN workflow correction: [Client-only payment PIN policy](CLIENT_ONLY_PAYMENT_PIN_WORKFLOW.md) supersedes historical staff-verification and cheque-pending descriptions below.

## Subsequent PIN policy change

At the user's request, automatic PIN expiry was removed after the audit below. Active PINs now have no time limit, including already-active records; successful use, cancellation and the existing five-attempt lock still invalidate/block verification. Explicitly persisted legacy expired PINs are not revived. Admin-only `POST /api/cod/disable` atomically disables an active PIN and removes its secret without changing payment status. Disable controls are available in Admin Order Details and PIN Management, including for locked PINs. Employee cards no longer display an expiry time. An active usable PIN cannot be replaced merely because it is old; disable it first. No migration or application-data edit is needed. The isolated integration now checks 120-day-old PIN availability/verification, unauthorized disable rejection, persisted disabling, employee-list removal, old-PIN rejection, regeneration and lock status. Historical expiry descriptions in the original audit reflect the earlier implementation and are superseded by this section.

## Scope and audit findings

### Subsequent PIN visibility and staff verification fix

The user reported missing PIN entry after the policy change. Confirmed causes: staff Order Details hid the PIN card entirely; generic admin detail reads intentionally excluded the PIN secret but the UI offered no authorized way to retrieve it after refresh; admin/staff order rows had no PIN actions. `OrderPaymentPinActions` now supplies shared View PIN and Enter Payment PIN controls inside admin/employee details and desktop/mobile rows. The client detail page also has an entry shortcut above configuration; client history row entry remains. Existing full-row navigation is preserved through a sibling overlay link so buttons are not nested inside anchors.

Admins and assigned employees can now verify PINs in addition to the owning client. Employee authorization is checked against `codPinEmployee` both before verification and in the atomic update. The backend records the actor in optional `codPinVerifiedBy`, strips that field from client payloads, and preserves cash `collected` versus cheque collection/payment pending. Authorized secret lookup uses the existing staff-only endpoint scoped by an optional validated order ID; no secret is embedded in initial row markup or unrelated client/staff APIs. Explicit admin lookup also supports an older active unassigned PIN. Consumed/disabled/cancelled/locked PINs are not retrievable. Active admin/employee lists refresh; a local verification updates their payment badges immediately. Late detail polling cannot revert a locally verified payment to active.

Verification for this follow-up: full backend suite **95 passed**, including actual database verification by admin and assigned employee, actor persistence, wrong PINs leaving payment pending, other-employee rejection and scoped PIN lookup. Frontend order UI **23 passed** and PIN/permission utility suite **4 passed**. Lint, native-loader production build, syntax and whitespace checks passed. No application database edits, live PINs, browser visual pass, migrations or new environment variables were introduced.

Inspected the existing Service/User/Order schemas, service/admin-user/order/COD controllers and routes, session authentication and role guards, draft and coupon handling, snapshot/pricing logic, dynamic New Order fields, staff workspace, payment badges, admin order details and shared form/select styles. Existing architecture and unrelated uncommitted work were retained. No application/remote database records were changed and no live PINs were generated during this audit.

- Content, SEO and Development share the same service catalogue, dynamic fields, server quote/checkout, snapshot, draft and repeat-order paths. Public visibility and ordering authorization remain independent. No separate catalogue or checkout was added.
- Cash PIN verification already atomically completed payment using the existing `collected` status. Cheque PIN verification only acknowledged collection, not bank clearance/payment; converting that to paid would falsely record payment. That distinction remains intact.
- Confirmed PIN gaps: no employee assignment or scoped employee PIN endpoint; cancellation checks only covered returned ad credit; COD orders already marked `paid` were not explicitly excluded; verification relied solely on the legacy JWT `userId` alias rather than the current authenticated `_id`.
- New Order select fields, including configured website platforms, already used CustomSelect and preserve schema-defined values. The access editor still used a native access-type dropdown and a separate checkbox catalogue; it now uses custom dropdowns with explicit multi-service selections and search.
- Existing progress/detail delivery capability is service-dependent. SEO/Development retain the shared order status, order delivery link and invoice flow. This change does not invent timed SEO packages, subscriptions, per-item deliverables or progress rules for newly introduced services. Existing Content progress/delivery behavior is retained.

## Implementation map

| Files | Purpose |
| --- | --- |
| `server/models/Order.js` | Optional `codPinEmployee` reference on the existing order record. |
| `server/controllers/codController.js`, `server/routes/codRoutes.js` | Validate active employee assignment, persist it atomically with PIN generation, reject cancelled/paid orders and malformed IDs, use authenticated client identity, preserve single use/expiry/attempt limits and cheque distinction. New admin-only eligible-employee endpoint and staff-only assigned-PIN endpoint. PIN errors do not log error objects or PIN values. |
| `server/controllers/orderController.js` | Remove assignment metadata from client-visible order payloads; generic order APIs still omit PIN secrets. |
| `client/src/services/codService.js` | Pass employee IDs when generating; call eligible-employee and assigned-PIN endpoints. |
| `client/src/utils/pinAssignment.js`, `client/src/hooks/usePinAssignment.js`, `client/src/components/PinEmployeeSelect.jsx` | Shared employee selection. Default only to a single eligible employee whose trimmed name equals Krish, case-insensitively; otherwise require explicit choice. Use actual IDs, retain explicit alternatives, show loading/empty/error/retry states. |
| `client/src/pages/admin/AdminOrderDetails.jsx` | Move client handoff and PIN sections above legacy/multi-item configuration without changing fields/actions. Add employee selection, retain assigned identity and refresh active PIN payment status without repopulating/overwriting unsaved handoff fields. |
| `client/src/pages/admin/CodManagement.jsx` | Update the other PIN-generation entry point to require assignment too. Refresh active PIN/payment states and stop displaying a locally retained PIN once its status expires or is consumed. |
| `client/src/components/AssignedPaymentPins.jsx`, `client/src/pages/EmployeeDashboard.jsx` | Employee dashboard shows only assigned, active, unlocked PINs with client/order context and expiry supplied by the backend. Refreshes while visible and on focus. |
| `client/src/components/ServiceAccessEditor.jsx` | Custom access-type and add-service dropdowns, search and explicit selected services, with inactive/missing assignments retained. Group access semantics are unchanged. |
| `client/src/index.css`, `client/src/styles/dashboard.css` | Shared Login-like neutral borders/focus shadow, error/disabled states and visible keyboard/forced-color outlines. Neutral ordinary informational icons. Preserve native choice/file/hidden controls and the existing dark coupon field. |
| `client/src/components/RoleBadge.jsx`, `client/src/pages/admin/AdminUsers.jsx` | Neutral role badge colors and ordinary decorative accents; success/warning/destructive semantic colors remain. |

New endpoints: `GET /api/cod/employees` (admin), `GET /api/cod/assigned` (admin or employee, employee query scoped to authenticated ID). The latter uses a minimal projection and `Cache-Control: no-store`. It excludes expired, locked, consumed, cancelled and completed-payment PINs. PIN values do not appear in public/client/generic staff order APIs. Existing staff order visibility and management roles are unchanged.

## Verification actually executed

- Full backend suite: **95 tests passed**, no failures or skipped tests (final run; includes the new route guard check).
- Frontend suites: **34 tests passed** across order UI (22), PIN assignment (2), async resources (4), service access (2), service edit (2), and order-item cleanup (2).
- Real loopback-only disposable MongoDB integration: combined Content/SEO/Development checkout; configured website-platform value persistence; pricing and service snapshots; quote/order total agreement and GST; eligible/inactive/missing employee validation; alternate assignment; assignment isolation; generic staff API PIN exclusion; malformed, wrong, unauthorized, expired, locked and cancelled verification; concurrent generation and verification; one-time cash payment persistence; cheque collection remaining pending; already-paid generation rejection. Test data is removed after the process exits. No application `.env` is loaded by this fixture.
- Existing regression suites cover client access policies, pricing options/quantities, coupons, GST/payment methods, draft confirmation/duplicates/access changes, authentication/session invalidation, payment-provider checks, deliveries/invoices/progress and preservation of historical data.
- `npm run lint`: passed without errors or warnings.
- `npm run build`: attempted, failed in the Windows Vite bundled config loader (`spawn EPERM`, native Tailwind binary bundling).
- `node node_modules/vite/bin/vite.js build --configLoader native`: production build and PWA generation passed. The existing large-chunk advisory remains.
- Backend syntax checks and `git diff --check`: passed.

Tests added/updated: `server/tests/helpers/pinWorkflow.js`, `server/tests/service-access-migration.integration.test.js`, `server/tests/pin-routes.test.js`, existing security/month-end fixtures, `client/tests/pin-assignment.test.mjs`, and `client/tests/order-ui.test.mjs`.

## Manual checks and operational notes

- Browser interaction, actual phone/tablet/desktop rendering, physical keyboard/touch use, and an on-screen mobile keyboard remain **unverified**. The earlier Windows browser helper could not reliably validate the active browser URL; this coding pass did not have an authenticated browser against the isolated fixture. SSR/accessibility-markup, keyboard-navigation utilities, popup placement and keyboard-reduced viewport tests are automated coverage, not a visual pass.
- In development, check Admin → Users → Add User/custom access and New Order configured platform fields with Tab, arrows, Enter and Escape; verify selected values and removal/search behavior. Check handoff → PIN → configuration order, input/error/disabled states and the dark coupon field on desktop/tablet/mobile.
- Use synthetic development orders to generate a PIN with Krish or another eligible employee, open that employee workspace, verify as the owning client and observe cash `collected` versus cheque `verified`/payment pending. Other employees must not see the PIN. No real payment or provider transaction was made by the tests.
- No new environment variables or database migration are required. Restart the local backend to load the new endpoints/schema. Newly generated PINs require `employeeId` from the eligible list; both existing admin generation interfaces were updated.
- Legacy active PINs are not automatically assigned to an employee or invalidated. They retain their existing validity; once expired/locked, normal regeneration can assign them. Missing/inactive/ambiguous Krish requires an explicit active employee selection.
- No deployment, commit, push, worktree, clone or new project was created.
