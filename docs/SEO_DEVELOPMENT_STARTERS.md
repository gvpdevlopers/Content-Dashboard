# SEO and Development starter catalogue

This phase adds editable service templates to the existing dashboard. It does not automatically create database records, change existing Content services, migrate clients, publish services, or activate ordering.

## Use in the admin dashboard

1. Open **Admin > Services > Create Service**.
2. Choose a starter and click **Use template**. Loading it only fills the form. If the form already contains work, review the replacement dialog first.
3. Review the sample price, scope, quantity limits and required client fields. Replace the sample description with your final offering.
4. Save the service. Starters default to **inactive** and **private**. Saving through the normal create endpoint retains its duplicate-slug protection; existing services are never replaced.
5. Use the group filter in **Admin > Services** to find SEO and Development services. Public/private labels show marketing visibility separately from active/inactive ordering status.
6. When ready, activate the service and assign its group or exact service ID to a client through **Admin > Users > User Details**. Enable public visibility separately if you want it marketed.

SEO and Development continue to share one client dashboard, New Order flow and Order History. A selected client can receive services from either or both groups. Existing Content catalogue and prices remain unchanged.

## Sample services

All prices below are editable INR placeholders, not final commercial rates. They use the existing fixed/per-unit pricing engine and payment/tax rules.

| Group | Starter | Sample base price | Quantity |
| --- | --- | ---: | --- |
| SEO | Complete SEO Package | INR 15,000 / month | 1-12 |
| SEO | SEO Audit | INR 5,000 / audit | 1-1 |
| SEO | Keyword Research | INR 3,000 / research package | 1-1 |
| SEO | On-page SEO | INR 1,000 / page | 1-100 |
| SEO | Technical SEO | INR 6,000 / project | 1-1 |
| SEO | Website Speed & Performance | INR 5,000 / project | 1-1 |
| Development | WordPress Website | INR 20,000 / website | 1-1 |
| Development | Shopify Store | INR 35,000 / store | 1-1 |
| Development | Custom Website | INR 60,000 / website | 1-1 |
| Development | Website Changes | INR 1,500 / hour | 1-160 |
| Development | Development Hours | INR 1,200 / hour | 1-160 |

SEO briefs collect the website, audience, market, keywords or technical concerns as appropriate. Website builds collect project scope and page/product estimates. Website changes and hourly work collect tasks and the existing site when relevant. No template asks clients to enter passwords or access tokens.

One SEO quantity means one purchased month; this does not introduce subscriptions or automatic renewal. Development hour quantities represent purchased hours; this does not introduce a time-tracking system or an hours wallet. Page and product estimates are brief fields and do not add charges independently.

## Implementation and verification

- Template definitions: `server/data/serviceTemplates.json`.
- Read-only template API: `GET /api/services/admin/templates`, protected by authentication and admin authorization.
- Template picker: `client/src/components/ServiceTemplatePicker.jsx`.
- Actual service creation still uses the existing validated admin create endpoint.
- Regression tests validate every starter against both the Mongoose schema and admin controller, reject duplicate slugs, verify inactive/private defaults, and check actual server quotes, required fields and quantity limits after simulated activation.

Before production release, exercise admin creation and authorized/unauthorized client ordering in staging. The safe migration preview/apply/rollback requirements remain in `docs/SERVICE_ACCESS_ROLLOUT.md`. No migration or database seed was executed in this phase.
