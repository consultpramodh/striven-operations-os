---
name: striven-runtime-verification
description: Validate observable Striven workflow behavior against a prewritten contract using API/runtime evidence without relying on implementation claims.
---

# Striven Runtime Verification

## Purpose

Prove that the workflow behaves correctly from the operator/API perspective.

## Before testing

Write or identify a short behavior contract containing:
- initial state
- action/input
- expected Striven state
- expected side effects
- forbidden side effects
- allowed records/fixtures
- evidence required

## Verification rules

- Treat logs saying "success" as insufficient.
- Re-read Striven state through the approved read interface.
- Verify the intended record changed and unrelated protected fields did not.
- Run negative probes where relevant:
  - invalid ID
  - ambiguous match
  - duplicate retry
  - missing required custom field
  - stale record
  - 401
  - 429
  - timeout/5xx
- Redact tenant/customer values from durable reports.
- Do not inspect source code to excuse incorrect runtime behavior.

## Result states

Each contract clause is:
- PASS
- FAIL
- BLOCKED
- OUT_OF_SCOPE

## Done condition

No workflow is production-ready until the relevant contract clauses pass and the evidence is reproducible.
