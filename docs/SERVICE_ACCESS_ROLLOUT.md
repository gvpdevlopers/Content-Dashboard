# Service groups and client access: staged rollout

## Approved rules

One dashboard, catalogue, checkout and order history. Roles remain admin,
employee and client. Services have `serviceGroup`: content, seo or development.
Clients have `serviceAccess` with mode `groups` or `selected`, a `groups` array
and a `serviceIds` array. Missing legacy settings default to Content.

Group access includes future active services in that group. Selected access
grants only listed IDs, even if a groups array is also present. Inactive-service
assignments remain stored but never authorize a new order. Malformed explicit
settings fail closed; they are not silently replaced with Content access.

`isPublic` controls marketing visibility independently of `isActive` (order
activation) and client authorization. A publicly visible inactive service may
be marketed but cannot be ordered. A private active service may be ordered by
an authorized client. Missing legacy public flags follow the former active-only
public visibility until backfilled. Backfill freezes that visibility explicitly.

## Current milestone / release boundary

Implemented: schema defaults, admin group/access/public-visibility controls,
independent public listing, and backend enforcement for authenticated client
catalogue/detail, quotes, coupon pricing, draft saves, and checkout. Authentication
loads access from the database for every request; token grants are ignored.
Draft/repeat restoration refreshes the catalogue and requires acknowledgement
of configuration changes before saving/submitting a partial restoration.
Saved drafts remain readable and return named access issues. Inactive assignments
remain stored. Historical order and payment endpoints retain their existing rules.
The admin create form now offers 11 editable SEO/Development starter templates,
all inactive and private by default. These are form presets, not an automatic
database seed. See `docs/SEO_DEVELOPMENT_STARTERS.md`.
Transactional apply/rollback tooling and offline approval verification are now
implemented. The tests use synthetic fixtures, including a disposable local
MongoDB replica set when a local mongod binary is available.
No application, staging or production database migration has been executed.

Next milestones:
1. Generate and review a real staging preview, verify a restorable backup, then
   rehearse the implemented apply/rollback commands against staging.
2. Use the starter templates to save SEO/Development offerings, replacing sample
   pricing and scope with final configuration before activation.
3. Validate admin/client flows in a browser and staging before production release.

Historical order/invoice access must remain owner/role-based, not dependent on
current catalogue access. Do not rewrite historical snapshots or prices. Draft
and repeat restoration must name unavailable services, retain a review warning
until acknowledged, and block submission until configuration is reviewed. Never
silently discard inaccessible services and submit the remaining order.

## Read-only migration preview

Use a database account with read-only permissions. Configure MIGRATION_MONGO_URI
through your secret mechanism. The script intentionally does not load app .env.
From `server`, using an explicitly identified staging database:

```powershell
node scripts/previewServiceAccess.js --preview --database YOUR_STAGING_DATABASE --output ../artifacts/service-access/staging-preview.json
```

No URI, password, emails or usernames are printed. Existing output files are
not overwritten. This preview script has no apply mode; the separate migration
command below requires explicit approval arguments. Artifacts contain record IDs, counts,
missing-field guards and exact proposed values; handle them as internal data.

The preview compares raw collection counts to scanned counts and aborts on a
mismatch. Review servicesScanned, clientsScanned, servicesAffected,
clientsAffected, groupDefaults, publicVisibilityDefaults, issues and the SHA-256.
Resolve all issues and regenerate before approval. A preview is not a lock:
counts and missing-field guards must be checked again immediately before apply.

Only missing serviceGroup/isPublic fields and missing client serviceAccess are
proposed. Existing explicit assignments, inactive selected IDs and visibility
are retained. No prices, configuration, timestamps, roles, credentials, orders,
invoices, payment records or employee access are migration targets.

`docs/examples/service-access-preview.example.json` is a synthetic example, not
a preview of any connected database. Its counts must never be used to approve
a real migration.

## Transactional rollout commands (implemented; not run on application databases)

The operator must first identify the target database, take a restorable backup,
and test restoring that backup in staging. Pause application writes and background
jobs that create or edit users/services during preview, apply and rollback. Snapshot
transactions verify the scanned counts and targeted write guards; they do not
freeze unrelated concurrent inserts into the entire database. The CLI records the
operator-supplied backup reference; it does not verify the backup itself.

Transactions require a replica set or a supported sharded deployment. There is no
standalone-server fallback and no partial/nontransactional mode. Use least-privilege
credentials for `services`, `users` and `_service_access_migrations`; historical
collections do not need write privileges. Native collection operations avoid
Mongoose defaults, save hooks and timestamps.

From `server`, first verify the reviewed artifact **offline** using its exact
printed SHA-256 and database name. `verify` never connects to a database:

```powershell
node scripts/migrateServiceAccess.js --mode verify --database YOUR_STAGING_DATABASE --preview ../artifacts/service-access/staging-preview.json --approve-sha256 REVIEWED_SHA256
```

After independently verifying the backup and reviewing the actual affected counts,
set `MIGRATION_MONGO_URI` through your secret mechanism. Application `.env` is never
loaded by either script. Do not place a connection string on the command line.

```powershell
node scripts/migrateServiceAccess.js --mode apply --database YOUR_STAGING_DATABASE --preview ../artifacts/service-access/staging-preview.json --approve-sha256 REVIEWED_SHA256 --environment staging --backup-reference VERIFIED_BACKUP_ID
```

Apply validates the checksum and strict field allowlist, then regenerates the
preview from native records and counts inside a snapshot transaction. Any mismatch
requires a new reviewed preview. Each update requires the approved missing fields
and activation/client-role guards. Every changed document is compared against its
expected result before commit so other fields remain unchanged. Updates and the
receipt commit together. The receipt ID is the approved preview hash; its collection
is `_service_access_migrations`. Receipts contain the approved changes, original
missing-field evidence, counts, environment, backup reference and operation times.
They contain no original user documents, passwords, contact details or connection
strings. Keep the receipt collection in the backup and protect it from app writes.

An already-applied receipt returns a no-op and never resets later admin edits.
A receipt marked rolled back cannot be applied again; a subsequent rollout needs
an explicitly designed and reviewed new migration rather than recycling that ID.
Preview files larger than 8 MiB are refused to keep the transaction receipt within
MongoDB document limits. Review a separate migration design for larger rollouts.

Rollback reads the **committed receipt**, rather than accepting a new preview:

```powershell
node scripts/migrateServiceAccess.js --mode rollback --database YOUR_STAGING_DATABASE --approve-sha256 REVIEWED_SHA256 --environment staging --backup-reference VERIFIED_BACKUP_ID
```

It unsets only fields the receipt proves were absent and only while their current
values still equal the applied values. Changed activation values, client roles,
missing targets or edited migrated fields abort the entire rollback for review.
Unrelated later edits, such as a service price or client name, are preserved.
Rollback and receipt state/count updates commit together; repeated rollback is a
no-op. Retain the backup and both receipt timestamps until release acceptance.

If a network connection is lost after commit, the command cannot promise that
nothing committed. Retry the same operation with the same approved hash and consult
its authoritative database receipt. Never infer success from a missing local log,
create a replacement hash to bypass a receipt, or manually unset fields broadly.

Production execution is a **separate explicit approval step** after the staging
restore/apply/rollback rehearsal and review of a fresh production preview/counts.
The production CLI additionally requires `--environment production` and
`--allow-production` on both apply and rollback. Those arguments are operator
assertions, not automatic approval or a guarantee that a database is staging.
Always independently verify which deployment the supplied URI and database select.
No production command has been executed by this implementation.

## Local verification

`npm test` in `server` includes allowlist/hash checks, count/guard drift, idempotent
replays, atomic failure simulation, protected-data preservation and edited-field
rollback refusal. The integration test starts its own loopback-only mongod process,
initializes a disposable replica set, and verifies real commits, transaction aborts,
concurrent applies and rollback. It never uses application environment files or
`MIGRATION_MONGO_URI`, and deletes only its own temporary directory after stopping
the process. Set `SERVICE_ACCESS_TEST_MONGOD` to a local binary if it is not found
at the known install locations. Without a binary, the real transaction test is
reported as skipped; that is not evidence of staging verification.

## Rollback requirements

Disable new editors/catalogue changes first. Use the committed receipt, not a
fresh query for all Content clients/services. For each migrated record, compare
its current migration-added fields to the applied values. If unchanged, unset
only fields proven absent before migration. If any field was subsequently
edited, stop and review rather than overwriting the edit. Never remove an
existing explicit assignment or reset a whole document. Perform rollback and
receipt updates transactionally, verify counts and protected collections, and
retain the backup and receipts until the release is accepted. The runtime
legacy fallbacks keep Content access and former public visibility available
after these added fields are removed.
