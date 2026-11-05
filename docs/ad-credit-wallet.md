# Client ad-credit wallet

## Implementation

The repository already contained platform wallets, integer-paise transaction accounting, unused-spend issuance, checkout deductions, order snapshots and cancellation credit release. Issuance already allowed In Progress orders; it required settled payment, not completion. These mechanisms and existing records were retained.

Added:
- Client dashboard balances for Meta Ads and Google Ads, refresh, and paginated transaction history with source/destination order links, reasons, actor and date.
- A partial-amount input alongside the existing platform credit checkbox in New Order. The remaining wallet balance is shown before submission.
- Admin/employee order-management credit application with confirmation, backend role checks, matching-platform budget validation, a payment lock, and atomic wallet/ledger/order updates.
- Richer client history responses and explicit staff authorization inside the controllers as well as on the routes.

## Usage and safeguards

Open a paid/collected Ads order in Admin or Employee order details. Under **Unused ad spend**, enter the platform amount and reason/reference, then confirm. The source order may be In Progress or an older order. Credit is never created automatically.

The existing one-entry-per-platform-per-source-order restriction remains. Confirm the total unused amount carefully; this is not an unrestricted top-up or balance editor. Source amounts are bounded by the saved order's platform budget. Unpaid source orders cannot create spendable funds.

Clients select credit under the relevant Ads spend field and can enter a smaller amount. Staff can use **Apply available credit to this order** on an eligible unpaid order. A staff adjustment is allowed once, before a Razorpay payment is initialized, an active collection PIN exists, an invoice is attached, or month-end payment activity exists. Completed/cancelled and previously released-credit orders cannot be repriced. Both platforms may be submitted together.

Credits only cover matching platform ad spend, not management fees or unrelated services. Existing checkout GST calculation is reused unchanged: totals are calculated from the subtotal after ad credit. Credit is stored separately from coupons and tax through `adCreditApplied`, `adCreditTotal`, and `subtotalBeforeAdCredit`; original service item snapshots remain unchanged.

Wallet deduction uses a conditional non-negative balance update inside the same MongoDB transaction as its ledger entry and order update. Duplicate application is blocked. No Razorpay transactions are changed or deleted. MongoDB transaction support (replica set/Atlas) remains required.

No new model, database migration, or replacement of existing unused-spend records is needed. Meta and Google are the platforms supported by the existing Ads schema; this change does not invent other platform budgets.

## Files changed for this feature

- `server/controllers/adCreditController.js`
- `server/routes/orderRoutes.js`
- `client/src/services/adCreditService.js`
- `client/src/components/AdCreditWallet.jsx` (new)
- `client/src/components/AdCreditCheckout.jsx`
- `client/src/components/OrderAdCredit.jsx`
- `client/src/pages/Dashboard.jsx`
- `client/src/pages/NewOrder.jsx`
- `client/src/pages/admin/AdminOrderDetails.jsx` (also used by employees)
- `server/tests/ad-credit.test.js`
- `server/tests/helpers/adCreditWorkflow.js` (new)
- `server/tests/package-workflow.test.js`
- `client/tests/order-ui.test.mjs`
- `artifacts/ad-credit/browser_qa.py` and test evidence

Existing unrelated local changes were preserved.

## Verification

- Full backend suite: **159 passed, 1 optional test skipped, 0 failed**. The skipped test reads an existing external catalogue; it was not needed for these isolated fixtures.
- Isolated replica-set workflow: In Progress and older source orders; admin/employee additions and applications; duplicate/unauthorized rejection; partial client checkout; payment/PIN/invoice safeguards; competing real database transactions; full use of remaining credit against eligible spend; fees/GST, ledger actor/reference and client isolation.
- Client test suite: **44 passed**, including partial credit input/remaining balance/error rendering.
- ESLint: passed.
- Production build: passed; existing bundle-size warning above 500 kB remains.
- Headless Edge: **9 browser checks passed using mocked APIs**, covering staff issuance/application/cancel, client wallet/history/source link, partial checkout and 390px overflow/error checks. Screenshots are in `artifacts/ad-credit/`.
- Browser APIs were mocked; real persistence and concurrency were tested separately with a disposable local MongoDB replica set. No live Razorpay charge, remote database mutation, deployment, commit or push was performed.
