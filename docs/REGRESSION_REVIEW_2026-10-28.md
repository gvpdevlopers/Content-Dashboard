# Regression review — 28 October 2026

> PIN workflow correction: [Client-only payment PIN policy](CLIENT_ONLY_PAYMENT_PIN_WORKFLOW.md) supersedes historical staff-verification and cheque-pending descriptions below.

Reviewed the recent service-access, dynamic ordering, draft/repeat restoration, pricing/payment, session authentication and PIN UI/backend paths in the existing repository. This is a code and automated-test review; it is not a claim that every possible application scenario has been exercised.

## Confirmed issues fixed

1. **Stale PIN display:** PIN Management retained a secret in local state even after another generation replaced it. Local PIN display is now tied to the generation timestamp and active unpaid/non-cancelled state. The shared authorized View/Enter actions are also present in PIN Management after refresh.
2. **Incomplete background refresh:** Admin detail polling updated status but omitted assignment, generation and cancellation changes. Payment metadata refresh now updates those fields, clears invalid local secrets and ignores older snapshots while preserving unsaved delivery/invoice/note edits and locally completed payments.
3. **Cash payment bypass and race:** Manual status changes could mark cash orders `paid` without verifying a PIN, and a stale manual save could overwrite a successful verification. Both completed cash statuses now require PIN verification; manual changes use an atomic compare against the current stored payment status. The UI disables those direct completion choices. Legacy records without PIN metadata still accept valid manual non-cash status changes.
4. **Invented frontend success:** Shared and legacy client verification code could infer completed payment from an incomplete success response. All entry paths now require the server's payment/PIN status confirmation and reject a missing/mismatched order ID when the current order has one. Cheque collection remains distinct from cleared payment. Legacy inline entry also has an immediate duplicate-submission guard and no longer logs Axios errors containing the submitted PIN.
5. **Malformed PIN input:** Array/object PIN values could pass string coercion, and missing generation/verification bodies produced server errors. Invalid bodies/types now receive validation responses before database queries; numeric/string six-digit compatibility is retained.
6. **Legacy session compatibility:** Authentication accepted `_id`-only tokens but downstream profile/session handlers expected `userId`. Middleware now supplies the canonical database identity in both fields, retaining current database role/access checks.
7. **Client detail navigation race:** Client Order Details had an unguarded loader, allowing an older route response to replace another order's display. It now uses the existing request-safe resource hook and resets order-local PIN state when the route changes.
8. **Default build command:** This Windows environment's default bundled Vite config loader failed with `EPERM`/native dependency bundling errors. The existing build script now uses `vite build --configLoader native`; no dependency versions or application architecture were changed.

## Main files

- `client/src/utils/paymentPin.js`: confirmation validation, generation-bound display and metadata merge policy.
- `client/src/pages/admin/CodManagement.jsx`, `AdminOrderDetails.jsx`: PIN display/refresh and cash payment controls.
- `client/src/pages/OrderDetails.jsx`, `client/src/components/PaymentPinDialog.jsx`: request-safe loading, duplicate protection and server-confirmed UI updates.
- `server/controllers/orderController.js`, `codController.js`, `server/middleware/auth.js`: atomic payment updates, cash PIN enforcement, input validation and canonical session identity.
- `client/package.json`: working standard production build command.
- `client/tests/pin-assignment.test.mjs`, `order-ui.test.mjs`, `server/tests/security.test.js`, `server/tests/helpers/pinWorkflow.js`: targeted regression coverage.

## Verification

- Full backend `npm test`: **97 passed**, no failures/skips. Includes an isolated real MongoDB combined Content/SEO/Development order, platform values/snapshots, GST/quote agreement, PIN permissions/persistence, manual completion rejection, and a deterministic race where PIN collection wins before a stale manual update. The stale update returns 409 and stored payment remains collected. A legacy non-cash record without a stored PIN status also updates successfully.
- Frontend: **40 passed** across all six suites: order UI 23, PIN/refresh/confirmation utilities 7, async resources 4, service access 2, service edit 2, order-item cleanup 2.
- `npm run lint`: clean.
- Standard `npm run build`: passed with its updated native-loader script, including PWA generation. The existing large bundle advisory remains.
- Backend syntax checks and `git diff --check`: passed.
- Existing regression suites cover access restrictions, inactive services, pricing options/quantities, GST/payment methods, coupons, draft restoration/confirmation, repeat/multi-service configuration, authentication/session revocation, delivery links, invoices and Content-specific progress behavior. No additional failures were found in these reviewed/tested paths.

No live/application database records, prices, service activation, historical orders or actual payment-provider transactions were changed by this review. All new PIN/payment persistence tests use the disposable loopback fixture; no live PINs were generated. No migrations, new environment variables, deployment, commit or push were performed.

Desktop/tablet/mobile visual interaction, actual mobile keyboard behavior and live payment-provider end-to-end flows remain manual verification items. Previous browser automation lacked a reliably validated authenticated Windows browser session, so no browser pass is claimed here. Restart the local backend to load the fixes.
