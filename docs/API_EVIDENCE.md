# API Evidence Register

The capability registry distinguishes current official documentation from previously exercised live behavior. A prior successful prototype is useful evidence, but it does not automatically promote every adjacent or similarly named endpoint.

## Current official evidence

Checked 2026-09-21.

### Authentication

Source: https://api.striven.com/help

Verified documentation:
- OAuth access token from `/accesstoken`
- bearer authorization for API requests
- access-token reuse
- refresh-token flow
- documented token lifetime behavior

### Task Search

Source: https://api.striven.com/help

Verified documentation:
- `POST /v1/Tasks/Search`
- request example includes `AccountID`, `PageIndex`, `PageSize`, `SortExpression`, and `SortOrder`

Important semantic note:
- the field name `AccountID` is retained because that is Striven's API contract;
- the Operations OS does **not** interpret it as a tenant ID;
- our live-probe configuration calls the corresponding value `probeCustomerId`.

### Static Lists

Source: https://api.striven.com/Help/StaticLists

Currently captured:
- Customer/Vendor Status
- Customer Asset Status
- Order Status
- Task Status

These are documented static reference values, not tenant-specific custom-field metadata.

### Rate Limits

Source: https://api.striven.com/Help/RateLimits

Current documented limits:
- Standard: 100 requests/minute and 5,000/day
- Enterprise: 500 requests/minute and 25,000/day
- allocation is per tenant
- 429 includes Retry-After
- daily usage resets at midnight UTC

## Previously exercised live read evidence

Source repository:
`consultpramodh/striven-flow`

Evidence commit:
`5d3252b35c463eb54fe4fe80315771eec5983abe`
("Add consolidated read-only customer graph probe")

Read-only routes exercised by that prototype:
- `GET /v1/customers/{customerId}`
- `GET /v1/contacts/{contactId}`
- `GET /v1/customers/{customerId}/assignments`
- `POST /v1/Tasks/Search` with the selected customer's/account's ID in `AccountID`

Stage 0B may probe these surfaces against the current tenant because they have prior live evidence. They remain separately labeled from official-documentation verification.

## Still blocked / not verified

Do not guess routes for:
- Sales Order discovery/search
- Customer Asset discovery/search
- Employee discovery/search
- Location discovery/search
- Item discovery/search
- custom-field definition enumeration

Each remains blocked until its exact current read contract is verified from official documentation or an isolated live read probe with a justified candidate endpoint.

## Evidence promotion rule

A capability may move to a stronger evidence class only after the exact operation has been observed.

Possible classes:
1. `pending-verification`
2. `verified-existing-live-project`
3. `verified-current-live-tenant`
4. `verified-official-docs`

Official documentation and live-tenant proof may coexist; one does not erase the other.
