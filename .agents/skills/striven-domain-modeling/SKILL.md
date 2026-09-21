---
name: striven-domain-modeling
description: Resolve Striven entity meanings, lifecycle rules, relationship semantics, and source-of-truth boundaries before implementation.
---

# Striven Domain Modeling

## Use when

A workflow depends on unclear business meaning such as:
- Customer vs Contact
- Sales Order vs Task ownership
- Task type/status lifecycle
- Customer Asset relationship
- employee/technician identity
- source-of-truth conflicts
- global vs type-specific custom fields

## Rules

- Separate verified facts, working assumptions, unresolved questions, and implementation choices.
- Prefer stable IDs for relationships; names are labels, not identities.
- Do not infer a relationship merely because records share a name, phone, address, or note.
- Preserve Striven as source of truth for operational entities.
- Our database owns orchestration state, external integration IDs, audit state, and workflow state only.
- Do not invent product behavior to close a data-model gap.

## Output

For the requested slice, produce:
- entities involved
- authoritative identifier for each
- verified relationship evidence
- lifecycle/status semantics
- field ownership/source of truth
- invariants
- ambiguous cases
- unresolved evidence
- downstream implementation owner

## Stop condition

If a relationship or lifecycle rule cannot be verified, mark it unresolved and block dependent automatic writes.
