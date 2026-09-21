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
- performs **no POST/PATCH business-record writes**

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

**Stage 0A:** authentication, request wrapper, API metering, and read-only capability discovery.

See `docs/V1_SCOPE.md` and `docs/ARCHITECTURE.md`.
