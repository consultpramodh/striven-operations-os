# Striven Operations OS

API-native operations orchestration layer for Striven.

## Stage 0 — Read-only Tenant Discovery

The first milestone is a read-only Tenant Discovery Engine that:

- authenticates safely to Striven
- discovers Phase-1 entity capabilities
- captures configuration IDs and relationships
- discovers custom-field metadata where the API exposes it
- versions the live tenant schema
- produces a Tenant Manifest and readiness report
- performs **no business-record create/update/delete writes**

## Phase-1 entities

- Customers
- Contacts
- Sales Orders
- Tasks
- Customer Assets
- Employees
- Locations
- Items

## Architecture principles

- Striven remains the operational source of truth.
- Runtime uses direct API endpoints, not custom reports.
- Search before create.
- Never guess entity IDs or custom-field IDs.
- Fail closed on ambiguous mappings or breaking schema drift.
- One controlled write gate for all mutations.
- Every mutation will be auditable, idempotent, and verified.
- AI assists reasoning; deterministic code controls execution.
- Tenant-specific manifests and credentials are never committed.

## Current milestone

**Stage 0B:** verify read contracts and relationship evidence using a known customer/account record. In Striven Task Search, the field name `AccountID` refers to the customer/account record used by the query; this repo does not treat it as a tenant identifier.

Current verified surfaces include the officially documented `POST /v1/Tasks/Search` plus read-only Customer/Contact/Assignment endpoints previously exercised in the earlier live prototype. Remaining Phase-1 routes stay blocked until independently verified.

See `docs/V1_SCOPE.md`, `docs/ARCHITECTURE.md`, and `docs/API_EVIDENCE.md`.
