# Initial SEO and Development seed

This insert-only seed uses the existing Service model and admin editor. It does not run the older `seedServices.js` (which updates Content configurations). It never loads the application's `.env` or falls back to `MONGO_URI`.

## Local command (PowerShell, repository root)

Point this at your **intended development MongoDB**, not a production database. Replace the example database name with your actual development database; it must contain a `dev`, `development`, `local` or `test` segment separated by underscores/hyphens. The database name must match in both arguments. Single-host loopback MongoDB is the default; remote/SRV targets require explicit `--allow-remote-development` and `NODE_ENV=development` or `test`. Production mode is always refused. The override does not establish a database's environment: confirm the intended development target before using it. An omitted URI database resolves to MongoDB's default `test`, which must still be explicitly named with `--database test`.

```powershell
$env:SEO_DEVELOPMENT_SEED_URI = 'mongodb://127.0.0.1:27017/glow_dev'
node server/scripts/seedSeoDevelopmentServices.js --database glow_dev
# Review the preview, then insert only missing services:
node server/scripts/seedSeoDevelopmentServices.js --database glow_dev --apply
# Repeat to confirm every row reports preserved:
node server/scripts/seedSeoDevelopmentServices.js --database glow_dev --apply
```

Preview does not create indexes or service records. Apply ensures the schema's unique slug index exists, validates all seed inputs, and inserts using `$setOnInsert`. A matching slug is always preserved, including prices, descriptions, fields, activation, timestamps and any other edits. Reports flag a preserved record with an unexpected group rather than changing it. Newly inserted records are inactive and private. A pre-existing active record stays active by design. No Content records, users, orders, payment records or snapshots are updated.

## Seed records

Established template slugs are reused even where the display name differs, preventing duplication of services previously created from those templates. Technical SEO is not seeded because it is outside the requested ten services.

| Name | Group | Stable slug |
| --- | --- | --- |
| Complete SEO Package | seo | complete-seo-package |
| Keyword Research | seo | keyword-research |
| SEO Audit | seo | seo-audit |
| On-Page SEO | seo | on-page-seo |
| Speed & Performance Optimization | seo | website-speed-performance |
| WordPress Website | development | wordpress-website |
| Shopify Website | development | shopify-store |
| Custom Website | development | custom-website |
| Website Changes | development | website-changes |
| Hourly Development Package | development | development-hours |

Fields populated: `name`, `slug`, `serviceGroup`, `category`, placeholder `description`, `pricingType`, `basePrice`, `unit`, `minQuantity`, `pricingOptions`, `fields`, `repeatableGroups`, `isActive`, `isPublic`, `displayOrder`, plus normal `_id`, creation/update timestamps and schema defaults. No maximum quantity is imposed by the seed. Pricing options and repeatable groups are empty. Existing template text/URL brief fields are reused; numeric estimate fields and their placeholder limits are omitted. No passwords or access tokens are requested.

`basePrice: 0` is a configuration placeholder, **not a final free offering**. Pricing is `fixed` with unit `project` (or `package` for Complete SEO Package); Hourly Development Package uses the existing `per_unit` engine with unit `hour`. No purchased hour count, package duration, renewal, GST changes or delivery commitment is introduced. All inserted services have `isActive: false` and `isPublic: false`.

## Before activation

In Admin → Services, review descriptions, scope, price, pricing type/unit, quantity limits and client fields. Configure the actual offering and activate it only when ready. Public website visibility is a separate choice. Group-authorized clients gain access after activation; custom-access clients require explicit service assignments. This seed does not change client permissions.

## Checks

`npm test` from `server` includes schema/admin-controller validation for all ten inputs, production/remote target rejection, catalogue exclusion, and rejection by both quote and order-submission controllers. The existing real MongoDB integration fixture also runs preview, apply and repeated apply on its own loopback test database, checks exact record/timestamp preservation, makes an administrator edit, verifies another rerun preserves it, and exercises the CLI. Existing Content and historical order snapshots are compared before and after. The fixture deletes its own temporary database files after testing; this does not seed the running app database.

On 2026-10-28, following the user's explicit instruction to use the configured remote URI, the target was inspected read-only and resolved to `test`. Ten missing services were inserted inactive/private, a second run preserved all ten, and the seven existing Content services were compared unchanged. Hash/count comparisons also confirmed all other existing collections were unchanged. No manual edits were made to the remote records as part of testing; edit preservation was tested in the disposable local fixture. A pre-seed service backup and verification summary are stored under ignored `artifacts/service-access/`. No credentials are included in this document or the seed script.

For an explicitly approved remote development target, set `SEO_DEVELOPMENT_SEED_URI` privately from the existing configuration (do not paste credentials into shell history), use `NODE_ENV=development`, then run the same commands with `--allow-remote-development`. The seed still never reads `.env` automatically or falls back to `MONGO_URI`.
