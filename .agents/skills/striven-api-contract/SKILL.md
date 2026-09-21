---
name: striven-api-contract
description: Verify and document Striven API endpoint contracts, payload shapes, auth/permission behavior, pagination, errors, and safe operation boundaries.
---

# Striven API Contract

## Entry gate

Use only after the business/entity meaning is clear enough to define the API interaction.

## Contract record

For each operation capture:
- entity
- purpose
- HTTP method
- path
- read/search/create/update classification
- required identifiers
- request body/query fields
- pagination
- response identifiers
- relationship fields
- custom-field representation
- permission behavior
- error behavior
- rate-limit behavior
- source/evidence date

## Rules

- Never assume CRUD symmetry between entities.
- Never derive a path by naming convention alone.
- Search POSTs are read operations only when the endpoint is explicitly verified as search/read.
- Keep authentication, permission, business validation, and transport errors distinct.
- Preserve the smallest payload possible for future PATCH operations.
- Mark undocumented or untested details `Not verified`.

## Stage 0

No contract may authorize create/update/delete.

## Done condition

A contract is usable only when method/path and the fields required by the current workflow are verified well enough to test without guessing.
