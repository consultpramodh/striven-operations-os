---
name: striven-handoff
description: Produce durable continuation context for another agent/session working on the Striven Operations OS.
---

# Striven Handoff

Create a concise handoff that allows a fresh agent to independently recover the real repository state.

## Include

- repository and branch/PR
- current milestone
- accepted architecture constraints
- what changed
- what is verified
- what failed and why
- current CI state
- unresolved evidence/blockers
- exact next test or decision
- write-safety mode
- links/identifiers needed to re-check live state

## Rules

- Distinguish facts from assumptions.
- Do not rely on chat memory as authority.
- Tell the next agent to inspect live GitHub/CI and repo instructions before editing.
- Do not include credentials, tokens, tenant record data, or private filesystem paths.
- Do not claim a test passed unless the evidence was actually observed.

## Done condition

The receiving agent should be able to start by verifying state, not by asking what happened.
