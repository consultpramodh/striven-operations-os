# V1 Scope

## Stage 0 — Read-only Tenant Discovery

1. Authentication and permission check
2. API capability discovery
3. Phase-1 entity discovery
4. Static/configuration ID capture
5. Custom-field discovery using capability-based providers
6. Relationship validation
7. Representative schema snapshots without persisting business values
8. Schema versioning and drift detection
9. Tenant Manifest generation
10. Readiness result for controlled-write testing

## Phase-1 entities

- Customers
- Contacts
- Sales Orders
- Tasks
- Customer Assets
- Employees
- Locations
- Items

## Stage 0 safety boundary

No business-record create/update/delete operations are permitted.

A POST is allowed only through the client's dedicated `search()` method and only for an endpoint whose path ends in `/Search`.

## Exit criteria

Stage 0 is complete only when we can answer with evidence:

- Can Customer → Sales Order → Task be resolved reliably?
- Can required custom-field IDs and valid values be identified?
- Can configuration drift be detected without guessing?
- Are API usage and permission failures observable?
