# Architecture

## Core path

Striven API  
→ API Adapter  
→ Tenant Discovery Engine  
→ Live Schema Registry  
→ Canonical Data Model  
→ Workflow / Decision Engine  
→ Operations Control Plane  
→ Verifier  
→ Write Gate  
→ Striven API

## Stage 0 implementation rule

Stage 0 exposes only two request primitives:

- `GET`
- explicit read-only `POST .../Search`

There is intentionally no generic POST, PATCH, PUT, or DELETE method in the public Stage 0 client surface.

## Supporting systems

- Audit ledger
- Exception queue
- Reconciliation
- API budget manager
- Evaluation framework
- Decision history

## Source of truth

Striven remains the operational source of truth for Customers, Contacts, Sales Orders, Tasks, Assets, Employees, Items, and tenant configuration.

The Operations OS stores only orchestration metadata, schema metadata, mappings, workflow state, audit records, and external integration identifiers.
