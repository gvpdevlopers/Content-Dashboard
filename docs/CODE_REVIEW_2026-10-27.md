# Service access and ordering code review - 27 October 2026

## Fixed

- Normalize HTTP service IDs to canonical lowercase hex before duplicate checks. Quotes, coupon pricing, checkout and draft saves reject mixed-case duplicate IDs. Custom assignments deduplicate those IDs instead of incorrectly reporting an existing service missing.
- Reject malformed/non-scalar service references before database lookup, returning validation errors rather than allowing query objects or Mongoose cast failures.
- Send an explicit null maximum quantity when an administrator clears the edit field. Omitting the field previously preserved the old limit on PATCH. Regression checks preserve prices, nested option IDs and priced numeric fields.
- Reset draft ID, coupon/price confirmation and source metadata even when a repeat/draft restores zero services. Serialize draft/repeat operations and block checkout while a restore is pending.
- Clean deselected option fields in the same reducer update, preserving unrelated/repeatable data and unchanged object references. This removes a state-update effect and its cascading-render lint error. Payload construction is now outside the component so the coupon effect has complete dependencies.
- Make the access editor tolerate null/malformed saved settings without silently granting Content access. Preserve inactive/missing selected assignments for explicit review, and avoid labelling them unavailable before the catalogue has loaded. Correct stray question marks in labels.
- Give the disposable MongoDB integration fixture enough startup time on Windows, with a separate primary-election deadline. The earlier 25-second startup limit caused reproducible test timeouts.

## Validation

- Server suite: 89 tests passed, including disposable real MongoDB transactions.
- Frontend: 19 existing UI tests plus 6 new payload/access/state regression tests passed.
- Production Vite/PWA build passed; the existing large-chunk warning remains.
- Changed frontend source files pass ESLint. Project-wide lint went from 12 errors / 4 warnings to 11 errors / 3 warnings; all remaining diagnostics existed before this review and are in other files (effect state/dependency and Fast Refresh findings). No new diagnostics were added.
- Syntax checks and git diff whitespace checks passed.

No browser checks or production database migrations were performed during this review. The old disposable browser fixture was asked to shut down. Existing Content catalogue data, historical orders, payments and invoices were not migrated or rewritten.

Follow-up (28 October 2026): the remaining project-wide lint findings were resolved. See `docs/LINT_CLEANUP_2026-10-28.md` for current validation results.
