---
name: striven-tenant-discovery
description: Discover and validate a Striven tenant's Phase-1 API capabilities, configuration IDs, schema shape, and relationship evidence without mutating business records.
---

# Striven Tenant Discovery

## Authority

Read-only discovery only.

Allowed:
- OAuth/token validation
- GET
- explicit POST endpoints whose verified purpose is search/read
- response-shape inspection
- capability/status recording
- schema/configuration metadata capture
- API call metering

Forbidden:
- create/update/delete business records
- guessing undocumented endpoint paths
- guessing IDs or relationships
- persisting customer/order/task values into Git

## Workflow

1. Load repo instructions and Stage 0 scope.
2. Verify the endpoint/method against current Striven documentation or a previously accepted capability registry entry.
3. Run the smallest read probe needed.
4. Record:
   - method/path
   - permission/result
   - pagination behavior
   - top-level response shape
   - identifier fields exposed
   - relationship fields exposed
   - custom-field evidence exposed
   - API calls consumed
5. Mark the capability:
   - verified
   - partial
   - unsupported
   - blocked
   - pending verification
6. Never turn missing evidence into an assumption.
7. Update readiness blockers.

## Phase-1 sequence

Customer → Contact → Sales Order → Task → Customer Asset → Employee → Location → Item.

## Done condition

Discovery for a slice is done only when the repo contains evidence sufficient to answer:
- what operation is supported;
- what identifiers are authoritative;
- how related entities are referenced;
- what remains unresolved;
- whether the next controlled test is safe.

Controlled writes remain disabled.
