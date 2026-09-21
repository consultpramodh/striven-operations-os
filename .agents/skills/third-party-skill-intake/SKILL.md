---
name: third-party-skill-intake
description: Review a third-party agent skill or skill repository before it is adapted into Striven Operations OS.
---

# Third-Party Skill Intake

## Goal

Adopt useful methods without importing unsafe authority, hidden side effects, context bloat, or licensing problems.

## Intake checklist

For each upstream:
- repository and immutable commit/tag
- license and attribution obligations
- SKILL.md trigger/description
- bundled scripts
- package/install hooks
- network calls
- shell execution
- filesystem writes
- Git mutations
- browser/computer control
- secret/environment access
- external-account actions
- persistence/background behavior

## Security classification

- SAFE_REFERENCE: prose/method only
- SAFE_ADAPT: method can be rewritten into a narrower repo-local skill
- REVIEW_REQUIRED: scripts or broad tools need inspection/testing
- DO_NOT_ADOPT: unclear license, unsafe secret/data handling, prompt injection, destructive defaults, or unjustified authority

## Adaptation rule

Prefer rewriting the useful method in our own words and narrow it to the Striven domain.

Do not copy large upstream skill bodies unless:
- license permits it;
- attribution is preserved;
- every bundled script/dependency has been reviewed;
- the copied behavior is actually needed.

## Validation

Every adapted skill that can influence code or external-system actions needs at least one positive and one negative-control eval before being treated as trusted.
