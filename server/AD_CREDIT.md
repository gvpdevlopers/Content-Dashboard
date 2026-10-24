# Unused ad spend credit

## Staff workflow

Open an ads order from **Admin → Orders** or **Employee → Orders**. The
**Unused ad spend** section inside the ads service lists the order's original Meta and Google budgets,
the client's available balance and credit activity.

Once payment is `paid` or `collected`, enter the **final remaining ad spend**
and a reason/campaign reference, then confirm. Each platform can be credited
once per source order. This prevents duplicate entries and accidental repeated
clicks from creating extra money. Enter the final reconciled amount, not a daily
estimate. The amount cannot exceed that platform's budget on the source order.

## Client workflow

When configuring an ads order, each platform's balance and recent credit activity
appear beside its ad-spend amount field. Select that platform's checkbox to use
the lesser of its balance and the new order's matching ad-spend budget. Any
excess remains available for a later order. Use the small refresh icon button if
staff have just recorded unused spend.

The ad-spend field is the **total desired campaign budget**, including carried
credit. For example, a ₹5,000 Meta budget with ₹2,000 of available Meta credit
requires ₹3,000 of new Meta funding, plus the management fee and the existing
applicable tax calculation. The app applies coupons to eligible service fees,
then subtracts ad credit from the subtotal before calculating tax. Meta credit
cannot pay for Google spend or another service. Fee pricing is unchanged.

Checkout, saved-draft confirmation, order details and payment retry all use the
server-calculated amount after credit. Order details and the success screen show
the credit breakdown. Drafts do not reserve credit; the current balance is
checked when they are ordered. An order funded entirely by credit has no new
payment due and is marked paid.

## Reservations and cancellation

Credit is reserved when the order is created. Abandoning checkout does not
release it, since payment may still complete; retry the same order from its
details page.

Cancelling an unpaid COD/cheque order, or an unpaid online order with no payment
attempt, atomically returns its credit once and invalidates collection PINs.
An order whose credit was returned cannot be reopened or marked paid. Create a
new order instead.

An unpaid online order with an existing Razorpay attempt must be reconciled
before cancellation; its platform payment could still arrive. Settled orders
retain their ad funding when cancelled. Staff can record their actual unused
ad spend using the normal workflow rather than automatically returning money
that may already have been spent.

## Storage and deployment

Amounts are stored as integer paise in `AdCreditWallet` and `AdCreditEntry`.
Every issuance, application and cancellation return records the client,
platform, order, actor and timestamp. Staff entries also retain a reason.

Wallet changes, audit entries and order changes use the same MongoDB
transaction. MongoDB must support transactions (Atlas, a replica set, or a
sharded cluster), as already required by coupon and saved-draft submission.
Allow the two new collections and the unique entry index on
`{ order: 1, platform: 1, kind: 1 }` to be created. With production auto-indexing
disabled, provision this index through the normal database deployment process.

Existing orders and services require no migration. Historical ads orders use
the stored `metaAdsAdSpendAmount` and `googleAdsAdSpendAmount` fields. Balances
start at zero and increase only when staff record confirmed unused spend. Other
service ordering flows continue to use their existing prices.

Regression tests in `tests/ad-credit.test.js` cover pricing, coupon coexistence,
draft confirmation, payment modes, duplicate grants, overdraft protection and
cancellation. They mock database and provider calls. Validate the workflow in
staging with a transaction-capable database and Razorpay test mode before
deploying it with real balances.
