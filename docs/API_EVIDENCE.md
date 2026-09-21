# API Evidence Register

The capability registry distinguishes documented API contracts, prior live evidence, and current-tenant proof. Documentation does not by itself prove that the connected tenant has permission or compatible data for an operation.

## Current official evidence

Checked 2026-09-21.

### Authentication and Task Search

Source: https://api.striven.com/help

Verified documentation includes:

- OAuth access token from `/accesstoken`
- bearer authorization
- access-token reuse
- refresh-token flow
- `POST /v1/Tasks/Search`
- Task Search request fields including `AccountID`, pagination, and sorting

Important semantic note:

- Striven's Task Search contract calls the customer/account record filter `AccountID`;
- the Operations OS does **not** use that field as tenant identity;
- repo configuration calls the selected record `probeCustomerId`.

### Static Lists

Source: https://api.striven.com/Help/StaticLists

Captured reference lists include:

- Customer/Vendor Status
- Customer Asset Status
- Order Status
- Task Status

### Rate Limits

Source: https://api.striven.com/Help/RateLimits

Captured policy:

- Standard: 100 requests/minute and 5,000/day
- Enterprise: 500/minute and 25,000/day
- allocation is per tenant
- 429 includes `Retry-After`
- daily usage resets at midnight UTC

## Current API contract registry

The Stage 0 capability registry now contains read/search contracts for:

- Customers
- Contacts
- Customer locations
- Sales Orders
- Tasks
- Customer Assets and Asset Types
- Employees
- Items
- entity custom-field definition reads where supported

The registry is intentionally separate from live-tenant proof. A route can be documented yet still fail because of tenant permissions, configuration, or contract differences.

## Previously exercised live read evidence

Source repository:

`consultpramodh/striven-flow`

Evidence commit:

`5d3252b35c463eb54fe4fe80315771eec5983abe`

Previously exercised read-only routes include:

- Customer by ID
- Contact by ID
- Customer assignments
- Task Search using the selected customer/account record ID

## Stage 0C live proof required

The next proof layers are:

### Metadata-only

Verify against the connected tenant:

- Customer custom-field definitions
- Sales Order custom-field definitions
- Customer Asset custom-field definitions
- Item custom-field definitions
- Customer Asset types
- active Employees

### Relationship proof

Using a known customer/account record:

- Customer → Contact
- Customer → Task
- Customer → Sales Order
- Task → Sales Order when Task exposes an order reference

The relationship probe stores counts and boolean/structural evidence, not customer names, order values, addresses, or notes.

## Evidence classes

1. `pending-verification`
2. `verified-existing-live-project`
3. `verified-current-live-tenant`
4. `verified-official-docs`

Documentation and live proof are orthogonal evidence. Production authorization requires the appropriate combination of contract evidence, current-tenant evidence, tests, and write-safety approval.


## Current live tenant verification — 2026-09-21

GitHub Actions run:
`35652778200`

Result:
- authentication: PASS
- static correctness gates: PASS
- live metadata verification: PASS
- API calls: read-only GETs only
- writes enabled: false

The following exact operations were observed successfully against the connected live tenant:

- `GET /v1/customers/0/custom-fields`
- `GET /v1/sales-orders/0/custom-fields`
- `GET /v1/customer-assets/0/custom-fields`
- `GET /v1/items/0/custom-fields`
- `GET /v1/customer-assets/types`
- `GET /v1/employees`

This proves endpoint availability and permission for these specific operations in the current tenant. It does not yet prove Customer → Sales Order → Task record relationships or any write behavior.
