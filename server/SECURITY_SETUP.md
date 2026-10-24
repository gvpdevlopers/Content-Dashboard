# Security and payment setup

Existing client, employee and admin routes remain available. These changes add
session revocation, database-backed login throttling, expiring collection PINs,
checkout retry protection and captured-payment reconciliation.

## Razorpay webhook

Set `RAZORPAY_WEBHOOK_SECRET` in the server environment to the secret configured
for a Razorpay webhook pointing to:

`https://YOUR_API_HOST/api/payments/razorpay/webhook`

Subscribe to `payment.captured` and `order.paid`. The endpoint validates the raw
request signature and fetches payment details before updating an order. Repeated
events are safe. Keep the webhook secret separate from `RAZORPAY_KEY_SECRET`.
The checkout verification route still works without webhook configuration;
automatic recovery requires the configured webhook. No real credentials are
included in this repository.

The order-details page provides payment retry for existing unpaid online orders.
Payment initialization reuses the original Razorpay order and can reconcile an
already captured payment if the browser's earlier callback was interrupted.

## Database and deployment

Allow Mongoose to create the new `RequestLock` and `RateBucket` collections and
their TTL indexes, plus the sparse unique `Order.submissionKey` index. Existing
orders need no backfill. If automatic index creation is disabled in production,
create these indexes through your normal database deployment process.

Deploy the API before the frontend. Older clients can still create orders; new
clients send an `Idempotency-Key` so repeated submissions reuse the same order.
Use HTTPS in production. HTTPS and localhost retain hashed checkout fingerprints
across reloads; LAN HTTP development retains retry keys in memory only.

Login is limited to 15 requests per identifier and 100 per source IP in a
15-minute fixed window. Buckets live in MongoDB and work across API processes.
The server uses Express's source IP, not an untrusted forwarded header. If you
deploy behind a proxy, configure Express `trust proxy` for your actual trusted
proxy topology to avoid grouping all users under the proxy's IP.

COD/cheque PINs expire after 15 minutes or five incorrect attempts. Admins can
replace expired or locked PINs. Existing active PINs follow the same expiry
using their stored generation timestamp. Password resets and deactivation
invalidate all prior sessions; users must sign in again.

Coupon usage remains attached to the created order, including unpaid orders.
Retrying that order does not reserve another coupon use. Automatic expiry or
release of an abandoned order's coupon is deliberately not introduced: payment
may still complete, and releasing it requires a coordinated cancellation policy.

## Checks

Run `npm test` in `server` and `npm run build` in `client`. The regression tests
mock MongoDB and Razorpay; they never modify live accounts or charge money.
Before deployment, exercise checkout, payment retry and signed webhook delivery
against a staging database and Razorpay test mode.
