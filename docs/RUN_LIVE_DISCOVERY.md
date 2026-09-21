# Live Stage 0 Verification Runbook

## Purpose

Run the Stage 0 discovery engine against the live Striven tenant without creating, updating, or deleting business records.

## GitHub Actions credential setup

Repository:

`consultpramodh/striven-operations-os`

Go to:

`Settings → Secrets and variables → Actions`

Recommended repository secrets:

```text
STRIVEN_CLIENT_ID
STRIVEN_CLIENT_SECRET
```

The workflow also accepts `CLIENT_ID` and `CLIENT_SECRET`.

The Client ID may alternatively be stored as an Actions variable named `STRIVEN_CLIENT_ID` or `CLIENT_ID`.

**The Client Secret must remain an Actions Secret. Do not store it as an Actions Variable.**

The workflow never prints either credential.

## Metadata-only GitHub verification

Open:

`Actions → Live Striven Metadata Verification → Run workflow`

This workflow performs:

1. credential-resolution check
2. skill validation
3. TypeScript typecheck
4. unit/invariant tests
5. OAuth authentication
6. read-only metadata probes for:
   - Customer custom-field definitions
   - Sales Order custom-field definitions
   - Customer Asset custom-field definitions
   - Item custom-field definitions
   - Customer Asset types
   - active Employees

No customer record ID is required for this metadata-only verification.

The job logs contain only status, response shape, metadata counts/keys, and API usage. It does not intentionally log credentials or business-record values.

## Full relationship verification

For a full local Stage 0 run, use a local `.env.local`:

```text
STRIVEN_CLIENT_ID=...
STRIVEN_CLIENT_SECRET=...
STRIVEN_BASE_URL=https://api.striven.com
STRIVEN_PROBE_CUSTOMER_ID=...
STAGE0_PAGE_SIZE=1
```

`STRIVEN_PROBE_CUSTOMER_ID` is a customer/account record ID used for read-only probes. It is not a tenant identifier.

Run:

```bash
npm install
npm run verify:stage0
```

This runs, in order:

1. agent-skill validation
2. TypeScript typecheck
3. unit/invariant tests
4. live read-only discovery
5. manifest invariant validation before the manifest can be written

## Expected safe output

A successful full run should include:

```text
Stage 0 discovery complete
Authentication: PASS
Custom Fields: PASS
Task Search: PASS
Customer Graph: PASS
Sales Order Relationship: PASS
Controlled writes enabled: NO
```

## Hard failure conditions

Treat the run as BLOCKED if any of these occur:

- credentials do not resolve
- authentication fails
- native custom-field metadata discovery fails
- Task Search fails
- Customer graph probe fails unexpectedly
- Sales Order relationship probe fails
- any enabled capability lacks evidence
- any pending capability is enabled
- any Stage 0 POST is not an explicit `/Search` endpoint
- manifest validation fails
- code attempts a business-record create/update/delete
- tenant/customer values appear in committed source or CI output

## Manual cross-check

For the selected probe customer, compare live Striven UI with API-derived relationship evidence:

- Customer exists
- Primary Contact existence agrees
- Contact resolves when present
- Customer assignments endpoint is readable
- Task Search accepts the customer/account ID
- Sales Orders returned belong to the selected customer
- Task Sales Order references, where present, resolve into that customer's Sales Orders

Do not copy customer names, phone numbers, email addresses, addresses, order values, or task text into Git.

## Promotion rule

A documented/read capability becomes trusted for this tenant only after its exact operation is observed successfully in the live tenant.

Controlled writes remain disabled until a separate controlled-write stage passes.
