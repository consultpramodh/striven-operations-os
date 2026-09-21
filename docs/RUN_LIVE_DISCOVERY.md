# Live Stage 0 Verification Runbook

## Purpose

Run the Stage 0 discovery engine against the live Striven tenant without creating, updating, or deleting business records.

## Preconditions

- local checkout of `consultpramodh/striven-operations-os`
- branch `stage-0-tenant-discovery`
- Node.js 22+
- local `.env.local` containing Striven credentials
- one known Customer/Account record ID for read-only probing

Do not commit `.env.local` or `tenant-manifest/discovery-latest.json`.

## Environment

```text
STRIVEN_CLIENT_ID=...
STRIVEN_CLIENT_SECRET=...
STRIVEN_BASE_URL=https://api.striven.com
STRIVEN_PROBE_CUSTOMER_ID=...
STAGE0_PAGE_SIZE=1
```

`STRIVEN_PROBE_CUSTOMER_ID` is a customer/account record ID used for the read-only probes. It is not a tenant identifier.

## One-command verification

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

The run should report:

```text
Stage 0 discovery complete
Authentication: PASS
Task Search: PASS
Customer Graph: PASS
Controlled writes enabled: NO
```

The exact API-call count may vary depending on whether a primary contact exists.

## Hard failure conditions

Treat the run as BLOCKED if any of these occur:

- authentication fails
- Task Search fails
- Customer graph probe fails unexpectedly
- any enabled capability lacks evidence
- any pending capability is enabled
- any Stage 0 POST is not an explicit `/Search` endpoint
- manifest validation fails
- code attempts a business-record create/update/delete
- tenant/customer values appear in committed source or CI output

## Manual cross-check

For the selected probe customer, compare the live Striven UI with the API-derived relationship evidence:

- Customer exists
- Primary Contact existence agrees
- Contact resolves when present
- Customer assignments endpoint is readable
- Task Search accepts the customer/account ID
- returned task structure is plausible for that customer

Do not copy customer names, phone numbers, email addresses, addresses, or task text into Git.

## Promotion rule

Only after the live run and UI cross-check pass may an endpoint be promoted from:

`verified-existing-live-project`

to:

`verified-current-live-tenant`

Sales Order, Asset, Employee, Location, Item, and custom-field metadata routes remain blocked until separately verified.
