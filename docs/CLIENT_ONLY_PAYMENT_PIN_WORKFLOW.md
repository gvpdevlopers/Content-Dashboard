# Client-only payment PIN workflow

This policy supersedes the earlier staff-verification and cheque-pending descriptions in the October 28 audit notes.

## Behavior

- Existing payment-method values `cod` and `cheque` share the existing `/api/cod` infrastructure.
- Admins generate, assign, view and disable PINs. The employee picker defaults to the single eligible employee named Krish, using that employee's actual database ID. Missing or ambiguous matches require a selection.
- Assigned employees view active PINs and authorized order details. Other employees cannot retrieve those PINs. Viewing or generating a PIN does not complete payment.
- Only the authenticated client who owns the order can submit `POST /api/cod/verify`. Admins and employees receive HTTP 403, even with the correct PIN.
- Both COD and cheque success atomically persist `paymentStatus: paid`, `codPinStatus: used`, the collection/verification time, and the owning client in `codPinVerifiedBy`.
- Manual payment-status updates cannot bypass this workflow for cash or cheque collection.
- Clients enter a PIN from an order-row dialog or the dedicated order-details section. Both use `PaymentPinForm` and the same endpoint. Saved payment/PIN confirmation is required before displaying success.
- Client state updates immediately after verification. Pending collection views refresh on focus and every 15 seconds while visible; staff PIN lists remove consumed/revoked PINs.
- Current no-automatic-expiry policy is preserved. Explicitly expired legacy records remain invalid. Disabling, generation changes, cancellation, five incorrect attempts and single use remain enforced atomically.

## Files changed for this correction

| Files | Purpose |
| --- | --- |
| `server/controllers/codController.js` | Client-only ownership enforcement, atomic Paid transition and verification audit |
| `server/controllers/orderController.js` | Prevent manual COD/cheque completion and overwriting completed payments |
| `client/src/utils/paymentPin.js` | Separate client verification from authorized staff viewing; validate saved Paid confirmation |
| `client/src/components/PaymentPinForm.jsx`, `PaymentPinDialog.jsx`, `ClientPaymentPinSection.jsx` | Shared verification logic, row dialog and dedicated inline entry/confirmation |
| `client/src/components/OrderPaymentPinActions.jsx`, `AssignedPaymentPins.jsx`, `PinEmployeeSelect.jsx` | View-only staff actions and corrected collection instructions |
| `client/src/pages/OrderHistory.jsx`, `OrderDetails.jsx` | Client entry points, immediate status updates and backend-authoritative payment indicators |
| `client/src/hooks/useCollectionPaymentRefresh.js` | Refresh pending collection state without resetting entry on normal background refresh |
| `client/src/pages/Dashboard.jsx`, `EmployeeDashboard.jsx`, `admin/AdminDashboard.jsx` | Refresh payment displays; show employee payment badges |
| `client/src/pages/admin/AdminOrderDetails.jsx`, `admin/CodManagement.jsx` | Staff view/manage controls, blocked manual completion and Paid labels |
| `server/tests/security.test.js`, `helpers/pinWorkflow.js`, `service-access-migration.integration.test.js` | Ownership, persistence, concurrency and local fixture startup diagnostics |
| `client/tests/order-ui.test.mjs`, `pin-assignment.test.mjs` | Client-only controls, both-method confirmation and employee assignment/view policies |

## Executed validation

- Backend: `cd server; npm test` — 98 tests passed, none skipped. The disposable loopback MongoDB fixture exercised actual order creation across Content, SEO and Development, configured platform snapshots, GST/quote agreement, employee assignment and secret isolation, staff/other-client rejection, wrong and repeated PINs, legacy expired and disabled PINs, attempt locks, concurrent submissions, and persisted Paid status returned by client/admin/employee detail controllers.
- The first database fixture attempts timed out during MongoDB startup. A subsequent full run passed, including the real database checks. Startup errors now retain the underlying connection error for diagnosis.
- Frontend: `cd client; node --test --experimental-test-isolation=none tests/*.test.mjs` — 41 tests passed. Default isolated Node test workers encountered Windows `spawn EPERM`; the non-isolated run executed all suites successfully.
- Frontend project lint: `npm run lint` — passed.
- Production build: `npm run build` — passed, with the bundle-size advisory for the main JavaScript chunk.
- Backend controller/helper syntax checks and `git diff --check` — passed.

No configured application database was read or modified, and no live PIN was generated during these checks. Browser/mobile visual testing and real payment-provider end-to-end testing were not performed.

## Local rollout and legacy records

Restart the local backend and refresh the frontend to load the correction. No new environment variables, schema migration or application-data migration are required. Razorpay and month-end payment workflows retain their existing implementation.

Older cheque records already marked `verified` while payment remains pending are not automatically rewritten as Paid and cannot reuse their consumed PIN. Review those historical financial records separately before any explicit reconciliation. Historical `collected` payments remain recognized as completed.

No deployment, commit or push was performed.
