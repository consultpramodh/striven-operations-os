---
name: striven-change-review
description: Independently review a fixed Striven Operations OS change set for correctness, safety-boundary regressions, schema assumptions, and evidence quality.
---

# Striven Change Review

## Review basis

Freeze one basis:
- current pull request;
- one commit/range;
- or current worktree snapshot.

Do not mix evidence across bases.

## Priority review areas

1. Did the change widen Stage 0 beyond read-only?
2. Can a path/method be used without verified capability evidence?
3. Can IDs or field mappings be guessed?
4. Can customer/business values leak into Git, logs, CI, or error output?
5. Can retries duplicate work?
6. Can one schema change affect unrelated workflows?
7. Are permission and rate-limit errors handled explicitly?
8. Does a claimed test prove behavior rather than implementation intention?
9. Did the change introduce unnecessary agent/model autonomy where deterministic code suffices?

## Findings

Report only concrete reachable issues with:
- severity
- affected behavior
- reproduction/evidence
- why it matters
- smallest safe correction

Do not redesign unrelated code.
