---
name: striven-schema-drift
description: Detect, classify, version, and safely react to Striven custom-field or tenant-configuration changes.
---

# Striven Schema Drift

## Identity rule

Stable configuration IDs define identity. Same-name fields are not automatically the same field.

## Change classes

Safe auto-refresh:
- label/description change with same stable ID and compatible type
- new unused field
- new option that does not invalidate existing mappings

Requires validation:
- required/default change
- scope change
- option rename
- permission/readability/writability change

Breaking:
- field removed/deactivated
- stable ID replaced
- data type changed
- required workflow option removed
- previously writable field becomes non-writable

## Workflow

1. Normalize current metadata.
2. Compare with previous schema version.
3. Produce a deterministic diff.
4. Map changed configuration to dependent workflows.
5. Apply safe changes automatically.
6. Mark validation-required changes for review.
7. Pause only affected writes for breaking changes.
8. Create a new schema version only after the new state is accepted.

## Never

- fuzzy-remap by name alone;
- continue production writes through a breaking dependency;
- shut down unrelated workflows because one field changed.

## Evidence

Every workflow run records the schema version it used.
