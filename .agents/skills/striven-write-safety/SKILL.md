---
name: striven-write-safety
description: Review a proposed Striven mutation for identity certainty, idempotency, field authority, stale-write risk, rollback, and verification before it can pass the write gate.
---

# Striven Write Safety

## Preconditions

A write is blocked unless all applicable checks pass:

1. tenant and entity are explicit;
2. target identity is EXACT or CONFIRMED;
3. endpoint/method contract is verified;
4. schema dependencies are current;
5. field is on the workflow's write allowlist;
6. idempotency key is present for create or retryable mutation;
7. current state has been read when stale-write risk matters;
8. operation risk class permits automatic execution;
9. audit context is available;
10. post-write verification is defined.

## Risk classes

- R0: read only
- R1: low-risk reversible patch
- R2: material operational patch
- R3: create
- R4: financial/destructive/irreversible or otherwise high-risk

R4 requires human approval. Early V1 may require approval for R2/R3 as well.

## Search-before-create

Before any POST that creates an entity:
- search for the intended existing record using verified identifiers;
- return existing record if the operation was already completed;
- do not use fuzzy name matching as create suppression by itself.

## Verification

After mutation:
- re-read the target;
- compare expected protected fields;
- emit an execution receipt;
- if downstream work fails, compensate only when reversal is explicitly safe.

## Kill switches

Respect global, tenant, workflow, and write-only kill switches before every mutation.
