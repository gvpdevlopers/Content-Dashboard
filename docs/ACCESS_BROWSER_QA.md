# Service access browser QA

Last run: 2026-10-27T10:46:50.707Z.

## Status

Live API checks against a disposable local MongoDB/API fixture: **18 passed, 0 failed**.

Browser interaction and visual checks: **pending**. The native Chrome helper returned `FrameArrived timed out`, then `computer-use request timed out: get_window_state`; it also detected user activity in the dashboard window. Dedicated in-app and Chrome browser connections were unavailable. No login, click-through, layout or mobile result is claimed from API responses.

The existing app was configured with a remote database. The QA fixture uses a fresh local replica set and synthetic accounts; no existing client, service, payment or order was edited.

## Start or repeat the fixture

From the repository root, keep the first command running in a terminal:

```powershell
node server/scripts/startBrowserAccessQA.js --start
```

The command starts a loopback MongoDB replica set, the actual API routes and a separate Vite dev server. It prints the UI URL and synthetic login credentials, and writes them to ignored `artifacts/browser-access-qa/session.json`. It requires the installed MongoDB binary or `SERVICE_ACCESS_TEST_MONGOD`. The application MongoDB URI and JWT/payment credentials are overridden with fixture-only values. No production payment is part of this test.

In another terminal, run the live API checks:

```powershell
node server/scripts/checkBrowserAccessQA.js
```

The report is written to ignored `artifacts/browser-access-qa/api-results.json`. Checkout replay retries only an explicit in-flight lease response before asserting the same order is returned.

## Browser matrix still to execute

| Account | Expected New Order catalogue |
| --- | --- |
| `qa.content` | QA Content Service only; exercises the missing legacy access default. |
| `qa.seo-development` | QA SEO Audit, QA Development Hours, QA Other SEO Service; one dashboard. |
| `qa.custom` | QA Content Service and QA SEO Audit only. Inactive assigned SEO stays hidden. |

1. Sign in to each fixture account, open New Order, verify the exact catalogue and labels, configure required briefs and quantities, and compare the displayed price to the server quote. Use Cash Payment only.
2. For custom access, open Order History and its historical QA Development Hours order. Verify it remains readable despite revoked ordering access.
3. Repeat that historical order: verify the named unavailable-service warning and that no unauthorized service can be submitted.
4. Open the custom account saved draft "QA restricted draft". Verify its unavailable Development service is identified, configuration review is required, the allowed SEO service remains configurable, and server price confirmation is required before submission.
5. Check save/loading/error feedback, narrow viewports, dialog scrolling and keyboard reachability. A desktop screenshot alone does not verify a real mobile keyboard.
6. With `qa.admin`, inspect Services group filters, active/private/public labels, templates and custom assignments. Avoid changing an existing application database; all mutation tests belong to this fixture.

## Completed live API checks

- qa.content: only authorized active catalogue services: PASS.
- qa.seo-development: only authorized active catalogue services: PASS.
- qa.custom: only authorized active catalogue services: PASS.
- private active service is orderable; public inactive service is not: PASS.
- unauthorized direct service URL is blocked: PASS.
- qa.content: server quote preserves quantity and pricing: PASS.
- qa.seo-development: server quote preserves quantity and pricing: PASS.
- qa.custom: server quote preserves quantity and pricing: PASS.
- custom access: restricted development ID rejected by /orders/quote: PASS.
- custom access: restricted development ID rejected by /orders/coupon-quote: PASS.
- custom access: restricted development ID rejected by /orders: PASS.
- custom access: restricted development ID rejected by /drafts: PASS.
- inactive assignment remains stored but cannot be ordered: PASS.
- restricted historical order remains visible with its original amount: PASS.
- restricted saved draft retains both services and returns a named access warning: PASS.
- client cannot edit its own service access or view admin users: PASS.
- access revocation and restoration work without client login again: PASS.
- valid cash checkout is idempotent in the disposable fixture: PASS.

## Stop and cleanup

Type `stop` and Enter in the fixture terminal, or create the ignored file `artifacts/browser-access-qa/stop`. The fixture shuts down and removes only its own verified temporary database directory. It also expires automatically after 45 minutes. The ignored report and session metadata remain as local artifacts; the printed credentials apply only to that disposable run.
